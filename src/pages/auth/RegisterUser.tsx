import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../api/firebaseConfig";
import { registerUserSchema } from "../../utils/validations";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterUser() {
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();

  // 🔥 Asegura que la pantalla empiece arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      celular: "",
      aceptoTerminos: false,
      aceptoPromociones: false,
    },
  });

  const aceptoTerminos = watch("aceptoTerminos");

  const onSubmit = async (data: any) => {
    setStatusMessage(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password.trim());
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre: data.nombre,
        apellidos: "", 
        email: data.email.trim(),
        celular: data.celular,
        fotoUrl: "",
        rol: "USUARIO",
        antiguedad: Date.now(),
        totalHuariques: 0,
        totalResenas: 0,
        logros: []
      });

      setStatusMessage({ text: "¡Usuario registrado con éxito! Entrando...", type: "success" });
      
      setTimeout(() => {
        window.location.href = "/dashboard/usuario";
      }, 1000);

    } catch (error: any) {
      console.error("Error en registro:", error);
      if (error.code === "auth/email-already-in-use") {
        setStatusMessage({ text: "Error: Este correo ya está registrado.", type: "error" });
      } else {
        setStatusMessage({ text: "Error: No se pudo crear la cuenta.", type: "error" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white px-8 py-6 flex flex-col max-w-md mx-auto animate-fadeIn">
      {/* Botón Atrás */}
      <button onClick={() => navigate(-1)} className="mt-2 mb-6 w-fit cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors">
        <ArrowLeft className="w-8 h-8 text-black" />
      </button>

      <h1 className="font-roboto text-[32px] font-bold text-black mb-4">
        Regístrate
      </h1>

      {statusMessage && (
        <p className={`text-sm py-2 px-3 rounded-md border ${statusMessage.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-500 border-red-200"}`}>
          {statusMessage.text}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-4">
        
        <div className="flex flex-col">
          <input {...register("nombre")} placeholder="Nombre completo*" className="w-full border-b border-gray-300 py-3 focus:outline-none focus:border-[#D32F2F] text-black transition-colors bg-transparent" />
          {errors.nombre && <span className="text-xs text-red-500 mt-1">{errors.nombre.message as string}</span>}
        </div>

        <div className="flex flex-col">
          <input {...register("email")} type="email" placeholder="Email*" className="w-full border-b border-gray-300 py-3 focus:outline-none focus:border-[#D32F2F] text-black transition-colors bg-transparent" />
          {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message as string}</span>}
        </div>

        <div className="flex flex-col">
          <input {...register("password")} type="password" placeholder="Contraseña*" className="w-full border-b border-gray-300 py-3 focus:outline-none focus:border-[#D32F2F] text-black transition-colors bg-transparent" />
          {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message as string}</span>}
        </div>

        <div className="flex flex-col">
          <input {...register("celular")} placeholder="Número de contacto*" className="w-full border-b border-gray-300 py-3 focus:outline-none focus:border-[#D32F2F] text-black transition-colors bg-transparent" />
          {errors.celular && <span className="text-xs text-red-500 mt-1">{errors.celular.message as string}</span>}
        </div>

        <div className="h-2"></div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("aceptoTerminos")} className="w-4 h-4 accent-[#D32F2F]" />
          <span className="text-[13px] text-black">Acepto los términos y condiciones</span>
        </label>
        {errors.aceptoTerminos && <span className="text-xs text-red-500 -mt-3">{errors.aceptoTerminos.message as string}</span>}

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("aceptoPromociones")} className="w-4 h-4 accent-[#D32F2F]" />
          <span className="text-[13px] text-black">Acepto recibir promociones a mi correo</span>
        </label>

        <div className="h-4"></div>

        <button
          type="submit"
          disabled={!aceptoTerminos || isSubmitting}
          className="w-full h-[55px] bg-[#D32F2F] text-white text-[20px] font-bold rounded-[30px] flex justify-center items-center disabled:opacity-50 transition-opacity cursor-pointer hover:bg-[#b72424]"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "Registrarse"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm font-poppins text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-[#D32F2F] font-bold hover:underline">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}