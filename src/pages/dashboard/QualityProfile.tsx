import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../api/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Camera, LogOut, Settings, Star, Heart, Lock, Unlock, Loader2, Wrench } from "lucide-react";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export default function QualityProfile() {
  const { userData, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Ajustes");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [formData, setFormData] = useState({
    nombre: userData?.nombre || "",
    apellidos: userData?.apellidos || "",
    celular: userData?.celular || "",
    fechaNacimiento: userData?.fechaNacimiento || "",
    tipoDocumento: userData?.tipoDocumento || "DNI",
    dni: userData?.dni || "",
    horaDesde: userData?.horaDisponibleDesde || "",
    horaHasta: userData?.horaDisponibleHasta || ""
  });
  const [diasDisponibles, setDiasDisponibles] = useState<string[]>(userData?.diasDisponibles || []);

  const handleChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const toggleDia = (dia: string) => {
    if (!isEditing) return;
    setDiasDisponibles(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  };

  const guardarCambios = async () => {
    if (!user) return;
    setIsSaving(true);
    setMensaje("");
    try {
      const userRef = doc(db, "qualities", user.uid);
      await updateDoc(userRef, {
        ...formData,
        diasDisponibles,
        horaDisponibleDesde: formData.horaDesde,
        horaDisponibleHasta: formData.horaHasta
      });
      setMensaje("✅ Cambios guardados");
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      setMensaje("❌ Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white min-h-screen pb-20 pt-8 px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shadow-sm">
              <img src={userData?.fotoUrl || `https://ui-avatars.com/api/?name=${userData?.nombre || "Q"}&background=D32F2F&color=fff&size=100`} alt="Perfil" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 w-[26px] h-[26px] bg-[#D32F2F] rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#B71C1C]">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-[13px] font-poppins">Mi perfil</span>
            <h1 className="font-roboto font-bold text-[22px] text-black">{userData?.nombre || "Cargando..."} {userData?.apellidos || ""}</h1>
            <span className="text-gray-500 text-sm font-poppins">Quality</span>
          </div>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 cursor-pointer hover:bg-red-50 rounded-full transition-colors">
          <LogOut className="w-6 h-6 text-[#D32F2F]" />
        </button>
      </div>

      {/* Stats Card */}
      <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-4 flex items-center mb-6">
        <div className="flex flex-col flex-1 items-center justify-center">
          <span className="font-poppins text-xs text-gray-500 mb-1">Mis logros</span>
          <span className="text-lg">🎁 🏅 🏆</span>
        </div>
        <div className="w-[1px] h-12 bg-gray-200"></div>
        <div className="flex flex-col flex-1 pl-4 justify-center">
          <span className="font-poppins text-[13px] text-black mb-1">{userData?.seguidores || 0} seguidores</span>
          <span className="font-poppins text-[13px] text-black mb-1">{userData?.totalResenas || 0} reseñas</span>
          <span className="font-poppins text-[11px] text-gray-500">Antigüedad: {userData?.antiguedad ? new Date(userData.antiguedad).toLocaleDateString() : "Nuevo"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-evenly border-b border-[#F0F0F0] mb-6 pb-2">
        <TabItem icon={<Settings className="w-[22px] h-[22px]" />} label="Ajustes" isActive={selectedTab === "Ajustes"} onClick={() => setSelectedTab("Ajustes")} />
        <TabItem icon={<Star className="w-[22px] h-[22px]" />} label="Mis reseñas" isActive={selectedTab === "Mis reseñas"} onClick={() => setSelectedTab("Mis reseñas")} />
        <TabItem icon={<Heart className="w-[22px] h-[22px]" />} label="Mis huariques" isActive={selectedTab === "Mis huariques"} onClick={() => setSelectedTab("Mis huariques")} />
      </div>

      {/* Content: Ajustes */}
      {selectedTab === "Ajustes" && (
        <div className="flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-[15px] font-poppins text-black">Información de tu cuenta</h2>
            <button onClick={() => setIsEditing(!isEditing)} className="text-[#D32F2F] p-1 cursor-pointer">
              {isEditing ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>
          </div>

          <ProfileInput label="Nombre(s)" value={formData.nombre} onChange={(v: string) => handleChange("nombre", v)} isEditing={isEditing} />
          <ProfileInput label="Apellido(s)" value={formData.apellidos} onChange={(v: string) => handleChange("apellidos", v)} isEditing={isEditing} />
          <ProfileInput label="Correo Electrónico" value={userData?.email || ""} onChange={() => {}} isEditing={false} />
          <ProfileInput label="Celular" value={formData.celular} onChange={(v: string) => handleChange("celular", v.replace(/\D/g, '').slice(0, 9))} isEditing={isEditing} />
          <ProfileInput label="Fecha de nacimiento" type="date" value={formData.fechaNacimiento} onChange={(v: string) => handleChange("fechaNacimiento", v)} isEditing={isEditing} />
          
          <div className="flex gap-2 py-2 mb-4">
            <select disabled={!isEditing} value={formData.tipoDocumento} onChange={(e) => {handleChange("tipoDocumento", e.target.value); handleChange("dni", "");}} className={`w-1/3 rounded-lg px-3 py-3 text-sm ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border-transparent'}`}>
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
            </select>
            <input type="text" readOnly={!isEditing} value={formData.dni} onChange={(e) => handleChange("dni", e.target.value.replace(/\D/g, '').slice(0, formData.tipoDocumento === "DNI" ? 8 : 9))} className={`w-2/3 rounded-lg px-3 py-3 text-sm ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border-transparent'}`} />
          </div>

          <h2 className="font-bold text-[15px] font-poppins text-black mb-4">Disponibilidad para evaluaciones</h2>
          <div className="flex justify-between mb-4">
            {DIAS_SEMANA.map(dia => (
              <button key={dia} onClick={() => toggleDia(dia)} disabled={!isEditing} className={`w-10 h-10 rounded-full font-bold text-[13px] flex items-center justify-center transition-colors ${diasDisponibles.includes(dia) ? 'bg-[#D32F2F] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
                {dia}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <ProfileInput type="time" label="Desde" value={formData.horaDesde} onChange={(v: string) => handleChange("horaDesde", v)} isEditing={isEditing} />
            <ProfileInput type="time" label="Hasta" value={formData.horaHasta} onChange={(v: string) => handleChange("horaHasta", v)} isEditing={isEditing} />
          </div>

          {isEditing && (
            <button onClick={guardarCambios} disabled={isSaving} className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-roboto font-bold text-base rounded-[28px] mt-8 flex justify-center items-center cursor-pointer transition-colors">
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar cambios"}
            </button>
          )}
          {mensaje && <p className={`mt-4 text-[13px] font-poppins ${mensaje.includes("✅") ? "text-[#4CAF50]" : "text-red-500"}`}>{mensaje}</p>}
        </div>
      )}

      {selectedTab !== "Ajustes" && (
        <div className="py-10 flex flex-col items-center text-center">
          <Wrench className="w-12 h-12 text-[#D32F2F] mb-4" />
          <h3 className="font-roboto font-bold text-base text-black mb-2">{selectedTab === "Mis reseñas" ? "Mis Reseñas" : "Mis Huariques"}</h3>
          <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed mb-4">ESTAMOS TRABAJANDO EN ELLO</p>
        </div>
      )}
    </div>
  );
}

function TabItem({ icon, label, isActive, onClick }: any) {
  return (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer relative group flex-1">
      <div className={isActive ? "text-[#D32F2F]" : "text-gray-400 group-hover:text-gray-600"}>{icon}</div>
      <span className={`font-poppins text-[12px] mt-1 ${isActive ? "text-[#D32F2F] font-bold" : "text-gray-400"}`}>{label}</span>
      {isActive && <div className="absolute -bottom-[9px] w-10 h-[2px] bg-[#D32F2F] rounded-full"></div>}
    </div>
  );
}

function ProfileInput({ label, value, type = "text", isEditing, onChange }: any) {
  return (
    <div className="flex flex-col flex-1 py-2">
      <label className="text-gray-500 text-xs mb-1">{label}</label>
      <input type={type} readOnly={!isEditing} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-lg outline-none px-4 py-3 text-sm transition-colors ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border-transparent text-gray-700'}`} />
    </div>
  );
}