const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID || '16Xkow8EIvGtgiKS9smrHJmr35Ogq5wEvQVHOtxbAqwo';
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';

const SHEET_NAMES: Record<string, string> = {
  usuarios: 'USUARIOS',
  df: 'DF',
  dl: 'DL',
  municipios: 'MUNICIPIO',
  secciones: 'SECCIONES',
  casillas: 'CASILLAS',
  rg: 'RG',
  rc: 'RC',
  rutas: 'RUTAS',
  rol: 'ROL'
};

let cachedData: Record<string, any[]> = {};

export function clearCache(table?: string) {
  if (table) {
    delete cachedData[table];
  } else {
    cachedData = {};
  }
}

async function fetchSheet(sheetName: string): Promise<any[]> {
  if (cachedData[sheetName]) {
    return cachedData[sheetName];
  }
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A1:Z5000?alt=json&key=${API_KEY}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      console.error(`Error fetching sheet ${sheetName}:`, response.status);
      return [];
    }
    const data = await response.json();
    if (!data.values || data.values.length === 0) return [];
    const headers = data.values[0];
    const rows = data.values.slice(1);
    const result = rows.map(row => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || '';
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

function createQueryBuilder(tableName: string) {
  const filters: { field: string; value: any }[] = [];
  let queryAction: 'select' | 'delete' = 'select';
  let singleResult = false;

  const execute = async () => {
    const sheetName = SHEET_NAMES[tableName] || tableName;
    const rows = await fetchSheet(sheetName);

    let transformedRows = rows.map(row => transformKeysToSnakeCase(row));

    for (const f of filters) {
      transformedRows = transformedRows.filter(row =>
        String(row[f.field]) === String(f.value)
      );
    }

    if (queryAction === 'delete') {
      const count = rows.length - transformedRows.length;
      console.log(`[Mock Delete] ${sheetName}: ${count} row(s) would be removed`);
      clearCache(sheetName);
      return { data: transformedRows, error: null };
    }

    const result = singleResult ? (transformedRows[0] || null) : transformedRows;
    return { data: result, error: null };
  };

  const builder: any = {
    select(columns?: string) {
      queryAction = 'select';
      return builder;
    },
    eq(field: string, value: any) {
      filters.push({ field, value });
      return builder;
    },
    single() {
      singleResult = true;
      return builder;
    },
    delete() {
      queryAction = 'delete';
      return builder;
    },
    update(values: Record<string, any>) {
      console.log(`[Mock Update] ${SHEET_NAMES[tableName] || tableName}:`, values);
      return builder;
    },
    insert(values: Record<string, any>) {
      console.log(`[Mock Insert] ${SHEET_NAMES[tableName] || tableName}:`, values);
      return builder;
    },
    then(resolve: Function, reject: Function) {
      return execute().then(resolve, reject);
    }
  };

  return builder;
}

export const sheetsClient = {
  from: (table: string) => createQueryBuilder(table),

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

      return {
        data: {
          user: {
            id: user.user_id || user.id,
            email: username,
            user_metadata: { usuario: user.usuario, rol: user.rol }
          },
          session: {
            access_token: user.user_id || user.id,
            refresh_token: '',
            expires_at: 0,
            expires_in: 0,
            token_type: 'bearer'
          }
        },
        error: null
      };
    },

    signOut: async () => {
      return { error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },

    getSession: async () => {
      return { data: { session: null }, error: null };
    }
  },

  rpc: async (functionName: string, params: any): Promise<any> => {
    if (functionName === 'validate_login') {
      await delay(800);
      const { data: usuarios } = await sheetsClient.from('usuarios').select();
      const user = (usuarios as any[])?.find(
        (u: any) => String(u.usuario).toLowerCase() === String(params.p_usuario).toLowerCase()
      );

      if (user && user.contrasena === params.p_contrasena) {
        return {
          data: {
            id: user.id,
            usuario: user.usuario,
            nombre_completo: user.nombre_completo || user.usuario,
            rol: user.rol || 'CAPTURISTA',
            user_id: user.user_id,
            municipio: user.municipio
          },
          error: null
        };
      }
      return { data: null, error: { message: 'Credenciales no válidas.' } };
    }

    if (['save_rg_secure', 'save_rc_secure', 'save_ruta_secure', 'save_casilla_secure', 'save_user'].includes(functionName)) {
      clearCache();
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }
};

export default sheetsClient;