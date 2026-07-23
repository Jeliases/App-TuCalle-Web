import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../api/firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, updateDoc, getDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, LogOut, Settings, Star, Heart, Lock, Unlock, Loader2, Bookmark, MessageCircle } from "lucide-react";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export default function QualityProfile() {
  const { userData, user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedTab, setSelectedTab] = useState("Ajustes");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // 🔥 Estados para Mis Huariques en tiempo real
  const [misHuariquesIds, setMisHuariquesIds] = useState<string[]>(userData?.misHuariques || []);
  const [tiendasGuardadas, setTiendasGuardadas] = useState<any[]>([]);
  const [isLoadingHuariques, setIsLoadingHuariques] = useState(false);

  // 🔥 Estados para Mis Reseñas
  const [misResenas, setMisResenas] = useState<any[]>([]);
  const [isLoadingResenas, setIsLoadingResenas] = useState(false);

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

  // 1. Escuchar la URL para auto-abrir pestañas
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "huariques") setSelectedTab("Mis huariques");
    else if (tab === "resenas") setSelectedTab("Mis reseñas");
    else setSelectedTab("Ajustes");
  }, [location.search]);

  // 2. Escuchar los Huariques Guardados en TIEMPO REAL
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "qualities", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMisHuariquesIds(docSnap.data().misHuariques || []);
      }
    });
    return () => unsub();
  }, [user]);

  // 3. Descargar Tiendas cuando estemos en "Mis huariques"
  useEffect(() => {
    const cargarHuariques = async () => {
      if (selectedTab !== "Mis huariques" || !user) return;
      if (misHuariquesIds.length === 0) {
        setTiendasGuardadas([]);
        return;
      }
      setIsLoadingHuariques(true);
      try {
        const promesas = misHuariquesIds.map((id: string) => getDoc(doc(db, "tiendas", id)));
        const docsSnaps = await Promise.all(promesas);
        const tiendasData = docsSnaps.filter(t => t.exists()).map(t => ({ id: t.id, ...t.data() }));
        setTiendasGuardadas(tiendasData);
      } catch (error) {
        console.error("Error al cargar huariques:", error);
      } finally {
        setIsLoadingHuariques(false);
      }
    };
    cargarHuariques();
  }, [selectedTab, user, misHuariquesIds]);

  // 4. Descargar Reseñas cuando estemos en "Mis reseñas"
  useEffect(() => {
    const cargarResenas = async () => {
      if (selectedTab !== "Mis reseñas" || !user) return;
      setIsLoadingResenas(true);
      try {
        const q = query(collection(db, "comentarios"), where("idUsuario", "==", user.uid));
        const snap = await getDocs(q);
        const resenasData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Ordenamos de más reciente a más antigua
        setMisResenas(resenasData.sort((a: any, b: any) => b.fecha - a.fecha));
      } catch (error) {
        console.error("Error al cargar reseñas:", error);
      } finally {
        setIsLoadingResenas(false);
      }
    };
    cargarResenas();
  }, [selectedTab, user]);

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
      await refreshUserData();
    } catch (error) {
      setMensaje("❌ Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const formatearFecha = (fechaMs: number) => {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(fechaMs));
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
          {/* 🔥 Contador en vivo de reseñas (usando el length real si está cargado, o el del userData) */}
          <span className="font-poppins text-[13px] text-black mb-1">{selectedTab === "Mis reseñas" ? misResenas.length : (userData?.totalResenas || 0)} reseñas</span>
          <span className="font-poppins text-[11px] text-gray-500">Antigüedad: {userData?.antiguedad ? formatearFecha(userData.antiguedad) : "Nuevo"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-evenly border-b border-[#F0F0F0] mb-6 pb-2">
        <TabItem icon={<Settings className="w-[22px] h-[22px]" />} label="Ajustes" isActive={selectedTab === "Ajustes"} onClick={() => setSelectedTab("Ajustes")} />
        <TabItem icon={<Star className="w-[22px] h-[22px]" />} label="Mis reseñas" isActive={selectedTab === "Mis reseñas"} onClick={() => setSelectedTab("Mis reseñas")} />
        <TabItem icon={<Heart className="w-[22px] h-[22px]" />} label="Mis huariques" isActive={selectedTab === "Mis huariques"} onClick={() => setSelectedTab("Mis huariques")} />
      </div>

      {/* =============================== */}
      {/* CONTENIDO: AJUSTES */}
      {/* =============================== */}
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
            <select disabled={!isEditing} value={formData.tipoDocumento} onChange={(e) => {handleChange("tipoDocumento", e.target.value); handleChange("dni", "");}} className={`w-1/3 rounded-lg px-3 py-3 text-sm font-poppins outline-none ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent'}`}>
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
            </select>
            <input type="text" readOnly={!isEditing} value={formData.dni} onChange={(e) => handleChange("dni", e.target.value.replace(/\D/g, '').slice(0, formData.tipoDocumento === "DNI" ? 8 : 9))} className={`w-2/3 rounded-lg px-3 py-3 text-sm font-poppins outline-none ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent'}`} />
          </div>

          <h2 className="font-bold text-[15px] font-poppins text-black mb-4">Disponibilidad para evaluaciones</h2>
          <div className="flex justify-between mb-4">
            {DIAS_SEMANA.map(dia => (
              <button key={dia} onClick={() => toggleDia(dia)} disabled={!isEditing} className={`w-10 h-10 rounded-full font-bold text-[13px] flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${diasDisponibles.includes(dia) ? 'bg-[#D32F2F] text-white' : 'bg-[#F5F5F5] text-gray-500'}`}>
                {dia}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <ProfileInput type="time" label="Desde" value={formData.horaDesde} onChange={(v: string) => handleChange("horaDesde", v)} isEditing={isEditing} />
            <ProfileInput type="time" label="Hasta" value={formData.horaHasta} onChange={(v: string) => handleChange("horaHasta", v)} isEditing={isEditing} />
          </div>

          {isEditing && (
            <button onClick={guardarCambios} disabled={isSaving} className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-roboto font-bold text-base rounded-[28px] mt-8 flex justify-center items-center cursor-pointer transition-colors shadow-md">
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar cambios"}
            </button>
          )}
          {mensaje && <p className={`mt-4 text-[13px] font-poppins text-center ${mensaje.includes("✅") ? "text-[#4CAF50]" : "text-red-500"}`}>{mensaje}</p>}
        </div>
      )}

      {/* =============================== */}
      {/* CONTENIDO: MIS RESEÑAS */}
      {/* =============================== */}
      {selectedTab === "Mis reseñas" && (
        <div className="flex flex-col animate-fadeIn pt-2">
          <h2 className="font-bold text-[15px] font-poppins text-black mb-4">Tus evaluaciones y comentarios</h2>
          
          {isLoadingResenas ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#D32F2F]" />
            </div>
          ) : misResenas.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mb-4" />
              <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed">
                Aún no has dejado ninguna reseña. ¡Evalúa tu primer huarique!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {misResenas.map(resena => (
                <div key={resena.id} className={`p-4 bg-white border rounded-xl shadow-sm flex flex-col ${resena.esEvaluacion ? 'border-orange-100 bg-orange-50/20' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="font-roboto font-bold text-[15px] text-black">{resena.nombreTienda}</span>
                      <span className="text-[10px] text-gray-400 font-poppins mt-0.5">{formatearFecha(resena.fecha)}</span>
                    </div>
                    {/* Estrellas solo si es evaluación */}
                    {resena.calificacion != null && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">
                        <Star className="w-3.5 h-3.5 text-[#FFC107] fill-current"/>
                        <span className="font-bold text-[12px] text-gray-700">{resena.calificacion?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] leading-snug text-gray-700 font-poppins mt-1">{resena.texto}</p>
                  {resena.platosSugeridos?.length > 0 && (
                    <div className="mt-2.5 text-[11px] bg-white border border-gray-100 px-2 py-1.5 rounded-lg inline-block w-fit">
                      <span className="font-bold text-[#D32F2F]">Sugerencias: </span>
                      <span className="text-gray-600 font-medium">{resena.platosSugeridos.join(", ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =============================== */}
      {/* CONTENIDO: MIS HUARIQUES */}
      {/* =============================== */}
      {selectedTab === "Mis huariques" && (
        <div className="flex flex-col animate-fadeIn pt-2">
          <h2 className="font-bold text-[15px] font-poppins text-black mb-4">Lugares guardados para evaluar</h2>
          
          {isLoadingHuariques ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#D32F2F]" />
            </div>
          ) : tiendasGuardadas.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Bookmark className="w-12 h-12 text-gray-200 mb-4" />
              <p className="font-poppins text-[13px] text-gray-500 max-w-[250px] leading-relaxed">
                No tienes huariques guardados. ¡Usa el marcador en las tiendas para agregarlas a tu lista de pendientes!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tiendasGuardadas.map((tienda) => (
                <div 
                  key={tienda.id} 
                  onClick={() => navigate(`/dashboard/quality/tienda/${tienda.id}`)}
                  className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-50 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="w-full h-[100px] relative">
                    <img src={tienda.portadaUrl || "https://via.placeholder.com/150"} alt={tienda.nombre} loading="lazy" className="w-full h-full object-cover" />
                    {/* Marcador rojo indicando que está guardado */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                      <Bookmark className="w-3.5 h-3.5 text-[#D32F2F] fill-current" />
                    </div>
                  </div>
                  <div className="p-3 flex flex-col">
                    <h3 className="font-poppins font-bold text-black text-[13px] truncate">{tienda.nombre}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-[#FFC107] fill-current" />
                      <span className="text-[10px] font-poppins font-bold text-gray-700">{tienda.calificacionGeneral?.toFixed(1) || "5.0"}</span>
                    </div>
                    <span className="text-[10px] font-poppins text-gray-500 mt-1.5 truncate">
                      {tienda.direccion?.texto?.split(",")[1]?.trim() || "Lima"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function TabItem({ icon, label, isActive, onClick }: any) {
  return (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer relative group flex-1">
      <div className={isActive ? "text-[#D32F2F]" : "text-gray-400 group-hover:text-gray-600 transition-colors"}>{icon}</div>
      <span className={`font-poppins text-[12px] mt-1 transition-colors ${isActive ? "text-[#D32F2F] font-bold" : "text-gray-400 group-hover:text-gray-600"}`}>{label}</span>
      {isActive && <div className="absolute -bottom-[9px] w-10 h-[2px] bg-[#D32F2F] rounded-full"></div>}
    </div>
  );
}

function ProfileInput({ label, value, type = "text", isEditing, onChange }: any) {
  return (
    <div className="flex flex-col flex-1 py-2">
      <label className="text-gray-500 text-xs mb-1 font-poppins">{label}</label>
      <input type={type} readOnly={!isEditing} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-lg outline-none px-4 py-3 text-sm font-poppins transition-colors ${isEditing ? 'bg-white border border-[#D32F2F]' : 'bg-[#F9F9F9] border border-transparent text-gray-700'}`} />
    </div>
  );
}