import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../api/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Camera, LogOut, Settings, Heart, Wrench, Lock, Unlock, Loader2, ArrowRightCircle, Ticket, AlertTriangle, Shield, Trash2 } from "lucide-react";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const ETIQUETAS_BASE = ["Broaster", "Caldos", "Parrilla", "Ensaladas", "Mariscos", "Chifa", "Criollo", "Postres"];

export default function StoreProfile() {
  const { userData, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Ajustes");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Estado del Formulario
  const [formData, setFormData] = useState({
    razonSocial: userData?.razonSocial || "",
    nombreTienda: userData?.nombre || "",
    celular: userData?.celular || "",
    whatsapp: userData?.whatsapp || "",
    direccion: userData?.direccion?.texto || "",
    encargadoNombre: userData?.encargadoNombre || "",
    encargadoContacto: userData?.encargadoContacto || "",
    encargadoEmail: userData?.encargadoEmail || "",
    tipoHorario: userData?.tipoHorario || "FIJO",
    horarioApertura: userData?.horarioApertura || "",
    horarioCierre: userData?.horarioCierre || "",
  });

  const [isHorarioFijo, setIsHorarioFijo] = useState(formData.tipoHorario === "FIJO");
  const [horariosVariables, setHorariosVariables] = useState<any>(userData?.horariosVariables || {});
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>(userData?.etiquetas || []);

  const handleChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleEtiqueta = (etiqueta: string) => {
    if (!isEditing) return;
    setEtiquetasSeleccionadas(prev => {
      if (prev.includes(etiqueta)) return prev.filter(e => e !== etiqueta);
      if (prev.length < 4) return [...prev, etiqueta];
      return prev;
    });
  };

  const handleHorarioVar = (dia: string, tipo: "apertura" | "cierre", valor: string) => {
    setHorariosVariables((prev: any) => ({
      ...prev,
      [dia]: { ...prev[dia], [tipo]: valor }
    }));
  };

  const guardarCambios = async () => {
    if (!user) return;
    setIsSaving(true);
    setMensaje("");
    
    try {
      const horarioTexto = isHorarioFijo && formData.horarioApertura && formData.horarioCierre 
        ? `${formData.horarioApertura} – ${formData.horarioCierre}` : "";

      const updatePayload = {
        nombre: formData.nombreTienda,
        razonSocial: formData.razonSocial,
        celular: formData.celular,
        whatsapp: formData.whatsapp,
        direccion: { texto: formData.direccion, latitud: userData?.direccion?.latitud || 0, longitud: userData?.direccion?.longitud || 0 },
        encargadoNombre: formData.encargadoNombre,
        encargadoContacto: formData.encargadoContacto,
        encargadoEmail: formData.encargadoEmail,
        tipoHorario: isHorarioFijo ? "FIJO" : "VARIABLE",
        horarioApertura: formData.horarioApertura,
        horarioCierre: formData.horarioCierre,
        horario: horarioTexto,
        horariosVariables: isHorarioFijo ? {} : horariosVariables,
        etiquetas: etiquetasSeleccionadas
      };

      const userRef = doc(db, "tiendas", user.uid);
      await updateDoc(userRef, updatePayload);
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
    <div className="w-full flex flex-col bg-white min-h-screen pb-20">
      
      {/* ── HEADER CON PORTADA ── */}
      <div className="relative w-full h-[280px] md:h-[320px] bg-gray-200">
        <img src={userData?.portadaUrl || "https://via.placeholder.com/800x400.png?text=Portada"} alt="Portada" className="w-full h-[190px] object-cover" />
        <div className="absolute top-0 left-0 w-full h-[190px] bg-black/20"></div>
        <button onClick={() => signOut(auth)} className="absolute top-4 right-4 p-2 cursor-pointer hover:bg-black/20 rounded-full transition-colors z-10">
          <LogOut className="w-6 h-6 text-white" />
        </button>

        <div className="absolute bottom-6 left-6 md:left-8 flex items-end gap-4 z-10">
          <div className="relative">
            <div className="w-[110px] h-[110px] rounded-full bg-white overflow-hidden border-4 border-white shadow-md">
              <img src={userData?.logoUrl || `https://ui-avatars.com/api/?name=${userData?.nombre || "T"}&background=D32F2F&color=fff&size=100`} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-1 right-1 w-[30px] h-[30px] bg-[#D32F2F] rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-[#B71C1C]">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="pb-3 hidden sm:flex flex-col">
            <span className="text-gray-500 text-[13px] font-poppins">Mi perfil</span>
            <h1 className="font-roboto font-bold text-2xl text-black">{userData?.nombre || "Cargando..."}</h1>
            <span className="text-gray-500 text-[14px] font-poppins">Huarique</span>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-2">
        {/* ── CARD INFO ── */}
        <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 p-4 flex justify-between items-center mb-8">
          <div className="flex flex-col items-center w-1/3">
            <span className="font-poppins font-bold text-[13px] text-black">{userData?.plan || "Impulso"}</span>
            <span className="font-poppins text-[10px] text-gray-500 mb-1">Plan Actual</span>
            <button className="bg-[#D32F2F] text-white text-[10px] font-poppins font-bold px-3 py-1 rounded-md mt-1 cursor-pointer">ACTIVAR</button>
          </div>
          <div className="w-[1px] h-[70px] bg-gray-200"></div>
          <div className="flex flex-col w-2/3 pl-6">
            <span className="font-poppins text-[13px] text-black mb-1">{userData?.seguidores || 0} seguidores</span>
            <span className="font-poppins text-[13px] text-black mb-1">{userData?.totalResenas || 0} reseñas</span>
            <span className="font-poppins text-[12px] text-gray-500 mt-1">
              {userData?.horarioApertura && userData?.horarioCierre ? `${userData.horarioApertura} – ${userData.horarioCierre}` : "Sin horario"}
            </span>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex justify-evenly border-b border-[#F0F0F0] mb-6 pb-2">
          <TabItem icon={<Settings className="w-[22px] h-[22px]" />} label="Ajustes" isActive={selectedTab === "Ajustes"} onClick={() => setSelectedTab("Ajustes")} />
          <TabItem icon={<Heart className="w-[22px] h-[22px]" />} label="Mis reseñas" isActive={selectedTab === "Mis reseñas"} onClick={() => setSelectedTab("Mis reseñas")} />
          <TabItem icon={<Wrench className="w-[22px] h-[22px]" />} label="Soporte" isActive={selectedTab === "Soporte"} onClick={() => setSelectedTab("Soporte")} />
        </div>

        {/* ── CONTENIDO: AJUSTES ── */}
        {selectedTab === "Ajustes" && (
          <div className="flex flex-col animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-[15px] font-poppins text-black">Ajustes de Horario</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-[#D32F2F] p-1 cursor-pointer">
                {isEditing ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
            </div>

            {/* Fijo */}
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="radio" name="horarioType" checked={isHorarioFijo} onChange={() => isEditing && setIsHorarioFijo(true)} disabled={!isEditing} className="w-4 h-4 accent-[#D32F2F]" />
              <span className="font-poppins font-bold text-[15px] text-black">Horario fijo</span>
            </label>
            <div className="flex gap-4 pl-7 mb-6">
              <TimeInput label="Apertura" value={formData.horarioApertura} disabled={!isEditing || !isHorarioFijo} onChange={(v: string) => handleChange("horarioApertura", v)} />
              <TimeInput label="Cierre" value={formData.horarioCierre} disabled={!isEditing || !isHorarioFijo} onChange={(v: string) => handleChange("horarioCierre", v)} />
            </div>

            {/* Variable */}
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input type="radio" name="horarioType" checked={!isHorarioFijo} onChange={() => isEditing && setIsHorarioFijo(false)} disabled={!isEditing} className="w-4 h-4 accent-[#D32F2F]" />
              <span className="font-poppins font-bold text-[15px] text-black">Horario variable</span>
            </label>
            <div className="flex flex-col gap-2 pl-7 mb-8">
              {DIAS_SEMANA.map(dia => (
                <div key={dia} className="flex items-center gap-4 mb-2">
                  <span className={`w-24 text-[13px] font-poppins ${isHorarioFijo ? 'text-gray-400' : 'text-black'}`}>{dia}</span>
                  <div className="flex gap-2 flex-1">
                    <TimeInput value={horariosVariables[dia]?.apertura || ""} disabled={!isEditing || isHorarioFijo} onChange={(v: string) => handleHorarioVar(dia, "apertura", v)} hideLabel />
                    <TimeInput value={horariosVariables[dia]?.cierre || ""} disabled={!isEditing || isHorarioFijo} onChange={(v: string) => handleHorarioVar(dia, "cierre", v)} hideLabel />
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-[#F0F0F0] mb-6" />

            <h2 className="font-bold text-[15px] font-poppins text-black mb-4">Información de tu tienda</h2>
            <ProfileInput label="Razón Social" value={formData.razonSocial} onChange={(v: string) => handleChange("razonSocial", v)} isEditing={isEditing} />
            <ProfileInput label="Nombre de la tienda" value={formData.nombreTienda} onChange={(v: string) => handleChange("nombreTienda", v)} isEditing={isEditing} />
            <ProfileInput label="Celular" value={formData.celular} onChange={(v: string) => handleChange("celular", v.replace(/\D/g, '').slice(0, 9))} isEditing={isEditing} />
            <ProfileInput label="WhatsApp" value={formData.whatsapp} onChange={(v: string) => handleChange("whatsapp", v.replace(/\D/g, '').slice(0, 9))} isEditing={isEditing} />
            <ProfileInput label="Dirección" value={formData.direccion} onChange={(v: string) => handleChange("direccion", v)} isEditing={isEditing} />

            <div className="flex flex-col py-2 mt-2 mb-6">
              <label className="text-gray-500 text-xs mb-2">Etiquetas de tu huarique (Máximo 4)</label>
              <div className="flex flex-wrap gap-2">
                {ETIQUETAS_BASE.map(etiqueta => {
                  const isSelected = etiquetasSeleccionadas.includes(etiqueta);
                  return (
                    <button key={etiqueta} onClick={() => toggleEtiqueta(etiqueta)} disabled={!isEditing} className={`px-4 py-2 rounded-full text-xs font-poppins transition-colors cursor-pointer ${isSelected ? 'bg-[#D32F2F] text-white font-bold' : 'bg-[#EEEEEE] text-gray-700'} ${!isEditing && !isSelected ? 'opacity-60 cursor-default' : ''}`}>
                      {etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>

            <h2 className="font-bold text-[15px] font-poppins text-black mb-4 mt-2">Información de Encargado</h2>
            <ProfileInput label="Nombres y Apellidos" value={formData.encargadoNombre} onChange={(v: string) => handleChange("encargadoNombre", v)} isEditing={isEditing} />
            <ProfileInput label="Número de contacto" value={formData.encargadoContacto} onChange={(v: string) => handleChange("encargadoContacto", v.replace(/\D/g, '').slice(0, 9))} isEditing={isEditing} />
            <ProfileInput label="Correo electrónico" value={formData.encargadoEmail} onChange={(v: string) => handleChange("encargadoEmail", v)} isEditing={isEditing} />

            {isEditing && (
              <button onClick={guardarCambios} disabled={isSaving} className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-roboto font-bold text-base rounded-[28px] mt-8 flex justify-center items-center cursor-pointer transition-colors">
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar cambios"}
              </button>
            )}
            {mensaje && <p className={`mt-4 text-[13px] font-poppins ${mensaje.includes("✅") ? "text-[#4CAF50]" : "text-red-500"}`}>{mensaje}</p>}
          </div>
        )}

        {/* ── CONTENIDO: MIS RESEÑAS ── */}
        {selectedTab === "Mis reseñas" && (
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <Heart className="w-12 h-12 text-[#D32F2F] mb-4" />
            <h3 className="font-roboto font-bold text-base text-black mb-2">Reseñas de Qualities</h3>
            <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed mb-4">Aquí aparecerán las evaluaciones CHAS que los Qualities han hecho de tu huarique.</p>
            <span className="font-poppins text-[10px] font-bold text-gray-300 tracking-[2px]">PRÓXIMAMENTE</span>
          </div>
        )}

        {/* ── CONTENIDO: SOPORTE ── */}
        {selectedTab === "Soporte" && (
          <div className="flex flex-col animate-fadeIn mt-2">
            <h2 className="font-bold text-[15px] font-poppins text-black mb-2">Sistema de recompensa</h2>
            <SupportItem icon={<Ticket />} text="Cupones y promociones" />
            
            <h2 className="font-bold text-[15px] font-poppins text-black mb-2 mt-6">Seguridad de mi cuenta</h2>
            <SupportItem icon={<AlertTriangle />} text="Reportar actividad sospechosa" />
            <SupportItem icon={<Shield />} text="Tuve un problema de verificación" />
            <SupportItem icon={<Trash2 />} text="Quiero eliminar mi cuenta" hideDivider />
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponentes auxiliares
function TabItem({ icon, label, isActive, onClick }: any) {
  return (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer relative group flex-1">
      <div className={isActive ? "text-[#D32F2F]" : "text-gray-400 group-hover:text-gray-600"}>{icon}</div>
      <span className={`font-poppins text-[12px] mt-1 ${isActive ? "text-[#D32F2F] font-bold" : "text-gray-400"}`}>{label}</span>
      {isActive && <div className="absolute -bottom-[9px] w-10 h-[2px] bg-[#D32F2F] rounded-full"></div>}
    </div>
  );
}

function TimeInput({ label, value, onChange, disabled, hideLabel = false }: any) {
  return (
    <div className="flex flex-col flex-1">
      {!hideLabel && <label className="text-gray-500 text-xs font-poppins mb-1">{label}</label>}
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`w-full rounded-lg outline-none px-3 py-2.5 text-sm transition-colors ${!disabled ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent text-gray-500'}`} />
    </div>
  );
}

function ProfileInput({ label, value, type = "text", isEditing, onChange }: any) {
  return (
    <div className="flex flex-col py-2">
      <label className="text-gray-500 text-xs mb-1">{label}</label>
      <input type={type} readOnly={!isEditing} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-lg outline-none px-4 py-3 text-sm transition-colors ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent text-gray-700'}`} />
    </div>
  );
}

function SupportItem({ icon, text, hideDivider }: any) {
  return (
    <div className="flex flex-col w-full cursor-pointer group">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center gap-3 text-gray-500 group-hover:text-[#D32F2F] transition-colors">
          <div className="w-5 h-5">{icon}</div>
          <span className="font-poppins text-sm text-[#555]">{text}</span>
        </div>
        <ArrowRightCircle className="w-5 h-5 text-gray-300 group-hover:text-[#D32F2F] transition-colors" />
      </div>
      {!hideDivider && <hr className="border-[#F0F0F0]" />}
    </div>
  );
}