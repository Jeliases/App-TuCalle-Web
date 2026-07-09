import { useState} from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { X, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Arreglo nativo para el ícono de Leaflet en React
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapSelectorProps {
  onLocationSelected: (direccion: string, lat: number, lng: number) => void;
  onDismiss: () => void;
}

// Componente interno para manejar los clics en el mapa
function LocationMarker({ position, setPosition, setDireccion }: any) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);
      setDireccion("Cargando dirección...");

      // Convertir coordenadas a texto usando Nominatim (Gratis y sin API Key)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        setDireccion(data.display_name || "Dirección no encontrada");
      } catch (error) {
        setDireccion("Error al obtener la dirección");
      }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function MapSelector({ onLocationSelected, onDismiss }: MapSelectorProps) {
  // Coordenadas iniciales (Centro de Lima por defecto)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>({ lat: -12.046374, lng: -77.042793 });
  const [direccionTexto, setDireccionTexto] = useState("Haz clic en el mapa para ubicar tu local");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    if (position && direccionTexto !== "Cargando dirección...") {
      setIsConfirming(true);
      onLocationSelected(direccionTexto, position.lat, position.lng);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-roboto font-bold text-lg text-black">Ubica tu local</h3>
          <button onClick={onDismiss} className="text-gray-500 hover:text-black transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenedor del Mapa */}
        <div className="h-[400px] w-full bg-gray-100 relative">
          <MapContainer center={[-12.046374, -77.042793]} zoom={13} className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} setDireccion={setDireccionTexto} />
          </MapContainer>
        </div>

        {/* Pie del Modal (Resultados y Confirmación) */}
        <div className="p-4 flex flex-col gap-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-semibold mb-1">Dirección seleccionada:</p>
            <p className="text-sm text-black line-clamp-2">{direccionTexto}</p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!position || direccionTexto === "Cargando dirección..." || isConfirming}
            className="w-full h-12 bg-[#D32F2F] text-white font-bold rounded-full disabled:opacity-50 transition-colors flex justify-center items-center cursor-pointer"
          >
            {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Ubicación"}
          </button>
        </div>

      </div>
    </div>
  );
}