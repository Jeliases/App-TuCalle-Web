import { useNavigate } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../api/firebaseConfig";

export default function Welcome() {
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      const storeDoc = await getDoc(doc(db, "tiendas", user.uid));
      const qualityDoc = await getDoc(doc(db, "qualities", user.uid));

      if (!userDoc.exists() && !storeDoc.exists() && !qualityDoc.exists()) {
        await setDoc(doc(db, "usuarios", user.uid), {
          nombre: user.displayName?.split(' ')[0] || "Usuario",
          apellidos: user.displayName?.split(' ').slice(1).join(' ') || "",
          email: user.email,
          fotoUrl: user.photoURL || "",
          rol: "USUARIO",
          fechaRegistro: Date.now()
        });
      }

      setTimeout(() => { window.location.href = "/"; }, 1000);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-poppins overflow-hidden">
      
      <div className="hidden lg:flex w-1/2 relative bg-black">
        <img 
          src="https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1000&auto=format&fit=crop" 
          alt="Fondo Calle" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        
        <div className="absolute top-8 left-8 font-roboto font-black text-[22px] tracking-wide">
          <span className="text-white">TU</span><span className="text-[#D32F2F]">CALLE</span>
        </div>

        <div className="absolute bottom-16 left-12">
          <h1 className="text-white font-roboto font-black text-[54px] leading-[1.1]">
            Descubre un<br/>
            <span className="text-[#D32F2F] italic">nuevo mundo</span>
          </h1>
          <p className="text-white/80 mt-3 text-sm tracking-wide">más cerca de ti</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm flex flex-col items-center">
          
          <h2 className="font-roboto font-black text-[28px] text-black mb-1">Bienvenido</h2>
          <p className="text-gray-400 text-[13px] mb-10 font-poppins">Inicia sesión para continuar</p>

          <button 
            onClick={() => navigate('/login')}
            className="w-full h-[52px] bg-[#D32F2F] text-white font-bold rounded-full flex items-center justify-center gap-3 hover:bg-[#b72424] transition-colors cursor-pointer shadow-sm"
          >
            <Mail className="w-5 h-5" />
            Continua con email
          </button>

          <div className="w-full flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-[10px] uppercase font-bold">O</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full h-[52px] bg-white border border-gray-200 text-gray-700 font-bold rounded-full flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm disabled:opacity-70"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#D32F2F]" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continua con Google
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-500 text-center mt-10 px-2 leading-relaxed">
            Al iniciar sesión estás de acuerdo con nuestros <a href="#" className="underline font-bold text-gray-700 hover:text-black">Términos y Condiciones</a> y nuestra <a href="#" className="underline font-bold text-gray-700 hover:text-black">Política de Privacidad</a>
          </p>

        </div>
      </div>
    </div>
  );
}