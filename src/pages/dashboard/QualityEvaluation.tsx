import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Star, ArrowLeft, Loader2, Check } from "lucide-react";

export default function QualityEvaluation() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  // Estados que reflejan tu EvaluacionViewModel.kt
  const [tiendasGuardadas, setTiendasGuardadas] = useState<any[]>([]);
  const [platosTienda, setPlatosTienda] = useState<any[]>([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<any>(null);
  const [platosSeleccionados, setPlatosSeleccionados] = useState<string[]>([]);
  
  // Variables del método CHAS
  const [confort, setConfort] = useState(4.5);
  const [higiene, setHigiene] = useState(4.0);
  const [atencion, setAtencion] = useState(4.0);
  const [sabrosura, setSabrosura] = useState(2.5);
  const [reviewText, setReviewText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cálculo en tiempo real
  const promedioChas = (confort + higiene + atencion + sabrosura) / 4.0;

  useEffect(() => {
    const cargarTiendasGuardadas = async () => {
      if (!user) return;
      try {
        // Buscamos el documento del Quality para sacar "misHuariques"
        const qualityDoc = await getDoc(doc(db, "qualities", user.uid));
        const misHuariquesIds = qualityDoc.data()?.misHuariques || [];
        
        if (misHuariquesIds.length > 0) {
          const tiendasData = [];
          for (const id of misHuariquesIds) {
            const tDoc = await getDoc(doc(db, "tiendas", id));
            if (tDoc.exists()) tiendasData.push({ id: tDoc.id, ...tDoc.data() });
          }
          setTiendasGuardadas(tiendasData);
        }
      } catch (error) { console.error("Error al cargar huariques:", error); }
      setIsLoading(false);
    };
    cargarTiendasGuardadas();
  }, [user]);

  const handleSeleccionarTienda = async (idTienda: string) => {
    const tienda = tiendasGuardadas.find(t => t.id === idTienda);
    if (!tienda) return;
    
    setTiendaSeleccionada(tienda);
    setPlatosSeleccionados([]); // Reseteamos platos
    setPlatosTienda([]);
    
    // Traemos los platos de la tienda seleccionada
    const qPlatos = query(collection(db, "platos"), where("idTienda", "==", tienda.id), where("estado", "==", "APROBADO"));
    const snap = await getDocs(qPlatos);
    setPlatosTienda(snap.docs.map(d => d.data().nombre));
  };

  const togglePlato = (platoNombre: string) => {
    if (platosSeleccionados.includes(platoNombre)) {
      setPlatosSeleccionados(prev => prev.filter(p => p !== platoNombre));
    } else {
      setPlatosSeleccionados(prev => [...prev, platoNombre]);
    }
  };

  const publicarEvaluacion = async () => {
    if (!user || !tiendaSeleccionada || !reviewText.trim()) return;
    setIsSubmitting(true);
    try {
      // Guardamos la evaluación en la colección de comentarios igual que en Android
      await addDoc(collection(db, "comentarios"), {
        idTienda: tiendaSeleccionada.id,
        nombreTienda: tiendaSeleccionada.nombre,
        idUsuario: user.uid,
        nombreUsuario: userData?.nombre || "Quality",
        fotoUsuario: userData?.fotoUrl || "",
        rolUsuario: "QUALITY",
        texto: reviewText,
        calificacion: promedioChas,
        fecha: Date.now(),
        likes: 0,
        likedBy: [],
        platosSugeridos: platosSeleccionados // 🔥 Platos recomendados por el Quality
      });
      setIsSubmitting(false);
      navigate('/dashboard/quality');
    } catch (error) {
      console.error("Error al publicar:", error);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-[#D32F2F]" /></div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white min-h-screen pb-24">
      
      {/* Header Fijo */}
      <div className="sticky top-0 bg-white z-10 flex items-center gap-4 px-5 py-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <div>
          <h1 className="font-roboto font-bold text-[20px] text-black leading-tight">Nueva Evaluación</h1>
          <p className="font-poppins text-xs text-gray-500">Método CHAS</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8 animate-fadeIn">
        
        {/* 1. Selector de Tienda */}
        <div>
          <label className="block font-roboto font-bold text-gray-800 text-sm mb-2">Selecciona el Huarique a evaluar</label>
          <select 
            className="w-full h-14 px-4 rounded-xl border border-gray-300 focus:border-[#D32F2F] outline-none font-poppins text-sm bg-white cursor-pointer"
            onChange={(e) => handleSeleccionarTienda(e.target.value)}
            value={tiendaSeleccionada?.id || ""}
          >
            <option value="" disabled>Selecciona un huarique guardado...</option>
            {tiendasGuardadas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          {tiendasGuardadas.length === 0 && (
            <div className="mt-3 p-3 bg-red-50 text-[#D32F2F] text-xs font-poppins rounded-lg">
              No tienes huariques guardados. Busca una tienda, abre sus detalles y dale clic al ícono de guardado (Bookmark).
            </div>
          )}
        </div>

        {/* 2. Selector de Platos */}
        {tiendaSeleccionada && (
          <div>
            <label className="block font-roboto font-bold text-gray-800 text-sm mb-2">Platos Sugeridos (Opcional)</label>
            <div className="flex flex-wrap gap-2">
              {platosTienda.length === 0 ? (
                <p className="text-xs font-poppins text-gray-500">Esta tienda aún no ha subido platos.</p>
              ) : (
                platosTienda.map((plato, idx) => {
                  const isSelected = platosSeleccionados.includes(plato);
                  return (
                    <button 
                      key={idx} 
                      onClick={() => togglePlato(plato)}
                      className={`px-4 py-2.5 rounded-full text-xs font-poppins font-medium border cursor-pointer transition-all flex items-center gap-2
                        ${isSelected ? 'bg-red-50 border-[#D32F2F] text-[#D32F2F]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {plato}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. Sliders del Método CHAS */}
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
          <label className="block font-roboto font-black text-lg text-black mb-6">Evaluación CHAS (0 a 5)</label>
          
          <ChasSlider label="Confort (Ambiente, asientos)" value={confort} setValue={setConfort} />
          <ChasSlider label="Higiene (Limpieza general)" value={higiene} setValue={setHigiene} />
          <ChasSlider label="Atención (Rapidez, amabilidad)" value={atencion} setValue={setAtencion} />
          <ChasSlider label="Sabrosura (Sabor, presentación)" value={sabrosura} setValue={setSabrosura} />

          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center">
            <span className="font-poppins font-bold text-gray-800 text-sm">Calificación Promedio:</span>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              <Star className="w-5 h-5 text-[#FFC107] fill-current" />
              <span className="font-roboto font-black text-xl text-[#D32F2F]">{promedioChas.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 4. Reseña Detallada */}
        <div>
          <label className="block font-roboto font-bold text-gray-800 text-sm mb-2">Tu Reseña Detallada</label>
          <textarea 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full h-36 p-4 rounded-xl border border-gray-300 focus:border-[#D32F2F] outline-none font-poppins text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
            placeholder="Describe tu experiencia gastronómica. ¿Qué destacas? ¿Qué mejorarías?"
          />
        </div>

        {/* 5. Botón Publicar */}
        <button 
          onClick={publicarEvaluacion}
          disabled={!tiendaSeleccionada || !reviewText.trim() || isSubmitting}
          className="w-full h-14 bg-[#D32F2F] text-white font-roboto font-bold text-base rounded-[28px] flex items-center justify-center gap-2 hover:bg-[#b72424] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_14px_rgba(211,47,47,0.3)] mt-4"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Publicar Recomendación"}
        </button>
      </div>
    </div>
  );
}

// Componente para los sliders (Igual a la UI de Jetpack Compose)
function ChasSlider({ label, value, setValue }: { label: string, value: number, setValue: (val: number) => void }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-poppins text-gray-600 font-medium">{label}</span>
        <span className="font-roboto font-bold text-[#D32F2F] text-sm">{value.toFixed(1)} ★</span>
      </div>
      <input 
        type="range" 
        min="0" max="5" step="0.5" 
        value={value} 
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#D32F2F]"
      />
    </div>
  );
}