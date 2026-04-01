import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Edit2, Check, X } from 'lucide-react';
import { Evento } from '../../types';

interface EventoCardProps {
    evento: Evento;
    isPastor: boolean;
    onEdit?: (e: Evento) => void;
    onAprobar?: (id: string, estado: 'aprobado' | 'rechazado') => void;
    onVerPublicidad?: (e: Evento) => void;
}

const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
};

const ESTADO_CONFIG = {
    pendiente: { label: 'Pendiente', icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
    aprobado: { label: 'Aprobado', icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
    rechazado: { label: 'Rechazado', icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-400' },
};

export const EventoCard: React.FC<EventoCardProps> = ({
    evento, isPastor, onEdit, onAprobar, onVerPublicidad,
}) => {
    const ministerioColor = evento.ministerios?.color || '#6366f1';
    const estadoConf = ESTADO_CONFIG[evento.estado];
    const EstadoIcon = estadoConf.icon;
    const mismaFecha = formatFecha(evento.fecha_inicio) === formatFecha(evento.fecha_fin);

    return (
        <div className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md ${estadoConf.border}`}>
            {/* Strip de color del ministerio */}
            <div className="h-1.5 w-full" style={{ backgroundColor: evento.estado === 'aprobado' ? ministerioColor : '#d1d5db' }} />

            <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">{evento.titulo}</h3>
                        {evento.ministerios && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <span
                                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: ministerioColor }}
                                />
                                <span className="text-xs text-gray-500">{evento.ministerios.nombre}</span>
                            </div>
                        )}
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${estadoConf.bg} ${estadoConf.text}`}>
                        <EstadoIcon className="w-3 h-3" />
                        {estadoConf.label}
                    </span>
                </div>

                {/* Descripción */}
                {evento.descripcion && (
                    <p className="text-sm text-gray-500 line-clamp-2">{evento.descripcion}</p>
                )}

                {/* Fecha/hora */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {mismaFecha
                            ? formatFecha(evento.fecha_inicio)
                            : `${formatFecha(evento.fecha_inicio)} → ${formatFecha(evento.fecha_fin)}`
                        }
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {formatHora(evento.fecha_inicio)} – {formatHora(evento.fecha_fin)}
                    </div>
                    {evento.lugar && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {evento.lugar}
                        </div>
                    )}
                </div>

                {/* Creador */}
                {evento.creador && (
                    <p className="text-xs text-gray-400">
                        Creado por <span className="font-medium text-gray-500">{evento.creador.nombres} {evento.creador.apellidos}</span>
                    </p>
                )}

                {/* Aprobador (si existe) */}
                {evento.aprobador && evento.estado !== 'pendiente' && (
                    <p className="text-xs text-gray-400">
                        {evento.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'} por{' '}
                        <span className="font-medium text-gray-500">{evento.aprobador.nombres} {evento.aprobador.apellidos}</span>
                    </p>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-1 flex-wrap">
                    {/* Editar — solo si está pendiente y hay handler */}
                    {onEdit && evento.estado === 'pendiente' && (
                        <button
                            onClick={() => onEdit(evento)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                    )}

                    {/* Aprobar/Rechazar — solo pastores, solo pendientes */}
                    {isPastor && evento.estado === 'pendiente' && onAprobar && (
                        <>
                            <button
                                onClick={() => onAprobar(evento.id_evento, 'rechazado')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> Rechazar
                            </button>
                            <button
                                onClick={() => onAprobar(evento.id_evento, 'aprobado')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" /> Aprobar
                            </button>
                        </>
                    )}

                    {/* Ver publicidad si ya fue aprobado */}
                    {evento.estado === 'aprobado' && onVerPublicidad && (
                        <button
                            onClick={() => onVerPublicidad(evento)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors ml-auto"
                        >
                            Publicidad
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};