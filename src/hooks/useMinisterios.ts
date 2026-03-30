import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Ministerio, MinisterioFormData } from '../types';
import { toast } from '../components/ui/Toast';

export const useMinisterios = () => {
    const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchMinisterios = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ministerios')
                .select(`
                    *,
                    ministerio_lideres (
                        id,
                        id_persona,
                        personas (
                            id_persona, nombres, apellidos, rol, foto_url, estado_activo
                        )
                    )
                `)
                .order('es_principal', { ascending: false })
                .order('nombre', { ascending: true });

            if (error) throw error;
            setMinisterios((data as unknown as Ministerio[]) || []);
        } catch (err: any) {
            toast.error('Error al cargar los ministerios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMinisterios();
    }, [fetchMinisterios]);

    const uploadLogo = async (file: File, ministerioId: string): Promise<string | null> => {
        const ext = file.name.split('.').pop();
        const path = `${ministerioId}/logo.${ext}`;
        const { error } = await supabase.storage
            .from('ministerios-logos')
            .upload(path, file, { upsert: true });

        if (error) {
            toast.error('Error al subir el logo.');
            return null;
        }

        const { data } = supabase.storage.from('ministerios-logos').getPublicUrl(path);
        return data.publicUrl + `?t=${Date.now()}`;
    };

    const crearMinisterio = async (
        formData: MinisterioFormData,
        logoFile?: File | null,
        lideresIds?: string[]
    ): Promise<boolean> => {
        setSaving(true);
        try {
            const { data: nuevo, error } = await supabase
                .from('ministerios')
                .insert({
                    nombre: formData.nombre,
                    descripcion: formData.descripcion || null,
                    color: formData.color,
                    es_principal: formData.es_principal || false,
                })
                .select()
                .single();

            if (error) throw error;

            if (logoFile) {
                const url = await uploadLogo(logoFile, nuevo.id_ministerio);
                if (url) {
                    await supabase
                        .from('ministerios')
                        .update({ logo_url: url })
                        .eq('id_ministerio', nuevo.id_ministerio);
                }
            }

            if (lideresIds && lideresIds.length > 0) {
                const rows = lideresIds.map(id => ({
                    id_ministerio: nuevo.id_ministerio,
                    id_persona: id,
                }));
                await supabase.from('ministerio_lideres').insert(rows);
            }

            toast.success('Ministerio creado exitosamente.');
            await fetchMinisterios();
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Error al crear el ministerio.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const actualizarMinisterio = async (
        id: string,
        formData: MinisterioFormData,
        logoFile?: File | null,
        lideresIds?: string[]
    ): Promise<boolean> => {
        setSaving(true);
        try {
            const updatePayload: any = {
                nombre: formData.nombre,
                descripcion: formData.descripcion || null,
                color: formData.color,
                es_principal: formData.es_principal || false,
            };

            if (logoFile) {
                const url = await uploadLogo(logoFile, id);
                if (url) updatePayload.logo_url = url;
            }

            const { error } = await supabase
                .from('ministerios')
                .update(updatePayload)
                .eq('id_ministerio', id);

            if (error) throw error;

            if (lideresIds !== undefined) {
                await supabase.from('ministerio_lideres').delete().eq('id_ministerio', id);
                if (lideresIds.length > 0) {
                    const rows = lideresIds.map(pid => ({
                        id_ministerio: id,
                        id_persona: pid,
                    }));
                    await supabase.from('ministerio_lideres').insert(rows);
                }
            }

            toast.success('Ministerio actualizado exitosamente.');
            await fetchMinisterios();
            return true;
        } catch (err: any) {
            toast.error(err?.message || 'Error al actualizar el ministerio.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Sin modal — acción inmediata con undo toast
    const toggleEstado = async (id: string, estadoActual: boolean): Promise<void> => {
        try {
            const { error } = await supabase
                .from('ministerios')
                .update({ estado_activo: !estadoActual })
                .eq('id_ministerio', id);
            if (error) throw error;

            await fetchMinisterios();

            toast.success(
                estadoActual ? 'Ministerio desactivado.' : 'Ministerio activado.',
                {
                    label: 'Deshacer',
                    onClick: async () => {
                        await supabase
                            .from('ministerios')
                            .update({ estado_activo: estadoActual })
                            .eq('id_ministerio', id);
                        await fetchMinisterios();
                    },
                }
            );
        } catch (err: any) {
            toast.error('Error al cambiar el estado.');
        }
    };

    return { ministerios, loading, saving, fetchMinisterios, crearMinisterio, actualizarMinisterio, toggleEstado };
};