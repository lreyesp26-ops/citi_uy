import React from 'react';
import { Edit2, Users, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { Ministerio } from '../../types';

interface MinisterioCardProps {
    ministerio: Ministerio;
    onEdit: (m: Ministerio) => void;
    onToggle: (m: Ministerio) => void;
    isPastor: boolean;
}

export const MinisterioCard: React.FC<MinisterioCardProps> = ({ ministerio, onEdit, onToggle, isPastor }) => {
    const { nombre, descripcion, color, logo_url, es_principal, estado_activo, ministerio_lideres } = ministerio;
    const initial = nombre.charAt(0).toUpperCase();
    const lideresActivos = ministerio_lideres.filter(ml => ml.personas?.estado_activo);

    return (
        <div
            className={`relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden ${!estado_activo ? 'opacity-60' : ''} ${es_principal ? 'ring-2 ring-offset-1 border-transparent' : 'border-gray-100'}`}
            style={es_principal ? { '--tw-ring-color': color } as React.CSSProperties : {}}
        >
            {/* Top color strip */}
            <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Logo / inicial */}
                    <div
                        className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
                        style={{ backgroundColor: color + '20', border: `2px solid ${color}30` }}
                    >
                        {logo_url ? (
                            <img src={logo_url} alt={nombre} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold" style={{ color }}>{initial}</span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">{nombre}</h3>
                            {es_principal && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                    style={{ backgroundColor: color }}>
                                    <Star className="w-2.5 h-2.5" /> Principal
                                </span>
                            )}
                            {!estado_activo && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                    Inactivo
                                </span>
                            )}
                        </div>

                        {descripcion && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{descripcion}</p>
                        )}

                        {/* Líderes */}
                        <div className="flex items-center gap-2 mt-3">
                            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {lideresActivos.length === 0 ? (
                                <span className="text-xs text-gray-400 italic">Sin líderes asignados</span>
                            ) : (
                                <div className="flex items-center gap-1 flex-wrap">
                                    {lideresActivos.slice(0, 3).map(ml => (
                                        <span
                                            key={ml.id}
                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={{ backgroundColor: color + '15', color }}
                                        >
                                            {ml.personas.nombres} {ml.personas.apellidos.split(' ')[0]}
                                        </span>
                                    ))}
                                    {lideresActivos.length > 3 && (
                                        <span className="text-xs text-gray-400">+{lideresActivos.length - 3} más</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                {isPastor && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button
                            onClick={() => onToggle(ministerio)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            {estado_activo
                                ? <><ToggleRight className="w-3.5 h-3.5" /> Desactivar</>
                                : <><ToggleLeft className="w-3.5 h-3.5" /> Activar</>
                            }
                        </button>
                        <button
                            onClick={() => onEdit(ministerio)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};