import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MapPin, Camera } from "lucide-react"; // <-- Camera añadido
import { useNavigate } from "react-router-dom";
import { registerStoreSchema } from "../../utils/validations";
import { registerStoreUser } from "../../api/auth";
import { uploadImage } from "../../api/storage"; // <-- Nuevo import
import MapSelector from "../../components/ui/MapSelector";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const HORAS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTOS = ["00", "15", "30", "45"];

export default function RegisterStore() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [coordenadas, setCoordenadas] = useState({ lat: 0, lng: 0 });

  // Estados para las imágenes (Archivo real para subir y URL local para previsualizar)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerStoreSchema),
    defaultValues: {
      nombreLocal: "", email: "", password: "", celular: "", direccionTexto: "",
      horaApertura: "08", minutoApertura: "00", periodoApertura: "AM" as const,
      horaCierre: "10", minutoCierre: "00", periodoCierre: "PM" as const,
    },
  });

  const toggleDia = (dia: string) => {
    setDiasSeleccionados(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
  };

  // Función para capturar la imagen seleccionada y generar la vista previa
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "portada") => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(previewUrl);
      } else {
        setPortadaFile(file);
        setPortadaPreview(previewUrl);
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (diasSeleccionados.length === 0) {
      setStatusMessage({ text: "Por favor, selecciona al menos un día de atención*", type: "error" }); return;
    }
    if (coordenadas.lat === 0 || coordenadas.lng === 0) {
      setStatusMessage({ text: "Por favor, selecciona la ubicación de tu local en el mapa*", type: "error" }); return;
    }
    
    setStatusMessage({ text: "Subiendo fotos y registrando tienda, espera un momento...", type: "success" });
    
    try {
      // 1. Subir imágenes primero (Exactamente como tu coroutine en Kotlin)
      const logoUrl = await uploadImage(logoFile, "tiendas/logos");
      const portadaUrl = await uploadImage(portadaFile, "tiendas/portadas");

      // 2. Armar paquete de datos
      const storePayload = { ...data, latitud: coordenadas.lat, longitud: coordenadas.lng };
      
      // 3. Registrar usuario con las URLs finales
      await registerStoreUser(storePayload, diasSeleccionados, logoUrl, portadaUrl);
      
      setStatusMessage({ text: "¡Tienda registrada con éxito!", type: "success" });
      window.location.reload();
    } catch (error: any) {
      setStatusMessage({ text: error.message, type: "error" });
    }
  };

  return (
    <div className="flex flex-col w-full py-4">
      <button onClick={() => navigate(-1)} className="mb-4 w-fit cursor-pointer text-black hover:text-gray-600 transition-colors">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <h2 className="font-roboto text-3xl font-bold text-black mb-6">Regístrate</h2>

      {statusMessage && (
        <p className={`text-sm py-2 mb-4 text-center ${statusMessage.type === "success" ? "text-[#4CAF50]" : "text-red-500"}`}>
          {statusMessage.text}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        
        {/* ================= INICIO BLOQUE DE IMÁGENES ================= */}
        <div className="w-full h-[220px] relative mb-4">
          {/* Portada (Altura 160px) */}
          <label className="block w-full h-[160px] bg-[#F5F5F5] rounded-2xl overflow-hidden cursor-pointer group shadow-sm transition-all hover:bg-gray-200 relative">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "portada")} />
            {portadaPreview ? (
              <img src={portadaPreview} alt="Portada" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                <Camera className="w-10 h-10 mb-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-medium">Añadir Portada</span>
              </div>
            )}
          </label>

          {/* Logo (Altura 110px, Circular, Centrado abajo) */}
          <label className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110px] h-[110px] bg-[#EEEEEE] rounded-full border-4 border-white overflow-hidden cursor-pointer flex items-center justify-center group shadow-md z-10 hover:bg-gray-200 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, "logo")} />
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-6 h-6 mb-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-medium">Logo</span>
              </div>
            )}
          </label>
        </div>
        {/* ================= FIN BLOQUE DE IMÁGENES ================= */}

        {/* ... AQUÍ VA EL RESTO DEL FORMULARIO EXACTAMENTE IGUAL ... */}
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-black">Nombre del local<span className="text-[#D32F2F]">*</span></label>
          <input {...register("nombreLocal")} className="w-full bg-[#F5F5F5] border border-transparent focus:border-[#D32F2F] rounded-md px-4 py-2.5 text-sm text-black outline-none transition-colors" />
          {errors.nombreLocal && <span className="text-[10px] text-red-500">{String(errors.nombreLocal.message)}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-black">Email<span className="text-[#D32F2F]">*</span></label>
          <input type="email" {...register("email")} className="w-full bg-[#F5F5F5] border border-transparent focus:border-[#D32F2F] rounded-md px-4 py-2.5 text-sm text-black outline-none transition-colors" />
          {errors.email && <span className="text-[10px] text-red-500">{String(errors.email.message)}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-black">Contraseña<span className="text-[#D32F2F]">*</span></label>
          <input type="password" {...register("password")} className="w-full bg-[#F5F5F5] border border-transparent focus:border-[#D32F2F] rounded-md px-4 py-2.5 text-sm text-black outline-none transition-colors" />
          {errors.password && <span className="text-[10px] text-red-500">{String(errors.password.message)}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-black">Número de contacto<span className="text-[#D32F2F]">*</span></label>
          <input {...register("celular")} className="w-full bg-[#F5F5F5] border border-transparent focus:border-[#D32F2F] rounded-md px-4 py-2.5 text-sm text-black outline-none transition-colors" />
          {errors.celular && <span className="text-[10px] text-red-500">{String(errors.celular.message)}</span>}
        </div>

        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-medium text-black">Dirección<span className="text-[#D32F2F]">*</span></label>
          <div className="relative flex items-center" onClick={() => setShowMap(true)}>
            <input readOnly placeholder="Escribe o usa el mapa 👇" {...register("direccionTexto")} className="w-full bg-[#F5F5F5] border border-transparent hover:border-[#D32F2F] rounded-md pl-4 pr-10 py-2.5 text-sm text-black outline-none transition-colors cursor-pointer text-left" />
            <MapPin className="absolute right-3 w-4 h-4 text-[#D32F2F] cursor-pointer" />
          </div>
          {errors.direccionTexto && <span className="text-[10px] text-red-500">{String(errors.direccionTexto.message)}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-black">Horario de atención<span className="text-[#D32F2F]">*</span></label>
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md p-1.5 items-center gap-1 text-xs">
              <span className="text-gray-400 px-1">Apertura</span>
              <select {...register("horaApertura")} className="bg-transparent outline-none text-black font-medium">{HORAS.map(h => <option key={h} value={h}>{h}</option>)}</select>:
              <select {...register("minutoApertura")} className="bg-transparent outline-none text-black font-medium">{MINUTOS.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <select {...register("periodoApertura")} className="bg-transparent outline-none text-[#D32F2F] font-bold"><option value="AM">AM</option><option value="PM">PM</option></select>
            </div>
            <span className="text-gray-400 text-xs">a</span>
            <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-md p-1.5 items-center gap-1 text-xs">
              <span className="text-gray-400 px-1">Cierre</span>
              <select {...register("horaCierre")} className="bg-transparent outline-none text-black font-medium">{HORAS.map(h => <option key={h} value={h}>{h}</option>)}</select>:
              <select {...register("minutoCierre")} className="bg-transparent outline-none text-black font-medium">{MINUTOS.map(m => <option key={m} value={m}>{m}</option>)}</select>
              <select {...register("periodoCierre")} className="bg-transparent outline-none text-[#D32F2F] font-bold"><option value="AM">AM</option><option value="PM">PM</option></select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black">Días de atención<span className="text-[#D32F2F]">*</span></label>
          <div className="flex gap-2 justify-between">
            {DIAS_SEMANA.map(dia => {
              const isSelected = diasSeleccionados.includes(dia);
              return (
                <button type="button" key={dia} onClick={() => toggleDia(dia)} className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${isSelected ? "bg-[#D32F2F] border-[#D32F2F] text-white" : "bg-white border-gray-300 text-gray-400 hover:bg-gray-50"}`}>
                  {dia}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-gray-400 italic">Podrás editar tu horario y días de atención más adelante desde tu perfil.</span>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full mt-4 h-12 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[15px] font-semibold rounded-full flex justify-center items-center disabled:opacity-50 transition-colors cursor-pointer">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "REGISTRARSE"}
        </button>
        
        {showMap && (
          <MapSelector
            onDismiss={() => setShowMap(false)}
            onLocationSelected={(direccion, lat, lng) => {
              setValue("direccionTexto", direccion, { shouldValidate: true });
              setCoordenadas({ lat, lng });
              setShowMap(false);
            }}
          />
        )}
      </form>
    </div>
  );
}