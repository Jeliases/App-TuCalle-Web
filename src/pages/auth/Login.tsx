import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../api/firebaseConfig";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";

// 🔥 Importamos tu nuevo archivo
import ForgotPassword from "./ForgotPassword";

export default function Login() {
  const navigate = useNavigate();
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      setTimeout(() => { window.location.href = "/"; }, 1000);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta más tarde.");
      } else {
        setError("Ocurrió un error al iniciar sesión. Verifica tu conexión.");
      }
      setIsLoading(false); 
    }
  };

  // 🔥 LÓGICA DE GMAIL IDÉNTICA A LA DEL WELCOME 🔥
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
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
    } catch (err: any) {
      console.error("Error en Google Login:", err);
      setError("Error al iniciar sesión con Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full animate-fadeIn relative mt-8 lg:mt-0 max-w-[400px] mx-auto lg:mx-0 font-poppins">
      
      {/* Si la vista es 'forgot', renderizamos el componente externo */}
      {view === 'forgot' ? (
        <ForgotPassword setView={setView} />
      ) : (
        // Si la vista es 'login', renderizamos el formulario normal
        <>
          <button 
            onClick={() => navigate('/welcome')}
            className="absolute -top-12 -left-2 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer z-10"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>

          <h1 className="font-roboto font-black text-[28px] text-black mb-1 text-center lg:text-left tracking-tight leading-tight">
            Inicia sesión
          </h1>
          <p className="font-poppins text-gray-500 mb-9 text-[14px] text-center lg:text-left font-normal">
            Accede a tu cuenta y disfruta de TuCalle
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="text-[13px] font-poppins text-gray-700 mb-1.5 font-medium">Correo electrónico</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#D32F2F] bg-gray-50 focus:bg-white outline-none transition-colors font-poppins text-sm"
                disabled={isLoading} required
              />
            </div>

            <div className="flex flex-col relative">
              <label className="text-[13px] font-poppins text-gray-700 mb-1.5 font-medium">Contraseña</label>
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#D32F2F] bg-gray-50 focus:bg-white outline-none transition-colors font-poppins text-sm"
                disabled={isLoading} required
              />
              <button 
                type="button" 
                onClick={() => setView('forgot')}
                className="text-gray-500 hover:text-[#D32F2F] text-[12px] font-poppins underline self-start mt-3 cursor-pointer transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-500 text-[13px] font-poppins p-3 rounded-lg border border-red-100 mt-1">{error}</div>}

            <button type="submit" disabled={isLoading} className="w-full bg-[#D32F2F] text-white font-bold font-roboto py-3.5 rounded-full mt-4 hover:bg-[#b72424] transition-colors flex justify-center items-center h-[54px] cursor-pointer shadow-sm">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Ingresar"}
            </button>

            {/* 🔥 BOTÓN DE GMAIL INTEGRADO 🔥 */}
            <div className="relative flex items-center justify-center my-1">
               <span className="w-full h-[1px] bg-gray-200"></span>
               <span className="absolute bg-white px-3 text-xs text-gray-400 font-poppins font-bold">O</span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={isLoading} 
              className="w-full bg-white border border-gray-200 text-gray-700 font-bold font-roboto py-3.5 rounded-full hover:bg-gray-50 transition-colors flex justify-center items-center h-[54px] cursor-pointer gap-3 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Continuar con Google
            </button>
          </form>

          <div className="mt-8 text-center text-[13px] font-poppins text-gray-600">
            ¿No tienes cuenta? <Link to="/register-role" className="text-[#D32F2F] font-bold hover:underline">Regístrate aquí</Link>
          </div>
        </>
      )}
    </div>
  );
}