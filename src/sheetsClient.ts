import bcrypt from 'bcryptjs';

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID || '16Xkow8EIvGtgiKS9smrHJmr35Ogq5wEvQVHOtxbAqwo';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || 'AIzaSyDDEx2TV3j_n0lCYRwON1jt8Bizi8sY_UE';
const CLIENT_ID = '231708164370-ct7ainjigif34dngi1o23of8uv7di1ig.apps.googleusercontent.com';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let cachedData: Record<string, any[]> = {};
let oauthToken: string | null = null;
let tokenClient: any = null;
let pendingAuthPromise: Promise<string> | null = null;

export function clearCache(table?: string) {
  if (table) delete cachedData[table];
  else cachedData = {};
}

function getTokenClient(): Promise<string> {
  if (oauthToken) return Promise.resolve(oauthToken);
  if (pendingAuthPromise) return pendingAuthPromise;

  pendingAuthPromise = new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = (window as any).google?.accounts?.oauth2?.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: any) => {
          pendingAuthPromise = null;
          if (resp.access_token) {
            oauthToken = resp.access_token;
            resolve(resp.access_token);
          } else {
            reject(new Error('Error al obtener autorización de Google'));
          }
        },
      });
    }
    if (!tokenClient) {
      pendingAuthPromise = null;
      reject(new Error('Google Identity Services no disponible. Recarga la página.'));
      return;
    }
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });

  return pendingAuthPromise;
}

async function apiRequest(method: string, urlPath: string, body?: any): Promise<any> {
  const useToken = method !== 'GET' || !!oauthToken;
  const separator = urlPath.includes('?') ? '&' : '?';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/${urlPath}${useToken ? '' : `${separator}key=${API_KEY}`}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (useToken) {
    try {
      const token = await getTokenClient();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      throw e;
    }
  }

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google API error ${res.status}: ${errText}`);
  }

  return res.json();
}

async function fetchSheet(sheetName: string): Promise<any[]> {
  if (cachedData[sheetName]) return cachedData[sheetName];

  try {
    const data = await apiRequest('GET', `values/${sheetName}!A1:Z5000?alt=json`);
    if (!data.values || data.values.length === 0) return [];
    const headers = data.values[0];
    const rows = data.values.slice(1);
    const result = rows.map(row => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] !== undefined ? row[index] : '';
      });
      return transformKeysToSnakeCase(obj);
    });
    cachedData[sheetName] = result;
    return result;
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    return [];
  }
}

function transformKeysToSnakeCase(obj: any): any {
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = obj[key];
  }
  return newObj;
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function saveRecordInSheet(sheetName: string, idField: string, idVal: number | null, payload: any): Promise<any> {
  const data = await apiRequest('GET', `values/${sheetName}!A1:Z5000?alt=json`);
  const rawRows: any[][] = data.values || [];
  if (rawRows.length === 0) {
    throw new Error(`La hoja "${sheetName}" está vacía o no tiene cabeceras.`);
  }

  const headers: string[] = rawRows[0];
  const idColIndex = headers.findIndex(h => h.toLowerCase() === idField.toLowerCase());
  if (idColIndex === -1) {
    throw new Error(`Columna de ID "${idField}" no encontrada en la hoja "${sheetName}".`);
  }

  // Clonar y serializar objetos/arreglos a strings JSON
  const serializedPayload = { ...payload };
  for (const key in serializedPayload) {
    if (typeof serializedPayload[key] === 'object' && serializedPayload[key] !== null) {
      serializedPayload[key] = JSON.stringify(serializedPayload[key]);
    }
  }

  let rowIndex = -1;
  if (idVal !== null && idVal !== undefined) {
    for (let i = 1; i < rawRows.length; i++) {
      if (String(rawRows[i][idColIndex]) === String(idVal)) {
        rowIndex = i;
        break;
      }
    }
  }

  if (rowIndex !== -1) {
    // Es actualización
    const rowToUpdate = rawRows[rowIndex];
    while (rowToUpdate.length < headers.length) {
      rowToUpdate.push('');
    }
    headers.forEach((header, colIdx) => {
      const keyInPayload = Object.keys(serializedPayload).find(
        k => k.toLowerCase() === header.toLowerCase() ||
             k.replace(/_/g, '').toLowerCase() === header.replace(/_/g, '').toLowerCase()
      );
      if (keyInPayload !== undefined) {
        let val = serializedPayload[keyInPayload];
        if (sheetName.toUpperCase() === 'USUARIOS' && header.toLowerCase() === 'rol') {
          if (val === 'ADMIN') val = '1';
          else if (val === 'CAPTURISTA') val = '2';
        }
        rowToUpdate[colIdx] = val !== null && val !== undefined ? val : '';
      }
    });
  } else {
    // Es inserción (nuevo registro)
    let nextId = 1;
    if (sheetName.toUpperCase() === 'CASILLAS') {
      const idIdx = headers.findIndex(h => h.toLowerCase() === 'id');
      const casillaIdIdx = headers.findIndex(h => h.toLowerCase() === 'casilla_id');
      for (let i = 1; i < rawRows.length; i++) {
        const curCasillaId = parseInt(rawRows[i][casillaIdIdx]) || 0;
        const curId = idIdx !== -1 ? (parseInt(rawRows[i][idIdx]) || 0) : 0;
        const maxOfRow = Math.max(curCasillaId, curId);
        if (maxOfRow >= nextId) {
          nextId = maxOfRow + 1;
        }
      }
      serializedPayload['id'] = nextId;
      serializedPayload['casilla_id'] = nextId;
    } else {
      for (let i = 1; i < rawRows.length; i++) {
        const curId = parseInt(rawRows[i][idColIndex]) || 0;
        if (curId >= nextId) {
          nextId = curId + 1;
        }
      }
      serializedPayload[idField] = nextId;
    }

    const newRow = headers.map(header => {
      const keyInPayload = Object.keys(serializedPayload).find(
        k => k.toLowerCase() === header.toLowerCase() ||
             k.replace(/_/g, '').toLowerCase() === header.replace(/_/g, '').toLowerCase()
      );
      if (keyInPayload !== undefined) {
        let val = serializedPayload[keyInPayload];
        if (sheetName.toUpperCase() === 'USUARIOS' && header.toLowerCase() === 'rol') {
          if (val === 'ADMIN') val = '1';
          else if (val === 'CAPTURISTA') val = '2';
        }
        return val !== null && val !== undefined ? val : '';
      }
      return '';
    });
    rawRows.push(newRow);
  }

  // Sobrescribir la hoja completa
  await apiRequest('POST', `values/${sheetName}!A1:Z5000:clear`);
  await apiRequest('PUT', `values/${sheetName}!A1:Z${rawRows.length + 1}?valueInputOption=RAW`, { values: rawRows });

  clearCache(sheetName);

  const finalRowIdx = rowIndex !== -1 ? rowIndex : rawRows.length - 1;
  const finalRow = rawRows[finalRowIdx];
  const obj: any = {};
  headers.forEach((header, index) => {
    obj[header] = finalRow[index] !== undefined ? finalRow[index] : '';
  });
  return transformKeysToSnakeCase(obj);
}

function createQueryBuilder(tableName: string) {
  const filters: { field: string; value: any }[] = [];
  let queryAction: 'select' | 'delete' = 'select';
  let singleResult = false;
  let updateData: any = null;

  const execute = async () => {
    const sheetName = SHEET_NAMES[tableName] || tableName;

    // Lógica para actualizar registros
    if (updateData) {
      try {
        const data = await apiRequest('GET', `values/${sheetName}!A1:Z5000?alt=json`);
        const rawRows = data.values || [];
        if (rawRows.length === 0) {
          return { data: [], error: new Error(`La hoja "${sheetName}" está vacía.`) };
        }
        const headers = rawRows[0];

        const filterIndices = filters.map(f => {
          const idx = headers.findIndex((h: string) => h.toLowerCase() === f.field.toLowerCase() ||
            h.replace(/_/g, '').toLowerCase() === f.field.replace(/_/g, '').toLowerCase());
          return { field: f.field, value: f.value, index: idx };
        }).filter(f => f.index !== -1);

        let updatedCount = 0;
        const serializedUpdate = { ...updateData };
        for (const k in serializedUpdate) {
          if (typeof serializedUpdate[k] === 'object' && serializedUpdate[k] !== null) {
            serializedUpdate[k] = JSON.stringify(serializedUpdate[k]);
          }
        }

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          let matches = true;
          for (const f of filterIndices) {
            if (String(row[f.index] !== undefined ? row[f.index] : '') !== String(f.value)) {
              matches = false;
              break;
            }
          }

          if (matches) {
            updatedCount++;
            while (row.length < headers.length) {
              row.push('');
            }
            headers.forEach((header: string, colIdx: number) => {
              const keyInPayload = Object.keys(serializedUpdate).find(
                k => k.toLowerCase() === header.toLowerCase() ||
                     k.replace(/_/g, '').toLowerCase() === header.replace(/_/g, '').toLowerCase()
              );
              if (keyInPayload !== undefined) {
                let val = serializedUpdate[keyInPayload];
                if (tableName === 'usuarios' && header.toLowerCase() === 'rol') {
                  if (val === 'ADMIN') val = '1';
                  else if (val === 'CAPTURISTA') val = '2';
                }
                row[colIdx] = val !== null && val !== undefined ? val : '';
              }
            });
          }
        }

        if (updatedCount > 0) {
          await apiRequest('POST', `values/${sheetName}!A1:Z5000:clear`);
          await apiRequest('PUT', `values/${sheetName}!A1:Z${rawRows.length + 1}?valueInputOption=RAW`, { values: rawRows });
          console.log(`[Update Builder] ${sheetName}: ${updatedCount} fila(s) actualizada(s)`);
        }
        clearCache(sheetName);

        // Retornar las filas coincidentes después de la actualización
        const updatedRows = await fetchSheet(sheetName);
        let transformedRows = updatedRows.map(row => transformKeysToSnakeCase(row));
        for (const f of filters) {
          transformedRows = transformedRows.filter(row =>
            String(row[f.field]) === String(f.value)
          );
        }
        const result = singleResult ? (transformedRows[0] || null) : transformedRows;
        return { data: result, error: null };
      } catch (e: any) {
        console.error(`[Update Builder Error] ${sheetName}:`, e);
        return { data: null, error: e };
      }
    }

    const rows = await fetchSheet(sheetName);
    let transformedRows = rows.map(row => transformKeysToSnakeCase(row));

    for (const f of filters) {
      transformedRows = transformedRows.filter(row =>
        String(row[f.field]) === String(f.value)
      );
    }

    if (queryAction === 'delete') {
      const count = rows.length - transformedRows.length;
      if (count > 0) {
        try {
          await apiRequest('POST', `values/${sheetName}!A1:Z5000:clear`);
          const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
          if (headers.length > 0) {
            const values = [headers, ...transformedRows.map(r => headers.map(h => r[h] ?? ''))];
            await apiRequest('PUT', `values/${sheetName}!A1:Z${values.length + 1}?valueInputOption=RAW`, { values });
          }
          console.log(`[Delete] ${sheetName}: ${count} fila(s) eliminada(s)`);
        } catch (e: any) {
          console.warn('[Delete] Error al sincronizar con Google Sheets:', e);
          return { data: null, error: e };
        }
      }
      clearCache(sheetName);
      return { data: transformedRows, error: null };
    }

    const result = singleResult ? (transformedRows[0] || null) : transformedRows;
    return { data: result, error: null };
  };

  const builder: any = {
    select(columns?: string) { queryAction = 'select'; return builder; },
    eq(field: string, value: any) { filters.push({ field, value }); return builder; },
    single() { singleResult = true; return builder; },
    delete() { queryAction = 'delete'; return builder; },
    update(values: Record<string, any>) {
      queryAction = 'select';
      updateData = values;
      return builder;
    },
    then(resolve: Function, reject: Function) { return execute().then(resolve, reject); }
  };

  return builder;
}

const SHEET_NAMES: Record<string, string> = {
  usuarios: 'USUARIOS', df: 'DF', dl: 'DL', municipios: 'MUNICIPIO',
  secciones: 'SECCIONES', casillas: 'CASILLAS', rg: 'RG', rc: 'RC',
  rutas: 'RUTAS', rol: 'ROL'
};

export const sheetsClient = {
  from: (table: string) => createQueryBuilder(table),

  get connected(): boolean { return !!oauthToken; },

  async connectGoogle(): Promise<boolean> {
    try {
      await getTokenClient();
      return true;
    } catch {
      return false;
    }
  },

  auth: {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      await delay(800);
      const { data: usuarios } = await sheetsClient.from('usuarios').select();
      const username = credentials.email.split('@')[0];
      const user = (usuarios as any[])?.find(
        (u: any) => String(u.usuario).toLowerCase() === username.toLowerCase()
      );
      if (!user) {
        return { data: { user: null, session: null }, error: { message: 'Credenciales no válidas.' } as any };
      }

      // Validación segura con bcrypt
      const isMatch = user.contrasena && (
        user.contrasena.startsWith('$2')
          ? bcrypt.compareSync(credentials.password, user.contrasena)
          : user.contrasena === credentials.password
      );
      if (!isMatch) {
        return { data: { user: null, session: null }, error: { message: 'Credenciales no válidas.' } as any };
      }

      return {
        data: {
          user: { id: user.user_id || user.id, email: username, user_metadata: { usuario: user.usuario, rol: user.rol } },
          session: { access_token: user.user_id || user.id, refresh_token: '', expires_at: 0, expires_in: 0, token_type: 'bearer' }
        },
        error: null
      };
    },
    signOut: async () => { oauthToken = null; return { error: null }; },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => { return { data: { session: null }, error: null }; }
  },

  rpc: async (functionName: string, params: any): Promise<any> => {
    if (functionName === 'validate_login') {
      await delay(800);
      const { data: usuarios } = await sheetsClient.from('usuarios').select();
      const user = (usuarios as any[])?.find(
        (u: any) => String(u.usuario).toLowerCase() === String(params.p_usuario).toLowerCase()
      );

      // Validación segura con bcrypt
      const isMatch = user && user.contrasena && (
        user.contrasena.startsWith('$2')
          ? bcrypt.compareSync(params.p_contrasena, user.contrasena)
          : user.contrasena === params.p_contrasena
      );

      if (isMatch) {
        return {
          data: { id: user.id, usuario: user.usuario, nombre_completo: user.nombre_completo || user.usuario,
            rol: user.rol || 'CAPTURISTA', user_id: user.user_id, municipio: user.municipio },
          error: null
        };
      }
      return { data: null, error: { message: 'Credenciales no válidas.' } };
    }

    if (functionName === 'save_rg_secure') {
      try {
        const data = await saveRecordInSheet('RG', 'id', params.p_id, params.p_payload);
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }

    if (functionName === 'save_rc_secure') {
      try {
        const data = await saveRecordInSheet('RC', 'id', params.p_id, params.p_payload);
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }

    if (functionName === 'save_ruta_secure') {
      try {
        const data = await saveRecordInSheet('RUTAS', 'id', params.p_id, params.p_payload);
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }

    if (functionName === 'save_casilla_secure') {
      try {
        const data = await saveRecordInSheet('CASILLAS', 'casilla_id', params.p_id, params.p_payload);
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }

    if (functionName === 'save_user') {
      const p_id = params.p_id || null;
      let hashedContrasena = params.p_password;
      if (hashedContrasena && !hashedContrasena.startsWith('$2')) {
        const salt = bcrypt.genSaltSync(6);
        hashedContrasena = bcrypt.hashSync(hashedContrasena, salt);
      }
      const payload = {
        usuario: params.p_usuario,
        contrasena: hashedContrasena,
        rol: params.p_rol === 'ADMIN' ? '1' : '2',
        nombre_completo: params.p_nombre_completo,
        municipio: params.p_municipio,
        correo: `${params.p_usuario}@outlook.com`,
        user_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
      };
      try {
        const data = await saveRecordInSheet('USUARIOS', 'id', p_id && p_id > 0 ? p_id : null, payload);
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }

    return { data: null, error: new Error(`RPC function "${functionName}" no soportada.`) };
  }
};

export default sheetsClient;