import { Home, BadgeDollarSign, ShoppingBag, Heart, User, Star, CheckCircle, AlertTriangle, BookOpen, BarChart, ClipboardSignature } from "lucide-react";
import type { UserRole } from "../../types/models";

export interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

export function getNavItems(role: UserRole | null): NavItem[] {
  switch (role) {
    case "QUALITY":
      return [
        { text: "Home", icon: <Home className="w-5 h-5" />, path: "/dashboard/quality" },
        { text: "Evaluar Huarique", icon: <ClipboardSignature className="w-5 h-5" />, path: "/dashboard/calificar/nueva" },
        { text: "Mis Huariques", icon: <Heart className="w-5 h-5" />, path: "/dashboard/quality" },
        { text: "Perfil", icon: <User className="w-5 h-5" />, path: "/dashboard/quality/perfil" },      ];
    case "ADMIN":
      return [
        { text: "Aprobaciones", icon: <CheckCircle className="w-5 h-5" />, path: "/dashboard/admin/aprobaciones" },
        { text: "Reportes", icon: <AlertTriangle className="w-5 h-5" />, path: "/dashboard/admin/reportes" },
        { text: "Perfil", icon: <User className="w-5 h-5" />, path: "/dashboard/admin/perfil" },
      ];
    case "TIENDA":
      return [
        { text: "Home", icon: <Home className="w-5 h-5" />, path: "/dashboard/tienda" },
        { text: "Platos", icon: <BookOpen className="w-5 h-5" />, path: "/dashboard/tienda/platos" },
        { text: "Reseñas", icon: <Star className="w-5 h-5" />, path: "/dashboard/tienda/resenas" },
        { text: "Métricas", icon: <BarChart className="w-5 h-5" />, path: "/dashboard/tienda/metricas" },
        { text: "Perfil", icon: <User className="w-5 h-5" />, path: "/dashboard/tienda/perfil" },
      ];
    default: // USUARIO
      return [
        { text: "Home", icon: <Home className="w-5 h-5" />, path: "/dashboard/usuario" },
        { text: "Ofertas", icon: <BadgeDollarSign className="w-5 h-5" />, path: "/dashboard/ofertas" },
        { text: "Pedidos", icon: <ShoppingBag className="w-5 h-5" />, path: "/dashboard/pedidos" },
        { text: "Favoritos", icon: <Heart className="w-5 h-5" />, path: "/dashboard/favoritos" },
        { text: "Perfil", icon: <User className="w-5 h-5" />, path: "/dashboard/perfil" },
      ];
  }
}