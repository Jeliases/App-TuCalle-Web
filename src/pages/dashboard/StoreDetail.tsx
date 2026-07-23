import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, MapPin, Clock, Bookmark, Heart, Star, Phone, Menu, Send, Loader2, MessageCircle } from "lucide-react";

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userData, role } = useAuth();

  const [store, setStore] = useState<any>(null);
  const [platos, setPlatos] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuardado, setIsGuardado] = useState(false);

  const [filtroSeleccionado, setFiltroSeleccionado] = useState("Destacados");
  const [comentarioText, setComentarioText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // 🔥 1. FORZAR SCROLL ARRIBA AL MONTAR LA PANTALLA
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchStore = async () => {
      const docRef = doc(db, "tiendas", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStore({ id: docSnap.id, ...docSnap.data() });
      }
    };

    const qPlatos = query(collection(db, "platos"), where("idTienda", "==", id), where("estado", "==", "APROBADO"));
    const unsubPlatos = onSnapshot(qPlatos, (snapshot) => {
      setPlatos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qComentarios = query(collection(db, "comentarios"), where("idTienda", "==", id));
    const unsubComentarios = onSnapshot(qComentarios, (snapshot) => {
      const coms = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComentarios(coms.sort((a: any, b: any) => b.fecha - a.fecha));
      setIsLoading(false);
    });

    let unsubQuality = () => {};
    if (role === "QUALITY" && user?.uid) {
      unsubQuality = onSnapshot(doc(db, "qualities", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const misHuariques = docSnap.data().misHuariques || [];
          setIsGuardado(misHuariques.includes(id));
        }
      });
    }

    fetchStore();

    // 🔥 LIMPIEZA DE CONEXIONES PARA EVITAR LENTITUD
    return () => {
      unsubPlatos();
      unsubComentarios();
      unsubQuality();
    };
  }, [id, role, user]);

  const toggleGuardarTienda = async () => {
    if (!user?.uid || role !== "QUALITY") return;
    const ref = doc(db, "qualities", user.uid);
    if (isGuardado) {
      await updateDoc(ref, { misHuariques: arrayRemove(id) });
    } else {
      await updateDoc(ref, { misHuariques: arrayUnion(id) });
      alert("Huarique guardado para su reseña"); 
    }
  };

  const enviarComentario = async () => {
    if (!comentarioText.trim() || !user?.uid || !store) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "comentarios"), {
        idTienda: store.id,
        nombreTienda: store.nombre,
        idUsuario: user.uid,
        nombreUsuario: userData?.nombre || "Usuario",
        fotoUsuario: userData?.fotoUrl || "",
        rolUsuario: role || "USUARIO",
        texto: comentarioText,
        calificacion: 5.0, // Solo para usuarios normales
        fecha: Date.now(),
        likes: 0,
        likedBy: [],
        platosSugeridos: []
      });
      setComentarioText("");
    } catch (error) {
      console.error("Error enviando comentario:", error);
    }
    setIsSending(false);
  };

  const toggleLike = async (idComentario: string, likesActuales: number, likedBy: string[]) => {
    if (!user?.uid) return;
    const ref = doc(db, "comentarios", idComentario);
    const hasLiked = likedBy.includes(user.uid);
    if (hasLiked) {
      await updateDoc(ref, { likedBy: arrayRemove(user.uid), likes: likesActuales - 1 });
    } else {
      await updateDoc(ref, { likedBy: arrayUnion(user.uid), likes: likesActuales + 1 });
    }
  };

  const formatearFecha = (fechaMs: number) => {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(fechaMs));
  };

  // 🔥 BACK CON DESTINO FIJO SEGÚN ROL (navigate(-1) rompía el historial)
  const volverAlDashboard = () => {
    navigate(role === "QUALITY" ? "/dashboard/quality" : "/dashboard/usuario");
  };

  if (isLoading || !store) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#D32F2F]" /></div>;
  }

  const platosFiltrados = filtroSeleccionado === "Ofertas" 
    ? platos.filter(p => p.precioDescuento < p.precioOriginal) 
    : platos;

  return (
    <div className="w-full bg-white min-h-screen pb-24 font-poppins">
      
      {/* 🔥 HEADER PEGAJOSO (STICKY) CON BOTÓN ATRÁS */}
      <div className="sticky top-0 z-50 bg-white flex justify-between items-center px-5 py-3 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={volverAlDashboard} className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <span className="font-roboto font-bold text-base truncate max-w-[220px]">
            {store.nombre}
          </span>
        </div>
      </div>

      <div className="px-5 w-full h-[180px] relative mt-4">
        <img src={store.portadaUrl || "https://via.placeholder.com/800x400.png?text=Sin+Portada"} alt="Portada" className="w-full h-full object-cover rounded-2xl" />
        {role === "QUALITY" && (
          <button onClick={toggleGuardarTienda} className="absolute top-3 left-8 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95">
            <Bookmark className={`w-5 h-5 ${isGuardado ? 'text-[#D32F2F] fill-current' : 'text-gray-400'}`} />
          </button>
        )}
        <button className="absolute top-3 right-8 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95">
          <Heart className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="font-roboto font-bold text-[28px] leading-tight text-black">{store.nombre}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[13px]">{store.direccion?.texto?.split(",").pop()?.trim() || "Perú"}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[13px]">Cierra {store.horarioCierre || "N/A"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Star className="w-7 h-7 text-[#FFC107] fill-current" />
              <span className="font-roboto font-bold text-[26px] text-gray-600">{store.calificacionGeneral?.toFixed(1) || "5.0"}</span>
              <span className="text-[12px] text-gray-400">({store.totalResenas || 0})</span>
            </div>
            <div className={`mt-1.5 px-4 py-1.5 rounded-xl ${store.estadoLocal?.toLowerCase() === 'abierto' ? 'bg-[#D32F2F]' : 'bg-gray-400'}`}>
              <span className="font-roboto font-bold text-white text-[12px] uppercase tracking-wider">{store.estadoLocal}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {store.etiquetas?.map((tag: string, i: number) => (
            <div key={i} className="bg-[#D32F2F] px-3 py-1.5 rounded-full">
              <span className="font-roboto font-bold text-white text-[11px]">{tag}</span>
            </div>
          ))}
        </div>

        {/* 🔥 BOTONES DE CONTACTO ACTUALIZADOS (Icono + Número) */}
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => window.open(`https://wa.me/51${store.whatsapp}`, '_blank')}
            className="flex-1 h-[50px] bg-[#25D366] rounded-full flex justify-center items-center gap-2 cursor-pointer hover:bg-[#1ebd57] transition-colors shadow-sm"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="font-roboto font-bold text-white text-[14px] truncate px-1">
              {store.whatsapp || "WhatsApp"}
            </span>
          </button>
          
          <button 
            onClick={() => window.open(`tel:${store.celular}`)}
            className="flex-1 h-[50px] bg-[#D32F2F] rounded-full flex justify-center items-center gap-2 cursor-pointer hover:bg-[#b72424] transition-colors shadow-sm"
          >
            <Phone className="w-5 h-5 text-white" />
            <span className="font-roboto font-bold text-white text-[14px] truncate px-1">
              {store.celular || "Llamar"}
            </span>
          </button>
        </div>
      </div>

      <div className="px-5 py-3 flex gap-4 items-center overflow-x-auto scrollbar-hide">
        <button onClick={() => setFiltroSeleccionado("Destacados")} className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
          <Menu className={`w-5 h-5 ${filtroSeleccionado === "Destacados" ? 'text-[#D32F2F]' : 'text-gray-500'}`} />
          <span className={`text-[14px] font-bold ${filtroSeleccionado === "Destacados" ? 'text-[#D32F2F]' : 'text-gray-500'}`}>Destacados</span>
        </button>
        <button onClick={() => setFiltroSeleccionado("Ofertas")} className={`px-4 py-1.5 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${filtroSeleccionado === "Ofertas" ? 'bg-[#D32F2F] text-white' : 'bg-gray-100 text-gray-600'}`}>
          <span className="text-[13px]">Ofertas</span>
        </button>
        <button onClick={() => setFiltroSeleccionado("Favoritos")} className={`px-4 py-1.5 rounded-full font-medium whitespace-nowrap cursor-pointer transition-colors ${filtroSeleccionado === "Favoritos" ? 'bg-[#D32F2F] text-white' : 'bg-gray-100 text-gray-600'}`}>
          <span className="text-[13px]">Favoritos</span>
        </button>
      </div>

      <div className="px-5 mt-2">
        {platosFiltrados.length === 0 ? (
          <p className="text-gray-500 text-[13px] py-5 text-center bg-gray-50 rounded-xl">No hay platos para mostrar en esta categoría.</p>
        ) : (
          platosFiltrados.map(plato => {
            const hasDiscount = plato.precioDescuento < plato.precioOriginal;
            const pct = hasDiscount ? Math.round((1 - (plato.precioDescuento / plato.precioOriginal)) * 100) : 0;
            return (
              <div key={plato.id} className="flex py-3 bg-white items-center border-b border-gray-50 last:border-0">
                <div className="w-[110px] h-[110px] rounded-2xl relative shrink-0 shadow-sm">
                  <img src={plato.imagenUrl} alt={plato.nombre} className="w-full h-full object-cover rounded-2xl" />
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center cursor-pointer shadow-sm">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-[#D32F2F]" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-roboto font-bold text-[16px] text-gray-900">{plato.nombre}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight mt-1">{plato.descripcion}</p>
                  <div className="mt-2">
                    {hasDiscount ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#FFD54F] px-1 py-0.5 rounded text-[10px] font-roboto font-bold text-black">-{pct}%</span>
                          <span className="text-[10px] text-gray-400 line-through">S/ {plato.precioOriginal.toFixed(2)}</span>
                        </div>
                        <span className="font-roboto font-black text-[18px] text-[#D32F2F]">S/ {plato.precioDescuento.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="font-roboto font-black text-[18px] text-[#D32F2F] mt-2 block">S/ {plato.precioOriginal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-5">
        <button className="w-full h-[50px] bg-white border-2 border-[#D32F2F] rounded-xl flex items-center justify-center cursor-pointer hover:bg-red-50 transition-colors">
          <span className="font-roboto font-bold text-[#D32F2F] text-[15px]">Ver menú completo</span>
        </button>
      </div>
      
      <div className="w-full h-2 bg-gray-50 my-2"></div>

      <div className="px-5 pt-4">
        <h2 className="font-roboto font-bold text-[20px] text-black mb-1">Comentarios</h2>
        
        {/* 🔥 RESTRICCIÓN DE COMENTARIOS PARA QUALITY */}
        {role === "QUALITY" ? (
          <div className="mt-4 bg-red-50 border border-red-100 p-5 rounded-xl text-center">
            <Star className="w-8 h-8 text-[#D32F2F] mx-auto mb-2 opacity-80" />
            <p className="text-[13px] text-gray-700 font-medium leading-relaxed">
              Como <span className="font-bold text-[#D32F2F]">Auditor Quality</span>, tus evaluaciones tienen un impacto mayor.
            </p>
            <button 
              onClick={() => navigate("/dashboard/calificar/nueva")} 
              className="mt-3 px-6 py-2 bg-[#D32F2F] text-white font-bold text-sm rounded-full shadow-sm hover:bg-[#b72424] transition-colors"
            >
              Realizar Evaluación CHAS
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-gray-500 mb-3">Cuéntanos qué te pareció</p>
            <div className="relative w-full">
              <input 
                type="text"
                value={comentarioText}
                onChange={(e) => setComentarioText(e.target.value)}
                placeholder="Escribe algo increíble..."
                className="w-full h-[50px] bg-gray-50 border border-transparent focus:bg-white focus:border-[#D32F2F] rounded-xl px-4 pr-12 outline-none text-[13px] transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
              />
              <button 
                onClick={enviarComentario} 
                disabled={isSending || !comentarioText.trim()} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer disabled:opacity-50 hover:bg-gray-100 rounded-full transition-colors"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin text-[#D32F2F]" /> : <Send className={`w-4 h-4 ${comentarioText.trim() ? 'text-[#D32F2F]' : 'text-gray-400'}`} />}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6">
        {comentarios.length === 0 ? (
          <p className="px-5 text-[13px] text-gray-500 text-center py-4 bg-gray-50 mx-5 rounded-xl">No hay comentarios aún. ¡Sé el primero!</p>
        ) : (
          comentarios.map(comentario => {
            const isLiked = comentario.likedBy?.includes(user?.uid || "");
            return (
              <div key={comentario.id} className="px-5 py-4 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={comentario.fotoUsuario || `https://ui-avatars.com/api/?name=${comentario.nombreUsuario}&background=D32F2F&color=fff`} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-gray-200 border border-gray-100" />
                    <div>
                      <h4 className="font-roboto font-bold text-[14px] text-black">{comentario.nombreUsuario}</h4>
                      {comentario.rolUsuario === "QUALITY" && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="bg-red-50 text-[#D32F2F] text-[9px] font-bold px-1.5 py-0.5 rounded">QUALITY</span>
                          <span className="text-[10px]">🎁 2025 🏅</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400">{formatearFecha(comentario.fecha)}</span>
                  </div>
                </div>
                
                <p className="mt-3 text-[13px] text-gray-700 leading-relaxed pr-2">{comentario.texto}</p>
                
                {comentario.rolUsuario === "QUALITY" && comentario.platosSugeridos?.length > 0 && (
                  <div className="mt-2 text-[12px] bg-gray-50 p-2 rounded-lg inline-block">
                    <span className="font-bold text-gray-800">Sugerencias: </span>
                    <span className="text-gray-600">{comentario.platosSugeridos.join(", ")}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-3 pt-2">
                  <div className="flex items-center gap-1">
                    {comentario.rolUsuario === "QUALITY" && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3.5 h-3.5 text-[#FFC107] fill-current" />
                        <span className="font-roboto font-bold text-[12px] text-gray-700">{comentario.calificacion?.toFixed(1) || "5.0"}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleLike(comentario.id, comentario.likes || 0, comentario.likedBy || [])} className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-gray-50 rounded-full transition-colors">
                    <span className={`font-poppins font-medium text-[12px] ${isLiked ? 'text-[#D32F2F]' : 'text-gray-400'}`}>{comentario.likes || 0}</span>
                    <Heart className={`w-4 h-4 ${isLiked ? 'text-[#D32F2F] fill-current' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}