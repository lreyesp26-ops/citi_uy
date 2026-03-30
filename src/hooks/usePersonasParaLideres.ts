import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Persona } from '../types';

// Todos los campos necesarios para el flujo de ascenso
export interface PersonaParaLider {
    id_persona: string;
    nombres: string;
    apellidos: string;
    rol: string;
    foto_url?: string;
    estado_activo: boolean;
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
    id_usuario?: string | null;
}

// Campos obligatorios para poder crear el usuario líder
export const CAMPOS_REQUERIDOS_LIDER: (keyof PersonaParaLider)[] = [
    'nombres',
    'apellidos',
    'correo_electronico',
    'numero_cedula',
    'celular',
    'direccion',
    'fecha_nacimiento',
    'genero',
    'nivel_estudio',
    'nacionalidad',
    'profesion',
    'estado_civil',
    'lugar_trabajo',
];

export const CAMPOS_LABELS: Record<string, string> = {
    nombres: 'Nombres',
    apellidos: 'Apellidos',
    correo_electronico: 'Correo electrónico',
    numero_cedula: 'Número de cédula',
    celular: 'Celular',
    direccion: 'Dirección',
    fecha_nacimiento: 'Fecha de nacimiento',
    genero: 'Género',
    nivel_estudio: 'Nivel de estudio',
    nacionalidad: 'Nacionalidad',
    profesion: 'Profesión',
    estado_civil: 'Estado civil',
    lugar_trabajo: 'Lugar de trabajo',
};

export const getCamposFaltantes = (persona: PersonaParaLider): string[] => {
    return CAMPOS_REQUERIDOS_LIDER.filter(campo => {
        const valor = persona[campo];
        return !valor || (typeof valor === 'string' && valor.trim() === '');
    }).map(campo => CAMPOS_LABELS[campo] || campo);
};

export const usePersonasParaLideres = () => {
    const [personas, setPersonas] = useState<PersonaParaLider[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPersonas = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('personas')
            .select(`
                id_persona, nombres, apellidos, rol, foto_url, estado_activo,
                correo_electronico, numero_cedula, celular, direccion,
                fecha_nacimiento, genero, nivel_estudio, nacionalidad,
                profesion, estado_civil, lugar_trabajo, id_usuario
            `)
            .eq('estado_activo', true)
            .order('apellidos');
        setPersonas((data as unknown as PersonaParaLider[]) || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchPersonas();
    }, []);

    return { personas, loading, refetch: fetchPersonas };
};