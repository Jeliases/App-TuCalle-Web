import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { X, Loader2 } from "lucide-react";

// Estilo del contenedor para que ocupe todo el espacio del div
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Centro por defecto (Puedes cambiarlo por las coordenadas de Cusco si lo prefieres)
const center = {
  lat: -12.046374,
  lng: -77.042793
};

interface MapSelectorProps {
  onLocationSelected: (direccion: string, lat: number, lng: number) => void;
  onDismiss: () => void;
}

export default function MapSelector({ onLocationSelected, onDismiss }: MapSelectorProps) {
  // 🔥 Cargador oficial del script de Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    // Llama a la variable de entorno que creamos en el archivo .env
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", 
  });

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(center);
  const [direccionTexto, setDireccionTexto] = useState("Haz clic en el mapa para ubicar tu local");
  const [isConfirming, setIsConfirming] = useState(false);

  // Función que se dispara cuando el dueño hace clic en el mapa
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    setDireccionTexto("Cargando dirección...");

    // 🔥 Reverse Geocoding: Transforma las coordenadas en texto de dirección de Google
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        // Obtenemos la dirección limpia y exacta
        setDireccionTexto(results[0].formatted_address);
      } else {
        setDireccionTexto("Dirección no encontrada en Google Maps");
      }
    });
  }, []);

  const handleConfirm = () => {
    if (position && direccionTexto !== "Cargando dirección...") {
      setIsConfirming(true);
      onLocationSelected(direccionTexto, position.lat, position.lng);
    }
  };

  // Pantalla de carga mientras Google Maps descarga sus scripts
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
         <Loader2 className="w-12 h-12 animate-spin text-[#D32F2F]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 shadow-sm z-10">
          <h3 className="font-roboto font-bold text-lg text-black">Ubica tu local en Google Maps</h3>
          <button onClick={onDismiss} className="text-gray-400 hover:text-black hover:bg-gray-100 p-1 rounded-full transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenedor del Mapa */}
        <div className="h-[400px] w-full bg-gray-100 relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={position || center}
            zoom={15}
            onClick={onMapClick}
            options={{
              disableDefaultUI: false, // Muestra los controles de Google
              zoomControl: true,
              streetViewControl: false, // Desactivamos el monito naranja para no saturar
              mapTypeControl: false, // Para que no cambien a vista satelital
              fullscreenControl: false
            }}
          >
            {/* El Pin Rojo de Google Maps */}
            {position && (
              <Marker 
                position={position} 
                animation={window.google.maps.Animation.DROP}
              />
            )}
          </GoogleMap>
        </div>

        {/* Pie del Modal (Resultados y Confirmación) */}
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-inner">
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mb-1">Dirección oficial de Google:</p>
            <p className="text-sm text-black font-medium line-clamp-2">{direccionTexto}</p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!position || direccionTexto === "Cargando dirección..." || isConfirming || direccionTexto === "Haz clic en el mapa para ubicar tu local"}
            className="w-full h-[52px] bg-[#D32F2F] text-white font-roboto font-bold text-lg rounded-full disabled:opacity-50 hover:bg-[#b72424] transition-colors flex justify-center items-center cursor-pointer shadow-md"
          >
            {isConfirming ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirmar Ubicación"}
          </button>
        </div>

      </div>
    </div>
  );
}