
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ValidadorCredencialProps {
  tipo: 'rg' | 'rc';
  onSuccess: (clave: string) => void;
  credencialValidacion: string;
  setCredencialValidacion: (clave: string) => void;
  mensajeValidacion: 'exito' | 'advertencia' | null;
  setMensajeValidacion: (msg: 'exito' | 'advertencia' | null) => void;
  credencialEncontrada: any;
  setCredencialEncontrada: (data: any) => void;
  representantesGenerales: any[];
  representantesCasilla: any[];
  editingRgId?: number | string | null;
  editingRcId?: number | string | null;
}

const ValidadorCredencial: React.FC<ValidadorCredencialProps> = ({ 
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
}) => {
  const isRG = tipo === 'rg';

  const handleValidarClave = () => {
    if (!credencialValidacion || credencialValidacion.length < 18) {
      toast.error('Clave de elector incompleta');
      return;
    }

    // Buscar duplicados
    const encontrada = [...representantesGenerales, ...representantesCasilla].find(r => 
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
  };
  
  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-inst-50 rounded-2xl flex items-center justify-center text-inst-600 flex-shrink-0">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-surface-900">Validación de Identidad</h3>
          <p className="text-xs text-surface-500">Ingresa la clave de elector para verificar disponibilidad</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            className="input-field pl-10 font-mono uppercase" 
            placeholder="ABCD1234567890EFGH"
            maxLength={18}
            value={credencialValidacion}
            onChange={e => setCredencialValidacion(e.target.value.toUpperCase())}
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleValidarClave}
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
                   type="button"
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
};

export default ValidadorCredencial;
