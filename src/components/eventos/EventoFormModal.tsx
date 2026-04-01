import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Evento, EventoFormData, Ministerio } from '../../types';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface EventoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EventoFormData) => Promise<boolean>;
    saving: boolean;
    evento?: Evento | null;
    ministeriosDisponibles: Ministerio[];
}

const toDateTimeLocal = (iso?: string) => {
    if (!iso) return '';
    // Convertir ISO a formato para input datetime-local
    return iso.slice(0, 16);
};

export const EventoFormModal: React.FC<EventoFormModalProps> = ({
    isOpen, onClose, onSubmit, saving, evento, ministeriosDisponibles,
}) => {
    const isEditing = !!evento;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EventoFormData>({
        defaultValues: {},
    });

    const fechaInicio = watch('fecha_inicio');

    useEffect(() => {
        if (isOpen) {
            reset(evento ? {
                titulo: evento.titulo,
                descripcion: evento.descripcion || '',
                id_ministerio: evento.id_ministerio,
                fecha_inicio: toDateTimeLocal(evento.fecha_inicio),
                fecha_fin: toDateTimeLocal(evento.fecha_fin),
                lugar: evento.lugar || '',
            } : {
                titulo: '',
                descripcion: '',
                id_ministerio: ministeriosDisponibles[0]?.id_ministerio || '',
                fecha_inicio: '',
                fecha_fin: '',
                lugar: '',
            });
        }
    }, [isOpen, evento, reset, ministeriosDisponibles]);

    const onFormSubmit = async (data: EventoFormData) => {
        // Convertir datetime-local a ISO para Supabase
        const payload: EventoFormData = {
            ...data,
            fecha_inicio: new Date(data.fecha_inicio).toISOString(),
            fecha_fin: new Date(data.fecha_fin).toISOString(),
            descripcion: data.descripcion || undefined,
            lugar: data.lugar || undefined,
        };
        const success = await onSubmit(payload);
        if (success) { reset(); onClose(); }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Evento' : 'Nuevo Evento'}
            width="lg"
        >
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

                {/* Ministerio */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ministerio *</label>
                    <select
                        {...register('id_ministerio', { required: 'Selecciona un ministerio' })}
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                        <option value="">Seleccionar ministerio...</option>
                        {ministeriosDisponibles.map(m => (
                            <option key={m.id_ministerio} value={m.id_ministerio}>
                                {m.nombre}
                            </option>
                        ))}
                    </select>
                    {errors.id_ministerio && (
                        <p className="mt-1 text-sm text-red-600">{errors.id_ministerio.message}</p>
                    )}
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
                                <Clock className="w-3.5 h-3.5" /> Fecha fin *
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
                <Input
                    label="Lugar"
                    {...register('lugar')}
                    placeholder="Ej. Templo principal, Salón de jóvenes..."
                    icon={<MapPin className="w-4 h-4" />}
                />

                {!isEditing && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                        <strong>Nota:</strong> El evento quedará pendiente de aprobación. Los pastores recibirán una notificación.
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" fullWidth isLoading={saving}>
                        {isEditing ? 'Guardar cambios' : 'Crear evento'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};