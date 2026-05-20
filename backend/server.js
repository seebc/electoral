const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: '10mb' }));

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fallback_key_change_me';

// Limitar peticiones para mitigar ataques DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { error: 'Demasiados intentos de inicio de sesión. Cuenta bloqueada temporalmente.' }
});

// ==========================================
// 1. ENDPOINT DE AUTENTICACIÓN SEGURA
// ==========================================
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const username = email.split('@')[0].toLowerCase();

    // Obtener usuarios desde Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/USUARIOS!A1:Z1000?alt=json&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    
    if (!response.data || !response.data.values || response.data.values.length < 2) {
      return res.status(401).json({ error: 'Credenciales no válidas o base de datos vacía.' });
    }

    const headers = response.data.values[0];
    const rows = response.data.values.slice(1);
    
    const usuarios = rows.map(row => {
      let obj = {};
      headers.forEach((h, i) => { obj[h.toLowerCase()] = row[i]; });
      return obj;
    });

    const user = usuarios.find(u => String(u.usuario).toLowerCase() === username);

    if (!user || !user.contrasena) {
      return res.status(401).json({ error: 'Credenciales no válidas.' });
    }

    // Validación segura
    let isMatch = false;
    if (user.contrasena.startsWith('$2')) {
      isMatch = bcrypt.compareSync(password, user.contrasena);
    } else {
      isMatch = user.contrasena === password; // Solo para legacy, idealmente eliminar esto
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales no válidas.' });
    }

    // Generar JWT Token
    const token = jwt.sign(
      { id: user.id || user.user_id, usuario: user.usuario, rol: user.rol, municipio: user.municipio },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id || user.user_id,
        usuario: user.usuario,
        rol: user.rol,
        municipio: user.municipio,
        nombre_completo: user.nombre_completo
      }
    });

  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ==========================================
// MIDDLEWARE: VALIDAR TOKEN JWT
// ==========================================
const verifyToken = (req, res, next) => {
  const token = req.headers['x-app-authorization'];
  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado.' });
    req.user = decoded;
    next();
  });
};

// ==========================================
// 2. PROXY SEGURO HACIA GOOGLE SHEETS
// ==========================================
app.use('/api/sheets', apiLimiter, verifyToken);

app.use('/api/sheets', async (req, res) => {
  const urlPath = req.path.replace(/^\//, '');
  
  // Seguridad: Bloquear acceso a la tabla USUARIOS si no es administrador (rol == 1)
  if (urlPath.toUpperCase().includes('USUARIOS')) {
    if (String(req.user.rol) !== '1') {
      return res.status(403).json({ error: 'Acceso denegado a datos de usuarios. Requiere privilegios de Administrador.' });
    }
  }

  const method = req.method;
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  // Reconstruir la query string original
  const queryPart = req.originalUrl.substring(req.originalUrl.indexOf(urlPath) + urlPath.length);
  const separator = queryPart.includes('?') ? '&' : '?';
  const finalUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/${urlPath}${queryPart}${isWrite ? '' : `${separator}key=${GOOGLE_API_KEY}`}`;

  try {
    const googleHeaders = {
      'Content-Type': 'application/json'
    };

    // Forward the Google OAuth token if present (for writes)
    if (req.headers['authorization']) {
      googleHeaders['Authorization'] = req.headers['authorization'];
    }

    const response = await axios({
      method: method,
      url: finalUrl,
      headers: googleHeaders,
      data: req.body
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const data = error.response ? error.response.data : { error: error.message };
    console.error(`[Proxy Error] ${method} ${urlPath}:`, status, data);
    res.status(status).json(data);
  }
});

app.listen(port, () => {
  console.log(`Backend protegido ejecutándose en http://localhost:${port}`);
});
