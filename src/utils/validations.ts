import { z } from "zod";

export const registerUserSchema = z.object({
  nombre: z.string().min(1, "El nombre completo es obligatorio"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  celular: z.string().min(9, "Ingresa un número de contacto válido"),
  aceptoTerminos: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
  aceptoPromociones: z.boolean().default(false),
});


export const registerStoreSchema = z.object({
  nombreLocal: z.string().min(1, "El nombre del local es obligatorio"),
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  celular: z.string().min(9, "Ingresa un número de contacto válido"),
  direccionTexto: z.string().min(1, "La dirección del local es obligatoria"),
  horaApertura: z.string().min(1, "Selecciona la hora de apertura"),
  minutoApertura: z.string().min(1, "Selecciona el minuto de apertura"),
  periodoApertura: z.enum(["AM", "PM"]),
  horaCierre: z.string().min(1, "Selecciona la hora de cierre"),
  minutoCierre: z.string().min(1, "Selecciona el minuto de cierre"),
  periodoCierre: z.enum(["AM", "PM"]),
});

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type RegisterUserForm = z.infer<typeof registerUserSchema>;