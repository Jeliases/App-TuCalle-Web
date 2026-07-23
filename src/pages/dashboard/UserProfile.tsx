import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../api/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, LogOut, Settings, Heart, ShoppingBag, Lock, Unlock, Loader2, Star } from "lucide-react";

export default function UserProfile() {
  const { userData, user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [selectedTab, setSelectedTab] = useState("Ajustes");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [favoritosIds, setFavoritosIds] = useState<string[]>(userData?.favoritos || []);
  const [tiendasFavoritas, setTiendasFavoritas] = useState<any[]>([]);
  const [isLoadingFavoritos, setIsLoadingFavoritos] = useState(false);

  const [formData, setFormData] = useState({
    nombre: userData?.nombre || "",
    apellidos: userData?.apellidos || "",
    celular: userData?.celular || "",
    fechaNacimiento: userData?.fechaNacimiento || "",
    tipoDocumento: userData?.tipoDocumento || "DNI",
    dni: userData?.dni || ""
  });

  // 1. Escuchar la URL para auto-abrir la pestaña
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "favoritos") {
      setSelectedTab("Mis huariques");
    } else {
      setSelectedTab("Ajustes");
    }
  }, [location.search]);

  // 2. Escuchar los Favoritos en TIEMPO REAL de forma robusta
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFavoritosIds(data.favoritos || []);
      }
    });
    return () => unsub();
  }, [user]);

  // 3. Descargar las tiendas cuando estemos en la pestaña de favoritos
  useEffect(() => {
    const cargarFavoritos = async () => {
      if (selectedTab !== "Mis huariques" || !user) return;
      
      if (favoritosIds.length === 0) {
        setTiendasFavoritas([]);
        return;
      }

      setIsLoadingFavoritos(true);
      try {
        const promesas = favoritosIds.map((id: string) => getDoc(doc(db, "tiendas", id)));
        const docsSnaps = await Promise.all(promesas);
        
        const tiendasData = docsSnaps
          .filter(tDoc => tDoc.exists())
          .map(tDoc => ({ id: tDoc.id, ...tDoc.data() }));
          
        setTiendasFavoritas(tiendasData);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
      } finally {
        setIsLoadingFavoritos(false);
      }
    };

    cargarFavoritos();
  }, [selectedTab, user, favoritosIds]);

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
      await refreshUserData();
    } catch (error) {
      setMensaje("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white min-h-screen pb-20">
      <div className="pt-8 px-6">
        
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

        <div className="w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100 py-4 flex justify-evenly items-center mb-6">
          {/* 🔥 Contador en vivo de los favoritos */}
          <StatItem valor={favoritosIds.length.toString()} label="favoritos" />
          <div className="w-[1px] h-10 bg-gray-200"></div>
          <StatItem valor={calcularAntiguedad()} label="antigüedad" />
          <div className="w-[1px] h-10 bg-gray-200"></div>
          <StatItem valor={userData?.totalResenas || "0"} label="reseñas" />
        </div>

        <div className="flex gap-8 mb-4 border-b border-[#F0F0F0] pb-2">
          <TabItem icon={<Settings className="w-[22px] h-[22px]" />} label="Ajustes" isActive={selectedTab === "Ajustes"} onClick={() => setSelectedTab("Ajustes")} />
          <TabItem icon={<Heart className="w-[22px] h-[22px]" />} label="Mis huariques" isActive={selectedTab === "Mis huariques"} onClick={() => setSelectedTab("Mis huariques")} />
          <TabItem icon={<ShoppingBag className="w-[22px] h-[22px]" />} label="Mis pedidos" isActive={selectedTab === "Mis pedidos"} onClick={() => setSelectedTab("Mis pedidos")} />
        </div>

        {selectedTab === "Ajustes" && (
          <div className="flex flex-col animate-fadeIn pt-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[15px] font-poppins text-black">Información de tu cuenta</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="text-[#D32F2F] p-1 cursor-pointer hover:bg-red-50 rounded-md transition-colors">
                {isEditing ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
            </div>

            <ProfileInput label="Nombre(s)*" value={formData.nombre} onChange={(v: string) => handleChange("nombre", v)} isEditing={isEditing} />
            <ProfileInput label="Apellido(s)*" value={formData.apellidos} onChange={(v: string) => handleChange("apellidos", v)} isEditing={isEditing} />
            <ProfileInput label="Correo Electrónico*" value={userData?.email || ""} onChange={() => {}} isEditing={false} />
            <ProfileInput label="Celular*" value={formData.celular} onChange={(v: string) => handleChange("celular", v.replace(/\D/g, '').slice(0, 9))} isEditing={isEditing} />
            <ProfileInput label="Fecha de nacimiento*" type="date" value={formData.fechaNacimiento} onChange={(v: string) => handleChange("fechaNacimiento", v)} isEditing={isEditing} />
                
            <div className="flex flex-col py-2">
              <label className="text-gray-500 text-xs mb-1 font-poppins">Documento de Identidad</label>
              <div className="flex gap-2">
                <select 
                  disabled={!isEditing} 
                  value={formData.tipoDocumento} 
                  onChange={(e) => {handleChange("tipoDocumento", e.target.value); handleChange("dni", "");}}
                  className={`w-1/3 rounded-lg outline-none px-3 py-3 text-sm transition-colors font-poppins ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent'}`}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                </select>
                <input 
                  type="text" 
                  readOnly={!isEditing}
                  value={formData.dni} 
                  onChange={(e) => handleChange("dni", e.target.value.replace(/\D/g, '').slice(0, formData.tipoDocumento === "DNI" ? 8 : 9))}
                  className={`w-2/3 rounded-lg outline-none px-3 py-3 text-sm transition-colors font-poppins ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent'}`}
                />
              </div>
            </div>

            {isEditing && (
              <button 
                onClick={guardarCambios}
                disabled={isSaving}
                className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-roboto font-bold text-base rounded-[28px] mt-8 flex justify-center items-center cursor-pointer transition-colors shadow-md"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar cambios"}
              </button>
            )}
            
            {mensaje && <p className={`mt-4 text-[13px] font-poppins text-center ${mensaje.includes("✅") ? "text-[#4CAF50]" : "text-red-500"}`}>{mensaje}</p>}
          </div>
        )}

        {selectedTab === "Mis huariques" && (
          <div className="flex flex-col animate-fadeIn pt-2">
            <h2 className="font-bold text-[15px] font-poppins text-black mb-4">Tus lugares favoritos</h2>
            
            {isLoadingFavoritos ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#D32F2F]" />
              </div>
            ) : tiendasFavoritas.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <Heart className="w-12 h-12 text-gray-200 mb-4" />
                <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed">
                  Aún no tienes huariques favoritos. ¡Explora el mapa y guarda los que más te gusten!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tiendasFavoritas.map((tienda) => (
                  <div 
                    key={tienda.id} 
                    onClick={() => navigate(`/dashboard/tienda/${tienda.id}`)}
                    className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-50 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="w-full h-[100px] relative">
                      <img src={tienda.portadaUrl || "https://via.placeholder.com/150"} alt={tienda.nombre} loading="lazy" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Heart className="w-3.5 h-3.5 text-[#D32F2F] fill-current" />
                      </div>
                    </div>
                    <div className="p-3 flex flex-col">
                      <h3 className="font-poppins font-bold text-black text-[13px] truncate">{tienda.nombre}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-[#FFC107] fill-current" />
                        <span className="text-[10px] font-poppins font-bold text-gray-700">{tienda.calificacionGeneral?.toFixed(1) || "5.0"}</span>
                      </div>
                      <span className="text-[10px] font-poppins text-gray-500 mt-1.5 truncate">
                        {tienda.direccion?.texto?.split(",")[1]?.trim() || "Lima"} • {tienda.horario}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === "Mis pedidos" && (
          <div className="py-10 flex flex-col items-center justify-center text-center animate-fadeIn">
            <ShoppingBag className="w-12 h-12 text-[#D32F2F] mb-4" />
            <h3 className="font-roboto font-bold text-base text-black mb-2">Mis Pedidos</h3>
            <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed mb-4">
              Aquí verás tu historial de pedidos con opciones para repetir y dejar reseña.
            </p>
            <span className="font-poppins text-[10px] font-bold text-gray-300 tracking-[2px]">PRÓXIMAMENTE</span>
          </div>
        )}

      </div>
    </div>
  );
}

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
      <label className="text-gray-500 text-xs mb-1 font-poppins">{label}</label>
      <input 
        type={type} 
        readOnly={!isEditing}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg outline-none px-4 py-3 text-sm transition-colors font-poppins ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent text-gray-700'}`}
      />
    </div>
  );
}