import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../api/firebaseConfig";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

// === LOGIN TRADICIONAL (CORREO Y CONTRASEÑA) ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Auth valida las credenciales.
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      
      // 2. LA SOLUCIÓN: Forzamos la recarga hacia la raíz ("/").
      // Al hacer esto, el ProtectedRoute de tu AppRouter despertará,
      // leerá que eres QUALITY (o Tienda/Usuario) y te mandará a tu dashboard correspondiente.
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      
    } catch (err: any) {
      console.error("Error en login:", err);
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

  return (
    <div className="flex flex-col w-full animate-fadeIn">
      <h2 className="font-roboto font-black text-3xl text-black mb-2 text-center lg:text-left">
        Inicia sesión
      </h2>
      <p className="font-poppins text-gray-500 mb-8 text-sm text-center lg:text-left">
        Accede a tu cuenta y disfruta de TuCalle
      </p>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-poppins text-gray-700 mb-1">Correo electrónico</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#D32F2F] outline-none transition-colors"
            disabled={isLoading}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-poppins text-gray-700 mb-1">Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#D32F2F] outline-none transition-colors"
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm font-poppins p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-[#D32F2F] text-white font-bold py-3 rounded-lg mt-2 hover:bg-[#b72424] transition-colors flex justify-center items-center h-[52px]"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entrar"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm font-poppins text-gray-600">
        ¿No tienes cuenta?{" "}
        <Link to="/register-role" className="text-[#D32F2F] font-bold hover:underline">
          Regístrate aquí
        </Link>
      </div>
    </div>
  );
}