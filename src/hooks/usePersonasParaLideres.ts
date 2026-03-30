import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Persona } from '../types';

// Carga pastores y líderes activos para asignar como líderes de ministerio
export const usePersonasParaLideres = () => {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('personas')
                .select('id_persona, nombres, apellidos, rol, foto_url, estado_activo, correo_electronico, numero_cedula, celular')
                .in('rol', ['pastor', 'lider'])
                .eq('estado_activo', true)
                .order('apellidos');
            setPersonas((data as unknown as Persona[]) || []);
            setLoading(false);
        };
        fetch();
    }, []);

    return { personas, loading };
};