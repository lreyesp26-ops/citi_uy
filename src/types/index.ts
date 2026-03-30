export interface Persona {
  id_persona: string;
  id_usuario: string;
  nombres: string;
  apellidos: string;
  rol: 'pastor' | 'lider';
  correo_electronico?: string;
  numero_cedula?: string;
  celular?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  nivel_estudio?: string;
  nacionalidad?: string;
  profesion?: string;
  estado_civil?: string;
  lugar_trabajo?: string;
  estado_activo?: boolean;
  foto_url?: string;
  created_at?: string;
}

export interface Miembro {
  id_persona: string;
  id_usuario: null;
  nombres: string;
  apellidos: string;
  rol: 'miembro';
  correo_electronico?: string;
  numero_cedula?: string;
  celular?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  nivel_estudio?: string;
  nacionalidad?: string;
  profesion?: string;
  estado_civil?: string;
  lugar_trabajo?: string;
  estado_activo: boolean;
  foto_url?: string;
  created_at?: string;
}

export interface MiembroFormData {
  nombres: string;
  apellidos: string;
  correo_electronico?: string;
  numero_cedula?: string;
  celular?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  genero?: string;
  nivel_estudio?: string;
  nacionalidad?: string;
  profesion?: string;
  estado_civil?: string;
  lugar_trabajo?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  persona: Persona;
}