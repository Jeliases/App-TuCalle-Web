import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react"; 

// Layouts
import AuthLayout from "../components/layout/AuthLayout";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

// Auth
import Login from "../pages/auth/Login";
import RoleSelection from "../pages/auth/RoleSelection";
import RegisterUser from "../pages/auth/RegisterUser";
import RegisterStore from "../pages/auth/RegisterStore";
import Welcome from "../pages/auth/Welcome";

// Dashboards y Perfiles
import UserDashboard from "../pages/dashboard/UserDashboard";
import StoreDashboard from "../pages/dashboard/StoreDashboard";
import QualityDashboard from "../pages/dashboard/QualityDashboard";
import UserProfile from "../pages/dashboard/UserProfile";
import StoreProfile from "../pages/dashboard/StoreProfile";
import QualityProfile from "../pages/dashboard/QualityProfile";
import QualityEvaluation from "../pages/dashboard/QualityEvaluation";
import StoreDetail from "../pages/dashboard/StoreDetail";

function RootDispatcher() {
  //  AÑADIDO: Sacamos 'loading' del contexto de autenticación
  const { user, role, loading } = useAuth();

  //  SOLUCIÓN: Si Firebase está "pensando", frenamos la pantalla y esperamos.
  // Esto evita que te patee a /welcome por error.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-[#D32F2F]" />
      </div>
    );
  }

  // 1. Si NO hay usuario, lo mandamos a la portada bonita (Welcome)
  if (!user) return <Navigate to="/welcome" replace />;

  // 2. Si SÍ hay usuario, lo lanzamos a su panel según su rol
  if (role === "USUARIO") return <Navigate to="/dashboard/usuario" replace />;
  if (role === "TIENDA") return <Navigate to="/dashboard/tienda" replace />;
  if (role === "QUALITY") return <Navigate to="/dashboard/quality" replace />;

  // Por si acaso el rol está vacío
  return <Navigate to="/welcome" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === RUTAS PÚBLICAS === */}
        {/* Welcome YA NO tiene AuthLayout para que ocupe el 100% de la pantalla 🔥 */}
        <Route path="/welcome" element={<Welcome />} />
        
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/register-role" element={<AuthLayout><RoleSelection /></AuthLayout>} />
        <Route path="/register/user" element={<AuthLayout><RegisterUser /></AuthLayout>} />
        <Route path="/register/store" element={<AuthLayout><RegisterStore /></AuthLayout>} />

        {/* === RUTAS PROTEGIDAS === */}
        
        {/* 1. Módulo Usuario */}
        <Route element={<ProtectedRoute allowedRoles={["USUARIO"]} />}>
          <Route path="/dashboard/usuario" element={<MainLayout><UserDashboard /></MainLayout>} />
          <Route path="/dashboard/perfil" element={<MainLayout><UserProfile /></MainLayout>} />
          <Route path="/dashboard/tienda/:id" element={<MainLayout><StoreDetail /></MainLayout>} />
        </Route>

        {/* 2. Módulo Tienda */}
        <Route element={<ProtectedRoute allowedRoles={["TIENDA"]} />}>
          <Route path="/dashboard/tienda" element={<MainLayout><StoreDashboard /></MainLayout>} />
          <Route path="/dashboard/tienda/perfil" element={<MainLayout><StoreProfile /></MainLayout>} />
        </Route>

        {/* 3. Módulo Quality */}
        <Route element={<ProtectedRoute allowedRoles={["QUALITY"]} />}>
          <Route path="/dashboard/quality" element={<MainLayout><QualityDashboard /></MainLayout>} />
          <Route path="/dashboard/quality/perfil" element={<MainLayout><QualityProfile /></MainLayout>} />
          <Route path="/dashboard/calificar/nueva" element={<MainLayout><QualityEvaluation /></MainLayout>} />
          <Route path="/dashboard/quality/tienda/:id" element={<MainLayout><StoreDetail /></MainLayout>} />
        </Route>

        {/* === RUTAS POR DEFECTO === */}
        {/* Ahora la raíz ("/") usa nuestro distribuidor inteligente */}
        <Route path="/" element={<RootDispatcher />} />
        
        {/* Si escriben una URL que no existe, los mandamos a la raíz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}