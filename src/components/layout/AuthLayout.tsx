import { type ReactNode } from "react";
import fondoLogin from "../../assets/fondoLogin.webp";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Mitad Izquierda - Imagen de Fondo (Visible solo en pantallas grandes) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black">
        <img
          src={fondoLogin}
          alt="Calle pintoresca"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Logo TUCALLE (Arriba a la izquierda) */}
        <div className="absolute top-8 left-8 font-roboto font-bold text-xl tracking-wide">
          <span className="text-white">TU</span><span className="text-[#D32F2F]">CALLE</span>
        </div>

        {/* Textos de abajo a la izquierda */}
        <div className="absolute bottom-16 left-12">
          <h1 className="font-roboto font-black text-5xl text-white leading-tight">
            Descubre un <br />
            <span className="text-[#D32F2F] italic">nuevo mundo</span>
          </h1>
          <p className="text-gray-300 font-poppins text-lg mt-2 font-light">
            más cerca de ti
          </p>
        </div>
      </div>

      {/* Mitad Derecha - Formularios Dinámicos */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 xl:px-24 relative overflow-y-auto max-h-screen py-10">
        <div className="w-full max-w-md">
           {children}
        </div>
      </div>
    </div>
  );
}