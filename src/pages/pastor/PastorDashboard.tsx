import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Heart, Calendar, DollarSign, BookOpen,
    CheckCircle2, AlertCircle, UserCheck,
    ArrowRight, Star,
} from 'lucide-react';

import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';


interface Stats {
    totalMiembros: number;
    miembrosActivos: number;
    totalMinisterios: number;
    ministeriosActivos: number;
    eventosPendientes: number;
    eventosAprobados: number;
    totalLideres: number;
    totalPastores: number;
    cursosActivos: number;
    diezmosTotalMes: number;
}

interface MinisterioResumen {
    id_ministerio: string;
    nombre: string;
    color: string;
    es_principal: boolean;
    logo_url?: string;
    lideres_count: number;
}

interface EventoReciente {
    id_evento: string;
    titulo: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fecha_inicio: string;
    ministerio_nombre?: string;
    ministerio_color?: string;
}

export const PastorDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [ministerios, setMinisterios] = useState<MinisterioResumen[]>([]);
    const [eventosPendientes, setEventosPendientes] = useState<EventoReciente[]>([]);
    const [loading, setLoading] = useState(true);

    const nombre = user?.persona
        ? user.persona.nombres.split(' ')[0]
        : 'Pastor';

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const [
                    { count: totalMiembros },
                    { count: miembrosActivos },
                    { count: totalMinisterios },
                    { count: ministeriosActivos },
                    { count: eventosPend },
                    { count: eventosAprobados },
                    { count: totalLideres },
                    { count: totalPastores },
                    { count: cursosActivos },
                    { data: ministeriosData },
                    { data: eventosData },
                    { data: diezmoData },
                ] = await Promise.all([
                    supabase.from('personas').select('*', { count: 'exact', head: true }).eq('rol', 'miembro'),
                    supabase.from('personas').select('*', { count: 'exact', head: true }).eq('rol', 'miembro').eq('estado_activo', true),
                    supabase.from('ministerios').select('*', { count: 'exact', head: true }),
                    supabase.from('ministerios').select('*', { count: 'exact', head: true }).eq('estado_activo', true),
                    supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                    supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
                    supabase.from('personas').select('*', { count: 'exact', head: true }).eq('rol', 'lider'),
                    supabase.from('personas').select('*', { count: 'exact', head: true }).eq('rol', 'pastor'),
                    supabase.from('cursos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
                    supabase.from('ministerios').select(`
                        id_ministerio, nombre, color, es_principal, logo_url,
                        ministerio_lideres(id)
                    `).order('es_principal', { ascending: false }).order('nombre').limit(10),
                    supabase.from('eventos').select(`
                        id_evento, titulo, estado, fecha_inicio,
                        ministerios(nombre, color)
                    `).eq('estado', 'pendiente').order('fecha_inicio').limit(5),
                    supabase.from('diezmo_cierres').select('total').gte('fecha_cierre',
                        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
                    ),
                ]);

                const diezmosMes = (diezmoData || []).reduce((s: number, c: any) => s + Number(c.total), 0);

                setStats({
                    totalMiembros: totalMiembros || 0,
                    miembrosActivos: miembrosActivos || 0,
                    totalMinisterios: totalMinisterios || 0,
                    ministeriosActivos: ministeriosActivos || 0,
                    eventosPendientes: eventosPend || 0,
                    eventosAprobados: eventosAprobados || 0,
                    totalLideres: totalLideres || 0,
                    totalPastores: totalPastores || 0,
                    cursosActivos: cursosActivos || 0,
                    diezmosTotalMes: diezmosMes,
                });

                setMinisterios(
                    (ministeriosData || []).map((m: any) => ({
                        id_ministerio: m.id_ministerio,
                        nombre: m.nombre,
                        color: m.color,
                        es_principal: m.es_principal,
                        logo_url: m.logo_url,
                        lideres_count: m.ministerio_lideres?.length || 0,
                    }))
                );

                setEventosPendientes(
                    (eventosData || []).map((e: any) => ({
                        id_evento: e.id_evento,
                        titulo: e.titulo,
                        estado: e.estado,
                        fecha_inicio: e.fecha_inicio,
                        ministerio_nombre: e.ministerios?.nombre,
                        ministerio_color: e.ministerios?.color,
                    }))
                );
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
        </div>
    );

    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

    const STAT_CARDS = [
        {
            label: 'Miembros activos',
            value: stats?.miembrosActivos ?? 0,
            sub: `${stats?.totalMiembros ?? 0} total`,
            icon: <Users className="w-5 h-5" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            path: '/pastor/miembros',
        },
        {
            label: 'Ministerios activos',
            value: stats?.ministeriosActivos ?? 0,
            sub: `${stats?.totalMinisterios ?? 0} total`,
            icon: <Heart className="w-5 h-5" />,
            color: 'text-red-600',
            bg: 'bg-red-50',
            path: '/pastor/ministerios',
        },
        {
            label: 'Eventos pendientes',
            value: stats?.eventosPendientes ?? 0,
            sub: `${stats?.eventosAprobados ?? 0} aprobados`,
            icon: <Calendar className="w-5 h-5" />,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            path: '/pastor/eventos',
            alert: (stats?.eventosPendientes ?? 0) > 0,
        },
        {
            label: 'Líderes',
            value: stats?.totalLideres ?? 0,
            sub: `${stats?.totalPastores ?? 0} pastores`,
            icon: <UserCheck className="w-5 h-5" />,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            path: '/pastor/lideres',
        },
        {
            label: 'Cursos activos',
            value: stats?.cursosActivos ?? 0,
            sub: 'Cursos bíblicos',
            icon: <BookOpen className="w-5 h-5" />,
            color: 'text-green-600',
            bg: 'bg-green-50',
            path: '/pastor/cursos',
        },
        {
            label: 'Diezmos este mes',
            value: `$${(stats?.diezmosTotalMes ?? 0).toFixed(2)}`,
            sub: 'Mes en curso',
            icon: <DollarSign className="w-5 h-5" />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            path: '/pastor/diezmos',
        },
    ];

    const principalesMinisterios = ministerios.filter(m => m.es_principal);
    const otrosMinisterios = ministerios.filter(m => !m.es_principal);

    const fmtFecha = (iso: string) =>
        new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });

    return (
        <div className="space-y-8">
            {/* Saludo */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{saludo}, {nombre} 👋</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {STAT_CARDS.map(s => (
                    <button key={s.label} onClick={() => navigate(s.path)}
                        className="relative text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
                        {s.alert && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                        )}
                        <div className={`inline-flex p-2.5 rounded-xl ${s.bg} ${s.color} mb-3`}>
                            {s.icon}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                        <ArrowRight className="absolute bottom-4 right-4 w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Eventos pendientes de aprobación */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Eventos por aprobar
                            {eventosPendientes.length > 0 && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                    {eventosPendientes.length}
                                </span>
                            )}
                        </h2>
                        <button onClick={() => navigate('/pastor/eventos')}
                            className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                            Ver todos <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {eventosPendientes.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">¡Sin eventos pendientes!</p>
                            </div>
                        ) : (
                            eventosPendientes.map(ev => (
                                <button key={ev.id_evento}
                                    onClick={() => navigate('/pastor/eventos')}
                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left transition-colors">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: ev.ministerio_color || '#f59e0b' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{ev.titulo}</p>
                                        <p className="text-xs text-gray-400">
                                            {ev.ministerio_nombre} · {fmtFecha(ev.fecha_inicio)}
                                        </p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex-shrink-0">
                                        Pendiente
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Ministerios */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Heart className="w-4 h-4 text-red-500" /> Ministerios
                        </h2>
                        <button onClick={() => navigate('/pastor/ministerios')}
                            className="text-xs text-red-600 hover:underline font-medium flex items-center gap-1">
                            Gestionar <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Principales */}
                    {principalesMinisterios.length > 0 && (
                        <div className="px-5 py-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Star className="w-3 h-3" /> A tu cargo
                            </p>
                            <div className="space-y-1.5">
                                {principalesMinisterios.map(m => (
                                    <div key={m.id_ministerio} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                                        style={{ backgroundColor: m.color + '10' }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                            style={{ backgroundColor: m.color }}>
                                            {m.nombre.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 flex-1 truncate">{m.nombre}</span>
                                        <span className="text-xs text-gray-400">{m.lideres_count} líder{m.lideres_count !== 1 ? 'es' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resto */}
                    {otrosMinisterios.length > 0 && (
                        <div className="px-5 py-2 pb-4">
                            {principalesMinisterios.length > 0 && (
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-1">
                                    Otros ministerios
                                </p>
                            )}
                            <div className="space-y-1">
                                {otrosMinisterios.slice(0, 5).map(m => (
                                    <div key={m.id_ministerio} className="flex items-center gap-3 px-2 py-1.5">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="text-sm text-gray-700 flex-1 truncate">{m.nombre}</span>
                                        <span className="text-xs text-gray-400">{m.lideres_count} líderes</span>
                                    </div>
                                ))}
                                {otrosMinisterios.length > 5 && (
                                    <p className="text-xs text-gray-400 px-2 pt-1">+{otrosMinisterios.length - 5} más</p>
                                )}
                            </div>
                        </div>
                    )}

                    {ministerios.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">
                            Sin ministerios creados aún
                        </div>
                    )}
                </div>
            </div>

            {/* Accesos rápidos */}
            <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accesos rápidos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Nuevo evento', icon: <Calendar className="w-5 h-5" />, path: '/pastor/eventos', color: 'text-blue-600 bg-blue-50' },
                        { label: 'Nuevo miembro', icon: <Users className="w-5 h-5" />, path: '/pastor/miembros', color: 'text-green-600 bg-green-50' },
                        { label: 'Diezmos', icon: <DollarSign className="w-5 h-5" />, path: '/pastor/diezmos', color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Devocional', icon: <BookOpen className="w-5 h-5" />, path: '/pastor/devocional', color: 'text-purple-600 bg-purple-50' },
                    ].map(a => (
                        <button key={a.label} onClick={() => navigate(a.path)}
                            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-center">
                            <div className={`p-2.5 rounded-xl ${a.color}`}>{a.icon}</div>
                            <span className="text-xs font-medium text-gray-700">{a.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};