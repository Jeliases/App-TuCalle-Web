import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { Settings, Wrench, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StoreDashboard() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  // Estado local para la UI (Abierto / Cerrado)
  const currentState = userData?.estadoLocal || "Cerrado";

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!user || currentState === nuevoEstado) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "tiendas", user.uid);
      await updateDoc(userRef, { estadoLocal: nuevoEstado });
      window.location.reload(); // Recarga para actualizar AuthContext global
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full flex flex-col pt-8 px-6 bg-white min-h-screen pb-20">
      
      {/* ── CABECERA ── */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shadow-sm">
            <img 
              src={userData?.logoUrl || `https://ui-avatars.com/api/?name=${userData?.nombre || "T"}&background=D32F2F&color=fff&size=100`} 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs font-poppins">Mi perfil</span>
            <h1 className="font-roboto font-bold text-xl text-black">
              {userData?.nombre || "Cargando..."}
            </h1>
            <span className="text-gray-500 text-[13px] font-poppins">Huarique</span>
          </div>
        </div>
        <button onClick={() => navigate("/dashboard/tienda/perfil")} className="p-2 cursor-pointer hover:bg-red-50 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-[#D32F2F]" />
        </button>
      </div>

      {/* ── TARJETA DE MÉTRICAS ── */}
      <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-6 flex justify-between items-center mb-8">
        {/* Plan y Activar */}
        <div className="flex flex-col items-center w-1/3">
          <span className="font-poppins font-bold text-[13px] text-black">{userData?.plan || "Impulso"}</span>
          <span className="font-poppins text-[11px] text-gray-500 mb-2">Plan Actual</span>
          <span className="font-poppins text-[9px] text-gray-400 mb-1">Mejora tu plan</span>
          <button className="bg-[#D32F2F] text-white text-[11px] font-poppins font-bold px-4 py-1.5 rounded-md hover:bg-[#B71C1C] transition-colors">
            ACTIVAR
          </button>
        </div>

        <div className="w-[1px] h-20 bg-gray-200 mx-4"></div>

        {/* Stats */}
        <div className="flex flex-col items-start w-2/3 pl-4">
          <span className="font-poppins text-[13px] text-black mb-1">{userData?.seguidores || 0} seguidores</span>
          <span className="font-poppins text-[13px] text-black mb-1">{userData?.totalResenas || 0} reseñas</span>
          <span className="font-poppins text-xs text-gray-500 mt-1">
            {userData?.horarioApertura && userData?.horarioCierre ? `${userData.horarioApertura} – ${userData.horarioCierre}` : "Sin horario"}
          </span>
          <span className="font-poppins text-[10px] text-gray-400">horario</span>
        </div>
      </div>

      {/* ── ESTADO ABIERTO / CERRADO ── */}
      <h2 className="font-roboto font-bold text-base text-black mb-3">Estado de tu tienda</h2>
      <div className="w-full flex h-[46px] rounded-full bg-[#E0E0E0] p-1 mb-8">
        {["Abierto", "Cerrado"].map((estado) => (
          <button
            key={estado}
            disabled={isUpdating}
            onClick={() => cambiarEstado(estado)}
            className={`flex-1 flex items-center justify-center rounded-full font-semibold text-sm transition-colors ${currentState === estado ? 'bg-[#D32F2F] text-white shadow-md' : 'text-black hover:bg-gray-300'}`}
          >
            {isUpdating && currentState === estado ? <Loader2 className="w-4 h-4 animate-spin" /> : estado}
          </button>
        ))}
      </div>

      {/* ── SECCIÓN "EN DESARROLLO" ── */}
      <div className="w-full bg-[#FFF8F8] rounded-xl p-8 flex flex-col items-center text-center">
        <Wrench className="w-12 h-12 text-[#D32F2F] mb-4" />
        <h3 className="font-roboto font-bold text-base text-black mb-2">Métricas y estadísticas</h3>
        <p className="font-poppins text-[13px] text-gray-500 max-w-[300px] leading-relaxed mb-4">
          Aquí verás tus platos más populares, recomendaciones recibidas y el rendimiento de tu huarique.
        </p>
        <span className="font-poppins text-[10px] font-bold text-gray-300 tracking-[2px]">
          ESTAMOS TRABAJANDO EN ELLO
        </span>
      </div>

    </div>
  );
}