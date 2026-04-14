import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, Users, Search, Shield, Mail, Phone, Calendar, Briefcase, ShieldCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAscenderPastor } from '../../hooks/useAscenderPastor';
import { usePersonasParaLideres, PersonaParaLider, getCamposFaltantes } from '../../hooks/usePersonasParaLideres';
import { CompletarDatosPastorModal, ConfirmarAscensoPastorModal } from '../../components/ministerios/AscensoPastorModals';

interface PersonaConMinisterios {
    id_persona: string;
    nombres: string;
    apellidos: string;
    rol: 'lider' | 'pastor';
    correo_electronico?: string;
    celular?: string;
    direccion?: string;
    fecha_nacimiento?: string;
    genero?: string;
    profesion?: string;
    estado_activo: boolean;
    created_at: string;
    ministerios_asignados: { nombre: string; color: string; estado_activo: boolean }[];
}

const getInitials = (nombres: string, apellidos: string) =>
    `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

const formatFecha = (iso?: string) => {
    if (!iso) return undefined;
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

const PersonaCard: React.FC<{
    persona: PersonaConMinisterios;
    onAscenderPastor?: (p: PersonaConMinisterios) => void;
}> = ({ persona, onAscenderPastor }) => {
    const initials = getInitials(persona.nombres, persona.apellidos);
    const isPastor = persona.rol === 'pastor';
    const accentColor = isPastor ? '#7c3aed' : '#ef4444';

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${persona.estado_activo ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
            <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: accentColor }}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {persona.nombres} {persona.apellidos}
                            </h3>
                            {!persona.estado_activo && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactivo</span>
                            )}
                        </div>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: accentColor }}>
                            {isPastor ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {isPastor ? 'Pastor' : 'Líder'}
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    {persona.correo_electronico && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span className="truncate">{persona.correo_electronico}</span>
                        </div>
                    )}
                    {persona.celular && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            {persona.celular}
                        </div>
                    )}
                    {persona.profesion && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Briefcase className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            {persona.profesion}
                        </div>
                    )}
                    {persona.fecha_nacimiento && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            {formatFecha(persona.fecha_nacimiento)}
                        </div>
                    )}
                </div>

                {persona.ministerios_asignados.length > 0 && (
                    <div className="pt-1">
                        <p className="text-xs font-medium text-gray-400 mb-1.5">Ministerios a cargo</p>
                        <div className="flex flex-wrap gap-1.5">
                            {persona.ministerios_asignados.map((m, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: m.color + '20', color: m.estado_activo ? m.color : '#9ca3af' }}>
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: m.estado_activo ? m.color : '#d1d5db' }} />
                                    {m.nombre}
                                    {!m.estado_activo && <span className="text-gray-400">(inactivo)</span>}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {persona.ministerios_asignados.length === 0 && !isPastor && (
                    <p className="text-xs text-gray-300 italic">Sin ministerios asignados</p>
                )}

                {/* Botón ascender a pastor — solo para líderes */}
                {!isPastor && onAscenderPastor && (
                    <div className="pt-1 border-t border-gray-50">
                        <Button variant="ghost" className="w-full text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                            onClick={() => onAscenderPastor(persona)}>
                            <ShieldCheck className="w-3.5 h-3.5" /> Ascender a Pastor
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const LideresPage: React.FC = () => {
    const [personas, setPersonas] = useState<PersonaConMinisterios[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Ascenso a pastor
    const { personas: personasParaLider, refetch: refetchPersonas } = usePersonasParaLideres();
    const { ascending, ascenderAPastor, previewUsername } = useAscenderPastor();
    const [personaParaCompletar, setPersonaParaCompletar] = useState<PersonaParaLider | null>(null);
    const [personaParaAscender, setPersonaParaAscender] = useState<PersonaParaLider | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: personasData } = await supabase
                .from('personas')
                .select(`id_persona, nombres, apellidos, rol, correo_electronico, celular,
                    direccion, fecha_nacimiento, genero, profesion, estado_activo, created_at`)
                .in('rol', ['lider', 'pastor'])
                .order('apellidos');

            const { data: lideresData } = await supabase
                .from('ministerio_lideres')
                .select(`id_persona, ministerios (nombre, color, estado_activo)`);

            const ministeriosPorPersona: Record<string, { nombre: string; color: string; estado_activo: boolean }[]> = {};
            (lideresData || []).forEach((ml: any) => {
                if (!ministeriosPorPersona[ml.id_persona]) ministeriosPorPersona[ml.id_persona] = [];
                if (ml.ministerios) ministeriosPorPersona[ml.id_persona].push(ml.ministerios);
            });

            const result: PersonaConMinisterios[] = (personasData || []).map((p: any) => ({
                ...p,
                ministerios_asignados: ministeriosPorPersona[p.id_persona] || [],
            }));
            setPersonas(result);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAscenderPastorClick = (persona: PersonaConMinisterios) => {
        // Buscar la persona en el listado completo (con todos los campos)
        const personaCompleta = personasParaLider.find(p => p.id_persona === persona.id_persona);
        if (!personaCompleta) return;

        // Si ya tiene cuenta (era líder), no necesitamos validar campos — solo cambiar rol
        if (personaCompleta.id_usuario) {
            setPersonaParaAscender(personaCompleta);
            return;
        }

        const faltantes = getCamposFaltantes(personaCompleta);
        if (faltantes.length > 0) {
            setPersonaParaCompletar(personaCompleta);
        } else {
            setPersonaParaAscender(personaCompleta);
        }
    };

    const handleDatosCompletados = (personaActualizada: PersonaParaLider) => {
        setPersonaParaCompletar(null);
        const faltantes = getCamposFaltantes(personaActualizada);
        if (faltantes.length === 0) setPersonaParaAscender(personaActualizada);
    };

    const handleConfirmarAscenso = async () => {
        if (!personaParaAscender) return;
        const result = await ascenderAPastor(personaParaAscender);
        if (result.success) {
            setPersonaParaAscender(null);
            refetchPersonas();
            fetchData();
        }
    };

    const pastores = useMemo(() =>
        personas.filter(p => p.rol === 'pastor' &&
            (!search.trim() || `${p.nombres} ${p.apellidos}`.toLowerCase().includes(search.toLowerCase()))
        ), [personas, search]);

    const lideres = useMemo(() =>
        personas.filter(p => p.rol === 'lider' &&
            (!search.trim() || `${p.nombres} ${p.apellidos}`.toLowerCase().includes(search.toLowerCase()))
        ), [personas, search]);

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Líderes y Pastores</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {pastores.length} pastor{pastores.length !== 1 ? 'es' : ''} · {lideres.length} líder{lideres.length !== 1 ? 'es' : ''}
                    </p>
                </div>
            </div>

            {personas.length > 0 && (
                <div className="max-w-sm">
                    <Input placeholder="Buscar por nombre..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        icon={<Search className="w-4 h-4" />} />
                </div>
            )}

            <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-violet-500" /> Pastores
                </h2>
                {pastores.length === 0 ? (
                    <EmptyState icon={<Shield className="w-10 h-10 text-gray-300" />}
                        title="Sin pastores registrados" description="No hay pastores en el sistema aún." className="py-8" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastores.map(p => <PersonaCard key={p.id_persona} persona={p} />)}
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-red-500" /> Líderes
                    </h2>
                    {lideres.length > 0 && (
                        <p className="text-xs text-gray-400">Puedes ascender líderes a pastores desde su tarjeta</p>
                    )}
                </div>
                {lideres.length === 0 ? (
                    <EmptyState icon={<Users className="w-10 h-10 text-gray-300" />}
                        title="Sin líderes registrados"
                        description="Los líderes aparecen aquí cuando son ascendidos desde el módulo de Ministerios."
                        className="py-8" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lideres.map(p => (
                            <PersonaCard key={p.id_persona} persona={p}
                                onAscenderPastor={handleAscenderPastorClick} />
                        ))}
                    </div>
                )}
            </section>

            <CompletarDatosPastorModal
                isOpen={!!personaParaCompletar}
                onClose={() => setPersonaParaCompletar(null)}
                persona={personaParaCompletar}
                onDatosCompletados={handleDatosCompletados}
            />

            <ConfirmarAscensoPastorModal
                isOpen={!!personaParaAscender}
                onClose={() => setPersonaParaAscender(null)}
                persona={personaParaAscender}
                onConfirm={handleConfirmarAscenso}
                ascending={ascending}
                usernamePreview={personaParaAscender
                    ? previewUsername(personaParaAscender.nombres, personaParaAscender.apellidos)
                    : ''}
                eraLider={!!personaParaAscender?.id_usuario}
            />
        </div>
    );
};