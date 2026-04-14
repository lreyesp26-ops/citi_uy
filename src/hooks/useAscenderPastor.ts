import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { PersonaParaLider } from './usePersonasParaLideres';

interface AscenderPastorResult {
    success: boolean;
    username?: string;
    tipo?: string;
}

export const useAscenderPastor = () => {
    const [ascending, setAscending] = useState(false);

    const previewUsername = (nombres: string, apellidos: string): string => {
        const norm = (s: string) =>
            s.toLowerCase()
                .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
                .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
                .replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
                .replace(/[^a-z0-9]/g, '');
        const primerNombre = norm(nombres.trim().split(' ')[0]);
        const primerApellido = norm(apellidos.trim().split(' ')[0]);
        return `${primerNombre}.${primerApellido}`;
    };

    const ascenderAPastor = async (persona: PersonaParaLider): Promise<AscenderPastorResult> => {
        setAscending(true);
        try {
            const { data, error } = await supabase.rpc('crear_usuario_pastor', {
                p_id_persona: persona.id_persona,
                p_nombres: persona.nombres,
                p_apellidos: persona.apellidos,
                p_correo_real: persona.correo_electronico!,
                p_cedula: persona.numero_cedula!,
            });

            if (error) throw error;

            const result = data as { success: boolean; username: string; tipo: string };

            if (result.tipo === 'rol_actualizado') {
                toast.success(`✓ ${persona.nombres} ahora es Pastor`);
            } else {
                toast.success(`✓ Pastor creado · Usuario: ${result.username} · Contraseña: ${persona.numero_cedula}`);
            }
            return { success: true, username: result.username, tipo: result.tipo };
        } catch (err: any) {
            const msg: string = err?.message || '';
            if (msg.includes('pastor')) {
                toast.error('Solo los pastores pueden realizar esta acción.');
            } else if (msg.includes('correo')) {
                toast.error('El correo de este miembro ya tiene una cuenta registrada.');
            } else {
                toast.error(msg || 'Error al ascender a pastor.');
            }
            return { success: false };
        } finally {
            setAscending(false);
        }
    };

    return { ascending, ascenderAPastor, previewUsername };
};