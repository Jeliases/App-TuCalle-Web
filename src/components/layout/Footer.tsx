export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-12 py-12 px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="font-roboto font-bold text-2xl tracking-wide">
            <span className="text-black">Tu</span><span className="text-[#D32F2F]">Calle</span>
          </div>
          <div className="flex gap-4 text-gray-400">
            {/* Íconos sociales genéricos por ahora */}
            <span className="cursor-pointer hover:text-black">FB</span>
            <span className="cursor-pointer hover:text-black">IG</span>
            <span className="cursor-pointer hover:text-black">TW</span>
            <span className="cursor-pointer hover:text-black">TK</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-gray-500 font-medium mb-8">
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:text-[#D32F2F]">Sobre Nosotros</a>
            <a href="#" className="hover:text-[#D32F2F]">Términos y Condiciones</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:text-[#D32F2F]">Registra tu huarique</a>
            <a href="#" className="hover:text-[#D32F2F]">Política de Privacidad</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:text-[#D32F2F]">Centro de Ayuda</a>
            <a href="#" className="hover:text-[#D32F2F]">Libro de Reclamaciones</a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="#" className="hover:text-[#D32F2F]">Trabaja con nosotros</a>
            <a href="#" className="hover:text-[#D32F2F]">Preguntas Frecuentes</a>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-center md:text-left border-t border-gray-100 pt-6">
          © 2026 App Tu Calle. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}