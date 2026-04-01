import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Evento, EventoFormData } from '../types';
import { toast } from '../components/ui/Toast';

export const useEventos = () => {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchEventos = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('eventos')
                .select(`
                    *,
                    ministerios (id_ministerio, nombre, color, logo_url),
                    creador:personas!eventos_id_creador_fkey (id_persona, nombres, apellidos, rol),
                    aprobador:personas!eventos_id_aprobador_fkey (id_persona, nombres, apellidos)
                `)
                .order('fecha_inicio', { ascending: true });

            if (error) throw error;
            setEventos((data as unknown as Evento[]) || []);
        } catch (err: any) {
            toast.error('Error al cargar los eventos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEventos();
    }, [fetchEventos]);

    const crearEvento = async (formData: EventoFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.rpc('crear_evento', {
                p_titulo: formData.titulo,
                p_descripcion: formData.descripcion || null,
                p_id_ministerio: formData.id_ministerio,
                p_fecha_inicio: formData.fecha_inicio,
                p_fecha_fin: formData.fecha_fin,
                p_lugar: formData.lugar || null,
            });
            if (error) throw error;
            toast.success('Evento creado. Los pastores han sido notificados para su aprobación.');
            await fetchEventos();
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Error al crear el evento.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const actualizarEvento = async (id: string, formData: Partial<EventoFormData>): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('eventos')
                .update({ ...formData, updated_at: new Date().toISOString() })
                .eq('id_evento', id);
            if (error) throw error;
            toast.success('Evento actualizado.');
            await fetchEventos();
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Error al actualizar el evento.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const aprobarEvento = async (id: string, estado: 'aprobado' | 'rechazado'): Promise<boolean> => {
        try {
            const { error } = await supabase.rpc('aprobar_evento', {
                p_id_evento: id,
                p_estado: estado,
            });
            if (error) throw error;
            toast.success(estado === 'aprobado' ? '✓ Evento aprobado.' : 'Evento rechazado.');
            await fetchEventos();
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Error al procesar el evento.');
            return false;
        }
    };

    const subirImagenPublicidad = async (id: string, file: File): Promise<string | null> => {
        const ext = file.name.split('.').pop();
        const path = `${id}/imagen_principal.${ext}`;
        const { error } = await supabase.storage
            .from('eventos-media')
            .upload(path, file, { upsert: true });

        if (error) {
            toast.error('Error al subir la imagen de publicidad.');
            return null;
        }

        const { data } = supabase.storage.from('eventos-media').getPublicUrl(path);
        const url = data.publicUrl + `?t=${Date.now()}`;

        await supabase
            .from('eventos')
            .update({ imagen_publicidad_url: url })
            .eq('id_evento', id);

        await fetchEventos();
        return url;
    };

    return {
        eventos,
        loading,
        saving,
        fetchEventos,
        crearEvento,
        actualizarEvento,
        aprobarEvento,
        subirImagenPublicidad,
    };
};