import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../api/firebaseConfig"; // Asegúrate de que esta ruta apunte a tu config

interface Banner {
  id: string;
  img: string;
  alt?: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Obtener imágenes de Firebase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const q = query(collection(db, 'banners_home'), where('activo', '==', true));
        const querySnapshot = await getDocs(q);
        
        const fetchedBanners: Banner[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBanners.push({
            id: doc.id,
            img: doc.data().imageUrl, // Asegúrate de que en Firebase el campo se llame imageUrl
            alt: `Banner Promoción ${doc.id}`
          });
        });

        if (fetchedBanners.length > 0) {
          setBanners(fetchedBanners);
        } else {
          // Fallback por si la colección está vacía (para que no se rompa el diseño)
          setBanners([
            { id: 'default-1', img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2000&auto=format&fit=crop" }
          ]);
        }
      } catch (error) {
        console.error("Error obteniendo los banners: ", error);
        setBanners([{ id: 'error-banner', img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2000&auto=format&fit=crop" }]);
      }
    };
    fetchBanners();
  }, []);

  // 2. Efecto de Auto-Play (Se mueve cada 5 segundos)
  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, [banners.length]);

  // 3. Controles Manuales
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  // Si aún no carga nada, mostramos un esqueleto o contenedor vacío del mismo tamaño
  if (banners.length === 0) {
    return <div className="w-full h-[200px] md:h-[280px] lg:h-[320px] bg-gray-200 animate-pulse"></div>;
  }

  return (
    <div className="relative w-full h-[200px] md:h-[280px] lg:h-[320px] overflow-hidden bg-black select-none group">
      
      {/* ── IMÁGENES ── */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full h-full shrink-0 relative">
            <img 
              src={banner.img} 
              alt={banner.alt || "Promoción"} 
              draggable={false}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Solo mostramos controles si hay más de 1 imagen */}
      {banners.length > 1 && (
        <>
          {/* ── FLECHAS ── */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>

          <button 
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>

          {/* ── PUNTOS INDICADORES ── */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? "w-2 h-2 bg-white scale-125" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}