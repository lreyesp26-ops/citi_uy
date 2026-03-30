import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Miembro } from '../../types';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Briefcase, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

interface MiembroDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    miembro: Miembro | null;
    onEdit: (miembro: Miembro) => void;
    onToggleEstado: (id: string, estadoActual: boolean) => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className="text-red-400 mt-0.5 flex-shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
            </div>
        </div>
    );
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
};

export const MiembroDetailModal: React.FC<MiembroDetailModalProps> = ({
    isOpen, onClose, miembro, onEdit, onToggleEstado
}) => {
    if (!miembro) return null;

    const initials = `${miembro.nombres.charAt(0)}${miembro.apellidos.charAt(0)}`.toUpperCase();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalle del miembro" width="md">
            <div className="space-y-5">
                {/* Avatar y nombre */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-red-700">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {miembro.nombres} {miembro.apellidos}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${miembro.estado_activo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {miembro.estado_activo ? 'Activo' : 'Inactivo'}
                            </span>
                            {miembro.numero_cedula && (
                                <span className="text-xs text-gray-400">CI: {miembro.numero_cedula}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-0">
                    <InfoRow icon={<Mail size={15} />} label="Correo" value={miembro.correo_electronico} />
                    <InfoRow icon={<Phone size={15} />} label="Celular" value={miembro.celular} />
                    <InfoRow icon={<MapPin size={15} />} label="Dirección" value={miembro.direccion} />
                    <InfoRow icon={<Calendar size={15} />} label="Fecha de nacimiento" value={formatDate(miembro.fecha_nacimiento)} />
                    <InfoRow icon={<User size={15} />} label="Género" value={miembro.genero} />
                    <InfoRow icon={<User size={15} />} label="Estado civil" value={miembro.estado_civil} />
                    <InfoRow icon={<User size={15} />} label="Nacionalidad" value={miembro.nacionalidad} />
                    <InfoRow icon={<BookOpen size={15} />} label="Nivel de estudio" value={miembro.nivel_estudio} />
                    <InfoRow icon={<Briefcase size={15} />} label="Profesión" value={miembro.profesion} />
                    <InfoRow icon={<Briefcase size={15} />} label="Lugar de trabajo" value={miembro.lugar_trabajo} />
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="secondary"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => onToggleEstado(miembro.id_persona, miembro.estado_activo)}
                    >
                        {miembro.estado_activo
                            ? <><ToggleRight size={16} className="text-gray-500" /> Desactivar</>
                            : <><ToggleLeft size={16} className="text-gray-500" /> Activar</>
                        }
                    </Button>
                    <Button
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => { onClose(); onEdit(miembro); }}
                    >
                        <Edit2 size={16} /> Editar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};