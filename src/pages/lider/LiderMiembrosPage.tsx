import React, { useState, useMemo } from 'react';
import {
    Users, UserPlus, Search, Filter,
    ChevronUp, ChevronDown, Edit2, AlertCircle,
    BookOpen, Phone, Mail, MapPin, Briefcase,
    ToggleLeft, ToggleRight, X
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useMinisterios } from '../../hooks/useMinisterios';
import { useMiembrosLider, MiembroConMinisterio, MiembroLiderFormData } from '../../hooks/useMiembrosLider';

// ── Constantes ────────────────────────────────────────────────────────────────
const GENEROS = ['Masculino', 'Femenino'];
const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'];
const NIVELES_ESTUDIO = ['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Postgrado'];

type SortField = 'apellidos' | 'nombres' | 'created_at';
type SortDir = 'asc' | 'desc';
type FilterEstado = 'todos' | 'activos' | 'inactivos';

// ── Colores de avatar ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    'from-red-100 to-red-200 text-red-700',
    'from-orange-100 to-orange-200 text-orange-700',
    'from-amber-100 to-amber-200 text-amber-700',
    'from-rose-100 to-rose-200 text-rose-700',
];
const getAvatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (m: MiembroConMinisterio) =>
    `${m.nombres.charAt(0)}${m.apellidos.charAt(0)}`.toUpperCase();

// ── Ítem de info del detalle ──────────────────────────────────────────────────
const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({
    icon, label, value,
}) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className="text-red-400 mt-0.5 flex-shrink-0">{icon}</div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
            </div>
        </div>
    );
};

const fmtFecha = (d?: string) => {
    if (!d) return undefined;
    return new Date(d + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
};

// ── Modal detalle de un miembro ───────────────────────────────────────────────
const MiembroDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    miembro: MiembroConMinisterio | null;
    onEdit: (m: MiembroConMinisterio) => void;
    onToggle: (id: string, estadoActual: boolean) => void;
}> = ({ isOpen, onClose, miembro, onEdit, onToggle }) => {
    if (!miembro) return null;
    const initials = getInitials(miembro);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalle del miembro" width="md">
            <div className="space-y-5">
                {/* Avatar y nombre */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${getAvatarColor(miembro.id_persona)}`}>
                        <span className="text-xl font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {miembro.nombres} {miembro.apellidos}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${miembro.estado_activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {miembro.estado_activo ? 'Activo' : 'Inactivo'}
                            </span>
                            {miembro.numero_cedula && (
                                <span className="text-xs text-gray-400">CI: {miembro.numero_cedula}</span>
                            )}
                        </div>
                        {/* Ministerios */}
                        {miembro.ministerios && miembro.ministerios.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {miembro.ministerios.map(m => (
                                    <span
                                        key={m.id_ministerio}
                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ backgroundColor: m.color + '20', color: m.color }}
                                    >
                                        {m.nombre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-0">
                    <InfoItem icon={<Mail size={15} />} label="Correo" value={miembro.correo_electronico} />
                    <InfoItem icon={<Phone size={15} />} label="Celular" value={miembro.celular} />
                    <InfoItem icon={<MapPin size={15} />} label="Dirección" value={miembro.direccion} />
                    <InfoItem icon={<Users size={15} />} label="Fecha de nacimiento" value={fmtFecha(miembro.fecha_nacimiento)} />
                    <InfoItem icon={<Users size={15} />} label="Género" value={miembro.genero} />
                    <InfoItem icon={<Users size={15} />} label="Estado civil" value={miembro.estado_civil} />
                    <InfoItem icon={<Users size={15} />} label="Nacionalidad" value={miembro.nacionalidad} />
                    <InfoItem icon={<BookOpen size={15} />} label="Nivel de estudio" value={miembro.nivel_estudio} />
                    <InfoItem icon={<Briefcase size={15} />} label="Profesión" value={miembro.profesion} />
                    <InfoItem icon={<Briefcase size={15} />} label="Lugar de trabajo" value={miembro.lugar_trabajo} />
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="secondary"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => onToggle(miembro.id_persona, miembro.estado_activo)}
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

// ── Formulario de miembro ─────────────────────────────────────────────────────
const MiembroFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (d: MiembroLiderFormData) => Promise<boolean>;
    saving: boolean;
    miembro?: MiembroConMinisterio | null;
    ministeriosDisponibles: { id_ministerio: string; nombre: string; color: string }[];
}> = ({ isOpen, onClose, onSubmit, saving, miembro, ministeriosDisponibles }) => {
    const isEditing = !!miembro;

    const buildDefault = (m?: MiembroConMinisterio | null) => ({
        nombres: m?.nombres || '',
        apellidos: m?.apellidos || '',
        correo_electronico: m?.correo_electronico || '',
        numero_cedula: m?.numero_cedula || '',
        celular: m?.celular || '',
        direccion: m?.direccion || '',
        fecha_nacimiento: m?.fecha_nacimiento || '',
        genero: m?.genero || '',
        estado_civil: m?.estado_civil || '',
        nacionalidad: m?.nacionalidad || '',
        nivel_estudio: m?.nivel_estudio || '',
        profesion: m?.profesion || '',
        lugar_trabajo: m?.lugar_trabajo || '',
        id_ministerio: ministeriosDisponibles[0]?.id_ministerio || '',
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<MiembroLiderFormData>({
        defaultValues: buildDefault(miembro),
    });

    React.useEffect(() => {
        if (isOpen) reset(buildDefault(miembro));
    }, [isOpen, miembro]);

    const onFormSubmit = async (data: MiembroLiderFormData) => {
        const cleaned = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
        ) as MiembroLiderFormData;
        const ok = await onSubmit(cleaned);
        if (ok) { reset(); onClose(); }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Miembro' : 'Registrar Nuevo Miembro'}
            width="lg"
        >
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

                {/* Ministerio — solo al crear */}
                {!isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ministerio al que pertenece *
                        </label>
                        {ministeriosDisponibles.length === 1 ? (
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                                style={{
                                    backgroundColor: ministeriosDisponibles[0].color + '10',
                                    borderColor: ministeriosDisponibles[0].color + '40',
                                }}
                            >
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: ministeriosDisponibles[0].color }}
                                />
                                <span className="text-sm font-medium text-gray-800">
                                    {ministeriosDisponibles[0].nombre}
                                </span>
                                <input
                                    type="hidden"
                                    {...register('id_ministerio')}
                                    value={ministeriosDisponibles[0].id_ministerio}
                                />
                            </div>
                        ) : (
                            <select
                                {...register('id_ministerio', { required: 'Selecciona un ministerio' })}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                {ministeriosDisponibles.map(m => (
                                    <option key={m.id_ministerio} value={m.id_ministerio}>{m.nombre}</option>
                                ))}
                            </select>
                        )}
                        {errors.id_ministerio && (
                            <p className="mt-1 text-sm text-red-600">{errors.id_ministerio.message}</p>
                        )}
                    </div>
                )}

                {/* Datos personales */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                        Datos personales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nombres *"
                            {...register('nombres', { required: 'El nombre es obligatorio' })}
                            error={errors.nombres?.message}
                            placeholder="Juan Carlos"
                        />
                        <Input
                            label="Apellidos *"
                            {...register('apellidos', { required: 'El apellido es obligatorio' })}
                            error={errors.apellidos?.message}
                            placeholder="García López"
                        />
                        <Input
                            label="Cédula"
                            {...register('numero_cedula')}
                            placeholder="0123456789"
                        />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                            <select
                                {...register('genero')}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <Input label="Fecha de nacimiento" type="date" {...register('fecha_nacimiento')} />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil</label>
                            <select
                                {...register('estado_civil')}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {ESTADOS_CIVILES.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <Input label="Nacionalidad" {...register('nacionalidad')} placeholder="Ecuatoriana" />
                    </div>
                </div>

                {/* Contacto */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                        Contacto
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Correo electrónico"
                            type="email"
                            {...register('correo_electronico')}
                            placeholder="correo@ejemplo.com"
                        />
                        <Input label="Celular" {...register('celular')} placeholder="0987654321" />
                        <div className="sm:col-span-2">
                            <Input label="Dirección" {...register('direccion')} placeholder="Calle principal, ciudad" />
                        </div>
                    </div>
                </div>

                {/* Académico y laboral */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                        Académico y laboral
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de estudio</label>
                            <select
                                {...register('nivel_estudio')}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {NIVELES_ESTUDIO.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <Input label="Profesión" {...register('profesion')} placeholder="Ingeniero, Docente..." />
                        <div className="sm:col-span-2">
                            <Input label="Lugar de trabajo" {...register('lugar_trabajo')} placeholder="Empresa o institución" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" fullWidth isLoading={saving}>
                        {isEditing ? 'Guardar cambios' : 'Registrar miembro'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export const LiderMiembrosPage: React.FC = () => {
    const { user } = useAuth();
    const myPersonaId = user?.persona?.id_persona || '';

    const { ministerios, loading: loadingMins } = useMinisterios();

    // Solo los ministerios donde este líder es líder
    const misMinisterios = useMemo(
        () => ministerios.filter(m =>
            m.estado_activo &&
            m.ministerio_lideres.some(ml => ml.id_persona === myPersonaId)
        ),
        [ministerios, myPersonaId]
    );

    const misMinisterioIds = useMemo(
        () => misMinisterios.map(m => m.id_ministerio),
        [misMinisterios]
    );

    const { miembros, loading, saving, crearMiembro, actualizarMiembro, toggleEstado } =
        useMiembrosLider(misMinisterioIds);

    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState<FilterEstado>('activos');
    const [filterMinisterio, setFilterMinisterio] = useState<string>('todos');
    const [sortField, setSortField] = useState<SortField>('apellidos');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const [showForm, setShowForm] = useState(false);
    const [editingMiembro, setEditingMiembro] = useState<MiembroConMinisterio | null>(null);
    const [detailMiembro, setDetailMiembro] = useState<MiembroConMinisterio | null>(null);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const filtered = useMemo(() => {
        let result = [...miembros];

        if (filterEstado !== 'todos') {
            result = result.filter(m =>
                filterEstado === 'activos' ? m.estado_activo : !m.estado_activo
            );
        }

        if (filterMinisterio !== 'todos') {
            result = result.filter(m =>
                m.ministerios?.some(min => min.id_ministerio === filterMinisterio)
            );
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(m =>
                m.nombres.toLowerCase().includes(q) ||
                m.apellidos.toLowerCase().includes(q) ||
                m.correo_electronico?.toLowerCase().includes(q) ||
                m.numero_cedula?.includes(q) ||
                m.celular?.includes(q)
            );
        }

        result.sort((a, b) => {
            const va = (a[sortField] || '').toString().toLowerCase();
            const vb = (b[sortField] || '').toString().toLowerCase();
            return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });

        return result;
    }, [miembros, search, filterEstado, filterMinisterio, sortField, sortDir]);

    const activos = miembros.filter(m => m.estado_activo).length;
    const inactivos = miembros.filter(m => !m.estado_activo).length;

    const handleSubmit = async (data: MiembroLiderFormData): Promise<boolean> => {
        if (editingMiembro) return actualizarMiembro(editingMiembro.id_persona, data);
        return crearMiembro(data);
    };

    const handleToggle = async (id: string, estadoActual: boolean) => {
        await toggleEstado(id, estadoActual);
        // Si el detail modal está abierto, actualizar
        if (detailMiembro?.id_persona === id) {
            setDetailMiembro(prev => prev ? { ...prev, estado_activo: !estadoActual } : null);
        }
    };

    const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
        if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-red-600" />
            : <ChevronDown className="w-3 h-3 text-red-600" />;
    };

    if (loadingMins || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    // Sin ministerios asignados
    if (misMinisterios.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Mis Miembros</h1>
                <EmptyState
                    icon={<AlertCircle className="w-12 h-12 text-amber-400" />}
                    title="Todavía no tienes ministerios asignados"
                    description="Para poder gestionar miembros, un pastor primero debe asignarte como líder de al menos un ministerio. Comunícate con el pastor para que te configure."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Miembros</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {miembros.length} miembros en tus ministerios · {activos} activos · {inactivos} inactivos
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingMiembro(null); setShowForm(true); }}
                    className="flex-shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo miembro</span>
                    <span className="sm:hidden">Nuevo</span>
                </Button>
            </div>

            {/* Ministerios del líder */}
            <div className="flex flex-wrap gap-2">
                {misMinisterios.map(m => (
                    <span
                        key={m.id_ministerio}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ backgroundColor: m.color + '18', color: m.color, border: `1px solid ${m.color}30` }}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        {m.nombre}
                    </span>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', value: miembros.length, color: 'text-gray-900' },
                    { label: 'Activos', value: activos, color: 'text-green-700' },
                    { label: 'Inactivos', value: inactivos, color: 'text-gray-400' },
                ].map(stat => (
                    <Card key={stat.label} padding="small">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </Card>
                ))}
            </div>

            {/* Filtros */}
            <Card padding="small">
                <div className="flex flex-col gap-3">
                    <Input
                        placeholder="Buscar por nombre, cédula, correo o celular..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

                        {/* Filtro estado */}
                        {(['todos', 'activos', 'inactivos'] as FilterEstado[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterEstado(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filterEstado === f
                                    ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                                    : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}

                        {/* Filtro ministerio (solo si tiene más de uno) */}
                        {misMinisterios.length > 1 && (
                            <>
                                <span className="w-px h-4 bg-gray-200 mx-1" />
                                <button
                                    onClick={() => setFilterMinisterio('todos')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMinisterio === 'todos'
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    Todos los ministerios
                                </button>
                                {misMinisterios.map(m => (
                                    <button
                                        key={m.id_ministerio}
                                        onClick={() => setFilterMinisterio(m.id_ministerio)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterMinisterio === m.id_ministerio
                                            ? 'text-white'
                                            : 'text-gray-500 hover:bg-gray-100'
                                            }`}
                                        style={filterMinisterio === m.id_ministerio
                                            ? { backgroundColor: m.color }
                                            : {}}
                                    >
                                        {m.nombre}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Tabla / Vacío */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Users className="w-12 h-12 text-gray-400" />}
                    title={
                        miembros.length === 0
                            ? 'Aún no tienes miembros registrados'
                            : 'Ningún miembro coincide con esa búsqueda'
                    }
                    description={
                        miembros.length === 0
                            ? 'Registra el primer miembro de tu ministerio usando el botón de arriba.'
                            : 'Prueba con otro nombre, cédula o cambia los filtros.'
                    }
                    action={
                        miembros.length === 0 ? (
                            <Button onClick={() => setShowForm(true)}>
                                <UserPlus className="w-4 h-4" /> Registrar primer miembro
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <Card padding="none" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-5 py-3 text-left">
                                        <button
                                            onClick={() => handleSort('apellidos')}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                                        >
                                            Miembro <SortIcon field="apellidos" />
                                        </button>
                                    </th>
                                    <th className="px-5 py-3 text-left hidden md:table-cell">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</span>
                                    </th>
                                    {misMinisterios.length > 1 && (
                                        <th className="px-5 py-3 text-left hidden lg:table-cell">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ministerio</span>
                                        </th>
                                    )}
                                    <th className="px-5 py-3 text-center">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</span>
                                    </th>
                                    <th className="px-5 py-3 text-center">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(miembro => (
                                    <tr
                                        key={miembro.id_persona}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setDetailMiembro(miembro)}
                                    >
                                        {/* Nombre */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center ${getAvatarColor(miembro.id_persona)}`}>
                                                    <span className="text-xs font-bold">{getInitials(miembro)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {miembro.apellidos}, {miembro.nombres}
                                                    </p>
                                                    {miembro.numero_cedula && (
                                                        <p className="text-xs text-gray-400">CI: {miembro.numero_cedula}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="px-5 py-3.5 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                {miembro.correo_electronico && (
                                                    <p className="text-gray-600 truncate max-w-[200px]">{miembro.correo_electronico}</p>
                                                )}
                                                {miembro.celular && (
                                                    <p className="text-gray-400 text-xs">{miembro.celular}</p>
                                                )}
                                                {!miembro.correo_electronico && !miembro.celular && (
                                                    <span className="text-gray-300 text-xs italic">Sin contacto registrado</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Ministerio(s) */}
                                        {misMinisterios.length > 1 && (
                                            <td className="px-5 py-3.5 hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {miembro.ministerios?.map(m => (
                                                        <span
                                                            key={m.id_ministerio}
                                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                            style={{ backgroundColor: m.color + '20', color: m.color }}
                                                        >
                                                            {m.nombre}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        )}

                                        {/* Estado */}
                                        <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleToggle(miembro.id_persona, miembro.estado_activo)}
                                                title={miembro.estado_activo ? 'Clic para desactivar' : 'Clic para activar'}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${miembro.estado_activo
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {miembro.estado_activo ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    setEditingMiembro(miembro);
                                                    setShowForm(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                            Mostrando {filtered.length} de {miembros.length} miembros
                        </div>
                    )}
                </Card>
            )}

            {/* Modal detalle */}
            <MiembroDetailModal
                isOpen={!!detailMiembro}
                onClose={() => setDetailMiembro(null)}
                miembro={detailMiembro}
                onEdit={m => { setEditingMiembro(m); setShowForm(true); }}
                onToggle={handleToggle}
            />

            {/* Modal formulario */}
            <MiembroFormModal
                isOpen={showForm}
                onClose={() => { setShowForm(false); setEditingMiembro(null); }}
                onSubmit={handleSubmit}
                saving={saving}
                miembro={editingMiembro}
                ministeriosDisponibles={misMinisterios.map(m => ({
                    id_ministerio: m.id_ministerio,
                    nombre: m.nombre,
                    color: m.color,
                }))}
            />
        </div>
    );
};