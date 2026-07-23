import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../api/firebaseConfig";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error", msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ type: "error", msg: "Las contraseñas no coinciden." });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: "error", msg: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      if (!oobCode) throw new Error("Código inválido");
      // 🔥 Esta es la función de Firebase que hace la magia
      await confirmPasswordReset(auth, oobCode, password);
      
      setStatus({ type: "success", msg: "¡Tu contraseña ha sido actualizada con éxito!" });
      setTimeout(() => navigate("/welcome"), 3000);
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", msg: "El enlace es inválido o ha expirado. Solicita uno nuevo." });
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins px-5">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md">
          <XCircle className="w-12 h-12 text-[#D32F2F] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h2>
          <p className="text-sm text-gray-500 mb-6">Falta el código de seguridad. Por favor, vuelve a solicitar el cambio de contraseña desde la aplicación.</p>
          <button onClick={() => navigate("/welcome")} className="w-full bg-black text-white rounded-full py-3 font-medium hover:bg-gray-800 transition-colors">Volver al inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins px-5">
      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 w-full max-w-md">
        
        <button onClick={() => navigate("/welcome")} className="p-2 -ml-2 mb-4 hover:bg-gray-50 rounded-full transition-colors cursor-pointer inline-block">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>

        <h1 className="font-roboto font-black text-2xl text-gray-900 mb-2">Crear nueva contraseña</h1>
        <p className="text-sm text-gray-500 mb-8">Ingresa tu nueva contraseña a continuación. Asegúrate de que sea segura.</p>

        {status && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-[#D32F2F]'}`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <span className="text-sm font-medium">{status.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type={showPwd ? "text" : "password"} 
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-[#F9F9F9] border border-transparent focus:bg-white focus:border-[#D32F2F] rounded-xl pl-12 pr-12 outline-none text-sm transition-colors"
              required
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type={showPwd ? "text" : "password"} 
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-14 bg-[#F9F9F9] border border-transparent focus:bg-white focus:border-[#D32F2F] rounded-xl pl-12 pr-12 outline-none text-sm transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading || status?.type === 'success'}
            className="w-full h-14 bg-[#D32F2F] text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2 hover:bg-[#b72424] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}