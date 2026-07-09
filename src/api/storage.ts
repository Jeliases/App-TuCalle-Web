import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebaseConfig";

export const uploadImage = async (file: File | null, folder: string): Promise<string> => {
  if (!file) return ""; // Si no hay foto, devuelve vacío (como en tu Kotlin)
  
  try {
    // Crea una referencia única con la fecha para evitar que imágenes con el mismo nombre se chanquen
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    throw new Error("Error al subir la imagen. Inténtalo de nuevo.");
  }
};