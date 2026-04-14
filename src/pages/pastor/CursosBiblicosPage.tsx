import React, { useState, useMemo } from 'react';
import {
    BookOpen, Plus, ArrowLeft, ChevronRight,
    Users, ClipboardList, BookMarked, BarChart2,
    Calendar, Edit2, Trash2, CheckSquare, Square,
    AlertCircle, Percent, Save, X, GraduationCap,
    ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import {
    usePeriodos, useCursos, usePonderaciones, useParticipantes,
    useClases, useAsistencias, useTareas, useCalificacionesTarea,
    useExamenes, useCalificacionesExamen, useNotasFinales,
} from '../../hooks/useCursos';
import type {
    Periodo, Curso, Participante, Clase,
    PeriodoFormData, CursoFormData, ClaseFormData,
} from '../../hooks/useCursos';

// ── Utilidades ───────────────────────────────────────────────────────────────
const fmt = (d?: string) => d
    ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const ESTADO_CURSO: Record<string, { label: string; cls: string }> = {
    activo: { label: 'Activo', cls: 'bg-green-100 text-green-700' },
    cerrado: { label: 'Cerrado', cls: 'bg-gray-100 text-gray-500' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-600' },
};

const ASIST_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    presente: { label: 'Presente', cls: 'bg-green-100 text-green-700 border-green-200', icon: <CheckSquare className="w-4 h-4" /> },
    ausente: { label: 'Ausente', cls: 'bg-red-100 text-red-600 border-red-200', icon: <Square className="w-4 h-4" /> },
    justificado: { label: 'Justificado', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle className="w-4 h-4" /> },
};

// ── Formulario genérico en modal ─────────────────────────────────────────────
function FormModal<T extends Record<string, any>>({
    isOpen, onClose, title, fields, onSubmit, saving, defaultValues,
}: {
    isOpen: boolean; onClose: () => void; title: string; saving: boolean;
    defaultValues?: Partial<T>;
    onSubmit: (d: T) => Promise<boolean>;
    fields: { name: keyof T; label: string; type?: string; required?: boolean; placeholder?: string }[];
}) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<T>({ defaultValues: defaultValues as any });
    React.useEffect(() => { if (isOpen) reset(defaultValues as any); }, [isOpen]);

    const go = async (d: T) => { if (await onSubmit(d)) { reset(); onClose(); } };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} width="md">
            <form onSubmit={handleSubmit(go)} className="space-y-4">
                {fields.map(f => (
                    <div key={String(f.name)}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required && ' *'}</label>
                        {f.type === 'textarea' ? (
                            <textarea
                                {...register(String(f.name) as any, { required: f.required ? `${f.label} es obligatorio` : false })}
                                rows={3}
                                placeholder={f.placeholder}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                        ) : (
                            <Input
                                type={f.type || 'text'}
                                {...register(String(f.name) as any, { required: f.required ? `${f.label} es obligatorio` : false })}
                                error={(errors as any)[f.name]?.message}
                                placeholder={f.placeholder}
                            />
                        )}
                    </div>
                ))}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button type="submit" fullWidth isLoading={saving}>Guardar</Button>
                </div>
            </form>
        </Modal>
    );
}

// ── SECCIÓN: Ponderaciones ───────────────────────────────────────────────────
const SeccionPonderaciones: React.FC<{ idCurso: string }> = ({ idCurso }) => {
    const { ponderaciones, loading, saving, guardarPonderaciones } = usePonderaciones(idCurso);
    const [local, setLocal] = useState<Record<string, number>>({});
    const [editing, setEditing] = useState(false);

    React.useEffect(() => {
        if (ponderaciones.length) {
            const m: Record<string, number> = {};
            ponderaciones.forEach(p => { m[p.tipo] = Number(p.porcentaje); });
            setLocal(m);
        }
    }, [ponderaciones]);

    const total = Object.values(local).reduce((s, v) => s + Number(v), 0);
    const ok = Math.abs(total - 100) < 0.01;

    const TIPOS = ['asistencia', 'tareas', 'examenes'] as const;
    const LABELS: Record<string, string> = { asistencia: 'Asistencia', tareas: 'Tareas', examenes: 'Exámenes' };
    const COLORS: Record<string, string> = { asistencia: '#22c55e', tareas: '#3b82f6', examenes: '#8b5cf6' };

    if (loading) return <div className="py-6 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Percent className="w-4 h-4" /> Ponderaciones de calificación
                </h3>
                {!editing
                    ? <Button variant="ghost" className="text-xs" onClick={() => setEditing(true)}><Edit2 className="w-3.5 h-3.5" /> Editar</Button>
                    : <span className={`text-xs font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>Total: {total.toFixed(1)}%</span>
                }
            </div>

            <div className="grid grid-cols-3 gap-3">
                {TIPOS.map(tipo => (
                    <div key={tipo} className="rounded-xl border border-gray-100 p-4 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: COLORS[tipo] + '20' }}>
                            <span className="text-lg font-bold" style={{ color: COLORS[tipo] }}>{LABELS[tipo].charAt(0)}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-600">{LABELS[tipo]}</p>
                        {editing ? (
                            <input
                                type="number"
                                min={0} max={100} step={0.5}
                                value={local[tipo] ?? 0}
                                onChange={e => setLocal(prev => ({ ...prev, [tipo]: Number(e.target.value) }))}
                                className="w-full text-center px-2 py-1 border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                                style={{ color: COLORS[tipo] }}
                            />
                        ) : (
                            <p className="text-2xl font-bold" style={{ color: COLORS[tipo] }}>{local[tipo] ?? 0}%</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Barra visual */}
            {!editing && (
                <div className="flex rounded-full overflow-hidden h-3">
                    {TIPOS.map(tipo => (
                        <div key={tipo} style={{ width: `${local[tipo] ?? 0}%`, backgroundColor: COLORS[tipo] }} title={`${LABELS[tipo]}: ${local[tipo]}%`} />
                    ))}
                </div>
            )}

            {editing && (
                <div className="flex gap-2 pt-1">
                    <Button variant="secondary" fullWidth onClick={() => setEditing(false)} disabled={saving}><X className="w-3.5 h-3.5" /> Cancelar</Button>
                    <Button fullWidth isLoading={saving} disabled={!ok}
                        onClick={async () => {
                            const ok2 = await guardarPonderaciones(TIPOS.map(t => ({ tipo: t, porcentaje: local[t] ?? 0 })));
                            if (ok2) setEditing(false);
                        }}>
                        <Save className="w-3.5 h-3.5" /> Guardar
                    </Button>
                </div>
            )}
        </div>
    );
};

// ── SECCIÓN: Participantes ───────────────────────────────────────────────────
const SeccionParticipantes: React.FC<{ idCurso: string }> = ({ idCurso }) => {
    const { participantes, loading, saving, agregarParticipante, eliminarParticipante } = useParticipantes(idCurso);
    const [todasPersonas, setTodasPersonas] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState('');
    const [showAdd, setShowAdd] = React.useState(false);

    React.useEffect(() => {
        supabase.from('personas').select('id_persona, nombres, apellidos, rol')
            .eq('estado_activo', true).order('apellidos')
            .then(({ data }) => setTodasPersonas(data || []));
    }, []);

    const yaInscritos = new Set(participantes.map(p => p.id_persona));

    const disponibles = todasPersonas.filter(p => {
        if (yaInscritos.has(p.id_persona)) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q);
    });

    if (loading) return <div className="py-6 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Participantes ({participantes.length})
                </h3>
                <Button variant="secondary" className="text-xs" onClick={() => setShowAdd(v => !v)}>
                    <Plus className="w-3.5 h-3.5" /> Agregar
                </Button>
            </div>

            {showAdd && (
                <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                    <Input placeholder="Buscar persona..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
                        {disponibles.length === 0
                            ? <p className="text-xs text-gray-400 text-center py-4">Sin resultados</p>
                            : disponibles.map(p => (
                                <button key={p.id_persona}
                                    onClick={async () => { await agregarParticipante(p.id_persona); setSearch(''); }}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-red-50 text-left transition-colors"
                                    disabled={saving}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{p.apellidos}, {p.nombres}</p>
                                        <p className="text-xs text-gray-400 capitalize">{p.rol}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-red-500" />
                                </button>
                            ))
                        }
                    </div>
                </div>
            )}

            {participantes.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">Sin participantes aún.</p>
                : (
                    <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        {participantes.map(p => (
                            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-red-700">
                                        {p.personas?.nombres?.charAt(0)}{p.personas?.apellidos?.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {p.personas?.apellidos}, {p.personas?.nombres}
                                    </p>
                                    <p className="text-xs text-gray-400 capitalize">{p.personas?.rol}</p>
                                </div>
                                <button onClick={() => eliminarParticipante(p.id)}
                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }
        </div>
    );
};

// ── SECCIÓN: Asistencia para una Clase ────────────────────────────────────────
const RegistroAsistencia: React.FC<{
    clase: Clase; participantes: Participante[];
    onClose: () => void;
}> = ({ clase, participantes, onClose }) => {
    const { asistencias, loading, saving, guardarAsistencias } = useAsistencias(clase.id_clase);
    const [local, setLocal] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const m: Record<string, string> = {};
        participantes.forEach(p => { m[p.id] = 'presente'; });
        asistencias.forEach(a => { m[a.id_participante] = a.estado; });
        setLocal(m);
    }, [asistencias, participantes]);

    const cycle = (id: string) => {
        const orden = ['presente', 'ausente', 'justificado'];
        const actual = local[id] || 'presente';
        const next = orden[(orden.indexOf(actual) + 1) % orden.length];
        setLocal(prev => ({ ...prev, [id]: next }));
    };

    const presentes = Object.values(local).filter(v => v === 'presente').length;
    const total = participantes.length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-800">{clase.nombre}</p>
                    <p className="text-xs text-gray-400">{fmt(clase.fecha)}</p>
                </div>
                <span className="text-sm font-bold text-green-600">{presentes}/{total} presentes</span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: total ? `${presentes / total * 100}%` : '0%' }} />
            </div>

            <p className="text-xs text-gray-400">Toca el estado para cambiar: Presente → Ausente → Justificado</p>

            {loading ? <div className="flex justify-center py-4"><Spinner /></div> : (
                <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                    {participantes.map(p => {
                        const estado = local[p.id] || 'presente';
                        const cfg = ASIST_CONFIG[estado];
                        return (
                            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">{p.personas?.apellidos}, {p.personas?.nombres}</p>
                                </div>
                                <button onClick={() => cycle(p.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${cfg.cls}`}>
                                    {cfg.icon} {cfg.label}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
                <Button fullWidth isLoading={saving}
                    onClick={async () => {
                        const registros = participantes.map(p => ({ id_participante: p.id, estado: local[p.id] || 'presente' }));
                        const ok = await guardarAsistencias(registros);
                        if (ok) onClose();
                    }}>
                    <Save className="w-4 h-4" /> Guardar asistencias
                </Button>
            </div>
        </div>
    );
};

// ── SECCIÓN: Clases ──────────────────────────────────────────────────────────
const SeccionClases: React.FC<{ idCurso: string; participantes: Participante[] }> = ({ idCurso, participantes }) => {
    const { clases, loading, saving, crearClase, eliminarClase } = useClases(idCurso);
    const [showForm, setShowForm] = React.useState(false);
    const [claseAsist, setClaseAsist] = React.useState<Clase | null>(null);

    if (loading) return <div className="py-6 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Clases ({clases.length})
                </h3>
                <Button variant="secondary" className="text-xs" onClick={() => setShowForm(true)}>
                    <Plus className="w-3.5 h-3.5" /> Nueva clase
                </Button>
            </div>

            {clases.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">Sin clases registradas.</p>
                : (
                    <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        {clases.map((c, i) => (
                            <div key={c.id_clase} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{c.nombre}</p>
                                    <p className="text-xs text-gray-400">{fmt(c.fecha)}</p>
                                </div>
                                <button onClick={() => setClaseAsist(c)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                                    <CheckSquare className="w-3.5 h-3.5" /> Asistencia
                                </button>
                                <button onClick={() => eliminarClase(c.id_clase)}
                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }

            <FormModal<ClaseFormData>
                isOpen={showForm} onClose={() => setShowForm(false)}
                title="Nueva Clase" saving={saving}
                onSubmit={crearClase}
                fields={[
                    { name: 'nombre', label: 'Nombre de la clase', required: true, placeholder: 'Ej. Clase 1 — Génesis' },
                    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
                ]}
            />

            <Modal isOpen={!!claseAsist} onClose={() => setClaseAsist(null)} title="Registrar Asistencia" width="md">
                {claseAsist && (
                    <RegistroAsistencia clase={claseAsist} participantes={participantes} onClose={() => setClaseAsist(null)} />
                )}
            </Modal>
        </div>
    );
};

// ── SECCIÓN: Calificaciones (Tareas o Exámenes) ──────────────────────────────
function SeccionCalificaciones({ tipo, idCurso, participantes }: {
    tipo: 'tareas' | 'examenes'; idCurso: string; participantes: Participante[];
}) {
    const esTarea = tipo === 'tareas';
    const { tareas, loading: lT, saving: sT, crearTarea, eliminarTarea } = useTareas(idCurso);
    const { examenes, loading: lE, saving: sE, crearExamen, eliminarExamen } = useExamenes(idCurso);

    const items = esTarea ? tareas : examenes;
    const loadingItems = esTarea ? lT : lE;
    const savingItems = esTarea ? sT : sE;
    const crearItem = esTarea ? crearTarea : crearExamen;
    const eliminarItem = esTarea
        ? (id: string) => eliminarTarea(id)
        : (id: string) => eliminarExamen(id);
    const idKey = esTarea ? 'id_tarea' : 'id_examen';

    const [showForm, setShowForm] = React.useState(false);
    const [calItem, setCalItem] = React.useState<any | null>(null);

    if (loadingItems) return <div className="py-6 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    {esTarea ? <ClipboardList className="w-4 h-4" /> : <BookMarked className="w-4 h-4" />}
                    {esTarea ? 'Tareas' : 'Exámenes'} ({items.length})
                </h3>
                <Button variant="secondary" className="text-xs" onClick={() => setShowForm(true)}>
                    <Plus className="w-3.5 h-3.5" /> {esTarea ? 'Nueva tarea' : 'Nuevo examen'}
                </Button>
            </div>

            {items.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">Sin {esTarea ? 'tareas' : 'exámenes'} aún.</p>
                : (
                    <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        {items.map((item: any) => (
                            <div key={item[idKey]} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.titulo}</p>
                                    {(item.fecha_entrega || item.fecha) && (
                                        <p className="text-xs text-gray-400">{fmt(item.fecha_entrega || item.fecha)}</p>
                                    )}
                                </div>
                                <button onClick={() => setCalItem(item)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" /> Calificar
                                </button>
                                <button onClick={() => eliminarItem(item[idKey])}
                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }

            <FormModal
                isOpen={showForm} onClose={() => setShowForm(false)}
                title={esTarea ? 'Nueva Tarea' : 'Nuevo Examen'} saving={savingItems}
                onSubmit={crearItem as any}
                fields={[
                    { name: 'titulo', label: esTarea ? 'Título de la tarea' : 'Título del examen', required: true, placeholder: esTarea ? 'Tarea 1' : 'Examen parcial' },
                    { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Opcional...' },
                    { name: esTarea ? 'fecha_entrega' : 'fecha', label: esTarea ? 'Fecha de entrega' : 'Fecha del examen', type: 'date' },
                ]}
            />

            {calItem && (
                <Modal isOpen={!!calItem} onClose={() => setCalItem(null)} title={`Calificaciones — ${calItem.titulo}`} width="md">
                    <PanelCalificaciones
                        tipo={tipo} idItem={calItem[idKey]}
                        participantes={participantes}
                        onClose={() => setCalItem(null)}
                    />
                </Modal>
            )}
        </div>
    );
}

// ── Panel calificaciones inline ──────────────────────────────────────────────
const PanelCalificaciones: React.FC<{
    tipo: 'tareas' | 'examenes'; idItem: string;
    participantes: Participante[]; onClose: () => void;
}> = ({ tipo, idItem, participantes, onClose }) => {
    const {
        calificaciones: calT, loading: lT, saving: sT, guardarCalificaciones: saveT,
    } = useCalificacionesTarea(tipo === 'tareas' ? idItem : '');
    const {
        calificaciones: calE, loading: lE, saving: sE, guardarCalificaciones: saveE,
    } = useCalificacionesExamen(tipo === 'examenes' ? idItem : '');

    const cals = tipo === 'tareas' ? calT : calE;
    const loading = tipo === 'tareas' ? lT : lE;
    const saving = tipo === 'tareas' ? sT : sE;
    const guardar = tipo === 'tareas' ? saveT : saveE;

    const [local, setLocal] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        const m: Record<string, string> = {};
        participantes.forEach(p => { m[p.id] = ''; });
        cals.forEach(c => { m[c.id_participante] = c.calificacion != null ? String(c.calificacion) : ''; });
        setLocal(m);
    }, [cals, participantes]);

    const calificadas = participantes.filter(p => local[p.id] !== '' && local[p.id] !== undefined).length;
    const pct = participantes.length ? Math.round(calificadas / participantes.length * 100) : 0;

    if (loading) return <div className="py-8 flex justify-center"><Spinner /></div>;

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-purple-600 flex-shrink-0">{calificadas}/{participantes.length} calificados</span>
            </div>

            <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                {participantes.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                        <p className="flex-1 text-sm text-gray-800 truncate">{p.personas?.apellidos}, {p.personas?.nombres}</p>
                        <div className="flex items-center gap-1">
                            <input
                                type="number" min={0} max={100} step={0.5}
                                value={local[p.id] ?? ''}
                                onChange={e => setLocal(prev => ({ ...prev, [p.id]: e.target.value }))}
                                placeholder="—"
                                className="w-20 text-center px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            <span className="text-xs text-gray-400">/100</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
                <Button fullWidth isLoading={saving}
                    onClick={async () => {
                        const registros = participantes.map(p => ({
                            id_participante: p.id,
                            calificacion: local[p.id] !== '' && local[p.id] !== undefined ? Number(local[p.id]) : null,
                        }));
                        const ok = await guardar(registros);
                        if (ok) onClose();
                    }}>
                    <Save className="w-4 h-4" /> Guardar calificaciones
                </Button>
            </div>
        </div>
    );
};

// ── SECCIÓN: Notas Finales ───────────────────────────────────────────────────
const SeccionNotas: React.FC<{ idCurso: string; participantes: Participante[] }> = ({ idCurso, participantes }) => {
    const { notas, loading } = useNotasFinales(idCurso);

    const mapa = useMemo(() => {
        const m: Record<string, number> = {};
        notas.forEach(n => { m[n.id_participante] = Number(n.nota_final); });
        return m;
    }, [notas]);

    if (loading) return <div className="py-6 flex justify-center"><Spinner /></div>;

    const getColor = (n: number) => n >= 70 ? 'text-green-600' : n >= 50 ? 'text-amber-600' : 'text-red-600';
    const getBg = (n: number) => n >= 70 ? 'bg-green-50' : n >= 50 ? 'bg-amber-50' : 'bg-red-50';

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Notas finales
            </h3>
            {participantes.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">Sin participantes.</p>
                : (
                    <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        {participantes.map(p => {
                            const nota = mapa[p.id];
                            const tieneNota = nota !== undefined && nota !== null;
                            return (
                                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800">{p.personas?.apellidos}, {p.personas?.nombres}</p>
                                    </div>
                                    {tieneNota ? (
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getBg(nota)}`}>
                                            <span className={`text-base font-bold ${getColor(nota)}`}>{nota.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400">/100</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-300 italic">Sin datos</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            }
            <p className="text-xs text-gray-400">
                Nota ≥ 70 = aprobado · 50–69 = en riesgo · &lt; 50 = reprobado
            </p>
        </div>
    );
};

// ── Detalle de un Curso ──────────────────────────────────────────────────────
type TabCurso = 'ponderaciones' | 'participantes' | 'clases' | 'tareas' | 'examenes' | 'notas';

const DetalleCurso: React.FC<{ curso: Curso; onBack: () => void }> = ({ curso, onBack }) => {
    const [tab, setTab] = useState<TabCurso>('participantes');
    const { participantes } = useParticipantes(curso.id_curso);

    const tabs: { key: TabCurso; label: string; icon: React.ReactNode }[] = [
        { key: 'participantes', label: 'Participantes', icon: <Users className="w-3.5 h-3.5" /> },
        { key: 'ponderaciones', label: 'Ponderaciones', icon: <Percent className="w-3.5 h-3.5" /> },
        { key: 'clases', label: 'Clases', icon: <Calendar className="w-3.5 h-3.5" /> },
        { key: 'tareas', label: 'Tareas', icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { key: 'examenes', label: 'Exámenes', icon: <BookMarked className="w-3.5 h-3.5" /> },
        { key: 'notas', label: 'Notas finales', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ];

    const cfg = ESTADO_CURSO[curso.estado] || ESTADO_CURSO.activo;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Cursos
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="font-medium text-gray-700 truncate">{curso.nombre}</span>
            </div>

            {/* Header del curso */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-gray-900">{curso.nombre}</h2>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                        </div>
                        {curso.descripcion && <p className="text-sm text-gray-500 mt-1">{curso.descripcion}</p>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Inicio: {fmt(curso.fecha_inicio)}</span>
                    {curso.fecha_fin && <span>Fin: {fmt(curso.fecha_fin)}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {participantes.length} participantes</span>
                    {curso.periodos && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {curso.periodos.nombre}</span>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
                            }`}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Contenido del tab */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                {tab === 'participantes' && <SeccionParticipantes idCurso={curso.id_curso} />}
                {tab === 'ponderaciones' && <SeccionPonderaciones idCurso={curso.id_curso} />}
                {tab === 'clases' && <SeccionClases idCurso={curso.id_curso} participantes={participantes} />}
                {tab === 'tareas' && <SeccionCalificaciones tipo="tareas" idCurso={curso.id_curso} participantes={participantes} />}
                {tab === 'examenes' && <SeccionCalificaciones tipo="examenes" idCurso={curso.id_curso} participantes={participantes} />}
                {tab === 'notas' && <SeccionNotas idCurso={curso.id_curso} participantes={participantes} />}
            </div>
        </div>
    );
};

// ── Tarjeta de Periodo ────────────────────────────────────────────────────────
const PeriodoRow: React.FC<{
    periodo: Periodo;
    cursos: Curso[];
    onSelectCurso: (c: Curso) => void;
    onEditPeriodo: (p: Periodo) => void;
    onTogglePeriodo: (p: Periodo) => void;
    onCrearCurso: (p: Periodo) => void;
    onEditCurso: (c: Curso) => void;
}> = ({ periodo, cursos, onSelectCurso, onEditPeriodo, onTogglePeriodo, onCrearCurso, onEditCurso }) => {
    const [open, setOpen] = useState(true);
    const cfg = ESTADO_CURSO[periodo.estado] || ESTADO_CURSO.activo;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header del periodo */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <button onClick={() => setOpen(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{periodo.nombre}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(periodo.fecha_inicio)} → {fmt(periodo.fecha_fin)} · {cursos.length} curso{cursos.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" className="text-xs p-2" onClick={() => onCrearCurso(periodo)}>
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" className="text-xs p-2" onClick={() => onEditPeriodo(periodo)}>
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <button onClick={() => onTogglePeriodo(periodo)}
                        className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        {periodo.estado === 'activo' ? 'Cerrar' : 'Reactivar'}
                    </button>
                </div>
            </div>

            {/* Lista de cursos */}
            {open && (
                <div className="divide-y divide-gray-50">
                    {cursos.length === 0 ? (
                        <div className="px-5 py-6 text-center">
                            <p className="text-sm text-gray-400">Sin cursos en este periodo.</p>
                            <button onClick={() => onCrearCurso(periodo)}
                                className="mt-2 text-xs text-red-600 hover:underline font-medium">+ Crear primer curso</button>
                        </div>
                    ) : cursos.map(c => {
                        const cs = ESTADO_CURSO[c.estado] || ESTADO_CURSO.activo;
                        return (
                            <div key={c.id_curso} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center flex-shrink-0">
                                    <GraduationCap className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cs.cls}`}>{cs.label}</span>
                                    </div>
                                    {c.descripcion && <p className="text-xs text-gray-400 truncate">{c.descripcion}</p>}
                                    <p className="text-xs text-gray-400">{fmt(c.fecha_inicio)}{c.fecha_fin ? ` → ${fmt(c.fecha_fin)}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => onEditCurso(c)}
                                        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <Button variant="secondary" className="text-xs" onClick={() => onSelectCurso(c)}>
                                        Ver <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export const CursosBiblicosPage: React.FC = () => {
    const { periodos, loading: lP, saving: sP, crearPeriodo, actualizarPeriodo, toggleEstadoPeriodo } = usePeriodos();
    const { cursos, loading: lC, saving: sC, crearCurso, actualizarCurso } = useCursos();

    const [cursosSeleccionado, setCursoSeleccionado] = useState<Curso | null>(null);
    const [showPeriodoForm, setShowPeriodoForm] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
    const [showCursoForm, setShowCursoForm] = useState(false);
    const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
    const [periodoCurso, setPeriodoCurso] = useState<Periodo | null>(null);

    const cursosPorPeriodo = useMemo(() => {
        const m: Record<string, Curso[]> = {};
        cursos.forEach(c => {
            if (!m[c.id_periodo]) m[c.id_periodo] = [];
            m[c.id_periodo].push(c);
        });
        return m;
    }, [cursos]);

    if (cursosSeleccionado) {
        return <DetalleCurso curso={cursosSeleccionado} onBack={() => setCursoSeleccionado(null)} />;
    }

    if (lP || lC) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-red-600" /> Cursos Bíblicos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {periodos.length} periodo{periodos.length !== 1 ? 's' : ''} · {cursos.length} curso{cursos.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button onClick={() => { setEditingPeriodo(null); setShowPeriodoForm(true); }}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo periodo</span>
                </Button>
            </div>

            {periodos.length === 0 ? (
                <EmptyState
                    icon={<BookOpen className="w-12 h-12 text-gray-300" />}
                    title="Sin periodos"
                    description="Crea un periodo (ej. 2025-2026) para comenzar a registrar cursos bíblicos."
                    action={<Button onClick={() => setShowPeriodoForm(true)}><Plus className="w-4 h-4" /> Crear primer periodo</Button>}
                />
            ) : (
                <div className="space-y-4">
                    {periodos.map(p => (
                        <PeriodoRow
                            key={p.id_periodo}
                            periodo={p}
                            cursos={cursosPorPeriodo[p.id_periodo] || []}
                            onSelectCurso={setCursoSeleccionado}
                            onEditPeriodo={per => { setEditingPeriodo(per); setShowPeriodoForm(true); }}
                            onTogglePeriodo={per => toggleEstadoPeriodo(per.id_periodo, per.estado)}
                            onCrearCurso={per => { setPeriodoCurso(per); setEditingCurso(null); setShowCursoForm(true); }}
                            onEditCurso={cur => { setEditingCurso(cur); setPeriodoCurso(null); setShowCursoForm(true); }}
                        />
                    ))}
                </div>
            )}

            {/* Modal Periodo */}
            <Modal isOpen={showPeriodoForm} onClose={() => { setShowPeriodoForm(false); setEditingPeriodo(null); }}
                title={editingPeriodo ? 'Editar Periodo' : 'Nuevo Periodo'} width="md">
                <PeriodoForm
                    saving={sP}
                    defaultValues={editingPeriodo ? {
                        nombre: editingPeriodo.nombre,
                        fecha_inicio: editingPeriodo.fecha_inicio,
                        fecha_fin: editingPeriodo.fecha_fin,
                    } : undefined}
                    onSubmit={async data => {
                        const ok = editingPeriodo
                            ? await actualizarPeriodo(editingPeriodo.id_periodo, data)
                            : await crearPeriodo(data);
                        if (ok) { setShowPeriodoForm(false); setEditingPeriodo(null); }
                        return ok;
                    }}
                    onClose={() => { setShowPeriodoForm(false); setEditingPeriodo(null); }}
                />
            </Modal>

            {/* Modal Curso */}
            <Modal isOpen={showCursoForm} onClose={() => { setShowCursoForm(false); setEditingCurso(null); }}
                title={editingCurso ? 'Editar Curso' : 'Nuevo Curso'} width="md">
                <CursoForm
                    saving={sC}
                    periodos={periodos}
                    periodoPorDefecto={periodoCurso?.id_periodo || editingCurso?.id_periodo || periodos[0]?.id_periodo}
                    defaultValues={editingCurso ? {
                        id_periodo: editingCurso.id_periodo,
                        nombre: editingCurso.nombre,
                        descripcion: editingCurso.descripcion || '',
                        fecha_inicio: editingCurso.fecha_inicio,
                        fecha_fin: editingCurso.fecha_fin || '',
                    } : undefined}
                    onSubmit={async data => {
                        const ok = editingCurso
                            ? await actualizarCurso(editingCurso.id_curso, data)
                            : await crearCurso(data);
                        if (ok) { setShowCursoForm(false); setEditingCurso(null); }
                        return ok;
                    }}
                    onClose={() => { setShowCursoForm(false); setEditingCurso(null); }}
                />
            </Modal>
        </div>
    );
};

// ── Formulario de Periodo ────────────────────────────────────────────────────
const PeriodoForm: React.FC<{
    saving: boolean;
    defaultValues?: Partial<PeriodoFormData>;
    onSubmit: (d: PeriodoFormData) => Promise<boolean>;
    onClose: () => void;
}> = ({ saving, defaultValues, onSubmit, onClose }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<PeriodoFormData>({ defaultValues });
    React.useEffect(() => { reset(defaultValues); }, [defaultValues]);
    const go = async (d: PeriodoFormData) => { await onSubmit(d); };
    return (
        <form onSubmit={handleSubmit(go)} className="space-y-4">
            <Input label="Nombre del periodo *" {...register('nombre', { required: 'Requerido' })} error={errors.nombre?.message} placeholder="Ej. Periodo 2025-2026" />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha inicio *" type="date" {...register('fecha_inicio', { required: 'Requerido' })} error={errors.fecha_inicio?.message} />
                <Input label="Fecha fin *" type="date" {...register('fecha_fin', { required: 'Requerido' })} error={errors.fecha_fin?.message} />
            </div>
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" fullWidth isLoading={saving}>Guardar</Button>
            </div>
        </form>
    );
};

// ── Formulario de Curso ──────────────────────────────────────────────────────
const CursoForm: React.FC<{
    saving: boolean;
    periodos: Periodo[];
    periodoPorDefecto?: string;
    defaultValues?: Partial<CursoFormData>;
    onSubmit: (d: CursoFormData) => Promise<boolean>;
    onClose: () => void;
}> = ({ saving, periodos, periodoPorDefecto, defaultValues, onSubmit, onClose }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CursoFormData>({
        defaultValues: { id_periodo: periodoPorDefecto, ...defaultValues },
    });
    React.useEffect(() => { reset({ id_periodo: periodoPorDefecto, ...defaultValues }); }, [defaultValues, periodoPorDefecto]);

    const go = async (d: CursoFormData) => { await onSubmit({ ...d, fecha_fin: d.fecha_fin || undefined }); };

    return (
        <form onSubmit={handleSubmit(go)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periodo *</label>
                <select {...register('id_periodo', { required: 'Requerido' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
                    {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>)}
                </select>
                {errors.id_periodo && <p className="mt-1 text-sm text-red-600">{errors.id_periodo.message}</p>}
            </div>
            <Input label="Nombre del curso *" {...register('nombre', { required: 'Requerido' })} error={errors.nombre?.message} placeholder="Ej. Fundamentos de la Fe" />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea {...register('descripcion')} rows={2} placeholder="Descripción breve..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha inicio *" type="date" {...register('fecha_inicio', { required: 'Requerido' })} error={errors.fecha_inicio?.message} />
                <Input label="Fecha fin" type="date" {...register('fecha_fin')} />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                Al crear el curso se asignarán ponderaciones por defecto: <strong>Asistencia 10% · Tareas 50% · Exámenes 40%</strong>. Puedes cambiarlas desde el curso.
            </div>
            <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" fullWidth isLoading={saving}>Crear curso</Button>
            </div>
        </form>
    );
};