import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface DiezmoCierre {
    id_cierre: string;
    fecha_cierre: string;
    asunto?: string;
    descripcion?: string;
    total: number;
    created_by?: string;
    created_at?: string;
}

export interface DiezmoRegistro {
    id_registro: string;
    id_cierre: string;
    id_persona?: string;
    fecha: string;
    monto: number;
    asunto?: string;
    descripcion?: string;
    created_at?: string;
    personas?: { id_persona: string; nombres: string; apellidos: string };
}

export interface CierreFormData {
    fecha_cierre: string;
    asunto?: string;
    descripcion?: string;
}

export interface RegistroFormData {
    id_persona?: string;
    fecha: string;
    monto: number | string;
    asunto?: string;
    descripcion?: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useDiezmos = () => {
    const [cierres, setCierres] = useState<DiezmoCierre[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchCierres = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('diezmo_cierres')
                .select('*')
                .order('fecha_cierre', { ascending: false });
            if (error) throw error;
            setCierres(data || []);
        } catch { toast.error('Error al cargar cierres de diezmos.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCierres(); }, [fetchCierres]);

    const crearCierre = async (form: CierreFormData): Promise<string | null> => {
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('diezmo_cierres')
                .insert({ ...form, asunto: form.asunto || null, descripcion: form.descripcion || null })
                .select()
                .single();
            if (error) throw error;
            toast.success('Cierre creado.');
            await fetchCierres();
            return data.id_cierre;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return null; }
        finally { setSaving(false); }
    };

    const actualizarCierre = async (id: string, form: CierreFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('diezmo_cierres')
                .update({ ...form, asunto: form.asunto || null, descripcion: form.descripcion || null })
                .eq('id_cierre', id);
            if (error) throw error;
            toast.success('Cierre actualizado.');
            await fetchCierres();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const eliminarCierre = async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('diezmo_cierres').delete().eq('id_cierre', id);
            if (error) throw error;
            toast.success('Cierre eliminado.', {
                label: 'Deshacer',
                onClick: async () => { /* no aplica — cascade elimina registros */ },
            });
            await fetchCierres();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { cierres, loading, saving, fetchCierres, crearCierre, actualizarCierre, eliminarCierre };
};

export const useRegistrosDiezmo = (idCierre: string) => {
    const [registros, setRegistros] = useState<DiezmoRegistro[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchRegistros = useCallback(async () => {
        if (!idCierre) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('diezmo_registros')
                .select('*, personas(id_persona, nombres, apellidos)')
                .eq('id_cierre', idCierre)
                .order('fecha', { ascending: true });
            if (error) throw error;
            setRegistros((data as unknown as DiezmoRegistro[]) || []);
        } catch { toast.error('Error al cargar registros.'); }
        finally { setLoading(false); }
    }, [idCierre]);

    useEffect(() => { fetchRegistros(); }, [fetchRegistros]);

    const agregar = async (form: RegistroFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('diezmo_registros').insert({
                id_cierre: idCierre,
                id_persona: form.id_persona || null,
                fecha: form.fecha,
                monto: Number(form.monto),
                asunto: form.asunto || null,
                descripcion: form.descripcion || null,
            });
            if (error) throw error;
            await fetchRegistros();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const actualizar = async (id: string, form: Partial<RegistroFormData>): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('diezmo_registros').update({
                ...form,
                monto: form.monto ? Number(form.monto) : undefined,
                id_persona: form.id_persona || null,
                asunto: form.asunto || null,
                descripcion: form.descripcion || null,
            }).eq('id_registro', id);
            if (error) throw error;
            await fetchRegistros();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const eliminar = async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('diezmo_registros').delete().eq('id_registro', id);
            if (error) throw error;
            await fetchRegistros();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { registros, loading, saving, fetchRegistros, agregar, actualizar, eliminar };
};