import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Calendar } from 'lucide-react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useNavigate } from 'react-router-dom';

interface NotificacionesBellProps {
    onEventoClick?: (idEvento: string) => void;
}

const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora mismo';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
};

export const NotificacionesBell: React.FC<NotificacionesBellProps> = ({ onEventoClick }) => {
    const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotifClick = (notif: typeof notificaciones[0]) => {
        if (!notif.leida) marcarLeida(notif.id_notificacion);
        if (notif.id_evento && onEventoClick) {
            onEventoClick(notif.id_evento);
            setOpen(false);
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {noLeidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
                        {noLeidas > 0 && (
                            <button
                                onClick={marcarTodasLeidas}
                                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Marcar todas
                            </button>
                        )}
                    </div>

                    {/* Lista */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notificaciones.length === 0 ? (
                            <div className="py-10 text-center text-sm text-gray-400">
                                Sin notificaciones
                            </div>
                        ) : (
                            notificaciones.map(n => (
                                <button
                                    key={n.id_notificacion}
                                    onClick={() => handleNotifClick(n)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.leida ? 'bg-red-50/40' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.leida ? 'bg-red-100' : 'bg-gray-100'}`}>
                                            <Calendar className={`w-4 h-4 ${!n.leida ? 'text-red-600' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!n.leida ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {n.titulo}
                                            </p>
                                            {n.mensaje && (
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.mensaje}</p>
                                            )}
                                            <p className="text-xs text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.leida && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};