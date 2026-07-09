import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import type { UserRole } from "../types/models";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-[#D32F2F]" />
      </div>
    );
  }

    if (!user) {
        console.log("🛡️ GUARDIA: No hay usuario. Mandando al Welcome.");
        return <Navigate to="/welcome" replace />; 
      }

  // SI EL ROL ES NULL, FRENAMOS EN SECO PARA EVITAR EL BUCLE
  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error de Perfil</h1>
        <p className="text-gray-600 mb-4">Tu cuenta (UID: {user.uid}) inició sesión, pero no encontramos tu documento en la base de datos.</p>
        <button onClick={() => window.location.href = "/login"} className="bg-[#D32F2F] text-white px-6 py-2 rounded-full font-bold">
          Volver al Login
        </button>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.log(`⛔ BLOQUEADO: Tienes rol ${role}, pero esta ruta pide ${allowedRoles}. Redirigiendo a tu zona...`);
    if (role === "TIENDA") return <Navigate to="/dashboard/tienda" replace />;
    if (role === "QUALITY") return <Navigate to="/dashboard/quality" replace />;
    return <Navigate to="/dashboard/usuario" replace />;
  }

  console.log(`✅ PERMITIDO: Entrando a ruta con rol ${role}`);
  return <Outlet />;
}