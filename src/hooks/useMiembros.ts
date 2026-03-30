import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Miembro, MiembroFormData } from '../types';
import { toast } from '../components/ui/Toast';

const parsearErrorSupabase = (err: any): string => {
    const msg: string = err?.message || '';
    const detail: string = err?.details || '';

    if (msg.includes('personas_correo_unique') || detail.includes('correo_electronico')) {
        return 'Ya existe un miembro registrado con ese correo electrónico.';
    }
    if (msg.includes('personas_cedula_unique') || detail.includes('numero_cedula')) {
        return 'Ya existe un miembro registrado con esa cédula.';
    }
    if (msg.includes('23505')) {
        return 'Ya existe un registro con esos datos. Verifica cédula y correo.';
    }
    if (msg.includes('23503')) {
        return 'Error de referencia: uno de los datos ingresados no es válido.';
    }
    if (msg.includes('42501') || msg.includes('permission denied')) {
        return 'No tienes permisos para realizar esta acción.';
    }
    return msg || 'Ocurrió un error inesperado. Intenta de nuevo.';
};

export const useMiembros = () => {
    const [miembros, setMiembros] = useState<Miembro[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchMiembros = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('personas')
                .select('*')
                .eq('rol', 'miembro')
                .order('apellidos', { ascending: true });

            if (error) throw error;
            setMiembros((data as Miembro[]) || []);
        } catch (err: any) {
            toast.error('Error al cargar los miembros.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMiembros();
    }, [fetchMiembros]);

    const crearMiembro = async (formData: MiembroFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('personas').insert({
                ...formData,
                rol: 'miembro',
                id_usuario: null,
                estado_activo: true,
            });
            if (error) throw error;
            toast.success('Miembro registrado exitosamente.');
            await fetchMiembros();
            return true;
        } catch (err: any) {
            toast.error(parsearErrorSupabase(err));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const actualizarMiembro = async (id: string, formData: Partial<MiembroFormData>): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('personas')
                .update(formData)
                .eq('id_persona', id);
            if (error) throw error;
            toast.success('Miembro actualizado exitosamente.');
            await fetchMiembros();
            return true;
        } catch (err: any) {
            toast.error(parsearErrorSupabase(err));
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Sin modal — acción inmediata con undo toast
    const toggleEstado = async (id: string, estadoActual: boolean): Promise<void> => {
        try {
            const { error } = await supabase
                .from('personas')
                .update({ estado_activo: !estadoActual })
                .eq('id_persona', id);
            if (error) throw error;

            await fetchMiembros();

            toast.success(
                estadoActual ? 'Miembro desactivado.' : 'Miembro activado.',
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
            toast.error(parsearErrorSupabase(err));
        }
    };

    return { miembros, loading, saving, fetchMiembros, crearMiembro, actualizarMiembro, toggleEstado };
};