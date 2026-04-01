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

// Añadir al src/types/index.ts existente

export interface MinisterioLider {
  id: string;
  id_ministerio: string;
  id_persona: string;
  personas: {
    id_persona: string;
    nombres: string;
    apellidos: string;
    rol: string;
    foto_url?: string;
    estado_activo: boolean;
  };
}

export interface Ministerio {
  id_ministerio: string;
  nombre: string;
  descripcion?: string;
  color: string;
  logo_url?: string;
  es_principal: boolean;
  estado_activo: boolean;
  created_at?: string;
  ministerio_lideres: MinisterioLider[];
}

export interface MinisterioFormData {
  nombre: string;
  descripcion?: string;
  color: string;
  es_principal?: boolean;
}

export interface Evento {
  id_evento: string;
  titulo: string;
  descripcion?: string;
  id_ministerio: string;
  id_creador: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  id_aprobador?: string;
  aprobado_at?: string;
  imagen_publicidad_url?: string;
  created_at?: string;
  updated_at?: string;
  ministerios?: { id_ministerio: string; nombre: string; color: string; logo_url?: string; };
  creador?: { id_persona: string; nombres: string; apellidos: string; rol: string; };
  aprobador?: { id_persona: string; nombres: string; apellidos: string; };
}

export interface EventoFormData {
  titulo: string;
  descripcion?: string;
  id_ministerio: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar?: string;
}

export interface Notificacion {
  id_notificacion: string;
  id_destinatario: string;
  tipo: string;
  titulo: string;
  mensaje?: string;
  id_evento?: string;
  leida: boolean;
  created_at: string;
  eventos?: { id_evento: string; titulo: string; estado: string; };
}