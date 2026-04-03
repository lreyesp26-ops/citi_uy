// ── Tipos: Cursos Bíblicos ──────────────────────────────────────────────────

export interface Periodo {
    id_periodo: string;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'activo' | 'cerrado';
    created_at?: string;
}

export interface Curso {
    id_curso: string;
    id_periodo: string;
    nombre: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    estado: 'activo' | 'cerrado' | 'cancelado';
    created_at?: string;
    // joins
    periodos?: Pick<Periodo, 'id_periodo' | 'nombre' | 'estado'>;
    _participantes_count?: number;
}

export interface Ponderacion {
    id_ponderacion: string;
    id_curso: string;
    tipo: 'asistencia' | 'tareas' | 'examenes';
    porcentaje: number;
}

export interface Participante {
    id: string;
    id_curso: string;
    id_persona: string;
    created_at?: string;
    personas?: {
        id_persona: string;
        nombres: string;
        apellidos: string;
        rol: string;
        estado_activo: boolean;
    };
}

export interface Clase {
    id_clase: string;
    id_curso: string;
    nombre: string;
    fecha: string;
    created_at?: string;
    _total_presentes?: number;
    _total_participantes?: number;
}

export interface Asistencia {
    id: string;
    id_clase: string;
    id_participante: string;
    estado: 'presente' | 'ausente' | 'justificado';
}

export interface Tarea {
    id_tarea: string;
    id_curso: string;
    titulo: string;
    descripcion?: string;
    fecha_entrega?: string;
    created_at?: string;
    _calificadas?: number;
    _total?: number;
}

export interface CalificacionTarea {
    id: string;
    id_tarea: string;
    id_participante: string;
    calificacion?: number;
}

export interface Examen {
    id_examen: string;
    id_curso: string;
    titulo: string;
    descripcion?: string;
    fecha?: string;
    created_at?: string;
    _calificados?: number;
    _total?: number;
}

export interface CalificacionExamen {
    id: string;
    id_examen: string;
    id_participante: string;
    calificacion?: number;
}

export interface NotaFinal {
    id_curso: string;
    id_participante: string;
    id_persona: string;
    nota_final: number;
}

// Forms
export interface PeriodoFormData {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
}

export interface CursoFormData {
    id_periodo: string;
    nombre: string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin?: string;
}

export interface ClaseFormData {
    nombre: string;
    fecha: string;
}

export interface TareaFormData {
    titulo: string;
    descripcion?: string;
    fecha_entrega?: string;
}

export interface ExamenFormData {
    titulo: string;
    descripcion?: string;
    fecha?: string;
}