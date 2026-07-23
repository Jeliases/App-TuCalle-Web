import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />

      {/* Aquí va el contenido dinámico (Dashboard, Perfil, etc) */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto">
        {children}
      </main>

      <Footer />
    </div>
  );
}