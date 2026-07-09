import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../api/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Camera, LogOut, Settings, Heart, ShoppingBag, Lock, Unlock, Loader2 } from "lucide-react";

export default function UserProfile() {
  const { userData, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Ajustes");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Estado Local del Formulario (se llena con los datos de Firebase)
  const [formData, setFormData] = useState({
    nombre: userData?.nombre || "",
    apellidos: userData?.apellidos || "",
    celular: userData?.celular || "",
    fechaNacimiento: userData?.fechaNacimiento || "",
    tipoDocumento: userData?.tipoDocumento || "DNI",
    dni: userData?.dni || ""
  });

  // Lógica exacta de calcularAntiguedad de Kotlin
  const calcularAntiguedad = () => {
    if (!userData?.antiguedad) return "Nuevo";
    const ms = Date.now() - userData.antiguedad;
    if (ms <= 0) return "Nuevo";
    const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (dias < 1) return "Hoy";
    if (dias < 30) return `${dias} días`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses`;
    return `${Math.floor(dias / 365)} año${Math.floor(dias / 365) > 1 ? "s" : ""}`;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const guardarCambios = async () => {
    if (!user) return;
    setIsSaving(true);
    setMensaje("");
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, formData);
      setMensaje("✅ Cambios guardados");
      setIsEditing(false);
      window.location.reload(); // Recarga para actualizar el Navbar
    } catch (error) {
      setMensaje("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white min-h-screen pb-20">
      <div className="pt-8 px-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shadow-sm">
                <img 
                  src={userData?.fotoUrl || `https://ui-avatars.com/api/?name=${userData?.nombre || "U"}&background=D32F2F&color=fff&size=100`} 
                  alt="Perfil" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <button className="absolute bottom-0 right-0 w-[26px] h-[26px] bg-[#D32F2F] rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#B71C1C]">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-[13px] font-poppins">Mi perfil</span>
              <h1 className="font-roboto font-bold text-[22px] text-black">
                {userData?.nombre || "Cargando..."} {userData?.apellidos || ""}
              </h1>
              <span className="text-gray-500 text-sm font-poppins capitalize">{userData?.rol?.toLowerCase() || "Usuario"}</span>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="p-2 cursor-pointer hover:bg-red-50 rounded-full transition-colors">
            <LogOut className="w-6 h-6 text-[#D32F2F]" />
          </button>
        </div>

        {/* STATS CARD */}
        <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 py-4 flex justify-evenly items-center mb-6">
          <StatItem valor={userData?.totalHuariques || "0"} label="huariques" />
          <div className="w-[1px] h-10 bg-gray-200"></div>
          <StatItem valor={calcularAntiguedad()} label="antigüedad" />
          <div className="w-[1px] h-10 bg-gray-200"></div>
          <StatItem valor={userData?.totalResenas || "0"} label="reseñas" />
        </div>

        {/* TABS */}
        <div className="flex gap-8 mb-4 border-b border-[#F0F0F0] pb-2">
          <TabItem icon={<Settings className="w-[22px] h-[22px]" />} label="Ajustes" isActive={selectedTab === "Ajustes"} onClick={() => setSelectedTab("Ajustes")} />
          <TabItem icon={<Heart className="w-[22px] h-[22px]" />} label="Mis huariques" isActive={selectedTab === "Mis huariques"} onClick={() => setSelectedTab("Mis huariques")} />
          <TabItem icon={<ShoppingBag className="w-[22px] h-[22px]" />} label="Mis pedidos" isActive={selectedTab === "Mis pedidos"} onClick={() => setSelectedTab("Mis pedidos")} />
        </div>

        {/* CONTENIDO DE LA PESTAÑA */}
        {selectedTab === "Ajustes" && (
          <div className="flex flex-col animate-fadeIn pt-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[15px] font-poppins text-black">Información de tu cuenta</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-[#D32F2F] p-1 cursor-pointer hover:bg-red-50 rounded-md">
                {isEditing ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
            </div>

            <ProfileInput label="Nombre(s)*" value={formData.nombre} onChange={(v: string) => handleChange("nombre", v)} isEditing={isEditing} />
            <ProfileInput label="Apellido(s)*" value={formData.apellidos} onChange={(v: string) => handleChange("apellidos", v)} isEditing={isEditing} />
            <ProfileInput label="Correo Electrónico*" value={userData?.email || ""} onChange={() => {}} isEditing={false} />
            <ProfileInput label="Celular*" value={formData.celular} onChange={(v: string) => handleChange("celular", v.replace(/\D/g, '').slice(0, 9))} isEditing={isEditing} />
            <ProfileInput label="Fecha de nacimiento*" type="date" value={formData.fechaNacimiento} onChange={(v: string) => handleChange("fechaNacimiento", v)} isEditing={isEditing} />
                
            {/* Documento Dual (Como ProfileDocumentField en Kotlin) */}
            <div className="flex flex-col py-2">
              <label className="text-gray-500 text-xs mb-1">Documento de Identidad</label>
              <div className="flex gap-2">
                <select 
                  disabled={!isEditing} 
                  value={formData.tipoDocumento} 
                  onChange={(e) => {handleChange("tipoDocumento", e.target.value); handleChange("dni", "");}}
                  className={`w-1/3 rounded-lg outline-none px-3 py-3 text-sm transition-colors ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent'}`}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                </select>
                <input 
                  type="text" 
                  readOnly={!isEditing}
                  value={formData.dni} 
                  onChange={(e) => handleChange("dni", e.target.value.replace(/\D/g, '').slice(0, formData.tipoDocumento === "DNI" ? 8 : 9))}
                  className={`w-2/3 rounded-lg outline-none px-3 py-3 text-sm transition-colors ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent'}`}
                />
              </div>
            </div>

            {isEditing && (
              <button 
                onClick={guardarCambios}
                disabled={isSaving}
                className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-roboto font-bold text-base rounded-[28px] mt-8 flex justify-center items-center cursor-pointer transition-colors"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar cambios"}
              </button>
            )}
            
            {mensaje && <p className={`mt-4 text-[13px] font-poppins ${mensaje.includes("✅") ? "text-[#4CAF50]" : "text-red-500"}`}>{mensaje}</p>}
          </div>
        )}

        {selectedTab !== "Ajustes" && (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <Settings className="w-12 h-12 text-[#D32F2F] mb-4" />
            <h3 className="font-roboto font-bold text-base text-black mb-2">
              {selectedTab === "Mis huariques" ? "Mis Huariques favoritos" : "Mis Pedidos"}
            </h3>
            <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed mb-4">
              {selectedTab === "Mis huariques" 
                ? "Aquí verás los huariques que has marcado como favoritos." 
                : "Aquí verás tu historial de pedidos con opciones para repetir y dejar reseña."}
            </p>
            <span className="font-poppins text-[10px] font-bold text-gray-300 tracking-[2px]">PRÓXIMAMENTE</span>
          </div>
        )}

      </div>
    </div>
  );
}

// Subcomponentes auxiliares (Traducciones exactas de Kotlin)
function StatItem({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-roboto font-bold text-base text-black">{valor}</span>
      <span className="font-poppins text-[11px] text-gray-500">{label}</span>
    </div>
  );
}

function TabItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer relative group">
      <div className={isActive ? "text-[#D32F2F]" : "text-gray-400 group-hover:text-gray-600 transition-colors"}>{icon}</div>
      <span className={`font-poppins text-[11px] mt-1 ${isActive ? "text-[#D32F2F] font-bold" : "text-gray-400 group-hover:text-gray-600 transition-colors"}`}>{label}</span>
      {isActive && <div className="absolute -bottom-[9px] w-10 h-[2px] bg-[#D32F2F] rounded-full"></div>}
    </div>
  );
}

function ProfileInput({ label, value, type = "text", isEditing, onChange }: any) {
  return (
    <div className="flex flex-col py-2">
      <label className="text-gray-500 text-xs mb-1">{label}</label>
      <input 
        type={type} 
        readOnly={!isEditing}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg outline-none px-4 py-3 text-sm transition-colors ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent text-gray-700'}`}
      />
    </div>
  );
}