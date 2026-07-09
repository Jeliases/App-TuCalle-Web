export type UserRole = "USUARIO" | "TIENDA" | "QUALITY" | "ADMIN";
// Interfaz base que todo documento en la colección 'usuarios' debe tener

export interface BaseUser {
  uid: string;
  email: string;
  rol: UserRole;
  celular: string;
}

// Estructura exacta para el registro de USUARIO
export interface NormalUser extends BaseUser {
  rol: "USUARIO";
  nombre: string;
  recibirPromociones: boolean;
}

// Estructura exacta para el registro de TIENDA (basado en tu RegisterStoreScreen)
export interface StoreUser extends BaseUser {
  rol: "TIENDA";
  nombre: string; // Nombre del local
  horario: string;
  horarioApertura: string;
  horarioCierre: string;
  diasApertura: string[];
  tipoHorario: "FIJO" | "VARIABLE";
  direccion: {
    texto: string;
    latitud: number;
    longitud: number;
  };
  logoUrl: string;
  portadaUrl: string;
  estado: "PENDIENTE" | "APROBADO";
  etiquetas: string[];
  // ... (aquí irían los demás campos de inicialización que tienes en Kotlin)
}