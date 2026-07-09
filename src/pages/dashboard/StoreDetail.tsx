import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, MapPin, Bell, Bookmark, Heart, Star, Phone, Menu, Send, Loader2 } from "lucide-react";

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
        calificacion: 5.0,
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

  // Formateador de fechas nativo de JS
  const formatearFecha = (fechaMs: number) => {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(fechaMs));
  };

  if (isLoading || !store) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#D32F2F]" /></div>;
  }

  const platosFiltrados = filtroSeleccionado === "Ofertas" 
    ? platos.filter(p => p.precioDescuento < p.precioOriginal) 
    : platos;

  return (
    <div className="w-full bg-white min-h-screen pb-24">
      <div className="flex justify-between items-center px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <MapPin className="w-5 h-5 text-[#D32F2F]" />
          <span className="font-roboto font-bold text-base truncate max-w-[180px]">
            {store.direccion?.texto?.split(",")[0] || "Ubicación"}
          </span>
        </div>
        <Bell className="w-6 h-6 text-[#D32F2F]" />
      </div>

      <div className="px-5 w-full h-[180px] relative mt-2">
        <img src={store.portadaUrl || "https://via.placeholder.com/800x400.png?text=Sin+Portada"} alt="Portada" className="w-full h-full object-cover rounded-2xl" />
        {role === "QUALITY" && (
          <button onClick={toggleGuardarTienda} className="absolute top-3 left-8 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer">
            <Bookmark className={`w-5 h-5 ${isGuardado ? 'text-[#D32F2F] fill-current' : 'text-gray-400'}`} />
          </button>
        )}
        <button className="absolute top-3 right-8 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer">
          <Heart className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="font-roboto font-bold text-[28px] leading-tight">{store.nombre}</h1>
            <div className="flex items-center gap-1 mt-1 text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[13px]">{store.direccion?.texto?.split(",").pop()?.trim() || "Perú"}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-gray-500">
              <Bell className="w-3.5 h-3.5" />
              <span className="text-[13px]">Cierra {store.horarioCierre || "N/A"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Star className="w-7 h-7 text-[#FFC107] fill-current" />
              <span className="font-roboto font-bold text-[26px] text-gray-500">{store.calificacionGeneral?.toFixed(1) || "5.0"}</span>
              <span className="text-[12px] text-gray-400">({store.totalResenas || 0})</span>
            </div>
            <div className={`mt-1.5 px-4 py-1.5 rounded-xl ${store.estadoLocal?.toLowerCase() === 'abierto' ? 'bg-[#D32F2F]' : 'bg-gray-400'}`}>
              <span className="font-roboto font-bold text-white text-[12px] uppercase">{store.estadoLocal}</span>
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

        <div className="flex gap-3 mt-6">
          <button className="flex-1 h-[50px] bg-[#D32F2F] rounded-[25px] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#b72424]">
            <Phone className="w-5 h-5 text-white" />
            <span className="font-roboto font-bold text-white text-[15px]">WhatsApp</span>
          </button>
          <button className="flex-1 h-[50px] bg-[#D32F2F] rounded-[25px] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#b72424]">
            <Phone className="w-5 h-5 text-white" />
            <span className="font-roboto font-bold text-white text-[15px]">Llamar</span>
          </button>
        </div>
      </div>

      <div className="px-5 py-3 flex gap-4 items-center overflow-x-auto scrollbar-hide">
        <button onClick={() => setFiltroSeleccionado("Destacados")} className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
          <Menu className={`w-5 h-5 ${filtroSeleccionado === "Destacados" ? 'text-[#D32F2F]' : 'text-black'}`} />
          <span className={`text-[14px] ${filtroSeleccionado === "Destacados" ? 'text-[#D32F2F]' : 'text-black'}`}>Destacados</span>
        </button>
        <button onClick={() => setFiltroSeleccionado("Ofertas")} className={`px-4 py-1.5 rounded-full whitespace-nowrap cursor-pointer ${filtroSeleccionado === "Ofertas" ? 'bg-[#D32F2F] text-white' : 'bg-[#E0E0E0] text-black'}`}>
          <span className="text-[14px]">Ofertas</span>
        </button>
        <button onClick={() => setFiltroSeleccionado("Favoritos")} className={`px-4 py-1.5 rounded-full whitespace-nowrap cursor-pointer ${filtroSeleccionado === "Favoritos" ? 'bg-[#D32F2F] text-white' : 'bg-[#E0E0E0] text-black'}`}>
          <span className="text-[14px]">Favoritos</span>
        </button>
      </div>

      <div className="px-5 mt-2">
        {platosFiltrados.length === 0 ? (
          <p className="text-gray-500 text-[13px] py-5">No hay platos para mostrar.</p>
        ) : (
          platosFiltrados.map(plato => {
            const hasDiscount = plato.precioDescuento < plato.precioOriginal;
            const pct = hasDiscount ? Math.round((1 - (plato.precioDescuento / plato.precioOriginal)) * 100) : 0;
            return (
              <div key={plato.id} className="flex py-2.5 bg-white items-center">
                <div className="w-[110px] h-[110px] rounded-2xl relative shrink-0">
                  <img src={plato.imagenUrl} alt={plato.nombre} className="w-full h-full object-cover rounded-2xl" />
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center cursor-pointer">
                    <Heart className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-roboto font-bold text-[16px]">{plato.nombre}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight mt-1">{plato.descripcion}</p>
                  <div className="mt-2">
                    {hasDiscount ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#FFD54F] px-1 py-0.5 rounded text-[10px] font-bold">-{pct}%</span>
                          <span className="text-[10px] text-gray-500 line-through">S/ {plato.precioOriginal.toFixed(2)}</span>
                        </div>
                        <span className="font-roboto font-bold text-[18px]">S/ {plato.precioDescuento.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="font-roboto font-bold text-[18px] mt-2 block">S/ {plato.precioOriginal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-5">
        <button className="w-full h-[50px] bg-[#D32F2F] rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#b72424]">
          <span className="font-roboto font-bold text-white text-[16px]">Revisa el menú completo</span>
        </button>
      </div>
      <div className="w-full h-[1px] bg-[#EEEEEE] my-2"></div>

      <div className="px-5 pt-2">
        <h2 className="font-roboto font-bold text-[22px]">Comentarios</h2>
        <p className="text-[14px] text-gray-500 mb-2">Escribe tu comentario</p>
        
        <div className="relative w-full">
          <input 
            type="text"
            value={comentarioText}
            onChange={(e) => setComentarioText(e.target.value)}
            placeholder="Escribe algo increíble..."
            className="w-full h-[55px] border border-gray-300 focus:border-[#D32F2F] rounded-lg px-4 pr-12 outline-none text-[14px]"
            onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
          />
          <button onClick={enviarComentario} disabled={isSending || !comentarioText.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 cursor-pointer disabled:opacity-50">
            {isSending ? <Loader2 className="w-5 h-5 animate-spin text-[#D32F2F]" /> : <Send className={`w-5 h-5 ${comentarioText.trim() ? 'text-[#D32F2F]' : 'text-gray-400'}`} />}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {comentarios.length === 0 ? (
          <p className="px-5 text-[13px] text-gray-500">Sé el primero en dejar un comentario.</p>
        ) : (
          comentarios.map(comentario => {
            const isLiked = comentario.likedBy?.includes(user?.uid || "");
            return (
              <div key={comentario.id} className="px-5 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={comentario.fotoUsuario || `https://ui-avatars.com/api/?name=${comentario.nombreUsuario}&background=D32F2F&color=fff`} alt="Avatar" className="w-11 h-11 rounded-full object-cover bg-gray-200" />
                    <div>
                      <h4 className="font-roboto font-bold text-[15px]">{comentario.nombreUsuario}</h4>
                      {comentario.rolUsuario === "QUALITY" && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <span>Quality</span><span>🎁 2025 🏅</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <span>estuvo en</span>
                    <MapPin className="w-3.5 h-3.5 text-[#D32F2F]" />
                    <span className="font-roboto font-bold text-black text-[12px]">{comentario.nombreTienda}</span>
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-[#333333] leading-relaxed">{comentario.texto}</p>
                {comentario.rolUsuario === "QUALITY" && comentario.platosSugeridos?.length > 0 && (
                  <div className="mt-2 text-[13px]">
                    <span className="font-roboto font-bold text-black">Plato sugerido: </span>
                    <span className="font-roboto font-bold text-black">{comentario.platosSugeridos.join(", ")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-1">
                    {comentario.rolUsuario === "QUALITY" && (
                      <>
                        <Star className="w-4 h-4 text-[#FFC107] fill-current" />
                        <span className="font-roboto font-bold text-[13px] text-gray-500 mr-2">{comentario.calificacion?.toFixed(1) || "5.0"}</span>
                      </>
                    )}
                    <span className="text-[11px] text-gray-500">{formatearFecha(comentario.fecha)}</span>
                  </div>
                  <button onClick={() => toggleLike(comentario.id, comentario.likes || 0, comentario.likedBy || [])} className="flex items-center gap-1 p-1 cursor-pointer">
                    <span className={`text-[13px] ${isLiked ? 'text-[#D32F2F]' : 'text-gray-500'}`}>{comentario.likes || 0}</span>
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-[#D32F2F] fill-current' : 'text-gray-500'}`} />
                  </button>
                </div>
                <div className="w-full h-[1px] bg-[#EEEEEE] mt-4"></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}