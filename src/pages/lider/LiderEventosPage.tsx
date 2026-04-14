import React, { useState, useMemo } from 'react';
import {
    Plus, Calendar, LayoutList, Filter, ArrowLeft,
    AlertCircle, MapPin, ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { EventoCard } from '../../components/eventos/EventoCard';
import { EventoDetailModal } from '../../components/eventos/EventoDetailModal';
import { PublicidadGeneratorModal } from '../../components/eventos/PublicidadGeneratorModal';
import { Cronograma } from '../../components/eventos/Cronograma';
import { useEventos } from '../../hooks/useEventos';
import { useMinisterios } from '../../hooks/useMinisterios';
import { useAuth } from '../../hooks/useAuth';
import { Evento, EventoFormData, Ministerio } from '../../types';
import { useForm } from 'react-hook-form';

type Vista = 'lista' | 'cronograma';
type FiltroEstado = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';
type Pantalla = 'lista' | 'seleccionar-ministerio' | 'formulario';

const toDateTimeLocal = (iso?: string) => iso ? iso.slice(0, 16) : '';

// ── Formulario inline ────────────────────────────────────────────────────────
const EventoFormInline: React.FC<{
    ministerio: Ministerio;
    saving: boolean;
    onSubmit: (data: EventoFormData) => Promise<boolean>;
    onBack: () => void;
    editingEvento?: Evento | null;
}> = ({ ministerio, saving, onSubmit, onBack, editingEvento }) => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<EventoFormData>({
        defaultValues: editingEvento ? {
            titulo: editingEvento.titulo,
            descripcion: editingEvento.descripcion || '',
            id_ministerio: editingEvento.id_ministerio,
            fecha_inicio: toDateTimeLocal(editingEvento.fecha_inicio),
            fecha_fin: toDateTimeLocal(editingEvento.fecha_fin),
            lugar: editingEvento.lugar || '',
        } : {
            id_ministerio: ministerio.id_ministerio,
            titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', lugar: '',
        },
    });
    const fechaInicio = watch('fecha_inicio');

    const onFormSubmit = async (data: EventoFormData) => {
        await onSubmit({
            ...data,
            id_ministerio: ministerio.id_ministerio,
            fecha_inicio: new Date(data.fecha_inicio).toISOString(),
            fecha_fin: new Date(data.fecha_fin).toISOString(),
            descripcion: data.descripcion || undefined,
            lugar: data.lugar || undefined,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-2xl border"
                style={{ backgroundColor: ministerio.color + '08', borderColor: ministerio.color + '30' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: ministerio.color }}>
                    {ministerio.nombre.charAt(0)}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">{ministerio.nombre}</p>
                    <p className="text-xs text-gray-400">El evento quedará pendiente de aprobación del pastor</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título del evento *</label>
                    <input {...register('titulo', { required: 'El título es obligatorio' })}
                        placeholder="Ej. Retiro de Jóvenes"
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" />
                    {errors.titulo && <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea {...register('descripcion')} rows={3} placeholder="Detalles del evento..."
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha inicio *
                        </label>
                        <input type="datetime-local" {...register('fecha_inicio', { required: 'Requerido' })}
                            className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" />
                        {errors.fecha_inicio && <p className="mt-1 text-sm text-red-600">{errors.fecha_inicio.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Fecha fin *
                        </label>
                        <input type="datetime-local" min={fechaInicio || undefined}
                            {...register('fecha_fin', {
                                required: 'Requerido',
                                validate: v => !fechaInicio || v >= fechaInicio || 'La fecha de fin debe ser posterior',
                            })}
                            className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" />
                        {errors.fecha_fin && <p className="mt-1 text-sm text-red-600">{errors.fecha_fin.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Lugar
                    </label>
                    <input type="text" {...register('lugar')} placeholder="Ej. Templo principal..."
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors" />
                </div>

                {!editingEvento && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                        <strong>Nota:</strong> El evento quedará pendiente de aprobación por parte del pastor.
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onBack} disabled={saving}>Cancelar</Button>
                    <Button type="submit" fullWidth isLoading={saving}>
                        {editingEvento ? 'Guardar cambios' : 'Crear evento'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

// ── Página principal ─────────────────────────────────────────────────────────
export const LiderEventosPage: React.FC = () => {
    const { user } = useAuth();
    const myPersonaId = user?.persona?.id_persona || '';

    const { eventos, loading, saving, crearEvento, actualizarEvento, subirImagenPublicidad } = useEventos();
    const { ministerios } = useMinisterios();

    const misMinisterios = useMemo(
        () => ministerios.filter(m => m.estado_activo && m.ministerio_lideres.some(ml => ml.id_persona === myPersonaId)),
        [ministerios, myPersonaId]
    );
    const misIds = useMemo(() => new Set(misMinisterios.map(m => m.id_ministerio)), [misMinisterios]);

    const [pantalla, setPantalla] = useState<Pantalla>('lista');
    const [ministerioSel, setMinisterioSel] = useState<Ministerio | null>(null);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [vista, setVista] = useState<Vista>('lista');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [detailEvento, setDetailEvento] = useState<Evento | null>(null);
    const [publicidadEvento, setPublicidadEvento] = useState<Evento | null>(null);

    // Solo mis eventos
    const misEventos = useMemo(
        () => eventos.filter(e => misIds.has(e.id_ministerio)),
        [eventos, misIds]
    );

    const eventosFiltrados = useMemo(() => {
        if (filtroEstado === 'todos') return misEventos;
        return misEventos.filter(e => e.estado === filtroEstado);
    }, [misEventos, filtroEstado]);

    const handleFormSubmit = async (data: EventoFormData): Promise<boolean> => {
        let ok: boolean;
        if (editingEvento) ok = await actualizarEvento(editingEvento.id_evento, data);
        else ok = await crearEvento(data);
        if (ok) { setPantalla('lista'); setMinisterioSel(null); setEditingEvento(null); }
        return ok;
    };

    const irAEditar = (ev: Evento) => {
        const min = ministerios.find(m => m.id_ministerio === ev.id_ministerio);
        if (min) { setEditingEvento(ev); setMinisterioSel(min); setPantalla('formulario'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    if (misMinisterios.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Mis Eventos</h1>
                <EmptyState icon={<AlertCircle className="w-12 h-12 text-amber-400" />}
                    title="Sin ministerios asignados"
                    description="Para crear eventos necesitas estar asignado como líder de al menos un ministerio." />
            </div>
        );
    }

    // Pantalla seleccionar ministerio
    if (pantalla === 'seleccionar-ministerio') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => setPantalla('lista')}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Mis Eventos
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-medium text-gray-700">Seleccionar ministerio</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">¿Para qué ministerio es el evento?</h2>
                    <p className="text-sm text-gray-400 mt-1">Solo puedes crear eventos para tus ministerios.</p>
                </div>
                {misMinisterios.length === 1 ? (
                    // Si solo hay uno, ir directo al formulario
                    (() => {
                        setMinisterioSel(misMinisterios[0]);
                        setPantalla('formulario');
                        return null;
                    })()
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {misMinisterios.map(m => (
                            <button key={m.id_ministerio}
                                onClick={() => { setMinisterioSel(m); setPantalla('formulario'); }}
                                className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                                <div className="h-1.5 w-full" style={{ backgroundColor: m.color }} />
                                <div className="p-5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                        style={{ backgroundColor: m.color }}>
                                        {m.nombre.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{m.nombre}</p>
                                        {m.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.descripcion}</p>}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Pantalla formulario
    if (pantalla === 'formulario' && ministerioSel) {
        return (
            <div className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-2">
                    <button onClick={() => setPantalla('lista')}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="w-4 h-4" /> Mis Eventos
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-medium text-gray-700">
                        {editingEvento ? 'Editar evento' : 'Nuevo evento'}
                    </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                    {editingEvento ? 'Editar evento' : 'Nuevo evento'}
                </h2>
                <EventoFormInline
                    ministerio={ministerioSel} saving={saving}
                    onSubmit={handleFormSubmit}
                    onBack={() => {
                        setPantalla(misMinisterios.length > 1 ? 'seleccionar-ministerio' : 'lista');
                        setEditingEvento(null);
                    }}
                    editingEvento={editingEvento}
                />
            </div>
        );
    }

    // Lista principal
    const pendientesCount = misEventos.filter(e => e.estado === 'pendiente').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Eventos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {misEventos.length} eventos en tus ministerios
                        {pendientesCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                {pendientesCount} pendiente{pendientesCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        <button onClick={() => setVista('lista')}
                            className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${vista === 'lista' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <LayoutList className="w-3.5 h-3.5" /> Lista
                        </button>
                        <button onClick={() => setVista('cronograma')}
                            className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${vista === 'cronograma' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Calendar className="w-3.5 h-3.5" /> Cronograma
                        </button>
                    </div>
                    <Button onClick={() => { setEditingEvento(null); setPantalla(misMinisterios.length === 1 ? 'formulario' : 'seleccionar-ministerio'); if (misMinisterios.length === 1) setMinisterioSel(misMinisterios[0]); }}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nuevo evento</span>
                    </Button>
                </div>
            </div>

            {vista === 'lista' && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {(['todos', 'pendiente', 'aprobado', 'rechazado'] as FiltroEstado[]).map(f => (
                        <button key={f} onClick={() => setFiltroEstado(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filtroEstado === f ? 'bg-gray-900 text-white' : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'}`}>
                            {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            )}

            {vista === 'cronograma' && (
                <Cronograma eventos={misEventos} onEventoClick={e => setDetailEvento(e)} />
            )}

            {vista === 'lista' && (
                eventosFiltrados.length === 0 ? (
                    <EmptyState icon={<Calendar className="w-12 h-12 text-gray-400" />}
                        title={misEventos.length === 0 ? 'Sin eventos aún' : 'Sin resultados'}
                        description={misEventos.length === 0 ? 'Crea tu primer evento usando el botón de arriba.' : 'Prueba con otro filtro.'}
                        action={misEventos.length === 0 ? (
                            <Button onClick={() => { setPantalla(misMinisterios.length === 1 ? 'formulario' : 'seleccionar-ministerio'); if (misMinisterios.length === 1) setMinisterioSel(misMinisterios[0]); }}>
                                <Plus className="w-4 h-4" /> Crear primer evento
                            </Button>
                        ) : undefined}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {eventosFiltrados.map(ev => (
                            <EventoCard key={ev.id_evento} evento={ev} isPastor={false}
                                onEdit={ev.estado === 'pendiente' ? irAEditar : undefined}
                                onVerPublicidad={e => setDetailEvento(e)} />
                        ))}
                    </div>
                )
            )}

            <EventoDetailModal isOpen={!!detailEvento} onClose={() => setDetailEvento(null)}
                evento={detailEvento} isPastor={false}
                onSubirPublicidad={subirImagenPublicidad}
                onGenerarPublicidad={e => { setDetailEvento(null); setPublicidadEvento(e); }} />

            <PublicidadGeneratorModal isOpen={!!publicidadEvento}
                onClose={() => setPublicidadEvento(null)}
                evento={publicidadEvento} onGuardar={subirImagenPublicidad} />
        </div>
    );
};