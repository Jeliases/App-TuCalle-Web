import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QualityEvaluation() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  
  const [tiendasGuardadas, setTiendasGuardadas] = useState<any[]>([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<any | null>(null);
  const [platosTienda, setPlatosTienda] = useState<any[]>([]);
  const [platosSeleccionados, setPlatosSeleccionados] = useState<string[]>([]);
  
  const [confort, setConfort] = useState(4.5);
  const [higiene, setHigiene] = useState(4.0);
  const [atencion, setAtencion] = useState(4.0);
  const [sabrosura, setSabrosura] = useState(2.5);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const promedioChas = (confort + higiene + atencion + sabrosura) / 4.0;

  // Cargar las tiendas que el Quality ha guardado
  useEffect(() => {
    const fetchGuardados = async () => {
      if (!user) return;
      try {
        const qualityDoc = await getDoc(doc(db, "qualities", user.uid));
        const misHuariquesIds = qualityDoc.data()?.misHuariques || [];
        if (misHuariquesIds.length > 0) {
          const q = query(collection(db, "tiendas"), where("uid", "in", misHuariquesIds));
          const snapshot = await getDocs(q);
          setTiendasGuardadas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error("Error cargando huariques guardados:", error);
      }
    };
    fetchGuardados();
  }, [user]);

  // Cargar platos cuando se selecciona una tienda
  useEffect(() => {
    if (!tiendaSeleccionada) return;
    const fetchPlatos = async () => {
      try {
        const q = query(collection(db, "platos"), where("idTienda", "==", tiendaSeleccionada.uid));
        const snapshot = await getDocs(q);
        setPlatosTienda(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setPlatosSeleccionados([]); // Reiniciar selección al cambiar tienda
      } catch (error) {
        console.error("Error cargando platos:", error);
      }
    };
    fetchPlatos();
  }, [tiendaSeleccionada]);

  const togglePlato = (nombrePlato: string) => {
    setPlatosSeleccionados(prev => 
      prev.includes(nombrePlato) ? prev.filter(p => p !== nombrePlato) : [...prev, nombrePlato]
    );
  };

  const handleSubmit = async () => {
    if (!user || !tiendaSeleccionada || !comentario) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(collection(db, "comentarios"));
      await setDoc(docRef, {
        id: docRef.id,
        idTienda: tiendaSeleccionada.uid,
        nombreTienda: tiendaSeleccionada.nombre,
        idUsuario: user.uid,
        nombreUsuario: userData?.nombre || "Quality",
        fotoUsuario: userData?.fotoUrl || "",
        rolUsuario: "QUALITY",
        texto: comentario,
        calificacion: promedioChas,
        platosSugeridos: platosSeleccionados,
        fecha: Date.now(),
        likes: 0,
        likedBy: []
      });
      navigate("/dashboard/quality");
    } catch (error) {
      console.error("Error al publicar:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white min-h-screen pb-20 pt-6 px-6">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="p-2 mr-4 hover:bg-gray-100 rounded-full cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-roboto font-bold text-xl text-black">Nueva Evaluación</h1>
          <span className="font-poppins text-xs text-gray-500">Método CHAS</span>
        </div>
      </div>

      <h2 className="font-roboto font-bold text-sm text-black mb-2">Selecciona el Huarique a evaluar</h2>
      <select 
        value={tiendaSeleccionada?.uid || ""} 
        onChange={(e) => setTiendaSeleccionada(tiendasGuardadas.find(t => t.uid === e.target.value) || null)}
        className="w-full bg-[#F9F9F9] border border-gray-200 focus:border-[#D32F2F] rounded-lg px-4 py-3 text-sm outline-none mb-6"
      >
        <option value="" disabled>Selecciona un huarique guardado</option>
        {tiendasGuardadas.map(t => <option key={t.uid} value={t.uid}>{t.nombre}</option>)}
      </select>

      <h2 className="font-roboto font-bold text-sm text-black mb-2">Platos Sugeridos (Puedes elegir varios)</h2>
      <div className="w-full bg-[#F9F9F9] border border-gray-200 rounded-lg p-4 mb-8 max-h-[150px] overflow-y-auto">
        {platosTienda.length === 0 ? (
          <p className="text-sm text-gray-400">Selecciona una tienda con platos registrados.</p>
        ) : (
          platosTienda.map(plato => (
            <label key={plato.id} className="flex items-center gap-3 mb-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={platosSeleccionados.includes(plato.nombre)} 
                onChange={() => togglePlato(plato.nombre)}
                className="w-4 h-4 accent-[#D32F2F]" 
              />
              <span className="text-sm text-gray-700">{plato.nombre}</span>
            </label>
          ))
        )}
      </div>

      <h2 className="font-roboto font-bold text-base text-black mb-4">Evaluación CHAS (0 a 5 estrellas)</h2>
      <SliderRow label="Confort (Ambiente, asientos)" value={confort} onChange={setConfort} />
      <SliderRow label="Higiene (Limpieza general)" value={higiene} onChange={setHigiene} />
      <SliderRow label="Atención (Rapidez, amabilidad)" value={atencion} onChange={setAtencion} />
      <SliderRow label="Sabrosura (Sabor, presentación)" value={sabrosura} onChange={setSabrosura} />

      <textarea 
        value={comentario} 
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escribe tu reseña detallada..."
        className="w-full h-32 bg-[#F9F9F9] border border-gray-200 focus:border-[#D32F2F] rounded-lg p-4 text-sm outline-none resize-none mt-6 mb-4"
      />

      <div className="w-full bg-[#FFF8F8] rounded-lg p-4 flex justify-between items-center mb-8">
        <span className="font-roboto font-bold text-sm text-black">Calificación promedio CHAS:</span>
        <div className="flex items-center gap-1">
          <Star className="w-6 h-6 text-[#FFC107] fill-[#FFC107]" />
          <span className="font-roboto font-bold text-xl text-[#D32F2F]">{promedioChas.toFixed(1)}</span>
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={isSubmitting || !tiendaSeleccionada || !comentario}
        className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-gray-300 text-white font-roboto font-bold text-base rounded-[28px] flex justify-center items-center cursor-pointer transition-colors"
      >
        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Publicar Recomendación"}
      </button>

    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="w-full flex flex-col mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-poppins text-[13px] text-[#555]">{label}</span>
        <span className="font-roboto font-bold text-[13px] text-[#D32F2F]">{value.toFixed(1)} ★</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max="5" 
        step="0.5" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className="w-full accent-[#D32F2F]" 
      />
    </div>
  );
}