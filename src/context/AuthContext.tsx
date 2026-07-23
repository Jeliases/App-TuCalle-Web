import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../api/firebaseConfig";
import type { UserRole } from "../types/models";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  userData: any | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

// 🔥 OPTIMIZACIÓN 1: Función externa limpia y rápida para buscar el rol
const fetchUserRoleData = async (uid: string) => {
  const collections = ["usuarios", "tiendas", "qualities", "admins"];
  const roles: UserRole[] = ["USUARIO", "TIENDA", "QUALITY", "ADMIN"];

  for (let i = 0; i < collections.length; i++) {
    const docSnap = await getDoc(doc(db, collections[i], uid));
    if (docSnap.exists()) {
      return { data: docSnap.data(), role: roles[i] };
    }
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 OPTIMIZACIÓN 2: useCallback evita re-renders infinitos en otras pantallas
  const refreshUserData = useCallback(async () => {
    if (!auth.currentUser) return;
    
    try {
      const result = await fetchUserRoleData(auth.currentUser.uid);
      if (result) {
        setRole(result.role);
        setUserData(result.data);
      }
    } catch (error) {
      console.error("🔴 ERROR al refrescar perfil:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          const result = await fetchUserRoleData(currentUser.uid);
          
          if (result) {
            setRole(result.role);
            setUserData(result.data);
          } else {
            console.error("🔴 ERROR CRÍTICO: El UID no existe en NINGUNA colección.");
            setRole(null);
            setUserData(null);
          }
        } catch (error) {
          console.error("🔴 ERROR DE RED/PERMISOS leyendo Firestore:", error);
          setRole(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setUserData(null);
      }
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  // 🔥 OPTIMIZACIÓN 3: useMemo congela el contexto. ¡La app dejará de recargarse sola!
  const contextValue = useMemo(() => ({
    user,
    role,
    userData,
    loading,
    refreshUserData
  }), [user, role, userData, loading, refreshUserData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);