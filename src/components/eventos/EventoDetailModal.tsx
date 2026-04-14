import React, { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Evento } from '../../types';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Image, Check, X } from 'lucide-react';
import { RechazoModal } from './RechazoModal';

interface EventoDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    evento: Evento | null;
    isPastor: boolean;
    onAprobar?: (id: string, estado: 'aprobado' | 'rechazado', motivo?: string) => Promise<boolean>;
    onSubirPublicidad?: (id: string, file: File) => Promise<string | null>;
    onGenerarPublicidad?: (evento: Evento) => void;
}

const formatFechaCompleta = (iso: string) =>
    new Date(iso).toLocaleString('es-EC', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

export const EventoDetailModal: React.FC<EventoDetailModalProps> = ({
    isOpen, onClose, evento, isPastor, onAprobar, onSubirPublicidad, onGenerarPublicidad,
}) => {
    const [procesando, setProcesando] = useState(false);
    const [rechazandoModal, setRechazandoModal] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    if (!evento) return null;

    const ministerioColor = evento.ministerios?.color || '#6366f1';

    const handleAprobar = async () => {
        if (!onAprobar) return;
        setProcesando(true);
        await onAprobar(evento.id_evento, 'aprobado');
        setProcesando(false);
        onClose();
    };

    const handleRechazar = async (motivo: string) => {
        if (!onAprobar) return;
        setProcesando(true);
        await onAprobar(evento.id_evento, 'rechazado', motivo);
        setProcesando(false);
        setRechazandoModal(false);
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onSubirPublicidad) return;
        setProcesando(true);
        await onSubirPublicidad(evento.id_evento, file);
        setProcesando(false);
    };

    const ESTADO_CONFIG = {
        pendiente: { label: 'Pendiente de aprobación', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        aprobado: { label: 'Aprobado', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
        rechazado: { label: 'Rechazado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    };
    const estadoConf = ESTADO_CONFIG[evento.estado];
    const EstadoIcon = estadoConf.icon;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Detalle del evento" width="md">
                <div className="space-y-5">
                    {/* Color strip del ministerio */}
                    <div
                        className="h-1.5 w-full rounded-full"
                        style={{ backgroundColor: evento.estado === 'aprobado' ? ministerioColor : '#e5e7eb' }}
                    />

                    {/* Título y ministerio */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{evento.titulo}</h3>
                        {evento.ministerios && (
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ministerioColor }} />
                                <span className="text-sm text-gray-500">{evento.ministerios.nombre}</span>
                            </div>
                        )}
                    </div>

                    {/* Estado */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${estadoConf.bg} ${estadoConf.color}`}>
                        <EstadoIcon className="w-4 h-4" />
                        {estadoConf.label}
                        {evento.aprobador && evento.estado !== 'pendiente' && (
                            <span className="ml-1 font-normal text-xs opacity-70">
                                · {evento.aprobador.nombres} {evento.aprobador.apellidos}
                            </span>
                        )}
                    </div>

                    {/* Descripción */}
                    {evento.descripcion && (
                        <p className="text-sm text-gray-600">{evento.descripcion}</p>
                    )}

                    {/* Fecha y lugar */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p>{formatFechaCompleta(evento.fecha_inicio)}</p>
                                <p className="text-gray-400">hasta {formatFechaCompleta(evento.fecha_fin)}</p>
                            </div>
                        </div>
                        {evento.lugar && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                {evento.lugar}
                            </div>
                        )}
                    </div>

                    {/* Creador */}
                    {evento.creador && (
                        <p className="text-xs text-gray-400 border-t border-gray-50 pt-3">
                            Creado por <span className="font-medium text-gray-500">{evento.creador.nombres} {evento.creador.apellidos}</span>
                        </p>
                    )}

                    {/* Publicidad */}
                    {evento.estado === 'aprobado' && (
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Image className="w-4 h-4" /> Publicidad del evento
                            </p>
                            {evento.imagen_publicidad_url ? (
                                <div className="space-y-3">
                                    <img
                                        src={evento.imagen_publicidad_url}
                                        alt="Publicidad"
                                        className="w-full rounded-xl border border-gray-200 object-cover max-h-48"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 text-sm"
                                            onClick={() => fileRef.current?.click()}
                                        >
                                            Cambiar imagen
                                        </Button>
                                        {onGenerarPublicidad && (
                                            <Button
                                                className="flex-1 text-sm"
                                                onClick={() => onGenerarPublicidad(evento)}
                                            >
                                                Generar publicidad
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        className="flex-1 text-sm"
                                        onClick={() => fileRef.current?.click()}
                                        disabled={procesando}
                                    >
                                        <Image className="w-3.5 h-3.5" /> Subir imagen
                                    </Button>
                                    {onGenerarPublicidad && (
                                        <Button
                                            className="flex-1 text-sm"
                                            onClick={() => onGenerarPublicidad(evento)}
                                        >
                                            Generar publicidad
                                        </Button>
                                    )}
                                </div>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </div>
                    )}

                    {/* Acciones de aprobación */}
                    {isPastor && evento.estado === 'pendiente' && (
                        <div className="flex gap-3 pt-2 border-t border-gray-100">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => setRechazandoModal(true)}
                                disabled={procesando}
                                className="text-red-600 hover:bg-red-50 border-red-200"
                            >
                                <X className="w-4 h-4" /> Rechazar
                            </Button>
                            <Button
                                fullWidth
                                onClick={handleAprobar}
                                isLoading={procesando}
                            >
                                <Check className="w-4 h-4" /> Aprobar evento
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal de rechazo */}
            <RechazoModal
                isOpen={rechazandoModal}
                onClose={() => setRechazandoModal(false)}
                onConfirm={handleRechazar}
                procesando={procesando}
                tituloEvento={evento.titulo}
            />
        </>
    );
};