import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Evento } from '../../types';

interface CronogramaProps {
    eventos: Evento[];
    onEventoClick: (e: Evento) => void;
}

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const Cronograma: React.FC<CronogramaProps> = ({ eventos, onEventoClick }) => {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    // Días del mes con padding
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Eventos indexados por día del mes
    const eventosPorDia = useMemo(() => {
        const map: Record<number, Evento[]> = {};
        eventos.forEach(ev => {
            const start = new Date(ev.fecha_inicio);
            const end = new Date(ev.fecha_fin);
            // Si el evento cae en este mes, marcarlo en cada día que abarca
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (d.getFullYear() === year && d.getMonth() === month) {
                    const day = d.getDate();
                    if (!map[day]) map[day] = [];
                    // No duplicar si ya está (evento multi-día)
                    if (!map[day].find(e => e.id_evento === ev.id_evento)) {
                        map[day].push(ev);
                    }
                }
            }
        });
        return map;
    }, [eventos, year, month]);

    const cells: (number | null)[] = [
        ...Array(firstDayOfMonth).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // Padding final para completar la grilla
    while (cells.length % 7 !== 0) cells.push(null);

    const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header navegación */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-semibold text-gray-900 text-lg">
                    {MESES[month]} {year}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Cabecera días */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {DIAS.map(d => (
                    <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grilla */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-50">
                {cells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="min-h-[90px] bg-gray-50/50" />;

                    const eventosDelDia = eventosPorDia[day] || [];
                    const isToday = day === todayDay;

                    return (
                        <div
                            key={`day-${day}`}
                            className={`min-h-[90px] p-1.5 flex flex-col gap-1 ${isToday ? 'bg-red-50/40' : 'hover:bg-gray-50/80'} transition-colors`}
                        >
                            {/* Número del día */}
                            <div className="flex justify-center">
                                <span className={`
                                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                                    ${isToday ? 'bg-red-600 text-white' : 'text-gray-700'}
                                `}>
                                    {day}
                                </span>
                            </div>

                            {/* Eventos del día — máx 3 visibles */}
                            <div className="flex flex-col gap-0.5">
                                {eventosDelDia.slice(0, 3).map(ev => {
                                    const color = ev.estado === 'aprobado'
                                        ? (ev.ministerios?.color || '#6366f1')
                                        : '#9ca3af';
                                    return (
                                        <button
                                            key={ev.id_evento}
                                            onClick={() => onEventoClick(ev)}
                                            className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: color + '25', color }}
                                            title={ev.titulo}
                                        >
                                            {ev.titulo}
                                        </button>
                                    );
                                })}
                                {eventosDelDia.length > 3 && (
                                    <span className="text-xs text-gray-400 text-center">
                                        +{eventosDelDia.length - 3} más
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Leyenda */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e44' }} />
                    <span style={{ color: '#16a34a' }}>Aprobado (color del ministerio)</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-gray-200" />
                    <span className="text-gray-400">Pendiente / Rechazado</span>
                </span>
            </div>
        </div>
    );
};