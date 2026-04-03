import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import type {
    Periodo, Curso, Ponderacion, Participante,
    Clase, Asistencia, Tarea, CalificacionTarea,
    Examen, CalificacionExamen, NotaFinal,
    PeriodoFormData, CursoFormData, ClaseFormData,
    TareaFormData, ExamenFormData,
} from './cursos.types';

// Re-export types so pages can import from one place
export type {
    Periodo, Curso, Ponderacion, Participante,
    Clase, Asistencia, Tarea, CalificacionTarea,
    Examen, CalificacionExamen, NotaFinal,
    PeriodoFormData, CursoFormData, ClaseFormData,
    TareaFormData, ExamenFormData,
};

// ── Periodos ────────────────────────────────────────────────────────────────
export const usePeriodos = () => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('periodos')
                .select('*')
                .order('fecha_inicio', { ascending: false });
            if (error) throw error;
            setPeriodos(data || []);
        } catch { toast.error('Error al cargar periodos.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const crear = async (form: PeriodoFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('periodos').insert(form);
            if (error) throw error;
            toast.success('Periodo creado.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const actualizar = async (id: string, form: PeriodoFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('periodos').update(form).eq('id_periodo', id);
            if (error) throw error;
            toast.success('Periodo actualizado.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const toggleEstado = async (id: string, estadoActual: string): Promise<void> => {
        const nuevo = estadoActual === 'activo' ? 'cerrado' : 'activo';
        try {
            const { error } = await supabase.from('periodos').update({ estado: nuevo }).eq('id_periodo', id);
            if (error) throw error;
            toast.success(nuevo === 'cerrado' ? 'Periodo cerrado.' : 'Periodo reactivado.');
            await fetch();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { periodos, loading, saving, refetch: fetch, crearPeriodo: crear, actualizarPeriodo: actualizar, toggleEstadoPeriodo: toggleEstado };
};

// ── Cursos ───────────────────────────────────────────────────────────────────
export const useCursos = (idPeriodo?: string) => {
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            let q = supabase
                .from('cursos')
                .select('*, periodos(id_periodo, nombre, estado)')
                .order('fecha_inicio', { ascending: true });
            if (idPeriodo) q = q.eq('id_periodo', idPeriodo);
            const { data, error } = await q;
            if (error) throw error;
            setCursos((data as unknown as Curso[]) || []);
        } catch { toast.error('Error al cargar cursos.'); }
        finally { setLoading(false); }
    }, [idPeriodo]);

    useEffect(() => { fetch(); }, [fetch]);

    const crear = async (form: CursoFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('cursos').insert({
                ...form,
                descripcion: form.descripcion || null,
                fecha_fin: form.fecha_fin || null,
            });
            if (error) throw error;
            toast.success('Curso creado con ponderaciones por defecto (Asistencia 10%, Tareas 50%, Exámenes 40%).');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const actualizar = async (id: string, form: Partial<CursoFormData>): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('cursos').update({
                ...form,
                fecha_fin: form.fecha_fin || null,
                updated_at: new Date().toISOString(),
            }).eq('id_curso', id);
            if (error) throw error;
            toast.success('Curso actualizado.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    return { cursos, loading, saving, refetch: fetch, crearCurso: crear, actualizarCurso: actualizar };
};

// ── Ponderaciones ────────────────────────────────────────────────────────────
export const usePonderaciones = (idCurso: string) => {
    const [ponderaciones, setPonderaciones] = useState<Ponderacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idCurso) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_ponderaciones')
                .select('*')
                .eq('id_curso', idCurso);
            if (error) throw error;
            setPonderaciones(data || []);
        } catch { toast.error('Error al cargar ponderaciones.'); }
        finally { setLoading(false); }
    }, [idCurso]);

    useEffect(() => { fetch(); }, [fetch]);

    const guardar = async (items: { tipo: string; porcentaje: number }[]): Promise<boolean> => {
        const total = items.reduce((s, i) => s + Number(i.porcentaje), 0);
        if (Math.abs(total - 100) > 0.01) {
            toast.error(`Las ponderaciones deben sumar 100%. Actualmente suman ${total.toFixed(1)}%.`);
            return false;
        }
        setSaving(true);
        try {
            for (const item of items) {
                const { error } = await supabase
                    .from('curso_ponderaciones')
                    .update({ porcentaje: item.porcentaje })
                    .eq('id_curso', idCurso)
                    .eq('tipo', item.tipo);
                if (error) throw error;
            }
            toast.success('Ponderaciones guardadas.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    return { ponderaciones, loading, saving, refetch: fetch, guardarPonderaciones: guardar };
};

// ── Participantes ────────────────────────────────────────────────────────────
export const useParticipantes = (idCurso: string) => {
    const [participantes, setParticipantes] = useState<Participante[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idCurso) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_participantes')
                .select('*, personas(id_persona, nombres, apellidos, rol, estado_activo)')
                .eq('id_curso', idCurso)
                .order('created_at');
            if (error) throw error;
            setParticipantes((data as unknown as Participante[]) || []);
        } catch { toast.error('Error al cargar participantes.'); }
        finally { setLoading(false); }
    }, [idCurso]);

    useEffect(() => { fetch(); }, [fetch]);

    const agregar = async (idPersona: string): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('curso_participantes')
                .insert({ id_curso: idCurso, id_persona: idPersona });
            if (error) {
                if (error.code === '23505') { toast.error('Esta persona ya está en el curso.'); return false; }
                throw error;
            }
            toast.success('Participante agregado.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const eliminar = async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('curso_participantes').delete().eq('id', id);
            if (error) throw error;
            toast.success('Participante eliminado.');
            await fetch();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { participantes, loading, saving, refetch: fetch, agregarParticipante: agregar, eliminarParticipante: eliminar };
};

// ── Clases y Asistencias ─────────────────────────────────────────────────────
export const useClases = (idCurso: string) => {
    const [clases, setClases] = useState<Clase[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idCurso) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_clases')
                .select('*')
                .eq('id_curso', idCurso)
                .order('fecha', { ascending: true });
            if (error) throw error;
            setClases(data || []);
        } catch { toast.error('Error al cargar clases.'); }
        finally { setLoading(false); }
    }, [idCurso]);

    useEffect(() => { fetch(); }, [fetch]);

    const crear = async (form: ClaseFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('curso_clases').insert({ ...form, id_curso: idCurso });
            if (error) throw error;
            toast.success('Clase registrada.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const eliminar = async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('curso_clases').delete().eq('id_clase', id);
            if (error) throw error;
            toast.success('Clase eliminada.');
            await fetch();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { clases, loading, saving, refetch: fetch, crearClase: crear, eliminarClase: eliminar };
};

export const useAsistencias = (idClase: string) => {
    const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idClase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_asistencias')
                .select('*')
                .eq('id_clase', idClase);
            if (error) throw error;
            setAsistencias(data || []);
        } catch { toast.error('Error al cargar asistencias.'); }
        finally { setLoading(false); }
    }, [idClase]);

    useEffect(() => { fetch(); }, [fetch]);

    const guardar = async (registros: { id_participante: string; estado: string }[]): Promise<boolean> => {
        setSaving(true);
        try {
            for (const r of registros) {
                const { error } = await supabase
                    .from('curso_asistencias')
                    .upsert(
                        { id_clase: idClase, id_participante: r.id_participante, estado: r.estado },
                        { onConflict: 'id_clase,id_participante' }
                    );
                if (error) throw error;
            }
            toast.success('Asistencias guardadas.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    return { asistencias, loading, saving, refetch: fetch, guardarAsistencias: guardar };
};

// ── Tareas ───────────────────────────────────────────────────────────────────
export const useTareas = (idCurso: string) => {
    const [tareas, setTareas] = useState<Tarea[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idCurso) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_tareas')
                .select('*')
                .eq('id_curso', idCurso)
                .order('created_at');
            if (error) throw error;
            setTareas(data || []);
        } catch { toast.error('Error al cargar tareas.'); }
        finally { setLoading(false); }
    }, [idCurso]);

    useEffect(() => { fetch(); }, [fetch]);

    const crear = async (form: TareaFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('curso_tareas').insert({
                ...form,
                id_curso: idCurso,
                fecha_entrega: form.fecha_entrega || null,
            });
            if (error) throw error;
            toast.success('Tarea creada.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const eliminar = async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('curso_tareas').delete().eq('id_tarea', id);
            if (error) throw error;
            toast.success('Tarea eliminada.');
            await fetch();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { tareas, loading, saving, refetch: fetch, crearTarea: crear, eliminarTarea: eliminar };
};

export const useCalificacionesTarea = (idTarea: string) => {
    const [calificaciones, setCalificaciones] = useState<CalificacionTarea[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idTarea) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_calificaciones_tarea')
                .select('*')
                .eq('id_tarea', idTarea);
            if (error) throw error;
            setCalificaciones(data || []);
        } catch { toast.error('Error al cargar calificaciones.'); }
        finally { setLoading(false); }
    }, [idTarea]);

    useEffect(() => { fetch(); }, [fetch]);

    const guardar = async (registros: { id_participante: string; calificacion: number | null }[]): Promise<boolean> => {
        setSaving(true);
        try {
            for (const r of registros) {
                const { error } = await supabase
                    .from('curso_calificaciones_tarea')
                    .upsert(
                        { id_tarea: idTarea, id_participante: r.id_participante, calificacion: r.calificacion },
                        { onConflict: 'id_tarea,id_participante' }
                    );
                if (error) throw error;
            }
            toast.success('Calificaciones guardadas.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    return { calificaciones, loading, saving, refetch: fetch, guardarCalificaciones: guardar };
};

// ── Exámenes ─────────────────────────────────────────────────────────────────
export const useExamenes = (idCurso: string) => {
    const [examenes, setExamenes] = useState<Examen[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idCurso) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_examenes')
                .select('*')
                .eq('id_curso', idCurso)
                .order('created_at');
            if (error) throw error;
            setExamenes(data || []);
        } catch { toast.error('Error al cargar exámenes.'); }
        finally { setLoading(false); }
    }, [idCurso]);

    useEffect(() => { fetch(); }, [fetch]);

    const crear = async (form: ExamenFormData): Promise<boolean> => {
        setSaving(true);
        try {
            const { error } = await supabase.from('curso_examenes').insert({
                ...form,
                id_curso: idCurso,
                fecha: form.fecha || null,
            });
            if (error) throw error;
            toast.success('Examen creado.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    const eliminar = async (id: string): Promise<void> => {
        try {
            const { error } = await supabase.from('curso_examenes').delete().eq('id_examen', id);
            if (error) throw error;
            toast.success('Examen eliminado.');
            await fetch();
        } catch (e: any) { toast.error(e?.message || 'Error.'); }
    };

    return { examenes, loading, saving, refetch: fetch, crearExamen: crear, eliminarExamen: eliminar };
};

export const useCalificacionesExamen = (idExamen: string) => {
    const [calificaciones, setCalificaciones] = useState<CalificacionExamen[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        if (!idExamen) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('curso_calificaciones_examen')
                .select('*')
                .eq('id_examen', idExamen);
            if (error) throw error;
            setCalificaciones(data || []);
        } catch { toast.error('Error al cargar calificaciones.'); }
        finally { setLoading(false); }
    }, [idExamen]);

    useEffect(() => { fetch(); }, [fetch]);

    const guardar = async (registros: { id_participante: string; calificacion: number | null }[]): Promise<boolean> => {
        setSaving(true);
        try {
            for (const r of registros) {
                const { error } = await supabase
                    .from('curso_calificaciones_examen')
                    .upsert(
                        { id_examen: idExamen, id_participante: r.id_participante, calificacion: r.calificacion },
                        { onConflict: 'id_examen,id_participante' }
                    );
                if (error) throw error;
            }
            toast.success('Calificaciones guardadas.');
            await fetch();
            return true;
        } catch (e: any) { toast.error(e?.message || 'Error.'); return false; }
        finally { setSaving(false); }
    };

    return { calificaciones, loading, saving, refetch: fetch, guardarCalificaciones: guardar };
};

// ── Notas Finales ────────────────────────────────────────────────────────────
export const useNotasFinales = (idCurso: string) => {
    const [notas, setNotas] = useState<NotaFinal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!idCurso) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v_notas_finales')
                .select('*')
                .eq('id_curso', idCurso);
            if (error) throw error;
            setNotas(data || []);
        } catch { toast.error('Error al cargar notas finales.'); }
        finally { setLoading(false); }
    }, [idCurso]);

    useEffect(() => { fetch(); }, [fetch]);

    return { notas, loading, refetch: fetch };
};