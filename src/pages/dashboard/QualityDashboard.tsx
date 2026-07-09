import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { MapPin, Bell, Search, Flame, Soup, Utensils, Leaf, ClipboardSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BannerCarousel from "../../components/layout/BannerCarousel";

// 🔥 CARRUSEL ARRASTRABLE: Cero barras de scroll y control con cursor
function DraggableCarousel({ children }: { children: React.ReactNode }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  let isDown = useRef(false);
  let startX = useRef(0);
  let scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    if (sliderRef.current) {
      startX.current = e.pageX - sliderRef.current.offsetLeft;
      scrollLeft.current = sliderRef.current.scrollLeft;
    }
  };
  const handleMouseLeave = () => { isDown.current = false; };
  const handleMouseUp = () => { isDown.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; 
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div ref={sliderRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className="flex gap-3 overflow-x-auto pb-4 pt-2 cursor-grab active:cursor-grabbing w-full select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {children}
    </div>
  );
}

export default function QualityDashboard() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [platos, setPlatos] = useState<any[]>([]);
  const navigate = useNavigate();
  const direccionActual = "San Juan de Lurigancho, Lima";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qTiendas = query(collection(db, "tiendas"), where("estado", "==", "APROBADO"));
        const tiendasSnap = await getDocs(qTiendas);
        const tiendasData = tiendasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTiendas(tiendasData.sort((a: any, b: any) => (b.calificacionGeneral || 0) - (a.calificacionGeneral || 0)));

        const qPlatos = query(collection(db, "platos"), where("estado", "==", "APROBADO"));
        const platosSnap = await getDocs(qPlatos);
        const platosData = platosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlatos(platosData.sort((a: any, b: any) => (b.calificacionPlato || 0) - (a.calificacionPlato || 0)));
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full flex flex-col pt-4 bg-white pb-24">
      
      {/* CABECERA (Ubicación y Campana) */}
      <div className="px-5 flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#D32F2F]" />
          <span className="font-roboto font-bold text-black text-base">{direccionActual}</span>
        </div>
        <button className="text-[#D32F2F] hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer">
          <Bell className="w-6 h-6" />
        </button>
      </div>

      {/* BANNER DINÁMICO (Edge to Edge) */}
      <div className="mb-7">
        <BannerCarousel />
      </div>

      {/* CATEGORÍAS */}
      <div className="px-5 flex justify-between mb-8 max-w-md">
        {[
          { name: "Broaster", icon: <Flame className="w-7 h-7 text-[#D32F2F]" /> },
          { name: "Caldos", icon: <Soup className="w-7 h-7 text-[#D32F2F]" /> },
          { name: "Parrilla", icon: <Utensils className="w-7 h-7 text-[#D32F2F]" /> },
          { name: "Ensaladas", icon: <Leaf className="w-7 h-7 text-[#D32F2F]" /> }
        ].map((cat, i) => (
          <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
            <div className="w-[55px] h-[55px] rounded-full bg-[#FFF0F0] flex items-center justify-center group-hover:bg-red-100 transition-colors">{cat.icon}</div>
            <span className="text-xs font-poppins font-medium text-gray-700">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* TÍTULO Y BUSCADOR */}
      <div className="px-5 mb-8">
        <h2 className="font-roboto font-black text-3xl text-black leading-tight mb-4">¿Qué se te antoja<br/>hoy?</h2>
        <div className="flex items-center w-full h-[50px] rounded-xl bg-[#F9F9F9] border border-[#E0E0E0] focus-within:border-[#D32F2F] px-4 transition-colors">
          <Search className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar huariques, platos..." className="w-full h-full bg-transparent outline-none text-sm px-3 font-poppins text-black placeholder-gray-400" />
        </div>
      </div>

      {/* 🔥 BOTÓN RÁPIDO DE EVALUACIÓN CHAS 🔥 */}
      <div className="px-5 mb-8">
        <button 
          onClick={() => navigate('/dashboard/calificar/nueva')}
          className="w-full bg-[#D32F2F] text-white rounded-2xl p-4 flex items-center justify-between hover:bg-[#b72424] transition-colors shadow-sm cursor-pointer"
        >
          <div className="text-left">
            <h3 className="font-roboto font-bold text-lg">Hacer una Evaluación</h3>
            <p className="font-poppins text-xs opacity-90 mt-0.5">Evalúa mediante el método CHAS</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ClipboardSignature className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* POPULARES AHORA (Platos) */}
      <div className="pl-5 mb-8">
        <div className="pr-5 flex justify-between items-center mb-3">
          <h2 className="text-[20px] font-roboto font-bold text-black">Populares ahora</h2>
          <button className="text-[#D32F2F] font-poppins text-sm underline decoration-[#D32F2F] cursor-pointer">Ver todo</button>
        </div>
        {platos.length > 0 ? (
          <DraggableCarousel>
            {platos.map((plato) => {
              const pctDesc = plato.precioOriginal > 0 ? Math.round((1 - (plato.precioDescuento / plato.precioOriginal)) * 100) : 0;
              return (
                <div key={plato.id} className="min-w-[160px] w-[160px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden flex flex-col pb-3 shrink-0 pointer-events-auto">
                  <div className="w-full h-[140px] relative pointer-events-none">
                    <img src={plato.imagenUrl || "https://via.placeholder.com/160"} alt={plato.nombre} draggable={false} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 pt-3 flex flex-col pointer-events-none">
                    <h3 className="font-roboto font-bold text-black text-base truncate">{plato.nombre}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-poppins text-xs text-gray-500 truncate">{plato.nombreTienda || "Huarique"}</span>
                      <span className="font-poppins text-xs font-bold text-gray-700 shrink-0">★ {plato.calificacionPlato || "5.0"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {pctDesc > 0 && <span className="bg-[#FFD54F] px-1.5 py-0.5 rounded text-[10px] font-roboto font-bold text-black">-{pctDesc}%</span>}
                      <span className="font-poppins text-[10px] text-gray-400 line-through">S/ {plato.precioOriginal?.toFixed(2)}</span>
                    </div>
                    <span className="font-roboto text-lg font-bold text-[#D32F2F] mt-1">S/ {plato.precioDescuento?.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </DraggableCarousel>
        ) : <p className="text-sm font-poppins text-gray-400">No hay platos populares.</p>}
      </div>

      {/* HUARIQUES RECOMENDADOS (Tiendas) */}
      <div className="pl-5 mb-8">
        <h2 className="text-[20px] font-roboto font-bold text-black mb-3">Huariques recomendados</h2>
        {tiendas.length > 0 ? (
          <DraggableCarousel>
            {tiendas.map((tienda) => (
              <div 
                key={tienda.id} 
                onClick={() => navigate(`/dashboard/quality/tienda/${tienda.id}`)} 
                className="min-w-[280px] w-[280px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-50 overflow-hidden pb-3 shrink-0 cursor-pointer hover:shadow-md transition-shadow pointer-events-auto"
              >
                <div className="w-full h-[140px] pointer-events-none">
                  <img src={tienda.portadaUrl || "https://via.placeholder.com/280x140"} alt={tienda.nombre} draggable={false} className="w-full h-full object-cover" />
                </div>
                <div className="px-3 pt-3 flex flex-col pointer-events-none">
                  <div className="flex justify-between items-center">
                    <h3 className="font-roboto font-bold text-black text-base truncate flex-1">{tienda.nombre}</h3>
                    <span className="font-poppins text-sm font-bold text-gray-700 ml-2">★ {tienda.calificacionGeneral?.toFixed(1) || "5.0"}</span>
                  </div>
                  <span className="font-poppins text-xs text-gray-500 mt-1 truncate">{tienda.direccion?.texto?.split(",")[1]?.trim() || "Lima"} • {tienda.horario}</span>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(tienda.etiquetas || []).slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="bg-[#D32F2F] text-white text-[10px] font-poppins font-bold px-2 py-1 rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </DraggableCarousel>
        ) : <p className="text-sm font-poppins text-gray-400">No hay huariques registrados.</p>}
      </div>
    </div>
  );
}