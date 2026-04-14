import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Heart, ArrowRight, Clock } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { useMinisterios } from '../../hooks/useMinisterios';
import { supabase } from '../../lib/supabase';

interface EventoResumen {
    id_evento: string;
    titulo: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fecha_inicio: string;
    ministerio_nombre?: string;
    ministerio_color?: string;
}

interface MiembroReciente {
    id_persona: string;
    nombres: string;
    apellidos: string;
    created_at: string;
}

const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtFechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });

export const LiderDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const myPersonaId = user?.persona?.id_persona || '';
    const nombre = user?.persona?.nombres.split(' ')[0] || 'Líder';

    const { ministerios, loading: loadingMins } = useMinisterios();

    const misMinisterios = useMemo(
        () => ministerios.filter(m => m.estado_activo && m.ministerio_lideres.some(ml => ml.id_persona === myPersonaId)),
        [ministerios, myPersonaId]
    );
    const misIds = useMemo(() => misMinisterios.map(m => m.id_ministerio), [misMinisterios]);

    const [totalMiembros, setTotalMiembros] = useState(0);
    const [eventosProximos, setEventosProximos] = useState<EventoResumen[]>([]);
    const [eventosPendientes, setEventosPendientes] = useState<EventoResumen[]>([]);
    const [miembrosRecientes, setMiembrosRecientes] = useState<MiembroReciente[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!misIds.length) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [{ count }, { data: evs }, { data: mrs }] = await Promise.all([
                    supabase.from('miembro_ministerio').select('*', { count: 'exact', head: true })
                        .in('id_ministerio', misIds),
                    supabase.from('eventos').select(`
                        id_evento, titulo, estado, fecha_inicio,
                        ministerios(nombre, color)
                    `).in('id_ministerio', misIds)
                        .gte('fecha_inicio', new Date().toISOString())
                        .order('fecha_inicio').limit(10),
                    supabase.from('miembro_ministerio').select(`
                        personas!miembro_ministerio_id_persona_fkey(id_persona, nombres, apellidos, created_at)
                    `).in('id_ministerio', misIds)
                        .order('created_at', { ascending: false }).limit(5),
                ]);

                setTotalMiembros(count || 0);

                const eventos = (evs || []).map((e: any) => ({
                    id_evento: e.id_evento,
                    titulo: e.titulo,
                    estado: e.estado,
                    fecha_inicio: e.fecha_inicio,
                    ministerio_nombre: e.ministerios?.nombre,
                    ministerio_color: e.ministerios?.color,
                }));
                setEventosProximos(eventos.filter((e: EventoResumen) => e.estado === 'aprobado'));
                setEventosPendientes(eventos.filter((e: EventoResumen) => e.estado === 'pendiente'));

                const uniqueMiembros = new Map<string, MiembroReciente>();
                (mrs || []).forEach((row: any) => {
                    const p = row.personas;
                    if (p && !uniqueMiembros.has(p.id_persona)) {
                        uniqueMiembros.set(p.id_persona, p);
                    }
                });
                setMiembrosRecientes(Array.from(uniqueMiembros.values()).slice(0, 5));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [misIds.join(',')]);

    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

    if (loadingMins || loading) return (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
    );

    return (
        <div className="space-y-8">
            {/* Saludo */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{saludo}, {nombre} 👋</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Sin ministerios */}
            {misMinisterios.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <Heart className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                    <p className="font-medium text-amber-800">Todavía no tienes ministerios asignados</p>
                    <p className="text-sm text-amber-600 mt-1">Comunícate con el pastor para que te asigne a un ministerio.</p>
                </div>
            )}

            {misMinisterios.length > 0 && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Mis miembros', value: totalMiembros, icon: <Users className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50', path: '/lider/miembros' },
                            { label: 'Próximos eventos', value: eventosProximos.length, icon: <Calendar className="w-5 h-5" />, color: 'text-green-600 bg-green-50', path: '/lider/eventos' },
                            { label: 'Eventos pendientes', value: eventosPendientes.length, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50', path: '/lider/eventos' },
                        ].map(s => (
                            <button key={s.label} onClick={() => navigate(s.path)}
                                className="relative text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
                                <div className={`inline-flex p-2.5 rounded-xl ${s.color} mb-3`}>{s.icon}</div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</p>
                                <ArrowRight className="absolute bottom-4 right-4 w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </button>
                        ))}
                    </div>

                    {/* Mis ministerios */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-500" /> Mis ministerios
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {misMinisterios.map(m => (
                                <div key={m.id_ministerio} className="flex items-center gap-4 px-5 py-3.5">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                                        style={{ backgroundColor: m.color }}>
                                        {m.logo_url
                                            ? <img src={m.logo_url} alt={m.nombre} className="w-full h-full object-cover rounded-xl" />
                                            : m.nombre.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 truncate">{m.nombre}</p>
                                        {m.descripcion && (
                                            <p className="text-xs text-gray-400 truncate">{m.descripcion}</p>
                                        )}
                                    </div>
                                    {m.es_principal && (
                                        <span className="px-2 py-0.5 text-xs font-semibold text-white rounded-full"
                                            style={{ backgroundColor: m.color }}>Principal</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Próximos eventos */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-green-500" /> Próximos eventos
                                </h2>
                                <button onClick={() => navigate('/lider/eventos')}
                                    className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                                    Ver todos <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {eventosProximos.length === 0 ? (
                                    <div className="px-5 py-8 text-center">
                                        <Calendar className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400">Sin eventos próximos</p>
                                    </div>
                                ) : (
                                    eventosProximos.slice(0, 4).map(ev => (
                                        <div key={ev.id_evento} className="flex items-center gap-3 px-5 py-3">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: ev.ministerio_color || '#22c55e' }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                                                <p className="text-xs text-gray-400">{fmtFechaCorta(ev.fecha_inicio)}</p>
                                            </div>
                                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                Aprobado
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Miembros recientes */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" /> Miembros recientes
                                </h2>
                                <button onClick={() => navigate('/lider/miembros')}
                                    className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                                    Ver todos <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {miembrosRecientes.length === 0 ? (
                                    <div className="px-5 py-8 text-center">
                                        <Users className="w-7 h-7 text-gray-200 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400">Sin miembros aún</p>
                                    </div>
                                ) : (
                                    miembrosRecientes.map(m => (
                                        <div key={m.id_persona} className="flex items-center gap-3 px-5 py-3">
                                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-red-700">
                                                    {m.nombres.charAt(0)}{m.apellidos.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {m.nombres} {m.apellidos}
                                                </p>
                                                <p className="text-xs text-gray-400">Registrado {fmtFecha(m.created_at)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};