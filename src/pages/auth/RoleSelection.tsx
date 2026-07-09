import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full text-center">
      {/* Botón Atrás */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 w-fit cursor-pointer text-black hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Título */}
      <h2 className="font-roboto text-3xl font-bold text-black mb-10">
        Queremos <br /> conocerte 👇
      </h2>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/register/user')}
          className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[16px] font-semibold rounded-full transition-colors cursor-pointer"
        >
          Soy Usuario
        </button>

        <button
          onClick={() => navigate('/register/store')}
          className="w-full h-[55px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[16px] font-semibold rounded-full transition-colors cursor-pointer"
        >
          Soy Tienda
        </button>
      </div>

      <button className="mt-8 text-[11px] text-gray-500 underline hover:text-[#D32F2F] cursor-pointer">
        Soy socio administrativo
      </button>

      {/* Footer Términos */}
      <p className="text-[10px] text-center text-gray-500 mt-12 leading-tight px-4">
        Al iniciar sesión estás de acuerdo con nuestros <a href="#" className="text-black underline">Términos y Condiciones</a> y nuestra <a href="#" className="text-black underline">Política de Privacidad</a>
      </p>
    </div>
  );
}