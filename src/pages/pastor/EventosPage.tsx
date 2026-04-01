import React, { useState, useMemo } from 'react';
import {
    Plus, Calendar, LayoutList, Filter, ArrowLeft,
    Users, CheckCircle2, XCircle, AlertCircle, MapPin, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
type Pantalla = 'eventos' | 'seleccionar-ministerio' | 'formulario';

// ─── Componente: tarjeta de ministerio para selección ───────────────────────
const MinisterioSelectCard: React.FC<{
    ministerio: Ministerio;
    onClick: () => void;
}> = ({ ministerio, onClick }) => {
    const lideresActivos = ministerio.ministerio_lideres.filter(ml => ml.personas?.estado_activo);

    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group"
        >
            <div className="h-1.5 w-full" style={{ backgroundColor: ministerio.color }} />
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    {/* Logo / inicial */}
                    <div
                        className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
                        style={{ backgroundColor: ministerio.color + '20', border: `2px solid ${ministerio.color}30` }}
                    >
                        {ministerio.logo_url ? (
                            <img src={ministerio.logo_url} alt={ministerio.nombre} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold" style={{ color: ministerio.color }}>
                                {ministerio.nombre.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{ministerio.nombre}</h3>
                            {ministerio.es_principal && (
                                <span
                                    className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: ministerio.color }}
                                >
                                    Principal
                                </span>
                            )}
                        </div>
                        {ministerio.descripcion && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{ministerio.descripcion}</p>
                        )}

                        {/* Líderes */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <Users className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            {lideresActivos.length === 0 ? (
                                <span className="text-xs text-gray-400 italic">Sin líderes asignados</span>
                            ) : (
                                <span className="text-xs text-gray-500">
                                    {lideresActivos.map(ml =>
                                        `${ml.personas.nombres} ${ml.personas.apellidos.split(' ')[0]}`
                                    ).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1 transition-colors" />
                </div>
            </div>
        </button>
    );
};

// ─── Componente: formulario inline de evento ─────────────────────────────────
const toDateTimeLocal = (iso?: string) => iso ? iso.slice(0, 16) : '';

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
            titulo: '',
            descripcion: '',
            fecha_inicio: '',
            fecha_fin: '',
            lugar: '',
        },
    });

    const fechaInicio = watch('fecha_inicio');

    const onFormSubmit = async (data: EventoFormData) => {
        const payload: EventoFormData = {
            ...data,
            id_ministerio: ministerio.id_ministerio,
            fecha_inicio: new Date(data.fecha_inicio).toISOString(),
            fecha_fin: new Date(data.fecha_fin).toISOString(),
            descripcion: data.descripcion || undefined,
            lugar: data.lugar || undefined,
        };
        await onSubmit(payload);
    };

    return (
        <div className="space-y-6">
            {/* Ministerio seleccionado — resumen */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border"
                style={{ backgroundColor: ministerio.color + '08', borderColor: ministerio.color + '30' }}>
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: ministerio.color }}
                >
                    {ministerio.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">{ministerio.nombre}</p>
                    <p className="text-xs text-gray-400">
                        {ministerio.ministerio_lideres.filter(ml => ml.personas?.estado_activo).map(ml =>
                            `${ml.personas.nombres} ${ml.personas.apellidos.split(' ')[0]}`
                        ).join(', ') || 'Sin líderes asignados'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                {/* Título */}
                <Input
                    label="Título del evento *"
                    {...register('titulo', { required: 'El título es obligatorio' })}
                    error={errors.titulo?.message}
                    placeholder="Ej. Retiro de Jóvenes 2026"
                />

                {/* Descripción */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                        {...register('descripcion')}
                        rows={3}
                        placeholder="Detalles del evento..."
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none"
                    />
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Fecha inicio *
                            </span>
                        </label>
                        <input
                            type="datetime-local"
                            {...register('fecha_inicio', { required: 'La fecha de inicio es obligatoria' })}
                            className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        />
                        {errors.fecha_inicio && (
                            <p className="mt-1 text-sm text-red-600">{errors.fecha_inicio.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Fecha fin *
                            </span>
                        </label>
                        <input
                            type="datetime-local"
                            {...register('fecha_fin', {
                                required: 'La fecha de fin es obligatoria',
                                validate: v => !fechaInicio || v >= fechaInicio || 'La fecha de fin debe ser posterior al inicio',
                            })}
                            min={fechaInicio || undefined}
                            className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        />
                        {errors.fecha_fin && (
                            <p className="mt-1 text-sm text-red-600">{errors.fecha_fin.message}</p>
                        )}
                    </div>
                </div>

                {/* Lugar */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Lugar
                        </span>
                    </label>
                    <input
                        type="text"
                        {...register('lugar')}
                        placeholder="Ej. Templo principal, Salón de jóvenes..."
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    />
                </div>

                {!editingEvento && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                        <strong>Nota:</strong> El evento quedará pendiente de aprobación. Los pastores recibirán una notificación.
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onBack} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" fullWidth isLoading={saving}>
                        {editingEvento ? 'Guardar cambios' : 'Crear evento'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

// ─── Página principal ─────────────────────────────────────────────────────────
export const EventosPage: React.FC = () => {
    const { user } = useAuth();
    const isPastor = user?.persona?.rol === 'pastor';
    const myPersonaId = user?.persona?.id_persona || '';

    const { eventos, loading, saving, crearEvento, actualizarEvento, aprobarEvento, subirImagenPublicidad } = useEventos();
    const { ministerios } = useMinisterios();

    const [pantalla, setPantalla] = useState<Pantalla>('eventos');
    const [ministerioSeleccionado, setMinisterioSeleccionado] = useState<Ministerio | null>(null);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);

    const [vista, setVista] = useState<Vista>('lista');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [detailEvento, setDetailEvento] = useState<Evento | null>(null);
    const [publicidadEvento, setPublicidadEvento] = useState<Evento | null>(null);

    // Solo ministerios ACTIVOS disponibles según rol
    const ministeriosDisponibles = useMemo((): Ministerio[] => {
        const activos = ministerios.filter(m => m.estado_activo); // ← solo activos
        if (isPastor) return activos;
        return activos.filter(m =>
            m.ministerio_lideres?.some(ml => ml.id_persona === myPersonaId)
        );
    }, [ministerios, isPastor, myPersonaId]);

    const eventosFiltrados = useMemo(() => {
        let result = [...eventos];
        if (filtroEstado !== 'todos') result = result.filter(e => e.estado === filtroEstado);
        if (!isPastor) {
            const misIds = new Set(ministeriosDisponibles.map(m => m.id_ministerio));
            result = result.filter(e => misIds.has(e.id_ministerio));
        }
        return result;
    }, [eventos, filtroEstado, isPastor, ministeriosDisponibles]);

    const pendientesCount = eventos.filter(e => e.estado === 'pendiente').length;

    const handleFormSubmit = async (data: EventoFormData): Promise<boolean> => {
        let ok: boolean;
        if (editingEvento) {
            ok = await actualizarEvento(editingEvento.id_evento, data);
        } else {
            ok = await crearEvento(data);
        }
        if (ok) {
            setPantalla('eventos');
            setMinisterioSeleccionado(null);
            setEditingEvento(null);
        }
        return ok;
    };

    const handleAprobar = async (id: string, estado: 'aprobado' | 'rechazado'): Promise<boolean> => {
        const ok = await aprobarEvento(id, estado);
        if (ok) setDetailEvento(null);
        return ok;
    };

    const irANuevoEvento = () => {
        setEditingEvento(null);
        setPantalla('seleccionar-ministerio');
    };

    const irAEditarEvento = (ev: Evento) => {
        const min = ministerios.find(m => m.id_ministerio === ev.id_ministerio);
        if (min) {
            setEditingEvento(ev);
            setMinisterioSeleccionado(min);
            setPantalla('formulario');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
        </div>
    );

    // ── Pantalla: seleccionar ministerio ─────────────────────────────────────
    if (pantalla === 'seleccionar-ministerio') {
        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPantalla('eventos')}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Eventos
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-medium text-gray-700">Nuevo evento — Seleccionar ministerio</span>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-900">¿Para qué ministerio es el evento?</h2>
                    <p className="text-sm text-gray-400 mt-1">Solo se muestran ministerios habilitados.</p>
                </div>

                {ministeriosDisponibles.length === 0 ? (
                    <EmptyState
                        icon={<Calendar className="w-10 h-10 text-gray-300" />}
                        title="Sin ministerios disponibles"
                        description="No tienes ministerios activos asignados. Pide a un pastor que habilite o te asigne uno."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ministeriosDisponibles.map(m => (
                            <MinisterioSelectCard
                                key={m.id_ministerio}
                                ministerio={m}
                                onClick={() => {
                                    setMinisterioSeleccionado(m);
                                    setPantalla('formulario');
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── Pantalla: formulario inline ───────────────────────────────────────────
    if (pantalla === 'formulario' && ministerioSeleccionado) {
        return (
            <div className="space-y-6 max-w-2xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPantalla('eventos')}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Eventos
                    </button>
                    {!editingEvento && (
                        <>
                            <span className="text-gray-300">/</span>
                            <button
                                onClick={() => setPantalla('seleccionar-ministerio')}
                                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                Seleccionar ministerio
                            </button>
                        </>
                    )}
                    <span className="text-gray-300">/</span>
                    <span className="text-sm font-medium text-gray-700">
                        {editingEvento ? 'Editar evento' : 'Nuevo evento'}
                    </span>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {editingEvento ? 'Editar evento' : 'Nuevo evento'}
                    </h2>
                </div>

                <EventoFormInline
                    ministerio={ministerioSeleccionado}
                    saving={saving}
                    onSubmit={handleFormSubmit}
                    onBack={() => editingEvento ? setPantalla('eventos') : setPantalla('seleccionar-ministerio')}
                    editingEvento={editingEvento}
                />
            </div>
        );
    }

    // ── Pantalla principal: lista/cronograma ──────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {eventos.length} eventos registrados
                        {isPastor && pendientesCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                {pendientesCount} pendiente{pendientesCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Toggle vista */}
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setVista('lista')}
                            className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${vista === 'lista' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <LayoutList className="w-3.5 h-3.5" /> Lista
                        </button>
                        <button
                            onClick={() => setVista('cronograma')}
                            className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${vista === 'cronograma' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Calendar className="w-3.5 h-3.5" /> Cronograma
                        </button>
                    </div>
                    {ministeriosDisponibles.length > 0 && (
                        <Button onClick={irANuevoEvento}>
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo evento</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            {vista === 'lista' && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {(['todos', 'pendiente', 'aprobado', 'rechazado'] as FiltroEstado[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFiltroEstado(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filtroEstado === f
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === 'pendiente' && pendientesCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-400 text-white rounded-full text-xs">
                                    {pendientesCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Vista cronograma */}
            {vista === 'cronograma' && (
                <Cronograma eventos={eventosFiltrados} onEventoClick={e => setDetailEvento(e)} />
            )}

            {/* Vista lista */}
            {vista === 'lista' && (
                eventosFiltrados.length === 0 ? (
                    <EmptyState
                        icon={<Calendar className="w-12 h-12 text-gray-400" />}
                        title={eventos.length === 0 ? 'Sin eventos registrados' : 'Sin resultados para este filtro'}
                        description={eventos.length === 0
                            ? 'Crea el primer evento para tu ministerio.'
                            : 'Prueba con otro filtro.'}
                        action={
                            eventos.length === 0 && ministeriosDisponibles.length > 0 ? (
                                <Button onClick={irANuevoEvento}>
                                    <Plus className="w-4 h-4" /> Crear primer evento
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {eventosFiltrados.map(ev => (
                            <EventoCard
                                key={ev.id_evento}
                                evento={ev}
                                isPastor={isPastor}
                                onEdit={ev.estado === 'pendiente' ? irAEditarEvento : undefined}
                                onAprobar={isPastor ? aprobarEvento : undefined}
                                onVerPublicidad={e => setDetailEvento(e)}
                            />
                        ))}
                    </div>
                )
            )}

            {/* Modales (se mantienen solo detail y publicidad) */}
            <EventoDetailModal
                isOpen={!!detailEvento}
                onClose={() => setDetailEvento(null)}
                evento={detailEvento}
                isPastor={isPastor}
                onAprobar={isPastor ? handleAprobar : undefined}
                onSubirPublicidad={subirImagenPublicidad}
                onGenerarPublicidad={e => { setDetailEvento(null); setPublicidadEvento(e); }}
            />

            <PublicidadGeneratorModal
                isOpen={!!publicidadEvento}
                onClose={() => setPublicidadEvento(null)}
                evento={publicidadEvento}
                onGuardar={subirImagenPublicidad}
            />
        </div>
    );
};