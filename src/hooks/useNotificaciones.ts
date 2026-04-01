import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Notificacion } from '../types';

export const useNotificaciones = () => {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotificaciones = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('notificaciones')
                .select(`
                    *,
                    eventos (id_evento, titulo, estado)
                `)
                .order('created_at', { ascending: false })
                .limit(50);
            setNotificaciones((data as unknown as Notificacion[]) || []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotificaciones();

        // Realtime: escuchar nuevas notificaciones
        const channel = supabase
            .channel('notificaciones-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notificaciones' },
                () => { fetchNotificaciones(); }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'notificaciones' },
                () => { fetchNotificaciones(); }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchNotificaciones]);

    const marcarLeida = async (id: string) => {
        await supabase.rpc('marcar_notificacion_leida', { p_id_notificacion: id });
        setNotificaciones(prev =>
            prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
        );
    };

    const marcarTodasLeidas = async () => {
        const noLeidas = notificaciones.filter(n => !n.leida);
        await Promise.all(noLeidas.map(n =>
            supabase.rpc('marcar_notificacion_leida', { p_id_notificacion: n.id_notificacion })
        ));
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    };

    const noLeidas = notificaciones.filter(n => !n.leida).length;

    return { notificaciones, loading, noLeidas, marcarLeida, marcarTodasLeidas, refetch: fetchNotificaciones };
};