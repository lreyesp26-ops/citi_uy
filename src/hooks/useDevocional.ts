import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface Devocional {
    id_devocional: string;
    anio: number;
    mes: number;
    logo_url?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface DevocionalDia {
    id_dia: string;
    id_devocional: string;
    dia: number;
    promesa?: string;
    lecturas?: string[];
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useDevocional = () => {
    const [devocionales, setDevocionales] = useState<Devocional[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchDevocionales = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('devocionales')
                .select('*')
                .order('anio', { ascending: false })
                .order('mes', { ascending: false });
            if (error) throw error;
            setDevocionales(data || []);
        } catch { toast.error('Error al cargar devocionales.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchDevocionales(); }, [fetchDevocionales]);

    const crearOActualizar = async (anio: number, mes: number): Promise<string | null> => {
        setSaving(true);
        try {
            // upsert por anio+mes
            const { data, error } = await supabase
                .from('devocionales')
                .upsert({ anio, mes, updated_at: new Date().toISOString() }, { onConflict: 'anio,mes' })
                .select()
                .single();
            if (error) throw error;
            await fetchDevocionales();
            return data.id_devocional;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return null; }
        finally { setSaving(false); }
    };

    const subirLogo = async (id: string, file: File): Promise<string | null> => {
        const ext = file.name.split('.').pop();
        const path = `${id}/logo.${ext}`;
        const { error } = await supabase.storage
            .from('devocional-logos')
            .upload(path, file, { upsert: true });
        if (error) { toast.error('Error al subir logo.'); return null; }
        const { data } = supabase.storage.from('devocional-logos').getPublicUrl(path);
        const url = data.publicUrl + `?t=${Date.now()}`;
        await supabase.from('devocionales').update({ logo_url: url }).eq('id_devocional', id);
        await fetchDevocionales();
        return url;
    };

    return { devocionales, loading, saving, fetchDevocionales, crearOActualizar, subirLogo };
};

export const useDevocionalDias = (idDevocional: string) => {
    const [dias, setDias] = useState<DevocionalDia[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchDias = useCallback(async () => {
        if (!idDevocional) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('devocional_dias')
                .select('*')
                .eq('id_devocional', idDevocional)
                .order('dia');
            if (error) throw error;
            setDias(data || []);
        } catch { toast.error('Error al cargar días.'); }
        finally { setLoading(false); }
    }, [idDevocional]);

    useEffect(() => { fetchDias(); }, [fetchDias]);

    const guardarDia = async (dia: number, promesa: string, lecturas: string[]): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('devocional_dias')
                .upsert(
                    { id_devocional: idDevocional, dia, promesa: promesa || null, lecturas: lecturas.filter(Boolean) },
                    { onConflict: 'id_devocional,dia' }
                );
            if (error) throw error;
            await fetchDias();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const guardarTodos = async (items: { dia: number; promesa: string; lecturas: string[] }[]): Promise<boolean> => {
        setSaving(true);
        try {
            const rows = items.map(i => ({
                id_devocional: idDevocional,
                dia: i.dia,
                promesa: i.promesa || null,
                lecturas: i.lecturas.filter(Boolean),
            }));
            const { error } = await supabase
                .from('devocional_dias')
                .upsert(rows, { onConflict: 'id_devocional,dia' });
            if (error) throw error;
            toast.success('Devocional guardado.');
            await fetchDias();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    return { dias, loading, saving, fetchDias, guardarDia, guardarTodos };
};