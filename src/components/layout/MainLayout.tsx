import { useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Drawer from "./Drawer";
import Footer from "./Footer"; // Lo crearemos en el siguiente paso

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar onMenuClick={() => setIsDrawerOpen(true)} />
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      
      {/* Aquí va el contenido dinámico (Dashboard, Perfil, etc) */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto">
        {children}
      </main>

      <Footer />
    </div>
  );
}