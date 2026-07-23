import { useState, useEffect, useRef } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { Flame, Soup, Utensils, Leaf, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BannerCarousel from "../../components/layout/BannerCarousel";

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
    <div
      ref={sliderRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="flex gap-4 overflow-x-auto pb-4 pt-2 cursor-grab active:cursor-grabbing w-full select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {children}
    </div>
  );
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [platos, setPlatos] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => console.warn("GPS denegado o no disponible", error)
      );
    }

    const fetchData = async () => {
      try {
        // 🔥 OPTIMIZACIÓN 1: Límite de 50 tiendas para no saturar la red 🔥
        const qTiendas = query(collection(db, "tiendas"), where("estado", "==", "APROBADO"), limit(50));
        const tiendasSnap = await getDocs(qTiendas);
        let tiendasData = tiendasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const qPlatos = query(collection(db, "platos"), where("estado", "==", "APROBADO"), orderBy("calificacionPlato", "desc"), limit(10));
        const platosSnap = await getDocs(qPlatos);
        setPlatos(platosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        setTiendas(tiendasData);
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      }
    };
    
    fetchData();
  }, []);

  const tiendasOrdenadas = [...tiendas].map(tienda => {
    if (userLocation && tienda.direccion?.latitud && tienda.direccion?.longitud) {
      const dist = calcularDistancia(userLocation.lat, userLocation.lng, tienda.direccion.latitud, tienda.direccion.longitud);
      return { ...tienda, distanciaKm: dist };
    }
    return { ...tienda, distanciaKm: 9999 }; 
  }).sort((a, b) => a.distanciaKm - b.distanciaKm).slice(0, 10); 

  return (
    <div className="w-full flex flex-col bg-white pb-24">
      <BannerCarousel />

      <div className="px-5 flex justify-between mb-8 mt-6 max-w-md">
        {[
          { name: "Broaster", icon: <Flame className="w-7 h-7 text-[#D32F2F]" /> },
          { name: "Caldos", icon: <Soup className="w-7 h-7 text-[#D32F2F]" /> },
          { name: "Parrilla", icon: <Utensils className="w-7 h-7 text-[#D32F2F]" /> },
          { name: "Ensaladas", icon: <Leaf className="w-7 h-7 text-[#D32F2F]" /> }
        ].map((cat, i) => (
          <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group select-none">
            <div className="w-[60px] h-[60px] rounded-full bg-[#FFF0F0] flex items-center justify-center group-hover:bg-red-100 transition-colors">
              {cat.icon}
            </div>
            <span className="text-[13px] font-poppins font-semibold text-gray-700">{cat.name}</span>
          </div>
        ))}
      </div>

      <div className="px-5 mb-8 select-none w-full">
        <h2 className="font-roboto font-black text-[26px] sm:text-[32px] lg:text-[38px] text-black leading-tight tracking-tight whitespace-nowrap">
          ¿Qué se te antoja hoy?
        </h2>
      </div>

      <Section title="Populares ahora">
        {platos.length > 0 ? (
          <DraggableCarousel>
            {platos.map((plato) => {
              const pctDesc = plato.precioOriginal > 0 ? Math.round((1 - (plato.precioDescuento / plato.precioOriginal)) * 100) : 0;
              return (
                <div key={plato.id} className="min-w-[180px] w-[180px] bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-50 overflow-hidden flex flex-col pb-4 shrink-0 pointer-events-auto">
                  <div className="w-full h-[150px] relative pointer-events-none">
                    {/* 🔥 OPTIMIZACIÓN 2: Lazy Loading de Imágenes 🔥 */}
                    <img src={plato.imagenUrl || "https://via.placeholder.com/160"} alt={plato.nombre} draggable={false} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 pt-3 flex flex-col pointer-events-none">
                    <h3 className="font-poppins font-bold text-black text-base truncate">{plato.nombre}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-poppins text-gray-500 truncate">{plato.nombreTienda || "Huarique"}</span>
                      <span className="text-xs font-poppins font-bold text-gray-700 shrink-0">★ {plato.calificacionPlato || "5.0"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {pctDesc > 0 && <span className="bg-[#FFD54F] px-1.5 py-0.5 rounded text-[10px] font-poppins font-bold text-black">-{pctDesc}%</span>}
                      <span className="text-[10px] font-poppins text-gray-400 line-through">S/ {plato.precioOriginal?.toFixed(2)}</span>
                    </div>
                    <span className="text-xl font-roboto font-bold text-[#D32F2F] mt-1">S/ {plato.precioDescuento?.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </DraggableCarousel>
        ) : <EmptyState text="Aún no hay platos registrados." />}
      </Section>

      <Section title="Huariques Cerca de ti">
        {tiendasOrdenadas.length > 0 ? (
          <DraggableCarousel>
            {tiendasOrdenadas.map((tienda) => (
              <div 
                key={tienda.id} 
                onClick={() => navigate(`/dashboard/tienda/${tienda.id}`)}
                className="min-w-[280px] w-[280px] bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-50 overflow-hidden pb-4 cursor-pointer hover:shadow-lg transition-shadow shrink-0 pointer-events-auto relative"
              >
                <div className="w-full h-[150px] pointer-events-none relative">
                  {/* 🔥 OPTIMIZACIÓN 2: Lazy Loading de Imágenes 🔥 */}
                  <img src={tienda.portadaUrl || "https://via.placeholder.com/280x140"} alt={tienda.nombre} draggable={false} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  
                  {tienda.distanciaKm < 9999 && (
                    <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-[#D32F2F]" />
                      <span className="text-[11px] font-poppins font-bold text-black">
                        {tienda.distanciaKm < 1 ? `${Math.round(tienda.distanciaKm * 1000)}m` : `${tienda.distanciaKm.toFixed(1)}km`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="px-4 pt-3 flex flex-col pointer-events-none">
                  <div className="flex justify-between items-center">
                    <h3 className="font-poppins font-bold text-black text-[17px] truncate flex-1">{tienda.nombre}</h3>
                    <span className="text-sm font-poppins font-bold text-gray-700 ml-2 shrink-0">★ {tienda.calificacionGeneral?.toFixed(1) || "5.0"}</span>
                  </div>
                  <span className="text-xs font-poppins text-gray-500 mt-1 truncate">{tienda.direccion?.texto?.split(",")[1]?.trim() || "Lima"} • {tienda.horario || "10 AM - 10 PM"}</span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(tienda.etiquetas || ["Comida", "Local"]).slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="bg-[#D32F2F] text-white text-[10px] font-poppins font-bold px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </DraggableCarousel>
        ) : <EmptyState text="Aún no hay huariques registrados cerca de ti." />}
      </Section>

      {tiendasOrdenadas.length > 0 && (
        <Section title="Los más recomendados" noSeeAll>
          <DraggableCarousel>
            {[...tiendas].sort((a, b) => (b.calificacionGeneral || 0) - (a.calificacionGeneral || 0)).slice(0, 8).map((tienda) => (
              <div key={tienda.id} onClick={() => navigate(`/dashboard/tienda/${tienda.id}`)} className="flex flex-col items-center gap-2 w-[80px] shrink-0 cursor-pointer pointer-events-auto">
                <div className="w-[74px] h-[74px] rounded-full bg-gray-200 overflow-hidden shadow-sm pointer-events-none border-2 border-white">
                  {/* 🔥 OPTIMIZACIÓN 2: Lazy Loading de Imágenes 🔥 */}
                  <img src={tienda.logoUrl || tienda.portadaUrl || "https://via.placeholder.com/74"} alt={tienda.nombre} draggable={false} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-poppins font-medium text-gray-600 text-center truncate w-full pointer-events-none">{tienda.nombre}</span>
              </div>
            ))}
          </DraggableCarousel>
        </Section>
      )}

      {tiendas.length > 0 && (
        <Section title="Porque lo bueno se repite" noSeeAll>
          <DraggableCarousel>
            {tiendas.slice().reverse().slice(0, 5).map((tienda) => (
              <div key={tienda.id} onClick={() => navigate(`/dashboard/tienda/${tienda.id}`)} className="min-w-[280px] w-[280px] h-[200px] bg-white rounded-[20px] shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-50 overflow-hidden flex flex-col cursor-pointer shrink-0 pointer-events-auto">
                {/* 🔥 OPTIMIZACIÓN 2: Lazy Loading de Imágenes 🔥 */}
                <img src={tienda.portadaUrl || "https://via.placeholder.com/280"} draggable={false} loading="lazy" decoding="async" className="w-full h-[65%] object-cover pointer-events-none" alt="" />
                <div className="px-4 h-[35%] flex flex-col justify-center pointer-events-none bg-white">
                  <span className="font-poppins font-bold text-black text-base truncate">{tienda.nombre}</span>
                  <span className="font-poppins text-xs text-gray-500 mt-0.5">Visitar de nuevo</span>
                </div>
              </div>
            ))}
          </DraggableCarousel>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, noSeeAll }: { title: string; children: React.ReactNode; noSeeAll?: boolean }) {
  return (
    <div className="px-5 mb-10 w-full overflow-hidden select-none">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-roboto font-bold text-[22px] text-black">{title}</h2>
        {!noSeeAll && (
          <button className="text-[#D32F2F] text-sm font-poppins font-semibold cursor-pointer hover:underline">Ver todo</button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm font-poppins text-gray-400 select-none px-1">{text}</p>;
}