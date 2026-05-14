
export interface Municipio {
  id: number | string;
  municipio: string;
}

export interface DistritoFederal {
  id: number | string;
  df: number;
}

export interface DistritoLocal {
  id: number | string;
  dl: number;
}

export interface Seccion {
  id: number;
  municipio_id: number;
}

export interface Casilla {
  casilla_id: number;
  casilla: string;
  municipio: number;
  df: number;
  dl: number;
  ubicación?: string;
}

export interface RepresentanteGeneral {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  clave_elector: string;
  numero_credencial?: string;
  cic?: string;
  telefono?: string;
  correo_electronico?: string;
  seccion_id: number;
  municipio_id: number;
  df_id: number;
  dl_id: number;
  calle?: string;
  num_ext?: string;
  num_int?: string;
  colonia?: string;
  cp?: string;
  capturista_id?: number;
}

export interface RepresentanteCasilla {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  clave_elector: string;
  telefono?: string;
  casilla_id: number;
  tipo_nombramiento: string;
  capturista_id?: number;
}

export interface Ruta {
  id: number;
  nombre_ruta: string;
  municipio_id: number;
  representante_general_id: number;
  casillas_asignada: number[];
  capturista_id?: number;
}

export interface Usuario {
  id: number;
  usuario: string;
  rol: 'ADMIN' | 'CAPTURISTA';
  nombre_completo?: string;
}
