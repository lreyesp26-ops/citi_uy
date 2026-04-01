import React, { useState, useMemo } from 'react';
import { Plus, Calendar, LayoutList, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { EventoCard } from '../../components/eventos/EventoCard';
import { EventoFormModal } from '../../components/eventos/EventoFormModal';
import { EventoDetailModal } from '../../components/eventos/EventoDetailModal';
import { PublicidadGeneratorModal } from '../../components/eventos/PublicidadGeneratorModal';
import { Cronograma } from '../../components/eventos/Cronograma';
import { useEventos } from '../../hooks/useEventos';
import { useMinisterios } from '../../hooks/useMinisterios';
import { useAuth } from '../../hooks/useAuth';
import { Evento, Ministerio } from '../../types';

type Vista = 'lista' | 'cronograma';
type FiltroEstado = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';

export const EventosPage: React.FC = () => {
    const { user } = useAuth();
    const isPastor = user?.persona?.rol === 'pastor';
    const myPersonaId = user?.persona?.id_persona || '';

    const { eventos, loading, saving, crearEvento, actualizarEvento, aprobarEvento, subirImagenPublicidad } = useEventos();
    const { ministerios } = useMinisterios();

    const [vista, setVista] = useState<Vista>('lista');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
    const [detailEvento, setDetailEvento] = useState<Evento | null>(null);
    const [publicidadEvento, setPublicidadEvento] = useState<Evento | null>(null);

    // Ministerios disponibles según rol
    const ministeriosDisponibles = useMemo((): Ministerio[] => {
        if (isPastor) return ministerios;
        // Líder: solo sus ministerios
        return ministerios.filter(m =>
            m.ministerio_lideres?.some(ml => ml.id_persona === myPersonaId)
        );
    }, [ministerios, isPastor, myPersonaId]);

    // Filtrado de eventos
    const eventosFiltrados = useMemo(() => {
        let result = [...eventos];
        if (filtroEstado !== 'todos') {
            result = result.filter(e => e.estado === filtroEstado);
        }
        if (!isPastor) {
            // Líder: solo sus ministerios
            const misIds = new Set(ministeriosDisponibles.map(m => m.id_ministerio));
            result = result.filter(e => misIds.has(e.id_ministerio));
        }
        return result;
    }, [eventos, filtroEstado, isPastor, ministeriosDisponibles]);

    const pendientesCount = eventos.filter(e => e.estado === 'pendiente').length;

    const handleFormSubmit = async (data: any): Promise<boolean> => {
        if (editingEvento) return actualizarEvento(editingEvento.id_evento, data);
        return crearEvento(data);
    };

    const handleAprobar = async (id: string, estado: 'aprobado' | 'rechazado'): Promise<boolean> => {
        const ok = await aprobarEvento(id, estado);
        if (ok) setDetailEvento(null);
        return ok;
    };

    const handleEventoClick = (ev: Evento) => {
        setDetailEvento(ev);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
        </div>
    );

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
                        <Button onClick={() => { setEditingEvento(null); setShowFormModal(true); }}>
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo evento</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros de estado (solo en vista lista) */}
            {vista === 'lista' && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400" />
                    {(['todos', 'pendiente', 'aprobado', 'rechazado'] as FiltroEstado[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFiltroEstado(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filtroEstado === f
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
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
                <Cronograma eventos={eventosFiltrados} onEventoClick={handleEventoClick} />
            )}

            {/* Vista lista */}
            {vista === 'lista' && (
                eventosFiltrados.length === 0 ? (
                    <EmptyState
                        icon={<Calendar className="w-12 h-12 text-gray-400" />}
                        title={eventos.length === 0 ? 'Sin eventos registrados' : 'Sin resultados para este filtro'}
                        description={
                            eventos.length === 0
                                ? 'Crea el primer evento para tu ministerio.'
                                : 'Prueba con otro filtro.'
                        }
                        action={
                            eventos.length === 0 && ministeriosDisponibles.length > 0 ? (
                                <Button onClick={() => setShowFormModal(true)}>
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
                                onEdit={ev.estado === 'pendiente' ? (e) => { setEditingEvento(e); setShowFormModal(true); } : undefined}
                                onAprobar={isPastor ? aprobarEvento : undefined}
                                onVerPublicidad={(e) => setDetailEvento(e)}
                            />
                        ))}
                    </div>
                )
            )}

            {/* Modales */}
            <EventoFormModal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingEvento(null); }}
                onSubmit={handleFormSubmit}
                saving={saving}
                evento={editingEvento}
                ministeriosDisponibles={ministeriosDisponibles}
            />

            <EventoDetailModal
                isOpen={!!detailEvento}
                onClose={() => setDetailEvento(null)}
                evento={detailEvento}
                isPastor={isPastor}
                onAprobar={isPastor ? handleAprobar : undefined}
                onSubirPublicidad={subirImagenPublicidad}
                onGenerarPublicidad={(e) => { setDetailEvento(null); setPublicidadEvento(e); }}
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