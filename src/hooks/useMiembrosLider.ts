import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

export interface MiembroConMinisterio {
    id_persona: string;
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
    created_at?: string;
    ministerios?: {
        id_ministerio: string;
        nombre: string;
        color: string;
    }[];
}

export interface MiembroLiderFormData {
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
    id_ministerio: string;
}

const parsearError = (err: any): string => {
    const msg: string = err?.message || '';
    const detail: string = err?.details || '';

    if (msg.includes('personas_correo_unique') || detail.includes('correo_electronico')) {
        return 'Ya existe un miembro registrado con ese correo electrónico.';
    }
    if (msg.includes('personas_cedula_unique') || detail.includes('numero_cedula')) {
        return 'Ya existe un miembro registrado con esa cédula.';
    }
    if (msg.includes('23505')) {
        return 'Ya existe un registro con esos datos. Verifica la cédula y el correo.';
    }
    if (msg.includes('42501') || msg.includes('permission denied')) {
        return 'No tienes permisos para realizar esta acción.';
    }
    if (msg.includes('foreign key') || msg.includes('23503')) {
        return 'Referencia inválida: uno de los datos ingresados no existe en el sistema.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
        return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    return msg || 'Ocurrió un error inesperado. Intenta de nuevo.';
};

export const useMiembrosLider = (ministerioIds: string[]) => {
    const [miembros, setMiembros] = useState<MiembroConMinisterio[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchMiembros = useCallback(async () => {
        if (!ministerioIds.length) {
            setMiembros([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Traer personas que son miembros de los ministerios del líder
            const { data, error } = await supabase
                .from('miembro_ministerio')
                .select(`
                    id_persona,
                    ministerios (id_ministerio, nombre, color),
                    personas!miembro_ministerio_id_persona_fkey (
                        id_persona, nombres, apellidos, rol,
                        correo_electronico, numero_cedula, celular, direccion,
                        fecha_nacimiento, genero, nivel_estudio, nacionalidad,
                        profesion, estado_civil, lugar_trabajo, estado_activo, created_at
                    )
                `)
                .in('id_ministerio', ministerioIds)
                .eq('personas.rol', 'miembro');

            if (error) throw error;

            // Agrupar por persona para consolidar sus ministerios
            const mapaPersonas = new Map<string, MiembroConMinisterio>();
            (data || []).forEach((row: any) => {
                const persona = row.personas;
                if (!persona || persona.rol !== 'miembro') return;

                if (!mapaPersonas.has(persona.id_persona)) {
                    mapaPersonas.set(persona.id_persona, {
                        ...persona,
                        ministerios: [],
                    });
                }

                const entry = mapaPersonas.get(persona.id_persona)!;
                if (row.ministerios) {
                    const yaExiste = entry.ministerios?.some(
                        m => m.id_ministerio === row.ministerios.id_ministerio
                    );
                    if (!yaExiste) {
                        entry.ministerios?.push(row.ministerios);
                    }
                }
            });

            const result = Array.from(mapaPersonas.values()).sort((a, b) =>
                a.apellidos.localeCompare(b.apellidos)
            );

            setMiembros(result);
        } catch (err: any) {
            toast.error('No se pudieron cargar los miembros. Intenta recargar la página.');
        } finally {
            setLoading(false);
        }
    }, [ministerioIds.join(',')]);

    useEffect(() => {
        fetchMiembros();
    }, [fetchMiembros]);

    const crearMiembro = async (formData: MiembroLiderFormData): Promise<boolean> => {
        setSaving(true);
        try {
            // 1. Crear la persona
            const { data: nuevaPersona, error: errorPersona } = await supabase
                .from('personas')
                .insert({
                    nombres: formData.nombres,
                    apellidos: formData.apellidos,
                    correo_electronico: formData.correo_electronico || null,
                    numero_cedula: formData.numero_cedula || null,
                    celular: formData.celular || null,
                    direccion: formData.direccion || null,
                    fecha_nacimiento: formData.fecha_nacimiento || null,
                    genero: formData.genero || null,
                    nivel_estudio: formData.nivel_estudio || null,
                    nacionalidad: formData.nacionalidad || null,
                    profesion: formData.profesion || null,
                    estado_civil: formData.estado_civil || null,
                    lugar_trabajo: formData.lugar_trabajo || null,
                    rol: 'miembro',
                    estado_activo: true,
                    id_usuario: null,
                })
                .select()
                .single();

            if (errorPersona) throw errorPersona;

            // 2. Asociar al ministerio
            const { error: errorMm } = await supabase
                .from('miembro_ministerio')
                .insert({
                    id_persona: nuevaPersona.id_persona,
                    id_ministerio: formData.id_ministerio,
                });

            if (errorMm) throw errorMm;

            toast.success('¡Miembro registrado exitosamente!');
            await fetchMiembros();
            return true;
        } catch (err: any) {
            toast.error(parsearError(err));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const actualizarMiembro = async (
        id: string,
        formData: Partial<MiembroLiderFormData>
    ): Promise<boolean> => {
        setSaving(true);
        try {
            const { id_ministerio, ...datosPersona } = formData;

            const { error } = await supabase
                .from('personas')
                .update({
                    ...datosPersona,
                    correo_electronico: datosPersona.correo_electronico || null,
                    numero_cedula: datosPersona.numero_cedula || null,
                    celular: datosPersona.celular || null,
                    direccion: datosPersona.direccion || null,
                    fecha_nacimiento: datosPersona.fecha_nacimiento || null,
                    genero: datosPersona.genero || null,
                    nivel_estudio: datosPersona.nivel_estudio || null,
                    nacionalidad: datosPersona.nacionalidad || null,
                    profesion: datosPersona.profesion || null,
                    estado_civil: datosPersona.estado_civil || null,
                    lugar_trabajo: datosPersona.lugar_trabajo || null,
                })
                .eq('id_persona', id);

            if (error) throw error;

            toast.success('Datos del miembro actualizados.');
            await fetchMiembros();
            return true;
        } catch (err: any) {
            toast.error(parsearError(err));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const toggleEstado = async (id: string, estadoActual: boolean): Promise<void> => {
        try {
            const { error } = await supabase
                .from('personas')
                .update({ estado_activo: !estadoActual })
                .eq('id_persona', id);

            if (error) throw error;

            await fetchMiembros();

            toast.success(
                estadoActual ? 'Miembro marcado como inactivo.' : 'Miembro reactivado.',
                {
                    label: 'Deshacer',
                    onClick: async () => {
                        await supabase
                            .from('personas')
                            .update({ estado_activo: estadoActual })
                            .eq('id_persona', id);
                        await fetchMiembros();
                    },
                }
            );
        } catch (err: any) {
            toast.error(parsearError(err));
        }
    };

    const asignarAMinisterio = async (
        idPersona: string,
        idMinisterio: string
    ): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('miembro_ministerio')
                .insert({ id_persona: idPersona, id_ministerio: idMinisterio });

            if (error) {
                if (error.code === '23505') {
                    toast.error('Este miembro ya pertenece a ese ministerio.');
                    return false;
                }
                throw error;
            }

            await fetchMiembros();
            return true;
        } catch (err: any) {
            toast.error(parsearError(err));
            return false;
        }
    };

    return {
        miembros,
        loading,
        saving,
        fetchMiembros,
        crearMiembro,
        actualizarMiembro,
        toggleEstado,
        asignarAMinisterio,
    };
};