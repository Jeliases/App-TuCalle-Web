import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getNavItems } from "./navConfig";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = getNavItems(role);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden" onClick={onClose}></div>}
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="font-roboto font-bold text-xl tracking-wide">
            <span className="text-black">Tu</span><span className="text-[#D32F2F]">Calle</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md cursor-pointer text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onClose(); }}
                className={`w-full flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${isActive ? 'text-[#D32F2F] bg-red-50/50 border-r-4 border-[#D32F2F]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={isActive ? 'text-[#D32F2F]' : 'text-gray-400'}>{item.icon}</span>
                <span className="text-[15px] font-poppins font-medium">{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}