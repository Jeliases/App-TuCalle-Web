import { useState } from "react";
import { Menu, MapPin, Search, ChevronDown, LogOut, User, Bell, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../api/firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getNavItems } from "./navConfig";
import { useUserLocation } from "../../hooks/useUserLocation";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { address, error } = useUserLocation();
  const { userData, role } = useAuth();
  const navigate = useNavigate();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => signOut(auth);
  const navItems = getNavItems(role);
  const initial = userData?.nombre ? userData.nombre.charAt(0).toUpperCase() : "U";
  const firstName = userData?.nombre ? userData.nombre.split(" ")[0] : "Usuario";

  return (
    <>
      {/* ── MENÚ LATERAL DESPLEGABLE (DRAWER) ── */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsMenuOpen(false)}
      />
      
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="font-roboto font-bold text-xl cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate('/'); }}>
            Tu<span className="text-[#D32F2F]">Calle</span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        <div className="flex flex-col py-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button 
              key={item.text}
              onClick={() => { setIsMenuOpen(false); navigate(item.path); }} 
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 text-left cursor-pointer transition-colors"
            >
              <div className="text-gray-500">{item.icon}</div>
              <span className="font-poppins font-medium text-gray-700">{item.text}</span>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-[#D32F2F] rounded-xl hover:bg-red-100 transition-colors font-poppins font-medium cursor-pointer">
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── NAVBAR PRINCIPAL SUPERIOR ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="h-16 flex items-center justify-between px-3 sm:px-8">
          
          <div className="flex items-center gap-1 sm:gap-4">
            <button 
              onClick={() => {
                setIsMenuOpen(true);
                onMenuClick?.();
              }} 
              className="p-1 hover:bg-gray-100 rounded-md cursor-pointer text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Solo se muestra en pantallas medianas o más grandes */}
            <div className="font-roboto font-bold text-xl tracking-wide cursor-pointer hidden sm:block" onClick={() => navigate('/')}>
              <span className="text-black">Tu</span><span className="text-[#D32F2F]">Calle</span>
            </div>
            
            {/* 🔥 UBICACIÓN VISIBLE EN CELULARES 🔥 */}
            <div className="flex items-center gap-1 text-[#D32F2F] ml-1 sm:ml-4 cursor-pointer hover:bg-red-50 px-1.5 py-1 rounded-md transition-colors">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-medium font-poppins truncate max-w-[130px] sm:max-w-[280px]">
                {error ? error : (address || "Ubicando...")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-4 hidden lg:block">
            <div className="relative flex items-center w-full h-10 rounded-full bg-[#F5F5F5] border border-transparent focus-within:border-[#D32F2F] overflow-hidden transition-colors">
              <div className="pl-4 pr-2 text-[#D32F2F]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Comida, huariques, tiendas, productos..."
                className="w-full h-full bg-transparent outline-none text-sm font-poppins text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative">
            <button className="relative p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D32F2F] rounded-full border border-white"></span>
            </button>

            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-full cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#A34CB3] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {initial}
              </div>
              <span className="text-sm font-medium font-poppins text-gray-700 hidden sm:block">Hola, {firstName}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-12 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate(navItems.find(i => i.text === "Perfil")?.path || "/dashboard/perfil"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    Mi perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#D32F2F] hover:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}