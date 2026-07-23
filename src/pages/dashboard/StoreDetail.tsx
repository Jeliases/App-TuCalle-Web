import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, MapPin, Clock, Bookmark, Heart, Star, Phone, Menu, Loader2, MessageCircle } from "lucide-react";
import StoreComments from "../../components/layout/StoreComments";

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [store, setStore] = useState<any>(null);
  const [platos, setPlatos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para los botones de guardado
  const [isGuardadoQuality, setIsGuardadoQuality] = useState(false);
  const [isFavoritoUsuario, setIsFavoritoUsuario] = useState(false);
  
  const [filtroSeleccionado, setFiltroSeleccionado] = useState("Destacados");

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
      setIsLoading(false);
    };

    const qPlatos = query(collection(db, "platos"), where("idTienda", "==", id), where("estado", "==", "APROBADO"));
    const unsubPlatos = onSnapshot(qPlatos, (snapshot) => {
      setPlatos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Listener para el Bookmark (Quality)
    let unsubQuality = () => {};
    if (role === "QUALITY" && user?.uid) {
      unsubQuality = onSnapshot(doc(db, "qualities", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const misHuariques = docSnap.data().misHuariques || [];
          setIsGuardadoQuality(misHuariques.includes(id));
        }
      });
    }

    // 🔥 Listener para el Corazón (Usuario) 🔥
    let unsubUser = () => {};
    if (role === "USUARIO" && user?.uid) {
      unsubUser = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const misFavoritos = docSnap.data().favoritos || [];
          setIsFavoritoUsuario(misFavoritos.includes(id));
        }
      });
    }

    fetchStore();

    return () => {
      unsubPlatos();
      unsubQuality();
      unsubUser();
    };
  }, [id, role, user]);

  const toggleGuardarQuality = async () => {
    if (!user?.uid || role !== "QUALITY") return;
    const ref = doc(db, "qualities", user.uid);
    if (isGuardadoQuality) {
      await updateDoc(ref, { misHuariques: arrayRemove(id) });
    } else {
      await updateDoc(ref, { misHuariques: arrayUnion(id) });
      alert("Huarique guardado para evaluación CHAS"); 
    }
  };

  // 🔥 Función para agregar/quitar de Favoritos (Usuario) 🔥
  const toggleFavoritoUsuario = async () => {
    if (!user?.uid || role !== "USUARIO") return;
    const ref = doc(db, "usuarios", user.uid);
    if (isFavoritoUsuario) {
      await updateDoc(ref, { favoritos: arrayRemove(id) });
    } else {
      await updateDoc(ref, { favoritos: arrayUnion(id) });
    }
  };

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
        
        {/* Botón Bookmark para Quality */}
        {role === "QUALITY" && (
          <button onClick={toggleGuardarQuality} className="absolute top-3 left-8 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95">
            <Bookmark className={`w-5 h-5 ${isGuardadoQuality ? 'text-[#D32F2F] fill-current' : 'text-gray-400'}`} />
          </button>
        )}

        {/* 🔥 Botón Corazón para Usuarios normales 🔥 */}
        {role === "USUARIO" && (
          <button onClick={toggleFavoritoUsuario} className="absolute top-3 right-8 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95">
            <Heart className={`w-5 h-5 transition-colors ${isFavoritoUsuario ? 'text-[#D32F2F] fill-current' : 'text-gray-400 hover:text-[#D32F2F]'}`} />
          </button>
        )}
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
                  {role === "USUARIO" && (
                     <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-transform">
                       <Heart className="w-4 h-4 text-gray-400 hover:text-[#D32F2F]" />
                     </div>
                  )}
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

      <StoreComments storeId={store.id} storeNombre={store.nombre} />
      
    </div>
  );
}