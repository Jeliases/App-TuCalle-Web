import { useState, useEffect } from "react";

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null); // null significa que aún estamos consultando
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalización no soportada");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
             setError("API Key no configurada");
             return;
          }

          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=es`
          );
          const data = await res.json();

          if (data.status === "OK" && data.results.length > 0) {
            const components = data.results[0].address_components;
            
            // Extracción precisa de componentes
            const route = components.find((c: any) => c.types.includes("route"))?.long_name || "";
            const streetNumber = components.find((c: any) => c.types.includes("street_number"))?.long_name || "";
            const district = components.find((c: any) => 
              c.types.includes("locality") || 
              c.types.includes("sublocality") || 
              c.types.includes("administrative_area_level_3")
            )?.long_name || "";

            // Formateo de dirección: "Calle Número, Distrito"
            if (route || district) {
              const fullAddress = [route, streetNumber].filter(Boolean).join(" ");
              setAddress(district ? `${fullAddress}, ${district}` : fullAddress);
            } else {
              setAddress("Dirección no encontrada");
            }
          } else {
            setError(`Error de Google: ${data.status}`);
          }
        } catch (e) {
          setError("Error al conectar con el servidor de mapas");
        }
      },
      // 🔥 CORRECCIÓN AQUÍ: Quitamos 'geoError' y dejamos los paréntesis vacíos
      () => {
        setError("Permiso de ubicación denegado");
      }
    );
  }, []);

  return { location, address, error };
}