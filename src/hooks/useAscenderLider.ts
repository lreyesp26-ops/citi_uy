import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { PersonaParaLider } from './usePersonasParaLideres';

interface AscenderResult {
    success: boolean;
    username?: string;
}

export const useAscenderLider = () => {
    const [ascending, setAscending] = useState(false);

    /**
     * Preview local del username (primerNombre.primerApellido)
     * El definitivo lo genera la función de Supabase con verificación de colisiones.
     */
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

    /**
     * Llama a la función RPC crear_usuario_lider:
     * - Usa el correo real del miembro para Supabase Auth
     * - La cédula como contraseña
     * - Genera username primerNombre.primerApellido en DB
     * - Actualiza rol a 'lider' y guarda el username en personas
     */
    const ascenderALider = async (persona: PersonaParaLider): Promise<AscenderResult> => {
        setAscending(true);
        try {
            const { data, error } = await supabase.rpc('crear_usuario_lider', {
                p_id_persona: persona.id_persona,
                p_nombres: persona.nombres,
                p_apellidos: persona.apellidos,
                p_correo_real: persona.correo_electronico!,
                p_cedula: persona.numero_cedula!,
            });

            if (error) throw error;

            const result = data as { success: boolean; username: string };
            toast.success(`✓ Líder creado · Usuario: ${result.username} · Contraseña: ${persona.numero_cedula}`);
            return { success: true, username: result.username };
        } catch (err: any) {
            const msg: string = err?.message || '';
            if (msg.includes('pastor')) {
                toast.error('Solo los pastores pueden ascender miembros.');
            } else if (msg.includes('correo')) {
                toast.error('El correo de este miembro ya tiene una cuenta registrada.');
            } else {
                toast.error(msg || 'Error al ascender a líder.');
            }
            return { success: false };
        } finally {
            setAscending(false);
        }
    };

    return { ascending, ascenderALider, previewUsername };
};