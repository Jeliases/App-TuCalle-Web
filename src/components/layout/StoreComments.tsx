import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, arrayUnion, arrayRemove, doc } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Star, Heart, Send, Loader2 } from "lucide-react";

interface StoreCommentsProps {
  storeId: string;
  storeNombre: string;
}

export default function StoreComments({ storeId, storeNombre }: StoreCommentsProps) {
  const { user, userData, role } = useAuth();
  const navigate = useNavigate();
  
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [comentarioText, setComentarioText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    const qComentarios = query(collection(db, "comentarios"), where("idTienda", "==", storeId));
    const unsubComentarios = onSnapshot(qComentarios, (snapshot) => {
      const coms = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const sorted = coms.sort((a: any, b: any) => {
        const aEsEval = a.esEvaluacion === true || (a.rolUsuario === "QUALITY" && a.platosSugeridos?.length > 0) || (a.rolUsuario === "QUALITY" && a.calificacion != null && a.calificacion !== 5.0);
        const bEsEval = b.esEvaluacion === true || (b.rolUsuario === "QUALITY" && b.platosSugeridos?.length > 0) || (b.rolUsuario === "QUALITY" && b.calificacion != null && b.calificacion !== 5.0);

        if (aEsEval && !bEsEval) return -1;
        if (!aEsEval && bEsEval) return 1;  
        
        return b.fecha - a.fecha;
      });
      
      setComentarios(sorted);
    });

    return () => unsubComentarios();
  }, [storeId]);

  const enviarComentario = async () => {
    if (!comentarioText.trim() || !user?.uid) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, "comentarios"), {
        idTienda: storeId,
        nombreTienda: storeNombre,
        idUsuario: user.uid,
        nombreUsuario: userData?.nombre || "Usuario",
        fotoUsuario: userData?.fotoUrl || "",
        rolUsuario: role || "USUARIO",
        texto: comentarioText,
        fecha: Date.now(),
        likes: 0,
        likedBy: [],
        esEvaluacion: false
      });
      setComentarioText("");
    } catch (error) {
      console.error("Error enviando comentario:", error);
    }
    setIsSending(false);
  };

  const toggleLike = async (idComentario: string, likesActuales: number, likedBy: string[]) => {
    if (!user?.uid) return;
    const ref = doc(db, "comentarios", idComentario);
    const hasLiked = likedBy.includes(user.uid);
    if (hasLiked) {
      await updateDoc(ref, { likedBy: arrayRemove(user.uid), likes: likesActuales - 1 });
    } else {
      await updateDoc(ref, { likedBy: arrayUnion(user.uid), likes: likesActuales + 1 });
    }
  };

  // 🔥 Formateador de tiempo estilo Facebook (ej. "4 h", "2 d")
  const formatearTiempo = (fechaMs: number) => {
    const segundos = Math.floor((Date.now() - fechaMs) / 1000);
    if (segundos < 60) return 'hace un momento';
    const min = Math.floor(segundos / 60);
    if (min < 60) return `${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias} d`;
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(fechaMs));
  };

  const primerNombre = userData?.nombre?.split(' ')[0] || 'Usuario';

  return (
    <div className="px-5 pt-4 pb-6 font-poppins">
      
      {/* BANNER EXCLUSIVO PARA QUALITY */}
      {role === "QUALITY" && (
        <div className="mb-5 bg-red-50 border border-red-100 p-4 rounded-xl text-center shadow-sm">
          <Star className="w-6 h-6 text-[#D32F2F] mx-auto mb-1.5 opacity-80" />
          <p className="text-[12px] text-gray-700 font-medium leading-relaxed">
            Como <span className="font-bold text-[#D32F2F]">Auditor Quality</span>, tus evaluaciones CHAS se fijan arriba.
          </p>
          <button 
            onClick={() => navigate("/dashboard/calificar/nueva")} 
            className="mt-2 px-6 py-2 bg-[#D32F2F] text-white font-bold text-xs rounded-full shadow-md hover:bg-[#b72424] transition-transform active:scale-95 cursor-pointer"
          >
            Realizar Evaluación CHAS
          </button>
        </div>
      )}

      {/* LISTA DE COMENTARIOS TIPO FACEBOOK */}
      <div className="mt-2">
        {comentarios.length === 0 ? (
          <p className="text-[13px] text-gray-500 text-center py-4 bg-[#F0F2F5] rounded-xl">Sé el primero en comentar.</p>
        ) : (
          comentarios.map((comentario, index) => {
            const isLiked = comentario.likedBy?.includes(user?.uid || "");
            const esEvaluacionOficial = comentario.esEvaluacion === true || (comentario.rolUsuario === "QUALITY" && comentario.platosSugeridos?.length > 0) || (comentario.rolUsuario === "QUALITY" && comentario.calificacion != null && comentario.calificacion !== 5.0);

            return (
              <div key={comentario.id} className="flex gap-2.5 mb-4">
                {/* Avatar a la izquierda */}
                <img 
                  src={comentario.fotoUsuario || `https://ui-avatars.com/api/?name=${comentario.nombreUsuario}&background=D32F2F&color=fff`} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5 border border-gray-100" 
                />
                
                <div className="flex flex-col items-start w-full max-w-[88%]">
                  {/* Burbuja del comentario */}
                  <div className={`px-3 py-2 rounded-2xl ${esEvaluacionOficial ? 'bg-orange-50 border border-orange-100' : 'bg-[#F0F2F5]'}`}>
                    <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                      <span className="font-roboto font-bold text-[13px] text-black leading-tight">{comentario.nombreUsuario}</span>
                      
                      {comentario.rolUsuario === "QUALITY" && (
                        <span className="text-[#D32F2F] text-[10px] font-bold leading-tight">🏅 Quality</span>
                      )}
                      
                      {esEvaluacionOficial && index === 0 && (
                        <span className="text-[9px] font-bold text-white bg-[#D32F2F] px-1 py-0.5 rounded uppercase tracking-wider ml-1">Fijado</span>
                      )}
                    </div>
                    
                    <p className={`text-[13.5px] leading-snug ${esEvaluacionOficial ? 'text-gray-900 font-medium' : 'text-gray-800'}`}>
                      {comentario.texto}
                    </p>
                    
                    {esEvaluacionOficial && comentario.platosSugeridos?.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-gray-700">
                        <span className="font-bold text-[#D32F2F]">Sugerencias: </span>
                        {comentario.platosSugeridos.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Acciones inferiores (Me gusta, Responder, Fecha) */}
                  <div className="flex items-center gap-3 mt-1 ml-3 text-[11px] font-bold text-gray-500">
                    <span className="font-normal text-gray-400">{formatearTiempo(comentario.fecha)}</span>
                    
                    <button 
                      onClick={() => toggleLike(comentario.id, comentario.likes || 0, comentario.likedBy || [])} 
                      className={`hover:underline cursor-pointer ${isLiked ? 'text-[#D32F2F]' : ''}`}
                    >
                      Me gusta
                    </button>
                    
                    <button className="hover:underline cursor-pointer">Responder</button>

                    {/* Contador de likes estilo flotante de FB */}
                    {comentario.likes > 0 && (
                      <div className="flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-full px-1.5 py-0.5 ml-1">
                        <Heart className="w-3 h-3 text-[#D32F2F] fill-current" />
                        <span className="text-[10px] text-gray-600 font-medium">{comentario.likes}</span>
                      </div>
                    )}

                    {/* Estrellas si es evaluación */}
                    {esEvaluacionOficial && comentario.calificacion != null && (
                      <div className="flex items-center gap-0.5 ml-1 text-[#FFC107]">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="font-bold text-gray-600">{comentario.calificacion?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🔥 CAJA DE ENTRADA TIPO FACEBOOK 🔥 */}
      <div className="flex items-center gap-2 mt-2 pt-4 border-t border-gray-100">
        <img 
          src={userData?.fotoUrl || `https://ui-avatars.com/api/?name=${userData?.nombre || "U"}&background=D32F2F&color=fff`} 
          alt="Tu avatar" 
          className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100" 
        />
        <div className="relative w-full">
          <input 
            type="text"
            value={comentarioText}
            onChange={(e) => setComentarioText(e.target.value)}
            placeholder={`Comentas como ${primerNombre}...`}
            className="w-full h-[38px] bg-[#F0F2F5] rounded-full pl-4 pr-10 outline-none text-[13.5px] text-gray-800 placeholder-gray-500 transition-colors focus:bg-gray-200"
            onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
          />
          <button 
            onClick={enviarComentario} 
            disabled={isSending || !comentarioText.trim()} 
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer disabled:opacity-40 hover:bg-gray-300 rounded-full transition-colors"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin text-[#D32F2F]" /> : <Send className={`w-4 h-4 ${comentarioText.trim() ? 'text-[#D32F2F]' : 'text-gray-500'}`} />}
          </button>
        </div>
      </div>

    </div>
  );
}