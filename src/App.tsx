import React, { useState, useEffect, useCallback } from 'react';
import { sheetsClient } from './sheetsClient';
import { 
  Users, 
  Search, 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle, 
  AlertTriangle,
  UserCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  LogOut,
  Trash2,
  Edit2,
  FileText,
  BarChart2,
  Printer,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  Route,
  Vote,
  Bell,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { Tables } from './database.types';

type Casilla = Tables<'casillas'>;
type DistritoFederal = Tables<'df'>;
type DistritoLocal = Tables<'dl'>;
type Municipio = Tables<'municipios'>;
type RepresentanteCasilla = Tables<'rc'>;
type RepresentanteGeneral = Tables<'rg'>;
type Seccion = Tables<'secciones'>;
type Ruta = Tables<'rutas'>;
type UsuarioManual = Tables<'usuarios'>;
import { 
  SkeletonTable,
  SkeletonDashboard
} from './components/UI';
import { useSessionTimeout } from './hooks/useSessionTimeout';

// --- Constantes y Validaciones ---
const CLAVE_ELECTOR_REGEX = /^[A-Z]{6}\d{8}[HM]\d{3}$/;

// --- Interfaces de Formulario ---
interface RGFormData {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  clave_elector: string;
  numero_credencial: string;
  cic: string;
  municipio_id: string; // UI Only
  df_id: string;
  dl_id: string;
  seccion_id: string;
  credencial_vigente: boolean;
  es_militante: boolean;
  calle: string;
  num_ext: string;
  num_int: string;
  colonia: string;
  codigo_postal: string;
  telefono: string;
  correo_electronico: string;
  autoriza_propaganda: boolean;
  tipo_propaganda: 'Ninguno' | 'Lona' | 'Pinta de Barda' | 'Otro';
  firma_capturada: boolean;
}

interface RCFormData extends RGFormData {
  casilla_id: string;
  tipo_nombramiento: 'Propietario' | 'Propietario 1' | 'Suplente' | 'Suplente 1';
}

// --- Componente de Error para el Dashboard ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
          <div className="card p-12 text-center space-y-6 max-w-md animate-scale-in">
            <div className="bg-danger-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-danger-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900">Algo salió mal</h2>
            <p className="text-surface-500 text-sm">Hubo un error crítico en la aplicación. Por favor, recarga la página.</p>
            <button onClick={() => window.location.reload()} className="btn-primary w-full">
              Recargar Sitio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // --- Estados de Sesión ---
  const [currentUser, setCurrentUser] = useState<UsuarioManual | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // --- Estados de Datos ---
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [distritosFederales, setDistritosFederales] = useState<DistritoFederal[]>([]);
  const [distritosLocales, setDistritosLocales] = useState<DistritoLocal[]>([]);
  const [casillas, setCasillas] = useState<Casilla[]>([]);
  const [representantesGenerales, setRepresentantesGenerales] = useState<RepresentanteGeneral[]>([]);
  const [representantesCasilla, setRepresentantesCasilla] = useState<RepresentanteCasilla[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioManual[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- UI y Navegación ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generales' | 'casilla' | 'listado_rg' | 'listado_rc' | 'casillas_form' | 'casillas_list' | 'rutas_form' | 'rutas_list' | 'reporte_rutas' | 'usuarios_mgmt' | 'usuarios_list'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Estados de Validación ---
  const [credencialValidacion, setCredencialValidacion] = useState('');
  const [mensajeValidacion, setMensajeValidacion] = useState<'exito' | 'advertencia' | null>(null);
  const [credencialEncontrada, setCredencialEncontrada] = useState<any>(null);

  // --- Estados para Reportes Operativos ---
  const [reporteOpTipo, setReporteOpTipo] = useState<'rg' | 'df' | 'dl' | 'municipio'>('rg');
  const [reporteOpValor, setReporteOpValor] = useState<string>('');

  // --- Formularios ---
  const [rgForm, setRgForm] = useState<RGFormData>({
    nombre: '', apellido_paterno: '', apellido_materno: '', clave_elector: '', numero_credencial: '', cic: '',
    municipio_id: '', df_id: '', dl_id: '', seccion_id: '', credencial_vigente: true, es_militante: false,
    calle: '', num_ext: '', num_int: '', colonia: '', codigo_postal: '', telefono: '', correo_electronico: '',
    autoriza_propaganda: false, tipo_propaganda: 'Ninguno', firma_capturada: false
  });

  const [rcForm, setRcForm] = useState<RCFormData>({
    nombre: '', apellido_paterno: '', apellido_materno: '', clave_elector: '', numero_credencial: '', cic: '',
    municipio_id: '', df_id: '', dl_id: '', seccion_id: '', casilla_id: '',
    tipo_nombramiento: 'Propietario', credencial_vigente: true, es_militante: false,
    calle: '', num_ext: '', num_int: '', colonia: '', codigo_postal: '', telefono: '', correo_electronico: '',
    autoriza_propaganda: false, tipo_propaganda: 'Ninguno', firma_capturada: false
  });

  const [rutaForm, setRutaForm] = useState({
    nombre_ruta: '', 
    representante_general_id: '', 
    df_id: '', 
    dl_id: '', 
    casillas_asignada: [] as number[],
    municipio_id: ''
  });

  const [casillaMgmtForm, setCasillaMgmtForm] = useState({
    casilla_id: '',
    casilla: '',
    df_id: '',
    dl_id: '',
    municipio_id: '',
    ubicación: ''
  });

  const [casillaSearch, setCasillaSearch] = useState('');

  const [userForm, setUserForm] = useState({
    usuario: '',
    nombre_completo: '',
    password: '',
    rol: 'CAPTURISTA' as 'ADMIN' | 'CAPTURISTA',
    municipio: ''
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // --- Edición ---
  const [editingRgId, setEditingRgId] = useState<number | null>(null);
  const [editingRcId, setEditingRcId] = useState<number | null>(null);
  const [editingRutaId, setEditingRutaId] = useState<number | null>(null);
  const [editingCasillaIntId, setEditingCasillaIntId] = useState<number | null>(null); // For updates we track the real DB "casilla_id" which acts as Primary Key here, though typically its an int.
  const [rgValidado, setRgValidado] = useState(false);
  const [rcValidado, setRcValidado] = useState(false);

  // --- Lógica de Auth ---
  useEffect(() => {
    const stored = localStorage.getItem('seebc_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUser(user);
      } catch {
        localStorage.removeItem('seebc_user');
      }
    }
    setAuthChecking(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await sheetsClient.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('seebc_user');
    setActiveTab('dashboard');
    toast.success('Sesión cerrada');
  };

  const handleLoginSuccess = (user: any) => {
    // La sesión la maneja ahora onAuthStateChange de forma centralizada
    setCurrentUser(user);
    toast.success('Bienvenido, ' + (user.nombre_completo || user.usuario));
  };

  useSessionTimeout(handleLogout, !!currentUser);

  // --- Carga de Datos ---
  const fetchData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    toast.loading('Cargando datos...', { id: 'fetch' });

    let loadedCount = { rg: 0, rc: 0 };

    try {
      // 1. Cargar Usuarios (Solo si es ADMIN la política lo permitirá)
      const { data: usersData } = await sheetsClient.from('usuarios').select('*');
      if (usersData) setUsuarios(usersData);

      // 2. Cargar Catálogos (Públicos o Autenticados)
      const [dfRes, dlRes, munRes, secRes] = await Promise.all([
        sheetsClient.from('df').select('*'),
        sheetsClient.from('dl').select('*'),
        sheetsClient.from('municipios').select('*'),
        sheetsClient.from('secciones').select('*')
      ]);

      if (dfRes.data) setDistritosFederales(dfRes.data);
      if (dlRes.data) setDistritosLocales(dlRes.data);
      if (munRes.data) setMunicipios(munRes.data);
      if (secRes.data) setSecciones(secRes.data);

      // 3. Cargar Datos Operativos (RLS filtrará automáticamente si no es ADMIN)
      const [rgRes, rcRes, rutasRes, casRes] = await Promise.all([
        sheetsClient.from('rg').select('*'),
        sheetsClient.from('rc').select('*'),
        sheetsClient.from('rutas').select('*'),
        sheetsClient.from('casillas').select('*')
      ]);

      let rgData = rgRes.data || [];
      let rcData = rcRes.data || [];
      let rutasData = rutasRes.data || [];
      let casData = casRes.data || [];
      loadedCount = { rg: rgData.length, rc: rcData.length };

      const userMunicipio = (currentUser as any)?.municipio;
      if (userMunicipio && currentUser?.rol !== 'ADMIN') {
        rgData = rgData.filter((r: any) => String(r.municipio_id) === String(userMunicipio));
        rcData = rcData.filter((r: any) => {
          const cas = casData.find((c: any) => String(c.casilla_id) === String(r.casilla_id));
          return cas && String(cas.municipio) === String(userMunicipio);
        });
        casData = casData.filter((c: any) => String(c.municipio) === String(userMunicipio));
        rutasData = rutasData.filter((r: any) => String(r.municipio_id) === String(userMunicipio));
      }

      setRepresentantesGenerales(rgData);
      setRepresentantesCasilla(rcData);
      setRutas(rutasData);
      setCasillas(casData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error('Error al cargar datos: ' + (error?.message || ''), { id: 'fetch' });
    } finally {
      setIsLoading(false);
      toast.dismiss('fetch');
    }
  };

  const handleTabClick = useCallback((itemId: string) => {
    setActiveTab(itemId as any);
    setSidebarOpen(false);
    setEditingRgId(null);
    setEditingRcId(null);
    setEditingRutaId(null);
    setEditingCasillaIntId(null);
    setCredencialValidacion('');
    setMensajeValidacion(null);
    setCredencialEncontrada(null);
    setRgValidado(false);
    setRcValidado(false);
    setCasillaSearch('');
    if (itemId === 'generales') {
      setRgForm({
        nombre: '', apellido_paterno: '', apellido_materno: '', clave_elector: '', numero_credencial: '', cic: '',
        municipio_id: '', df_id: '', dl_id: '', seccion_id: '', credencial_vigente: true, es_militante: false,
        calle: '', num_ext: '', num_int: '', colonia: '', codigo_postal: '', telefono: '', correo_electronico: '',
        autoriza_propaganda: false, tipo_propaganda: 'Ninguno' as any, firma_capturada: false
      });
    } else if (itemId === 'casilla') {
      setRcForm({
        nombre: '', apellido_paterno: '', apellido_materno: '', clave_elector: '', numero_credencial: '', cic: '',
        municipio_id: '', df_id: '', dl_id: '', seccion_id: '', casilla_id: '',
        tipo_nombramiento: 'Propietario' as any, credencial_vigente: true, es_militante: false,
        calle: '', num_ext: '', num_int: '', colonia: '', codigo_postal: '', telefono: '', correo_electronico: '',
        autoriza_propaganda: false, tipo_propaganda: 'Ninguno' as any, firma_capturada: false
      });
    } else if (itemId === 'rutas_form') {
      if (!editingRutaId) {
        setRutaForm({ 
          nombre_ruta: '', 
          representante_general_id: '', 
          df_id: '', 
          dl_id: '', 
          casillas_asignada: [],
          municipio_id: ''
        });
      }
    } else if (itemId === 'usuarios_mgmt') {
      setEditingUserId(null);
      setUserForm({ usuario: '', nombre_completo: '', password: '', rol: 'CAPTURISTA', municipio: '' });
      setShowUserPassword(false);
    }
  }, [editingRutaId]);

  // --- Handlers RG ---
  const handleEditRg = (rg: any) => {
    setEditingRgId(rg.id);
    setRgForm({
      nombre: rg.nombre, apellido_paterno: rg.apellido_paterno, apellido_materno: rg.apellido_materno || '',
      clave_elector: rg.clave_elector, numero_credencial: rg.numero_credencial || '', cic: rg.cic || '',
      municipio_id: String(rg.municipio_id || rg.seccion_id || ''),
      df_id: String(rg.df_id || ''), dl_id: String(rg.dl_id || ''), seccion_id: String(rg.seccion_id || ''),
      credencial_vigente: rg.credencial_vigente, es_militante: rg.es_militante,
      calle: rg.calle || '', num_ext: rg.num_ext || '', num_int: rg.num_int || '', colonia: rg.colonia || '',
      codigo_postal: rg.codigo_postal || '', telefono: rg.telefono || '', correo_electronico: rg.correo_electronico || '',
      autoriza_propaganda: rg.autoriza_propaganda, tipo_propaganda: rg.tipo_propaganda || 'Ninguno', firma_capturada: rg.firma_capturada || false
    });
    setActiveTab('generales');
  };

  const handleDeleteRg = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este RG?')) return;
    try {
      const { error } = await sheetsClient.from('rg').delete().eq('id', id);
      if (error) throw error;
      toast.success('RG eliminado');
      fetchData();
    } catch (error: any) {
      toast.error('Error al eliminar RG: ' + (error?.message || ''));
    }
  };

  const handleSaveRg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rgForm.clave_elector || rgForm.clave_elector.length !== 18) {
      toast.error('Debes validar una clave de elector de 18 caracteres');
      return;
    }
    try {
      const { municipio_id, ...payload } = rgForm;
      const dataToSave = {
        ...payload,
        df_id: parseInt(payload.df_id), dl_id: parseInt(payload.dl_id),
        seccion_id: parseInt(payload.seccion_id) || 0, capturista_id: 1
      };
      if (editingRgId) {
        await sheetsClient.rpc('save_rg_secure', { p_id: editingRgId, p_payload: dataToSave });
        toast.success('RG actualizado');
      } else {
        await sheetsClient.rpc('save_rg_secure', { p_id: null, p_payload: dataToSave });
        toast.success('RG registrado');
      }
      setEditingRgId(null); setActiveTab('listado_rg'); fetchData();
    } catch (error: any) {
      toast.error('Error: ' + (error?.message || ''));
    }
  };

  // --- Handlers RC ---
  const handleEditRc = (rc: any) => {
    setEditingRcId(rc.id);
    setRcForm({
      nombre: rc.nombre, apellido_paterno: rc.apellido_paterno, apellido_materno: rc.apellido_materno || '',
      clave_elector: rc.clave_elector, numero_credencial: rc.numero_credencial || '', cic: rc.cic || '',
      municipio_id: String(rc.municipio_id || ''),
      df_id: String(rc.df_id || ''), dl_id: String(rc.dl_id || ''), seccion_id: String(rc.seccion_id || ''),
      casilla_id: String(rc.casilla_id || ''), tipo_nombramiento: rc.tipo_nombramiento || 'Propietario',
      credencial_vigente: rc.credencial_vigente, es_militante: rc.es_militante,
      calle: rc.calle || '', num_ext: rc.num_ext || '', num_int: rc.num_int || '', colonia: rc.colonia || '',
      codigo_postal: rc.codigo_postal || '', telefono: rc.telefono || '', correo_electronico: rc.correo_electronico || '',
      autoriza_propaganda: rc.autoriza_propaganda, tipo_propaganda: rc.tipo_propaganda || 'Ninguno', firma_capturada: rc.firma_capturada || false
    });
    setActiveTab('casilla');
  };

  const handleDeleteRc = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este RC?')) return;
    try {
      const { error } = await sheetsClient.from('rc').delete().eq('id', id);
      if (error) throw error;
      toast.success('RC eliminado');
      fetchData();
    } catch (error: any) {
      toast.error('Error al eliminar RC: ' + (error?.message || ''));
    }
  };

  const handleSaveRc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcForm.clave_elector || rcForm.clave_elector.length !== 18) {
      toast.error('Debes validar una clave de elector de 18 caracteres');
      return;
    }
    try {
      const { municipio_id, ...payload } = rcForm;
      const dataToSave = {
        ...payload, casilla_id: parseInt(payload.casilla_id) || null,
        df_id: parseInt(payload.df_id), dl_id: parseInt(payload.dl_id),
        seccion_id: parseInt(payload.seccion_id) || 0, capturista_id: 1
      };
      if (editingRcId) {
        await sheetsClient.rpc('save_rc_secure', { p_id: editingRcId, p_payload: dataToSave });
        toast.success('RC actualizado');
      } else {
        await sheetsClient.rpc('save_rc_secure', { p_id: null, p_payload: dataToSave });
        toast.success('RC registrado');
      }
      setEditingRcId(null); setActiveTab('listado_rc'); fetchData();
    } catch (error: any) {
      toast.error('Error: ' + (error?.message || ''));
    }
  };

  // --- Handlers Casillas ---
  const handleEditCasilla = (cas: any) => {
    setEditingCasillaIntId(cas.casilla_id);
    setCasillaMgmtForm({
      casilla_id: String(cas.casilla_id || ''),
      casilla: cas.casilla || '',
      df_id: cas.df ? String(cas.df) : '',
      dl_id: cas.dl ? String(cas.dl) : '',
      municipio_id: cas.municipio ? String(cas.municipio) : '',
      ubicaci\u00f3n: cas.ubicaci\u00f3n || ''
    });
  };

  const handleDeleteCasilla = async (casilla_id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta casilla?')) return;
    try {
      const { error } = await sheetsClient.from('casillas').delete().eq('casilla_id', casilla_id);
      if (error) throw error;
      toast.success('Casilla eliminada');
      fetchData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + (error?.message || ''));
    }
  };

  const handleSaveCasilla = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        casilla: casillaMgmtForm.casilla,
        df: casillaMgmtForm.df_id ? parseInt(casillaMgmtForm.df_id) : null,
        dl: casillaMgmtForm.dl_id ? parseInt(casillaMgmtForm.dl_id) : null,
        municipio: casillaMgmtForm.municipio_id ? parseInt(casillaMgmtForm.municipio_id) : null,
        ubicaci\u00f3n: casillaMgmtForm.ubicaci\u00f3n ? casillaMgmtForm.ubicaci\u00f3n.toUpperCase() : null,
        capturista_id: 1
      };
      await sheetsClient.rpc('save_casilla_secure', { p_id: editingCasillaIntId, p_payload: dataToSave });
      toast.success(editingCasillaIntId ? 'Casilla actualizada' : 'Casilla registrada');
      setEditingCasillaIntId(null);
      setCasillaMgmtForm({ casilla_id: '', casilla: '', df_id: '', dl_id: '', municipio_id: '', ubicaci\u00f3n: '' });
      setActiveTab('casillas_list'); fetchData();
    } catch (error: any) {
      toast.error('Error: ' + (error?.message || ''));
    }
  };

  // --- Handlers Rutas ---
  const handleEditRuta = (ruta: any) => {
    setEditingRutaId(ruta.id);
    setRutaForm({
      nombre_ruta: ruta.nombre_ruta,
      representante_general_id: String(ruta.representante_general_id || ''),
      df_id: ruta.df_id ? String(ruta.df_id) : '',
      dl_id: ruta.dl_id ? String(ruta.dl_id) : '',
      municipio_id: ruta.municipio_id ? String(ruta.municipio_id) : '',
      casillas_asignada: (ruta.casillas_asignada || []) as number[]
    });
    setActiveTab('rutas_form');
  };

  const handleDeleteRuta = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta ruta?')) return;
    try {
      const { error } = await sheetsClient.from('rutas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Ruta eliminada');
      fetchData();
    } catch (error: any) {
      toast.error('Error al eliminar ruta: ' + (error?.message || ''));
    }
  };

  const handleSaveRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        nombre_ruta: rutaForm.nombre_ruta,
        df_id: rutaForm.df_id ? parseInt(rutaForm.df_id) : null,
        dl_id: parseInt(rutaForm.dl_id),
        representante_general_id: rutaForm.representante_general_id ? parseInt(rutaForm.representante_general_id) : null,
        municipio_id: rutaForm.municipio_id ? parseInt(rutaForm.municipio_id) : null,
        casillas_asignada: rutaForm.casillas_asignada,
        capturista_id: 1
      };
      if (editingRutaId) {
        await sheetsClient.rpc('save_ruta_secure', { p_id: editingRutaId, p_payload: dataToSave });
        toast.success('Ruta actualizada');
      } else {
        await sheetsClient.rpc('save_ruta_secure', { p_id: null, p_payload: dataToSave });
        toast.success('Ruta registrada');
      }
      setEditingRutaId(null); setActiveTab('rutas_list'); fetchData();
    } catch (error: any) {
      toast.error('Error: ' + (error?.message || ''));
    }
  };

  // --- Handler Usuarios ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.usuario || (!editingUserId && !userForm.password)) {
      toast.error('Usuario y contraseña requeridos');
      return;
    }
    try {
      if (editingUserId) {
        const { error } = await sheetsClient.from('usuarios').update({
          usuario: userForm.usuario.toLowerCase().trim(),
          rol: userForm.rol,
          nombre_completo: userForm.nombre_completo || null,
          municipio: userForm.municipio || null
        }).eq('id', editingUserId);
        if (error) throw error;
      } else {
        const { error } = await sheetsClient.rpc('save_user', {
          p_id: 0, p_usuario: userForm.usuario.toLowerCase().trim(),
          p_password: userForm.password, p_rol: userForm.rol,
          p_nombre_completo: userForm.nombre_completo || '',
          p_municipio: userForm.municipio || null
        });
        if (error) throw error;
      }
      toast.success(editingUserId ? 'Usuario actualizado' : 'Usuario creado');
      setEditingUserId(null);
      setUserForm({ usuario: '', nombre_completo: '', password: '', rol: 'CAPTURISTA', municipio: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + (error?.message || ''));
    }
  };

  const handleEditUser = (u: UsuarioManual) => {
    setEditingUserId(u.id);
    setUserForm({
      usuario: u.usuario,
      nombre_completo: u.nombre_completo || '',
      password: '',
      rol: (u.rol as any) || 'CAPTURISTA',
      municipio: u.municipio ? String(u.municipio) : ''
    });
    setShowUserPassword(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser?.id) {
      toast.error('No puedes eliminar tu propio usuario');
      return;
    }
    if (!confirm('¿Seguro que deseas eliminar este usuario? Sus capturas quedarán sin autor asignado.')) return;
    
    // El trigger/constraint de base de datos se encargará de poner capturista_id = NULL
    const { error } = await sheetsClient.from('usuarios').delete().eq('id', id);
    if (error) toast.error('Error al eliminar usuario');
    else { toast.success('Usuario eliminado'); fetchData(); }
  };

  // --- Cálculos de métricas ---
  const coberturaEstatal = Math.round((representantesCasilla.length / (casillas.length || 1)) * 100);
  const casillasSinCobertura = casillas.length - Array.from(new Set(representantesCasilla.map(rc => rc.casilla_id))).length;

  if (authChecking) return null;
  if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} />;

  // --- Tab title mapping ---
  const tabTitles: Record<string, string> = {
    dashboard: 'Panel de Control',
    generales: editingRgId ? 'Editar Representante General' : 'Nuevo Representante General',
    casilla: editingRcId ? 'Editar Rep. de Casilla' : 'Nuevo Rep. de Casilla',
    listado_rg: 'Representantes Generales',
    listado_rc: 'Representantes de Casilla',
    casillas: 'Catálogo de Casillas',
    padron: 'Padrón Electoral',
    rutas_form: editingRutaId ? 'Editar Ruta' : 'Nueva Ruta',
    rutas_list: 'Listado de Rutas',
    reporte_rutas: 'Listados Operativos',
    usuarios_mgmt: 'Gestión de Usuarios',
    usuarios_list: 'Usuarios',
  };

  return (
    <ErrorBoundary>
    <>
      <Toaster 
        position="top-center" 
        containerClassName="center-toaster"
        toastOptions={{ 
          style: { borderRadius: '8px', background: '#111827', color: '#fff', fontSize: '13px', fontWeight: '500', fontFamily: 'Inter, sans-serif' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }} 
      />

      <div className="min-h-screen bg-surface-50 flex">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        handleTabClick={handleTabClick}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-8 z-10 no-print flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-icon lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / Page Title */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-surface-400">SEEBC</span>
            <span className="text-surface-300">/</span>
            <span className="font-semibold text-surface-800">{tabTitles[activeTab] || 'Dashboard'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input 
                type="text" 
                placeholder="BUSCAR REGISTROS..." 
                className="bg-surface-50 border border-surface-200 pl-10 pr-4 py-2 rounded-none w-64 text-sm focus:outline-none focus:ring-2 focus:ring-inst-500/20 focus:border-inst-500 transition-all placeholder:text-surface-400 uppercase"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              />
          </div>

          <div className="h-6 w-px bg-surface-200 hidden md:block" />

          {/* Notifications */}
          <button className="btn-icon relative">
            <Bell className="w-5 h-5" />
            {casillasSinCobertura > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {/* System Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            <span className="text-xs font-medium text-success-700">Operativo</span>
          </div>

          <div className="h-6 w-px bg-surface-200" />

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-inst-100 rounded-lg flex items-center justify-center text-sm font-bold text-inst-700">
              {currentUser?.usuario?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-surface-800 leading-none">{currentUser?.usuario || 'Invitado'}</p>
              <p className="text-[11px] text-surface-400 mt-0.5">{currentUser?.rol === 'ADMIN' ? 'Administrador' : 'Capturista'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
        {isLoading ? (
          activeTab === 'dashboard' ? <SkeletonDashboard /> : <SkeletonTable />
        ) : (
          <div className="max-w-7xl mx-auto pb-12">
            {/* ============ DASHBOARD ============ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Header */}
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-surface-900">Panel de Control</h1>
                  <p className="text-surface-500 mt-1 text-sm">Vista general del sistema electoral</p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
                  {/* RG Count */}
                  <div className="card-metric hover-lift group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-inst-50 rounded-lg flex items-center justify-center group-hover:bg-inst-100 transition-colors">
                        <Users className="w-5 h-5 text-inst-600" />
                      </div>
                      <span className="badge-info">
                        <TrendingUp className="w-3 h-3" />+12%
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-surface-900">{representantesGenerales.length}</p>
                    <p className="text-xs text-surface-500 mt-1 font-medium">Representantes Generales</p>
                  </div>

                  {/* RC Count */}
                  <div className="card-metric hover-lift group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center group-hover:bg-warning-100 transition-colors">
                        <ClipboardList className="w-5 h-5 text-warning-600" />
                      </div>
                      <span className="badge-warning">Meta: 90%</span>
                    </div>
                    <p className="text-3xl font-bold text-surface-900">{representantesCasilla.length}</p>
                    <p className="text-xs text-surface-500 mt-1 font-medium">Representantes de Casilla</p>
                  </div>

                  {/* Cobertura */}
                  <div className="card-metric hover-lift group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center group-hover:bg-success-100 transition-colors">
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      </div>
                      <span className="badge-success">Activo</span>
                    </div>
                    <p className="text-3xl font-bold text-surface-900">{coberturaEstatal}%</p>
                    <p className="text-xs text-surface-500 mt-1 font-medium">Cobertura Estatal</p>
                  </div>

                  {/* Sin Cobertura */}
                  <div className="card-metric hover-lift group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center group-hover:bg-danger-100 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-danger-600" />
                      </div>
                      <span className="badge-danger">Prioridad</span>
                    </div>
                    <p className="text-3xl font-bold text-danger-600">{casillasSinCobertura}</p>
                    <p className="text-xs text-surface-500 mt-1 font-medium">Casillas sin Cobertura</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cobertura por Municipio */}
                  <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-surface-800 text-sm">Cobertura por Municipio</h3>
                        <p className="text-xs text-surface-400 mt-0.5">Avance de estructura municipal</p>
                      </div>
                      <BarChart2 className="w-4 h-4 text-surface-300" />
                    </div>
                    <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
                      {municipios.map(m => {
                        const casillasEnMun = casillas.filter(c => c.municipio === m.id);
                        const casillasCubiertas = Array.from(new Set(representantesCasilla.filter(rc => {
                          const cas = casillas.find(c => c.casilla_id === rc.casilla_id);
                          return cas?.municipio === m.id;
                        }).map(rc => rc.casilla_id))).length;
                        const porc = casillasEnMun.length > 0 ? (casillasCubiertas / casillasEnMun.length) * 100 : 0;
                        
                        return (
                          <div key={m.id} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-surface-700">{m.municipio}</span>
                              <span className="text-[11px] font-medium text-surface-400">{casillasCubiertas}/{casillasEnMun.length}</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className={`progress-bar-fill ${porc < 50 ? 'bg-danger-500' : porc < 90 ? 'bg-warning-500' : 'bg-success-500'}`} 
                                style={{ width: `${porc}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alertas de Vacíos */}
                  <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-surface-800 text-sm">Prioridad de Cobertura</h3>
                        <p className="text-xs text-surface-400 mt-0.5">Casillas sin representante asignado</p>
                      </div>
                      <span className="badge-danger">{casillasSinCobertura} vacías</span>
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Sección</th>
                            <th>Casilla</th>
                            <th>Municipio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {casillas
                            .filter(c => !representantesCasilla.some(rc => rc.casilla_id === c.casilla_id))
                            .slice(0, 50)
                            .map(c => (
                              <tr key={c.casilla_id}>
                                <td><span className="font-semibold text-surface-800">{c.casilla?.split(' ')[0]}</span></td>
                                <td><span className="text-danger-600 font-medium">{c.casilla}</span></td>
                                <td><span className="text-surface-400 text-xs">{municipios.find(m => m.id === c.municipio)?.municipio}</span></td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                  <h3 className="font-semibold text-surface-800 text-sm mb-4">Acciones Rápidas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button onClick={() => handleTabClick('generales')} className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 hover:bg-inst-50 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-inst-100 flex items-center justify-center group-hover:bg-inst-200 transition-colors">
                        <UserCircle className="w-4 h-4 text-inst-600" />
                      </div>
                      <span className="text-sm font-medium text-surface-700 group-hover:text-inst-700">Nuevo RG</span>
                    </button>
                    <button onClick={() => handleTabClick('casilla')} className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 hover:bg-warning-50 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-warning-100 flex items-center justify-center group-hover:bg-warning-200 transition-colors">
                        <ClipboardList className="w-4 h-4 text-warning-600" />
                      </div>
                      <span className="text-sm font-medium text-surface-700 group-hover:text-warning-700">Nuevo RC</span>
                    </button>
                    <button onClick={() => handleTabClick('rutas_form')} className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 hover:bg-surface-100 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-surface-200 flex items-center justify-center group-hover:bg-surface-300 transition-colors">
                        <Route className="w-4 h-4 text-surface-600" />
                      </div>
                      <span className="text-sm font-medium text-surface-700">Nueva Ruta</span>
                    </button>
                    <button onClick={() => handleTabClick('reporte_rutas')} className="flex items-center gap-3 p-4 rounded-lg bg-surface-50 hover:bg-surface-100 transition-all group">
                      <div className="w-9 h-9 rounded-lg bg-surface-200 flex items-center justify-center group-hover:bg-surface-300 transition-colors">
                        <Printer className="w-4 h-4 text-surface-600" />
                      </div>
                      <span className="text-sm font-medium text-surface-700">Imprimir</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============ REPORTE OPERATIVO ============ */}
            {activeTab === 'reporte_rutas' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 no-print">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">Listados Operativos</h1>
                    <p className="text-surface-500 text-sm mt-1">Formato de campo — Tamaño carta</p>
                  </div>
                  <button 
                    onClick={() => window.print()} 
                    disabled={!reporteOpValor}
                    className="btn-primary"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Listado
                  </button>
                </div>

                <div className="card p-6 no-print">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Filtrar por</label>
                        <select 
                          className="select-field"
                          value={reporteOpTipo}
                          onChange={(e) => {
                            setReporteOpTipo(e.target.value as any);
                            setReporteOpValor('');
                          }}
                        >
                          <option value="rg">General (RG)</option>
                          <option value="municipio">Municipio</option>
                          <option value="df">Distrito Federal (DF)</option>
                          <option value="dl">Distrito Local (DL)</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Seleccionar {reporteOpTipo.toUpperCase()}</label>
                        <select 
                          className="select-field"
                          value={reporteOpValor}
                          onChange={(e) => setReporteOpValor(e.target.value)}
                        >
                          <option value="">— Elige una opción —</option>
                          {reporteOpTipo === 'rg' && [...representantesGenerales].sort((a,b) => a.nombre.localeCompare(b.nombre)).map(rg => (
                            <option key={rg.id} value={rg.id}>{rg.nombre} {rg.apellido_paterno}</option>
                          ))}
                          {reporteOpTipo === 'municipio' && [...municipios].sort((a,b) => (a.municipio || '').localeCompare(b.municipio || '')).map(m => (
                            <option key={m.id} value={m.id}>{m.municipio}</option>
                          ))}
                          {reporteOpTipo === 'df' && [...distritosFederales].sort((a,b) => (a.df || 0) - (b.df || 0)).map(df => (
                            <option key={df.id} value={df.id}>Distrito Federal {df.df}</option>
                          ))}
                          {reporteOpTipo === 'dl' && [...distritosLocales].sort((a,b) => (a.dl || 0) - (b.dl || 0)).map(dl => (
                            <option key={dl.id} value={dl.id}>Distrito Local {dl.dl}</option>
                          ))}
                        </select>
                      </div>
                   </div>
                </div>

                {reporteOpValor ? (
                  <div className="card overflow-hidden printable-area">
                    {/* Print Header */}
                    <div className="p-6 border-b-2 border-surface-900 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest">Control de Estructura Electoral 2026</p>
                        <h3 className="text-xl font-bold text-surface-900">
                          {reporteOpTipo === 'rg' ? `RG: ${representantesGenerales.find(r => String(r.id) === reporteOpValor)?.nombre} ${representantesGenerales.find(r => String(r.id) === reporteOpValor)?.apellido_paterno}` : 
                           reporteOpTipo === 'municipio' ? `Municipio: ${municipios.find(m => String(m.id) === reporteOpValor)?.municipio}` :
                           reporteOpTipo === 'df' ? `Distrito Federal ${distritosFederales.find(d => String(d.id) === reporteOpValor)?.df}` :
                           `Distrito Local ${distritosLocales.find(d => String(d.id) === reporteOpValor)?.dl}`}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider">Página 1 de 1</p>
                        <p className="text-sm font-semibold text-surface-800">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    <table className="data-table">
                       <thead>
                          <tr>
                             <th>Casilla</th>
                             {reporteOpTipo !== 'rg' && <th>RG</th>}
                             <th>Nombre del Representante</th>
                             <th>Tipo</th>
                             <th>Celular</th>
                             <th>Correo Electrónico</th>
                             <th>Ubicación de Casilla</th>
                          </tr>
                       </thead>
                       <tbody>
                          {representantesCasilla
                            .filter(rc => {
                              const cas = casillas.find(c => String(c.casilla_id) === String(rc.casilla_id));
                              if (reporteOpTipo === 'rg') {
                                const ruta = rutas.find(r => 
                                  Array.isArray(r.casillas_asignada) && 
                                  r.casillas_asignada.map(String).includes(String(rc.casilla_id))
                                );
                                return String(ruta?.representante_general_id || '') === reporteOpValor;
                              }
                              if (reporteOpTipo === 'municipio') return String(cas?.municipio || '') === reporteOpValor;
                              if (reporteOpTipo === 'df') return String(rc.df_id) === reporteOpValor;
                              if (reporteOpTipo === 'dl') return String(rc.dl_id) === reporteOpValor;
                              return false;
                            })
                            .sort((a,b) => {
                              const casA = casillas.find(c => c.casilla_id === a.casilla_id)?.casilla || '';
                              const casB = casillas.find(c => c.casilla_id === b.casilla_id)?.casilla || '';
                              return (casA || '').localeCompare(casB || '', undefined, {numeric: true, sensitivity: 'base'});
                            })
                            .map(rc => {
                               const cas = casillas.find(c => c.casilla_id === rc.casilla_id);
                               const ruta = rutas.find(r => 
                                 Array.isArray(r.casillas_asignada) && 
                                 r.casillas_asignada.map(String).includes(String(rc.casilla_id))
                               );
                               const rg = ruta ? representantesGenerales.find(r => String(r.id) === String(ruta.representante_general_id)) : null;

                               return (
                                 <tr key={rc.id}>
                                   <td><span className="font-semibold text-surface-900 whitespace-nowrap text-xs">{cas?.casilla || 'N/A'}</span></td>
                                   {reporteOpTipo !== 'rg' && (
                                     <td><span className="text-xs text-surface-600 uppercase font-medium">{rg ? `${rg.nombre} ${rg.apellido_paterno}` : 'Sin asignar'}</span></td>
                                   )}
                                   <td><span className="font-semibold text-surface-800 uppercase text-xs">{rc.nombre} {rc.apellido_paterno} {rc.apellido_materno || ''}</span></td>
                                   <td><span className="text-xs text-surface-500">{rc.tipo_nombramiento}</span></td>
                                   <td><span className="text-xs font-medium text-inst-600 font-mono">{rc.telefono || '—'}</span></td>
                                   <td><span className="text-xs text-surface-400 truncate max-w-[150px] inline-block">{rc.correo_electronico || '—'}</span></td>
                                   <td><span className="text-[10px] text-surface-500 italic">{cas?.ubicación || '—'}</span></td>
                                 </tr>
                               );
                            })}
                          {representantesCasilla.filter(rc => {
                              if (reporteOpTipo === 'rg') {
                                const ruta = rutas.find(r => 
                                  Array.isArray(r.casillas_asignada) && 
                                  r.casillas_asignada.map(String).includes(String(rc.casilla_id))
                                );
                                return String(ruta?.representante_general_id) === reporteOpValor;
                              }
                              if (reporteOpTipo === 'df') return String(rc.df_id) === reporteOpValor;
                              if (reporteOpTipo === 'dl') return String(rc.dl_id) === reporteOpValor;
                              return false;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-12">
                                 <p className="text-sm text-surface-400">Sin registros que coincidan con la selección</p>
                              </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card border-dashed border-2 py-20 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center">
                      <Printer className="w-7 h-7 text-surface-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-600">Configuración del Reporte</p>
                      <p className="text-sm text-surface-400 mt-1">Selecciona el tipo de filtro y el valor para generar el listado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============ LISTADO RG ============ */}
            {activeTab === 'listado_rg' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">Representantes Generales</h1>
                    <p className="text-surface-500 text-sm mt-1">Administración y seguimiento de la estructura capturada</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-info">{representantesGenerales.length} registros</span>
                    <button onClick={() => handleTabClick('generales')} className="btn-primary">
                      <UserCircle className="w-4 h-4" />
                      Nuevo RG
                    </button>
                  </div>
                </div>

                <div className="table-wrapper overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre Completo</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Municipio / Sección</th>
                        <th>Distritos</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {representantesGenerales
                        .filter(rg => 
                          rg.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (rg.telefono && rg.telefono.includes(searchTerm)) ||
                          (rg.correo_electronico && rg.correo_electronico.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .sort((a, b) => a.nombre.localeCompare(b.nombre))
                        .map((rg) => {
                          const seccionObj = secciones.find(s => s.id === rg.seccion_id);
                          const municipio = municipios.find(m => m.id === seccionObj?.municipio_id)?.municipio || 'N/A';
                          const dfObj = distritosFederales.find(d => String(d.id) === String(rg.df_id));
                          const dlObj = distritosLocales.find(d => String(d.id) === String(rg.dl_id));
                          
                          return (
                            <tr key={rg.id}>
                              <td>
                                <span className="font-semibold text-surface-800 uppercase">{rg.nombre} {rg.apellido_paterno} {rg.apellido_materno || ''}</span>
                              </td>
                              <td>
                                <span className="text-surface-600 text-xs font-mono">{rg.telefono || 'N/A'}</span>
                              </td>
                              <td>
                                <span className="text-surface-400 text-xs">{rg.correo_electronico || 'N/A'}</span>
                              </td>
                              <td>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-surface-700">{municipio}</span>
                                  <span className="text-[11px] text-surface-400">Sección {seccionObj?.id || 'N/A'}</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex gap-1.5">
                                  <span className="badge-info">DF {dfObj?.df || 'N/A'}</span>
                                  <span className="badge-success">DL {dlObj?.dl || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handleEditRg(rg)} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteRg(rg.id)} className="btn-icon hover:!text-danger-600 hover:!bg-danger-50" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {representantesGenerales.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="w-10 h-10 text-surface-300" />
                              <p className="text-sm text-surface-400">No hay representantes registrados</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============ FORM RG ============ */}
            {activeTab === 'generales' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-info">Estructura Electoral</span>
                  </div>
                  <h1 className="text-2xl font-bold text-surface-900">{editingRgId ? 'Editar' : 'Registro de'} Representante General</h1>
                </div>

                <ValidadorCredencial 
                  tipo="rg"
                  onSuccess={(clave: string) => {
                    setRgForm(prev => ({ ...prev, clave_elector: clave }));
                    setRgValidado(true);
                  }}
                  credencialValidacion={credencialValidacion}
                  setCredencialValidacion={setCredencialValidacion}
                  mensajeValidacion={mensajeValidacion}
                  setMensajeValidacion={setMensajeValidacion}
                  credencialEncontrada={credencialEncontrada}
                  setCredencialEncontrada={setCredencialEncontrada}
                  activeTab={activeTab}
                  representantesGenerales={representantesGenerales}
                  representantesCasilla={representantesCasilla}
                  editingRgId={editingRgId}
                  editingRcId={editingRcId}
                />

                {(rgValidado || editingRgId) && (
                  <form onSubmit={handleSaveRg} className="card p-6 lg:p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-inst-600" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="input-label">Nombre(s)</label>
                        <input type="text" required className="input-field uppercase" value={rgForm.nombre} onChange={e => setRgForm({...rgForm, nombre: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">Apellido Paterno</label>
                        <input type="text" required className="input-field uppercase" value={rgForm.apellido_paterno} onChange={e => setRgForm({...rgForm, apellido_paterno: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">Apellido Materno</label>
                        <input type="text" className="input-field uppercase" value={rgForm.apellido_materno} onChange={e => setRgForm({...rgForm, apellido_materno: e.target.value.toUpperCase()})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="input-label">Clave de Elector</label>
                        <input type="text" readOnly className="input-field bg-surface-50 text-surface-400 cursor-not-allowed font-mono uppercase" value={rgForm.clave_elector} />
                      </div>
                      <div>
                        <label className="input-label">No. Credencial</label>
                        <input type="text" className="input-field uppercase" value={rgForm.numero_credencial} onChange={e => setRgForm({...rgForm, numero_credencial: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">CIC</label>
                        <input type="text" className="input-field uppercase" value={rgForm.cic} onChange={e => setRgForm({...rgForm, cic: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">Teléfono</label>
                        <input type="tel" className="input-field uppercase" value={rgForm.telefono} onChange={e => setRgForm({...rgForm, telefono: e.target.value.toUpperCase()})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="input-label">Municipio</label>
                        <select required className="select-field" value={rgForm.municipio_id} onChange={e => setRgForm({...rgForm, municipio_id: e.target.value, seccion_id: ''})}>
                          <option value="">Seleccionar...</option>
                          {[...municipios].sort((a,b) => (a.municipio || '').localeCompare(b.municipio || '')).map(m => <option key={m.id} value={m.id}>{m.municipio}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Sección</label>
                        <select required className="select-field" value={rgForm.seccion_id} onChange={e => setRgForm({...rgForm, seccion_id: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {secciones.filter(s => String(s.municipio_id) === rgForm.municipio_id).sort((a,b) => a.id - b.id).map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Distrito Federal</label>
                        <select required className="select-field" value={rgForm.df_id} onChange={e => setRgForm({...rgForm, df_id: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {[...distritosFederales].sort((a, b) => (a.df || 0) - (b.df || 0)).map(d => <option key={d.id} value={d.id}>DF {d.df}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Distrito Local</label>
                        <select required className="select-field" value={rgForm.dl_id} onChange={e => setRgForm({...rgForm, dl_id: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {[...distritosLocales].sort((a, b) => (a.dl || 0) - (b.dl || 0)).map(d => <option key={d.id} value={d.id}>DL {d.dl}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Correo electrónico */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Correo Electrónico</label>
                        <input type="email" className="input-field" value={rgForm.correo_electronico} onChange={e => setRgForm({...rgForm, correo_electronico: e.target.value})} placeholder="correo@ejemplo.com" />
                      </div>
                    </div>

                    {/* Dirección */}
                    <div>
                      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Domicilio</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="input-label">Calle</label>
                          <input type="text" className="input-field uppercase" value={rgForm.calle} onChange={e => setRgForm({...rgForm, calle: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="input-label">Núm. Exterior</label>
                          <input type="text" className="input-field uppercase" value={rgForm.num_ext} onChange={e => setRgForm({...rgForm, num_ext: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="input-label">Núm. Interior</label>
                          <input type="text" className="input-field uppercase" value={rgForm.num_int} onChange={e => setRgForm({...rgForm, num_int: e.target.value.toUpperCase()})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="md:col-span-2">
                          <label className="input-label">Colonia</label>
                          <input type="text" className="input-field uppercase" value={rgForm.colonia} onChange={e => setRgForm({...rgForm, colonia: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="input-label">Código Postal</label>
                          <input type="text" className="input-field uppercase" maxLength={5} value={rgForm.codigo_postal} onChange={e => setRgForm({...rgForm, codigo_postal: e.target.value.toUpperCase()})} />
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div>
                      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Información Adicional</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rgForm.credencial_vigente} onChange={e => setRgForm({...rgForm, credencial_vigente: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Credencial Vigente</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rgForm.es_militante} onChange={e => setRgForm({...rgForm, es_militante: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Es Militante</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rgForm.autoriza_propaganda} onChange={e => setRgForm({...rgForm, autoriza_propaganda: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Autoriza Propaganda</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rgForm.firma_capturada} onChange={e => setRgForm({...rgForm, firma_capturada: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Firma Capturada</span>
                        </label>
                      </div>
                      {rgForm.autoriza_propaganda && (
                        <div className="mt-4 max-w-xs">
                          <label className="input-label">Tipo de Propaganda</label>
                          <select className="select-field" value={rgForm.tipo_propaganda} onChange={e => setRgForm({...rgForm, tipo_propaganda: e.target.value as any})}>
                            <option value="Ninguno">Ninguno</option>
                            <option value="Lona">Lona</option>
                            <option value="Pinta de Barda">Pinta de Barda</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                      <button type="button" onClick={() => handleTabClick('listado_rg')} className="btn-ghost">Cancelar</button>
                      <button type="submit" className="btn-primary">
                        {editingRgId ? 'Actualizar Registro' : 'Completar Registro'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ============ FORM RC ============ */}
            {activeTab === 'casilla' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-warning">Estructura Electoral</span>
                  </div>
                  <h1 className="text-2xl font-bold text-surface-900">{editingRcId ? 'Editar' : 'Registro de'} Representante de Casilla</h1>
                </div>

                <ValidadorCredencial 
                  tipo="rc"
                  registrosExistentes={representantesCasilla}
                  onSuccess={(clave: string) => {
                    setRcForm(prev => ({ ...prev, clave_elector: clave }));
                    setRcValidado(true);
                  }}
                  credencialValidacion={credencialValidacion}
                  setCredencialValidacion={setCredencialValidacion}
                  mensajeValidacion={mensajeValidacion}
                  setMensajeValidacion={setMensajeValidacion}
                  credencialEncontrada={credencialEncontrada}
                  setCredencialEncontrada={setCredencialEncontrada}
                  activeTab={activeTab}
                  representantesGenerales={representantesGenerales}
                  representantesCasilla={representantesCasilla}
                  editingRgId={editingRgId}
                  editingRcId={editingRcId}
                  setRgForm={setRgForm}
                  setRcForm={setRcForm}
                  handleEditRg={handleEditRg}
                  handleEditRc={handleEditRc}
                />

                {(rcValidado || editingRcId) && (
                  <form onSubmit={handleSaveRc} className="card p-6 lg:p-8 space-y-8 relative overflow-hidden animate-scale-in">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-warning-600" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="input-label">Nombre(s)</label>
                        <input type="text" required className="input-field uppercase" value={rcForm.nombre} onChange={e => setRcForm({...rcForm, nombre: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">Apellido Paterno</label>
                        <input type="text" required className="input-field uppercase" value={rcForm.apellido_paterno} onChange={e => setRcForm({...rcForm, apellido_paterno: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">Apellido Materno</label>
                        <input type="text" className="input-field uppercase" value={rcForm.apellido_materno} onChange={e => setRcForm({...rcForm, apellido_materno: e.target.value.toUpperCase()})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="input-label">Clave de Elector</label>
                        <input type="text" readOnly className="input-field bg-surface-50 text-surface-400 cursor-not-allowed font-mono uppercase" value={rcForm.clave_elector} />
                      </div>
                      <div>
                        <label className="input-label">No. Credencial</label>
                        <input type="text" className="input-field uppercase" value={rcForm.numero_credencial} onChange={e => setRcForm({...rcForm, numero_credencial: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">CIC</label>
                        <input type="text" className="input-field uppercase" value={rcForm.cic} onChange={e => setRcForm({...rcForm, cic: e.target.value.toUpperCase()})} />
                      </div>
                      <div>
                        <label className="input-label">Teléfono</label>
                        <input type="tel" className="input-field uppercase" value={rcForm.telefono} onChange={e => setRcForm({...rcForm, telefono: e.target.value.toUpperCase()})} />
                      </div>
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Tipo Registro</label>
                        <select className="select-field" value={rcForm.tipo_nombramiento} onChange={e => setRcForm({...rcForm, tipo_nombramiento: e.target.value as any})}>
                          <option value="Propietario">Propietario</option>
                          <option value="Propietario 1">Propietario 1</option>
                          <option value="Suplente">Suplente</option>
                          <option value="Suplente 1">Suplente 1</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="input-label">Municipio</label>
                        <select required className="select-field" value={rcForm.municipio_id} onChange={e => setRcForm({...rcForm, municipio_id: e.target.value, seccion_id: '', casilla_id: ''})}>
                          <option value="">Seleccionar...</option>
                          {[...municipios].sort((a,b) => (a.municipio || '').localeCompare(b.municipio || '')).map(m => <option key={m.id} value={m.id}>{m.municipio}</option>)}
                        </select>
                      </div>
                      <div>
                         <label className="input-label">Casilla Asignada</label>
                         <select required className="select-field" value={rcForm.casilla_id} onChange={e => {
                           const cas = casillas.find(c => String(c.casilla_id) === e.target.value);
                           setRcForm({
                             ...rcForm, 
                             casilla_id: e.target.value,
                             seccion_id: cas?.seccion_id ? String(cas.seccion_id) : '',
                             df_id: cas?.df ? String(cas.df) : rcForm.df_id,
                             dl_id: cas?.dl ? String(cas.dl) : rcForm.dl_id
                           });
                         }}>
                           <option value="">Seleccionar...</option>
                           {casillas
                             .filter(c => String(c.municipio) === rcForm.municipio_id)
                             .sort((a,b) => (a.casilla || '').localeCompare(b.casilla || '', undefined, {numeric: true}))
                             .map(c => <option key={c.casilla_id} value={c.casilla_id}>{c.casilla}</option>)}
                         </select>
                      </div>
                      <div>
                        <label className="input-label">Sección (Automática)</label>
                        <input type="text" readOnly className="input-field bg-surface-50 text-surface-400 cursor-not-allowed" value={rcForm.seccion_id || ''} placeholder="Se autocompleta" />
                      </div>
                    </div>



                    {/* Dirección */}
                    <div>
                      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Domicilio</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="input-label">Calle</label>
                          <input type="text" className="input-field uppercase" value={rcForm.calle} onChange={e => setRcForm({...rcForm, calle: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="input-label">Núm. Exterior</label>
                          <input type="text" className="input-field uppercase" value={rcForm.num_ext} onChange={e => setRcForm({...rcForm, num_ext: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="input-label">Núm. Interior</label>
                          <input type="text" className="input-field uppercase" value={rcForm.num_int} onChange={e => setRcForm({...rcForm, num_int: e.target.value.toUpperCase()})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="md:col-span-2">
                          <label className="input-label">Colonia</label>
                          <input type="text" className="input-field uppercase" value={rcForm.colonia} onChange={e => setRcForm({...rcForm, colonia: e.target.value.toUpperCase()})} />
                        </div>
                        <div>
                          <label className="input-label">Código Postal</label>
                          <input type="text" className="input-field uppercase" maxLength={5} value={rcForm.codigo_postal} onChange={e => setRcForm({...rcForm, codigo_postal: e.target.value.toUpperCase()})} />
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div>
                      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Información Adicional</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rcForm.credencial_vigente} onChange={e => setRcForm({...rcForm, credencial_vigente: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Credencial Vigente</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rcForm.es_militante} onChange={e => setRcForm({...rcForm, es_militante: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Es Militante</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rcForm.autoriza_propaganda} onChange={e => setRcForm({...rcForm, autoriza_propaganda: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Autoriza Propaganda</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 cursor-pointer hover:bg-surface-50 transition-colors">
                          <input type="checkbox" className="w-4 h-4 accent-inst-600" checked={rcForm.firma_capturada} onChange={e => setRcForm({...rcForm, firma_capturada: e.target.checked})} />
                          <span className="text-sm font-medium text-surface-700">Firma Capturada</span>
                        </label>
                      </div>
                      {rcForm.autoriza_propaganda && (
                        <div className="mt-4 max-w-xs">
                          <label className="input-label">Tipo de Propaganda</label>
                          <select className="select-field" value={rcForm.tipo_propaganda} onChange={e => setRcForm({...rcForm, tipo_propaganda: e.target.value as any})}>
                            <option value="Ninguno">Ninguno</option>
                            <option value="Lona">Lona</option>
                            <option value="Pinta de Barda">Pinta de Barda</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="input-label">Correo Electrónico</label>
                        <input type="email" className="input-field" value={rcForm.correo_electronico} onChange={e => setRcForm({...rcForm, correo_electronico: e.target.value})} placeholder="correo@ejemplo.com" />
                      </div>
                      <div>
                        <label className="input-label">Distrito Federal</label>
                        <input type="text" readOnly className="input-field bg-surface-50 text-surface-400 cursor-not-allowed font-mono" value={rcForm.df_id ? `DF ${rcForm.df_id}` : '—'} />
                      </div>
                      <div>
                        <label className="input-label">Distrito Local</label>
                        <input type="text" readOnly className="input-field bg-surface-50 text-surface-400 cursor-not-allowed font-mono" value={rcForm.dl_id ? `DL ${rcForm.dl_id}` : '—'} />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                      <button type="button" onClick={() => handleTabClick('listado_rc')} className="btn-ghost">Cancelar</button>
                      <button type="submit" className="btn-primary">
                        {editingRcId ? 'Actualizar Registro' : 'Completar Registro'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ============ LISTADO RC ============ */}
            {activeTab === 'listado_rc' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">Representantes de Casilla</h1>
                    <p className="text-surface-500 text-sm mt-1">Seguimiento de la estructura en niveles de casilla</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-warning">{representantesCasilla.length} registros</span>
                    <button onClick={() => handleTabClick('casilla')} className="btn-primary">
                      <UserCircle className="w-4 h-4" />
                      Nuevo RC
                    </button>
                  </div>
                </div>

                <div className="table-wrapper overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nombre Completo</th>
                        <th>Casilla</th>
                        <th>Tipo</th>
                        <th>RG Responsable</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {representantesCasilla
                        .filter(rc => 
                          rc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (rc.telefono && rc.telefono.includes(searchTerm))
                        )
                        .map((rc) => {
                          const cas = casillas.find(c => String(c.casilla_id) === String(rc.casilla_id));
                          
                          // Buscar RG dinámicamente: RC -> Sección -> Ruta -> RG 
                          const ruta = rutas.find(r => 
                            Array.isArray(r.casillas_asignada) && 
                            r.casillas_asignada.map(String).includes(String(rc.casilla_id))
                          );
                          const rg = ruta ? representantesGenerales.find(r => String(r.id) === String(ruta.representante_general_id)) : null;

                          return (
                            <tr key={rc.id}>
                              <td><span className="font-semibold text-surface-800 uppercase">{rc.nombre} {rc.apellido_paterno}</span></td>
                              <td><span className="font-semibold text-inst-600 text-xs">{cas?.casilla || 'N/A'}</span></td>
                              <td><span className="text-xs text-surface-500">{rc.tipo_nombramiento}</span></td>
                              <td><span className="text-xs text-surface-600">{rg ? `${rg.nombre} ${rg.apellido_paterno}` : 'Sin asignar'}</span></td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handleEditRc(rc)} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteRc(rc.id)} className="btn-icon hover:!text-danger-600 hover:!bg-danger-50" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============ CASILLAS FORM ============ */}
            {activeTab === 'casillas_form' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">{editingCasillaIntId ? 'Editar Casilla' : 'Capturar Casilla'}</h1>
                    <p className="text-surface-500 text-sm mt-1">Registro de casillas electorales</p>
                  </div>
                </div>

                <form onSubmit={handleSaveCasilla} className="card p-6 lg:p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-inst-600" />
                  <h3 className="text-lg font-semibold text-surface-800">{editingCasillaIntId ? 'Editar datos de casilla' : 'Nueva Casilla'}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Nombre/Clave Casilla</label>
                      <input type="text" required className="input-field uppercase" value={casillaMgmtForm.casilla} onChange={e => setCasillaMgmtForm({...casillaMgmtForm, casilla: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className="input-label">Municipio</label>
                      <select className="select-field" value={casillaMgmtForm.municipio_id} onChange={e => setCasillaMgmtForm({...casillaMgmtForm, municipio_id: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {[...municipios].sort((a,b) => (a.municipio || '').localeCompare(b.municipio || '')).map(m => <option key={m.id} value={m.id}>{m.municipio}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Distrito Federal</label>
                      <select className="select-field" value={casillaMgmtForm.df_id} onChange={e => setCasillaMgmtForm({...casillaMgmtForm, df_id: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {[...distritosFederales].sort((a,b) => (a.df || 0) - (b.df || 0)).map(d => <option key={d.id} value={d.id}>DF {d.df}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Distrito Local</label>
                      <select className="select-field" value={casillaMgmtForm.dl_id} onChange={e => setCasillaMgmtForm({...casillaMgmtForm, dl_id: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {[...distritosLocales].sort((a,b) => (a.dl || 0) - (b.dl || 0)).map(d => <option key={d.id} value={d.id}>DL {d.dl}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="input-label">Ubicación</label>
                      <input type="text" className="input-field uppercase" value={casillaMgmtForm.ubicación} onChange={e => setCasillaMgmtForm({...casillaMgmtForm, ubicación: e.target.value.toUpperCase()})} placeholder="E.j., Escuela Primaria Benito Juárez" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                    {editingCasillaIntId !== null && (
                      <button type="button" onClick={() => {
                        setEditingCasillaIntId(null);
                        setCasillaMgmtForm({ casilla_id: '', casilla: '', df_id: '', dl_id: '', municipio_id: '', ubicación: '' });
                        setActiveTab('casillas_list');
                      }} className="btn-ghost">Cancelar Edición</button>
                    )}
                    <button type="submit" className="btn-primary">
                      {editingCasillaIntId !== null ? 'Actualizar Casilla' : 'Guardar Casilla'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============ CASILLAS LIST ============ */}
            {activeTab === 'casillas_list' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">Catálogo de Casillas</h1>
                    <p className="text-surface-500 text-sm mt-1">Consulta de casillas electorales</p>
                  </div>
                  <button onClick={() => setActiveTab('casillas_form')} className="btn-primary whitespace-nowrap">
                    Nueva Casilla
                  </button>
                </div>

                <div className="table-wrapper overflow-x-auto mt-8">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Casilla</th>
                        <th>Municipio</th>
                        <th>Distrito Federal</th>
                        <th>Distrito Local</th>
                        <th>Ubicación</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {casillas
                        .filter(c => 
                          String(c.casilla_id).includes(searchTerm) || 
                          (c.casilla && c.casilla.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .sort((a, b) => (a.casilla_id || 0) - (b.casilla_id || 0))
                        .map((cas) => (
                          <tr key={cas.casilla_id}>
                            <td><span className="font-semibold text-surface-800">{cas.casilla_id}</span></td>
                            <td><span className="font-semibold text-inst-600 uppercase">{cas.casilla}</span></td>
                            <td><span className="text-sm text-surface-600">{municipios.find(m => String(m.id) === String(cas.municipio))?.municipio || 'N/A'}</span></td>
                            <td><span className="text-sm text-surface-600">{cas.df ? `DF ${cas.df}` : 'N/A'}</span></td>
                            <td><span className="text-sm text-surface-600">{cas.dl ? `DL ${cas.dl}` : 'N/A'}</span></td>
                            <td><span className="text-sm text-surface-600 truncate block max-w-xs" title={cas.ubicación || ''}>{cas.ubicación || '—'}</span></td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleEditCasilla(cas)} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteCasilla(cas.casilla_id)} className="btn-icon hover:!text-danger-600 hover:!bg-danger-50" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============ RUTAS FORM ============ */}
            {activeTab === 'rutas_form' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h1 className="text-2xl font-bold text-surface-900">{editingRutaId ? 'Editar' : 'Registro de'} Ruta</h1>
                </div>

                <form onSubmit={handleSaveRuta} className="card p-6 lg:p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-surface-600" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="input-label">Nombre de la Ruta</label>
                      <input type="text" required className="input-field uppercase" value={rutaForm.nombre_ruta} onChange={e => setRutaForm({...rutaForm, nombre_ruta: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className="input-label">Municipio (Filtro)</label>
                      <select className="select-field" value={rutaForm.municipio_id} onChange={e => setRutaForm({...rutaForm, municipio_id: e.target.value, casillas_asignada: []})}>
                        <option value="">Todos los municipios...</option>
                        {[...municipios].sort((a,b) => (a.municipio || '').localeCompare(b.municipio || '')).map(m => <option key={m.id} value={m.id}>{m.municipio}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">RG Responsable</label>
                      <select required className="select-field" value={rutaForm.representante_general_id} onChange={e => setRutaForm({...rutaForm, representante_general_id: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        {[...representantesGenerales].sort((a,b) => a.nombre.localeCompare(b.nombre)).map(rg => <option key={rg.id} value={rg.id}>{rg.nombre} {rg.apellido_paterno}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Distrito Federal</label>
                      <select className="select-field" value={rutaForm.df_id} onChange={e => setRutaForm({...rutaForm, df_id: e.target.value, casillas_asignada: []})}>
                        <option value="">Todos los distritos...</option>
                        {[...distritosFederales].sort((a,b) => (a.df || 0) - (b.df || 0)).map(d => <option key={d.id} value={d.id}>DF {d.df}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Distrito Local</label>
                      <select className="select-field" value={rutaForm.dl_id} onChange={e => setRutaForm({...rutaForm, dl_id: e.target.value, casillas_asignada: []})}>
                        <option value="">Todos los distritos...</option>
                        {[...distritosLocales].sort((a,b) => (a.dl || 0) - (b.dl || 0)).map(d => <option key={d.id} value={d.id}>DL {d.dl}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="input-label">Seleccionar Casillas ({casillas.filter(c => {
                        if (rutaForm.municipio_id && String(c.municipio) !== rutaForm.municipio_id) return false;
                        if (rutaForm.df_id && String(c.df) !== rutaForm.df_id) return false;
                        if (rutaForm.dl_id && String(c.dl) !== rutaForm.dl_id) return false;
                        return true;
                      }).length} disponibles)</label>
                      <span className="text-xs font-semibold text-inst-600 bg-inst-50 px-2 py-1 rounded">
                        {rutaForm.casillas_asignada.length} seleccionadas
                      </span>
                    </div>

                    {/* Buscador de Casillas */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-surface-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar casilla por nombre..."
                        className="input-field pl-10"
                        value={casillaSearch}
                        onChange={(e) => setCasillaSearch(e.target.value)}
                      />
                    </div>

                    <div className="border border-surface-200 rounded-lg p-2 bg-surface-50">
                      <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                        {casillas
                          .filter(c => {
                            if (rutaForm.municipio_id && String(c.municipio) !== rutaForm.municipio_id) return false;
                            if (rutaForm.df_id && String(c.df) !== rutaForm.df_id) return false;
                            if (rutaForm.dl_id && String(c.dl) !== rutaForm.dl_id) return false;
                            
                            if (casillaSearch.trim()) {
                              const search = casillaSearch.toLowerCase();
                              return (c.casilla || '').toLowerCase().includes(search);
                            }

                            return true;
                          })
                          .sort((a,b) => (a.casilla || '').localeCompare(b.casilla || ''))
                          .map(c => (
                            <label key={c.casilla_id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              rutaForm.casillas_asignada.includes(c.casilla_id) 
                                ? 'bg-inst-50 border-inst-200 shadow-sm' 
                                : 'bg-white border-transparent hover:border-surface-200'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={rutaForm.casillas_asignada.includes(c.casilla_id)}
                                onChange={(e) => {
                                  const newSelection = e.target.checked 
                                    ? [...rutaForm.casillas_asignada, c.casilla_id]
                                    : rutaForm.casillas_asignada.filter((id: number) => id !== c.casilla_id);
                                  setRutaForm({...rutaForm, casillas_asignada: newSelection});
                                }}
                                className="w-4 h-4 rounded text-inst-600 focus:ring-inst-500"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-surface-900 uppercase">{c.casilla}</span>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                    <button type="button" onClick={() => handleTabClick('rutas_list')} className="btn-ghost">Cancelar</button>
                    <button type="submit" className="btn-primary">
                      {editingRutaId ? 'Actualizar Ruta' : 'Crear Ruta'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============ RUTAS LIST ============ */}
            {activeTab === 'rutas_list' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">Listado de Rutas</h1>
                    <p className="text-surface-500 text-sm mt-1">Estructura de rutas asignadas</p>
                  </div>
                  <button onClick={() => handleTabClick('rutas_form')} className="btn-primary">
                    <Route className="w-4 h-4" />
                    Nueva Ruta
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rutas.map(ruta => {
                    const rg = representantesGenerales.find(r => String(r.id) === String(ruta.representante_general_id));
                    return (
                      <div key={ruta.id} className="card p-5 hover-lift">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center">
                            <Route className="w-5 h-5 text-surface-500" />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditRuta(ruta)} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteRuta(ruta.id)} className="btn-icon hover:!text-danger-600 hover:!bg-danger-50" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <h4 className="font-bold text-surface-900 uppercase">{ruta.nombre_ruta}</h4>
                        <div className="space-y-1 mt-2">
                          <p className="text-xs text-surface-500 flex justify-between">
                            <span>RG:</span> 
                            <span className="font-medium text-surface-700">{rg ? `${rg.nombre} ${rg.apellido_paterno}` : 'Sin asignar'}</span>
                          </p>
                          <p className="text-xs text-surface-500 flex justify-between">
                            <span>Municipio:</span> 
                            <span className="font-medium text-surface-700">{municipios.find(m => m.id === ruta.municipio_id)?.municipio || 'N/A'}</span>
                          </p>
                          <p className="text-xs text-surface-500 flex justify-between">
                            <span>Casillas:</span> 
                            <span className="font-medium text-surface-700">{(ruta.casillas_asignada as any[])?.length || 0}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============ USUARIOS MGMT ============ */}
            {activeTab === 'usuarios_mgmt' && (
              <div className="space-y-8 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-surface-900">Gestión de Usuarios</h1>
                    <p className="text-surface-500 text-sm mt-1">Administración de accesos y roles</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Formulario */}
                  <div className="lg:col-span-1">
                    <form onSubmit={handleSaveUser} className="card p-6 space-y-5 sticky top-24">
                      <h3 className="font-bold text-surface-800 border-b border-surface-100 pb-3">
                        {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="input-label">Usuario (Login)</label>
                          <input 
                            type="text" 
                            required 
                            className="input-field lowecase" 
                            placeholder="ej. fcorascon"
                            value={userForm.usuario} 
                            onChange={e => setUserForm({...userForm, usuario: e.target.value.toLowerCase().replace(/\s/g, '')})} 
                          />
                        </div>

                        <div>
                          <label className="input-label">Nombre Completo</label>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Nombre del capturista"
                            value={userForm.nombre_completo} 
                            onChange={e => setUserForm({...userForm, nombre_completo: e.target.value})} 
                          />
                        </div>

                        <div>
                          <label className="input-label">Rol del Sistema</label>
                          <select 
                            className="select-field"
                            value={userForm.rol}
                            onChange={e => setUserForm({...userForm, rol: e.target.value as any})}
                          >
                            <option value="CAPTURISTA">CAPTURISTA (Restringido)</option>
                            <option value="ADMIN">ADMINISTRADOR (Total)</option>
                          </select>
                        </div>

                        <div>
                          <label className="input-label">Municipio</label>
                          <select 
                            className="select-field"
                            value={userForm.municipio}
                            onChange={e => setUserForm({...userForm, municipio: e.target.value})}
                          >
                            <option value="">Seleccionar...</option>
                            {municipios.map(m => (
                              <option key={m.id} value={m.id}>{m.municipio}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between">
                            <label className="input-label">Contraseña</label>
                            {editingUserId && <span className="text-[10px] text-surface-400 font-medium italic">Dejar vacío para mantener</span>}
                          </div>
                          <div className="relative">
                            <input 
                              type={showUserPassword ? 'text' : 'password'} 
                              required={!editingUserId}
                              className="input-field pr-10" 
                              placeholder={editingUserId ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
                              value={userForm.password} 
                              onChange={e => setUserForm({...userForm, password: e.target.value})} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowUserPassword(!showUserPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                            >
                              {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 btn-primary">
                          {editingUserId ? 'Actualizar' : 'Crear Usuario'}
                        </button>
                        {editingUserId && (
                          <button 
                            type="button" 
                            onClick={() => handleTabClick('usuarios_mgmt')}
                            className="btn-ghost"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Listado */}
                  <div className="lg:col-span-2">
                    <div className="card overflow-hidden">
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Usuario</th>
                              <th>Nombre / Rol</th>
                              <th>Municipio</th>
                              <th className="text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usuarios.map(u => (
                              <tr key={u.id} className={u.id === currentUser?.id ? 'bg-surface-50' : ''}>
                                <td>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${u.rol === 'ADMIN' ? 'bg-inst-100 text-inst-700' : 'bg-surface-100 text-surface-600'}`}>
                                      {u.usuario.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-surface-900">{u.usuario}</span>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <p className="text-sm font-medium text-surface-700">{u.nombre_completo || '—'}</p>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${u.rol === 'ADMIN' ? 'bg-inst-100 text-inst-700' : 'bg-surface-100 text-surface-500'}`}>
                                      {u.rol}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span className="text-sm text-surface-600">{municipios.find(m => String(m.id) === String(u.municipio))?.municipio || u.municipio || '—'}</span>
                                </td>
                                <td className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button 
                                      onClick={() => handleEditUser(u)} 
                                      className="btn-icon" 
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(u.id)} 
                                      className={`btn-icon hover:!text-danger-600 hover:!bg-danger-50 ${u.id === currentUser?.id ? 'opacity-20 cursor-not-allowed' : ''}`} 
                                      disabled={u.id === currentUser?.id}
                                      title={u.id === currentUser?.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============ USUARIOS LIST ============ */}
            {activeTab === 'usuarios_list' && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <h1 className="text-2xl font-bold text-surface-900">Usuarios</h1>
                  <p className="text-surface-500 text-sm mt-1">Listado de usuarios del sistema</p>
                </div>
                <div className="table-wrapper overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Municipio</th>
                        <th>Rol</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(u => (
                        <tr key={u.id}>
                          <td><span className="text-xs text-surface-400">{u.id}</span></td>
                          <td><span className="font-semibold text-surface-800">{u.usuario}</span></td>
                          <td><span className="text-sm text-surface-600">{u.nombre_completo || '—'}</span></td>
                          <td><span className="text-sm text-surface-600">{u.correo || '—'}</span></td>
                          <td><span className="text-sm text-surface-600">{municipios.find(m => String(m.id) === String(u.municipio))?.municipio || u.municipio || '—'}</span></td>
                          <td><span className={`text-xs font-bold px-2 py-1 rounded ${u.rol === '1' || u.rol === 'ADMIN' ? 'bg-inst-100 text-inst-700' : 'bg-surface-100 text-surface-500'}`}>{u.rol}</span></td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { handleEditUser(u); handleTabClick('usuarios_mgmt'); }} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteUser(u.id)} className={`btn-icon hover:!text-danger-600 hover:!bg-danger-50 ${u.id === currentUser?.id ? 'opacity-20 cursor-not-allowed' : ''}`} disabled={u.id === currentUser?.id} title={u.id === currentUser?.id ? "No puedes eliminarte a ti mismo" : "Eliminar"}><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
      </div>
      </div>
    </>
    </ErrorBoundary>
  );
}

// --- Sub-componente Validador ---
function ValidadorCredencial({ 
  tipo,
  onSuccess,
  credencialValidacion, 
  setCredencialValidacion, 
  mensajeValidacion, 
  setMensajeValidacion, 
  credencialEncontrada, 
  setCredencialEncontrada,
  representantesGenerales, 
  representantesCasilla, 
  editingRgId, 
  editingRcId
}: any) {
  const isRG = tipo === 'rg';
  
  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-10 h-10 ${isRG ? 'bg-inst-600' : 'bg-warning-600'} rounded-lg flex items-center justify-center`}>
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-surface-800">Validador de Credencial</h3>
          <p className="text-xs text-surface-400">Verifica duplicidad para {isRG ? 'RG' : 'RC'}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={credencialValidacion}
          onChange={(e) => {
            const val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18);
            setCredencialValidacion(val);
            setMensajeValidacion(null);
            setCredencialEncontrada(null);
          }}
          placeholder="INGRESA CLAVE DE ELECTOR (18 CARACTERES)"
          className="input-field flex-1 font-mono tracking-widest text-base"
          maxLength={18}
        />
        <button
          onClick={() => {
            if (credencialValidacion.length === 0) {
              toast.error('Ingresa la clave de elector');
              return;
            }
            if (credencialValidacion.length !== 18) {
              toast.error(`Incompleta: faltan ${18 - credencialValidacion.length} caracteres`);
              return;
            }
            if (!CLAVE_ELECTOR_REGEX.test(credencialValidacion)) {
              toast.error('Formato inválido (6L, 8N, H/M, 3N)');
              return;
            }
            const encontrada = [...representantesGenerales, ...representantesCasilla].find((r: any) => 
              r.clave_elector === credencialValidacion && 
              r.id !== (isRG ? editingRgId : editingRcId)
            );
            if (encontrada) {
              setCredencialEncontrada(encontrada);
              setMensajeValidacion('advertencia');
            } else {
              setCredencialEncontrada(null);
              setMensajeValidacion('exito');
              toast.success('Clave validada');
              onSuccess(credencialValidacion);
            }
          }}
          className="btn-primary whitespace-nowrap"
        >
          Validar Clave
        </button>
      </div>

      {/* Success message */}
      {mensajeValidacion === 'exito' && (
        <div className="mt-4 p-4 bg-success-50 border border-success-100 rounded-lg flex items-center gap-3 animate-fade-in-up">
          <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-success-700 text-sm">Disponible</p>
            <p className="text-success-600 text-xs">Clave no registrada. Puedes continuar con la captura.</p>
          </div>
        </div>
      )}

      {/* Duplicate Alert Modal */}
      {mensajeValidacion === 'advertencia' && credencialEncontrada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-900/60 backdrop-blur-sm p-6 no-print animate-fade-in-up">
           <div className="card p-8 max-w-md w-full text-center space-y-6 animate-scale-in shadow-2xl">
              <div className="bg-danger-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                 <AlertTriangle className="w-8 h-8 text-danger-600" />
              </div>
              <div className="space-y-3">
                 <div>
                    <p className="text-xs font-semibold text-danger-600 uppercase tracking-wider mb-1">Alerta de Seguridad</p>
                    <h3 className="text-xl font-bold text-surface-900">Clave Duplicada</h3>
                 </div>
                 <div className="bg-surface-50 p-4 rounded-lg">
                    <p className="text-surface-900 font-bold uppercase">{credencialEncontrada.nombre} {credencialEncontrada.apellido_paterno}</p>
                    <p className="text-surface-500 text-xs mt-1">
                      Asignado como: <span className="font-semibold text-surface-700">{credencialEncontrada.casilla_id ? 'Rep. de Casilla' : 'Rep. General'}</span>
                    </p>
                 </div>
              </div>
              <div>
                 <button 
                   onClick={() => {
                     setMensajeValidacion(null);
                     setCredencialEncontrada(null);
                     setCredencialValidacion('');
                   }}
                   className="btn-primary w-full"
                 >
                   Cerrar y Limpiar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Sidebar ---
function Sidebar({ 
  activeTab, 
  handleTabClick,
  currentUser,
  onLogout,
  isOpen,
  onClose
}: { 
  activeTab: string; 
  handleTabClick: (id: string) => void;
  currentUser: any;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Inicio', Icon: LayoutDashboard },
    { 
      id: 'group_generales', 
      label: 'Generales', 
      Icon: Briefcase,
      isGroup: true,
      subItems: [
        { id: 'generales', label: 'Nuevo RG', Icon: UserCircle },
        { id: 'listado_rg', label: 'Listado RG', Icon: Users },
      ]
    },
    { 
      id: 'group_casillas', 
      label: 'Rep. Casillas', 
      Icon: ClipboardList,
      isGroup: true,
      subItems: [
        { id: 'casilla', label: 'Nuevo RC', Icon: UserCircle },
        { id: 'listado_rc', label: 'Listado RC', Icon: Users },
      ]
    },
    { 
      id: 'group_rutas', 
      label: 'Rutas', 
      Icon: Route,
      isGroup: true,
      subItems: [
        { id: 'rutas_form', label: 'Capturar Ruta', Icon: Search },
        { id: 'rutas_list', label: 'Listado Rutas', Icon: Route },
      ]
    },
    { 
      id: 'group_casillas_cat', 
      label: 'Casillas', 
      Icon: Vote,
      isGroup: true,
      subItems: [
        { id: 'casillas_form', label: 'Capturar', Icon: Search },
        { id: 'casillas_list', label: 'Consultar', Icon: Vote },
      ]
    },

    { 
      id: 'group_reportes', 
      label: 'Reportes', 
      Icon: BarChart2,
      isGroup: true,
      subItems: [
        { id: 'reporte_rutas', label: 'Listados Op.', Icon: FileText },
      ]
    },
    { 
      id: 'group_usuarios', 
      label: 'Usuarios', 
      Icon: Users,
      isGroup: true,
      subItems: [
        { id: 'usuarios_mgmt', label: 'Gestionar', Icon: Users },
        { id: 'usuarios_list', label: 'Listado', Icon: Users },
      ]
    },
  ];

  return (
    <aside className={`
      w-64 bg-white border-r border-surface-200 flex flex-col h-screen flex-shrink-0 no-print
      fixed lg:sticky top-0 z-50 transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo Area */}
      <div className="h-16 px-5 border-b border-surface-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-inst-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.5c0 5 3.5 9.5 8 10.5 4.5-1 8-5.5 8-10.5V5l-8-3zM12 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-surface-900">SEEBC <span className="text-inst-600">2027</span></h1>
            <p className="text-[10px] text-surface-400 font-medium">Plataforma Electoral</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button onClick={onClose} className="btn-icon lg:hidden">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {navigationItems.map(item => (
          <div key={item.id}>
            {item.isGroup ? (
              <>
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={`sidebar-link group ${openGroups[item.id] ? 'text-surface-800' : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'}`}
                >
                  <item.Icon className="w-[18px] h-[18px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {openGroups[item.id] ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                </button>
                
                {openGroups[item.id] && (
                  <div className="ml-5 pl-3 border-l border-surface-100 space-y-0.5 mt-0.5 mb-1">
                    {item.subItems?.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleTabClick(sub.id)}
                        className={`sidebar-link text-[13px] ${
                          activeTab === sub.id 
                          ? 'sidebar-link-active' 
                          : 'sidebar-link-inactive'
                        }`}
                      >
                        <sub.Icon className="w-4 h-4" />
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`sidebar-link ${
                  activeTab === item.id 
                  ? 'sidebar-link-active' 
                  : 'sidebar-link-inactive'
                }`}
              >
                <item.Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-surface-200">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 bg-inst-50 rounded-lg flex items-center justify-center text-sm font-semibold text-inst-700">
            {currentUser?.usuario?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-800 truncate">{currentUser?.usuario || 'Invitado'}</p>
            <p className="text-[11px] text-success-600 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500"></span> En línea
            </p>
          </div>
          <button onClick={async () => { const ok = await sheetsClient.connectGoogle(); if (ok) toast.success('Google conectado'); else toast.error('Error al conectar Google'); }} className="btn-icon" title="Conectar Google para guardar datos">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          </button>
          <button onClick={onLogout} className="btn-icon" title="Cerrar Sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// --- Componente Login ---
function Login({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Intentar Login con Supabase Auth (Normal)
      const email = usuario.includes('@') ? usuario : `${usuario.toLowerCase().trim()}@seebc.com`;
      let authSuccess = false;

      try {
        const { data: { user }, error: authError } = await sheetsClient.auth.signInWithPassword({
          email,
          password
        });

        if (!authError && user) {
          authSuccess = true;
          const { data: profileData } = await sheetsClient
            .from('usuarios')
            .select('*')
            .eq('user_id', user.id);
          const profile = Array.isArray(profileData) ? profileData[0] : profileData;

          if (profile) {
            toast.success(`Bienvenido, ${profile.nombre_completo || profile.usuario}`);
            onLoginSuccess(profile);
            return;
          }
        }
      } catch (authErr) {
        console.warn('Auth engine unavailable, using secure fallback:', authErr);
      }

      // 2. FALLBACK SEGURO: Validación bcrypt via RPC en el servidor
      if (!authSuccess) {
        const { data: profile, error: rpcError } = await sheetsClient.rpc('validate_login', {
          p_usuario: usuario.toLowerCase().trim(),
          p_contrasena: password
        });

        if (rpcError || !profile) {
          const delay = Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          throw new Error('Credenciales no válidas.');
        }

        toast.success(`Bienvenido, ${profile.nombre_completo || profile.usuario}`);
        onLoginSuccess(profile);
        return;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Error al iniciar sesión');
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-surface-50">
      {/* Background decorative gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-inst-600/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-inst-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-inst-600 rounded-2xl flex items-center justify-center shadow-lg shadow-inst-600/20 mb-6">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5v6.5c0 5 3.5 9.5 8 10.5 4.5-1 8-5.5 8-10.5V5l-8-3zM12 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-surface-900">Acceso a Plataforma</h1>
            <p className="text-surface-500 text-sm">Ingresa tus credenciales para continuar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="input-label">Usuario</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  placeholder="Nombre de usuario"
                  className="input-field pl-11 h-12 relative z-10 bg-transparent rounded-none"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                />
                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 z-20 pointer-events-none group-focus-within:text-inst-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="input-label">Contraseña</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11 h-12 relative z-10 bg-transparent rounded-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400 z-20 pointer-events-none group-focus-within:text-inst-500 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:text-inst-600 transition-colors z-30 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="animate-fade-in-up">
              <div className="bg-danger-50 border border-danger-100 rounded-lg p-3 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-danger-500 flex-shrink-0" />
                <p className="text-xs font-medium text-danger-700">{errorMsg}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <footer className="text-center">
          <p className="text-[11px] font-medium text-surface-400">
            SEEBC ©2027 · Versión 3.0
          </p>
        </footer>
      </div>
    </div>
  );
}
