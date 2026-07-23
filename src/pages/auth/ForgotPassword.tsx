import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../api/firebaseConfig";
import { Loader2, ArrowLeft } from "lucide-react";

interface ForgotPasswordProps {
  setView: (view: 'login' | 'forgot') => void;
}

export default function ForgotPassword({ setView }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico.");
      return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("¡Enlace enviado! Revisa tu bandeja de entrada o spam 📧");
      setTimeout(() => {
        setView('login');
      }, 4000);
    } catch (err: any) {
      console.error("Error en reset:", err);
      setError("No encontramos una cuenta registrada con ese correo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn flex flex-col w-full relative">
      <button 
        onClick={() => setView('login')}
        className="absolute -top-12 -left-2 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer z-10"
        aria-label="Volver"
      >
        <ArrowLeft className="w-6 h-6 text-black" />
      </button>

      <h1 className="font-roboto font-black text-[26px] text-black mb-6 text-left tracking-tight leading-tight">
        Recuperar contraseña
      </h1>
      
      <p className="font-poppins text-[#666] mb-6 text-[14px] text-left leading-relaxed">
        Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace seguro para restablecer tu contraseña.
      </p>

      <form onSubmit={handleReset} className="flex flex-col gap-5">
        <div className="flex flex-col">
          <label className="text-[13px] font-poppins text-gray-700 mb-1.5 font-medium flex items-center">
            Email<span className="text-[#D32F2F] ml-0.5 font-bold">*</span>
          </label>
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#D32F2F] bg-gray-50 focus:bg-white outline-none transition-colors font-poppins text-sm"
            disabled={isLoading} required
          />
        </div>

        {error && <div className="bg-red-50 text-red-500 text-[13px] font-poppins p-3 rounded-lg border border-red-100">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 text-[13px] font-poppins p-3 rounded-lg border border-green-200">{success}</div>}

        <button type="submit" disabled={isLoading} className="w-full bg-[#D32F2F] text-white font-bold font-roboto py-3.5 rounded-full mt-4 hover:bg-[#b72424] transition-colors flex justify-center items-center h-[54px] cursor-pointer shadow-sm">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enviar enlace"}
        </button>
      </form>
    </div>
  );
}