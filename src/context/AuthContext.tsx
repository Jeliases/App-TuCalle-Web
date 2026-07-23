import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    try {
      let data = null;
      let currentRole = null;

      let docSnap = await getDoc(doc(db, "usuarios", uid));
      if (docSnap.exists()) {
        data = docSnap.data();
        currentRole = data.rol || "USUARIO";
      } else {
        docSnap = await getDoc(doc(db, "tiendas", uid));
        if (docSnap.exists()) {
          data = docSnap.data();
          currentRole = data.rol || "TIENDA";
        } else {
          docSnap = await getDoc(doc(db, "qualities", uid));
          if (docSnap.exists()) {
            data = docSnap.data();
            currentRole = data.rol || "QUALITY";
          } else {
            docSnap = await getDoc(doc(db, "admins", uid));
            if (docSnap.exists()) {
              data = docSnap.data();
              currentRole = data.rol || "ADMIN";
            }
          }
        }
      }

      if (data && currentRole) {
        setRole(currentRole as UserRole);
        setUserData(data);
      }
    } catch (error) {
      console.error("🔴 ERROR al refrescar perfil:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log("🔵 AUTH: Usuario detectado en Firebase Auth. UID:", currentUser.uid);
        setUser(currentUser);
        
        try {
          let data = null;
          let currentRole = null;

          console.log("🟡 FIRESTORE: Buscando en colección 'usuarios'...");
          let docSnap = await getDoc(doc(db, "usuarios", currentUser.uid));
          
          if (docSnap.exists()) {
            data = docSnap.data();
            currentRole = data.rol || "USUARIO";
            console.log("🟢 ENCONTRADO EN 'usuarios'. Rol:", currentRole);
          } else {
            console.log("🟡 FIRESTORE: No está en 'usuarios'. Buscando en 'tiendas'...");
            docSnap = await getDoc(doc(db, "tiendas", currentUser.uid));
            
            if (docSnap.exists()) {
              data = docSnap.data();
              currentRole = data.rol || "TIENDA";
              console.log("🟢 ENCONTRADO EN 'tiendas'. Rol:", currentRole);
            } else {
              console.log("🟡 FIRESTORE: No está en 'tiendas'. Buscando en 'qualities'...");
              docSnap = await getDoc(doc(db, "qualities", currentUser.uid));
              
              if (docSnap.exists()) {
                data = docSnap.data();
                currentRole = data.rol || "QUALITY";
                console.log("🟢 ENCONTRADO EN 'qualities'. Rol:", currentRole);
              } else {
                console.log("🟡 FIRESTORE: No está en 'qualities'. Buscando en 'admins'...");
                docSnap = await getDoc(doc(db, "admins", currentUser.uid));
                
                if (docSnap.exists()) {
                  data = docSnap.data();
                  currentRole = data.rol || "ADMIN";
                  console.log("🟢 ENCONTRADO EN 'admins'. Rol:", currentRole);
                }
              }
            }
          }

          if (data && currentRole) {
            setRole(currentRole as UserRole);
            setUserData(data);
          } else {
            console.error("🔴 ERROR CRÍTICO: El UID", currentUser.uid, "no existe en NINGUNA colección de Firestore.");
            setRole(null);
            setUserData(null);
          }
        } catch (error) {
          console.error("🔴 ERROR DE RED/PERMISOS leyendo Firestore:", error);
          setRole(null);
          setUserData(null);
        }
      } else {
        console.log("⚪ AUTH: No hay usuario logueado (Sesión cerrada).");
        setUser(null);
        setRole(null);
        setUserData(null);
      }
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);