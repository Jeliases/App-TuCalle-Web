import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// 1. Registro de Usuario Normal
export const registerNormalUser = async (data: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    const userData = {
      uid: user.uid,
      nombre: data.nombre,
      email: data.email,
      celular: data.celular,
      rol: "USUARIO",
      recibirPromociones: data.aceptoPromociones,
    };

    await setDoc(doc(db, "usuarios", user.uid), userData);
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 2. Iniciar Sesión (Login)
export const loginUser = async (data: any) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') {
      throw new Error("Correo o contraseña incorrectos");
    }
    throw new Error(error.message);
  }
};

// 3. Registro de Tienda (Store)
export const registerStoreUser = async (
  data: any, 
  diasSeleccionados: string[], 
  logoUrl: string, 
  portadaUrl: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    const horaInicioFormatted = `${data.horaApertura}:${data.minutoApertura} ${data.periodoApertura}`;
    const horaFinFormatted = `${data.horaCierre}:${data.minutoCierre} ${data.periodoCierre}`;

    const storeData = {
      uid: user.uid,
      nombre: data.nombreLocal.trim(),
      email: data.email.trim(),
      celular: data.celular.trim(),
      horario: `${horaInicioFormatted} - ${horaFinFormatted}`,
      horarioApertura: horaInicioFormatted,
      horarioCierre: horaFinFormatted,
      diasApertura: diasSeleccionados,
      tipoHorario: "FIJO",
      horariosVariables: {},
      direccion: {
        texto: data.direccionTexto,
        latitud: data.latitud || -12.046374, 
        longitud: data.longitud || -77.042793,
      },
      logoUrl: logoUrl,
      portadaUrl: portadaUrl,
      rol: "TIENDA",
      estado: "APROBADO",
      antiguedad: Date.now(),
      calificacionGeneral: 5.0,
      totalResenas: 0,
      etiquetas: [],
      seguidores: 0,
      estadoLocal: "Cerrado",
      plan: "Impulso",
      razonSocial: data.nombreLocal.trim(),
      encargadoNombre: "",
      encargadoContacto: "",
      encargadoEmail: ""
    };

    await setDoc(doc(db, "tiendas", user.uid), storeData);
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};