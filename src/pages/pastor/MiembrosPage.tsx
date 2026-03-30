import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Search, Filter, ChevronUp, ChevronDown, Edit2, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { MiembroFormModal } from '../../components/miembros/MiembroFormModal';
import { useMiembros } from '../../hooks/useMiembros';
import { Miembro, MiembroFormData } from '../../types';

type SortField = 'apellidos' | 'nombres' | 'created_at';
type SortDir = 'asc' | 'desc';
type FilterEstado = 'todos' | 'activos' | 'inactivos';

const getInitials = (m: Miembro) =>
    `${m.nombres.charAt(0)}${m.apellidos.charAt(0)}`.toUpperCase();

const AVATAR_COLORS = [
    'from-red-100 to-red-200 text-red-700',
    'from-orange-100 to-orange-200 text-orange-700',
    'from-amber-100 to-amber-200 text-amber-700',
    'from-rose-100 to-rose-200 text-rose-700',
];

const getAvatarColor = (id: string) =>
    AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

export const MiembrosPage: React.FC = () => {
    const { miembros, loading, saving, crearMiembro, actualizarMiembro, toggleEstado } = useMiembros();

    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState<FilterEstado>('activos');
    const [sortField, setSortField] = useState<SortField>('apellidos');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingMiembro, setEditingMiembro] = useState<Miembro | null>(null);

    // Modal de confirmación de estado
    const [confirmTarget, setConfirmTarget] = useState<Miembro | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const filtered = useMemo(() => {
        let result = [...miembros];

        if (filterEstado !== 'todos') {
            result = result.filter(m => filterEstado === 'activos' ? m.estado_activo : !m.estado_activo);
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
    }, [miembros, search, filterEstado, sortField, sortDir]);

    const activos = miembros.filter(m => m.estado_activo).length;
    const inactivos = miembros.filter(m => !m.estado_activo).length;

    const handleEdit = (miembro: Miembro) => {
        setEditingMiembro(miembro);
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingMiembro(null);
    };

    const handleSubmit = async (data: MiembroFormData): Promise<boolean> => {
        if (editingMiembro) return actualizarMiembro(editingMiembro.id_persona, data);
        return crearMiembro(data);
    };

    const handleConfirmToggle = async () => {
        if (!confirmTarget) return;
        setConfirmLoading(true);
        await toggleEstado(confirmTarget.id_persona, confirmTarget.estado_activo);
        setConfirmLoading(false);
        setConfirmTarget(null);
    };

    const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
        if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-red-600" />
            : <ChevronDown className="w-3 h-3 text-red-600" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Miembros</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {miembros.length} miembros registrados · {activos} activos · {inactivos} inactivos
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingMiembro(null); setShowFormModal(true); }}
                    className="flex items-center gap-2 flex-shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo miembro</span>
                    <span className="sm:hidden">Nuevo</span>
                </Button>
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
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex-1 w-full">
                        <Input
                            placeholder="Buscar por nombre, cédula, correo o celular..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            icon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Filter className="w-4 h-4 text-gray-400" />
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
                    </div>
                </div>
            </Card>

            {/* Tabla */}
            {filtered.length === 0 ? (
                <EmptyState
                    icon={<Users className="w-12 h-12 text-gray-400" />}
                    title={miembros.length === 0 ? 'Sin miembros registrados' : 'Sin resultados'}
                    description={
                        miembros.length === 0
                            ? 'Registra el primer miembro de la iglesia usando el botón "Nuevo miembro".'
                            : 'Intenta con otros términos de búsqueda o cambia el filtro.'
                    }
                    action={
                        miembros.length === 0 ? (
                            <Button onClick={() => setShowFormModal(true)} className="flex items-center gap-2">
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
                                    <th className="px-5 py-3 text-left hidden lg:table-cell">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Info</span>
                                    </th>
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
                                    <tr key={miembro.id_persona} className="hover:bg-gray-50 transition-colors">

                                        {/* Nombre + avatar */}
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
                                                    <span className="text-gray-300 text-xs">Sin contacto</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Info */}
                                        <td className="px-5 py-3.5 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1.5">
                                                {miembro.genero && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                        {miembro.genero}
                                                    </span>
                                                )}
                                                {miembro.profesion && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs truncate max-w-[120px]">
                                                        {miembro.profesion}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Estado — clic abre confirmación */}
                                        <td className="px-5 py-3.5 text-center">
                                            <button
                                                onClick={() => setConfirmTarget(miembro)}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${miembro.estado_activo
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {miembro.estado_activo ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-5 py-3.5 text-center">
                                            <button
                                                onClick={() => handleEdit(miembro)}
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

            {/* Modal de confirmación de estado */}
            <Modal
                isOpen={!!confirmTarget}
                onClose={() => setConfirmTarget(null)}
                title={confirmTarget?.estado_activo ? 'Desactivar miembro' : 'Activar miembro'}
                width="sm"
            >
                <div className="flex flex-col items-center text-center p-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmTarget?.estado_activo ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                        <AlertTriangle className={`w-6 h-6 ${confirmTarget?.estado_activo ? 'text-red-600' : 'text-green-600'
                            }`} />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                        ¿{confirmTarget?.estado_activo ? 'Desactivar' : 'Activar'} a este miembro?
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        <span className="font-semibold text-gray-700">
                            {confirmTarget?.nombres} {confirmTarget?.apellidos}
                        </span>
                        {confirmTarget?.estado_activo
                            ? ' quedará como inactivo en el sistema.'
                            : ' volverá a estar activo en el sistema.'}
                    </p>
                    <div className="flex w-full gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setConfirmTarget(null)}
                            disabled={confirmLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmTarget?.estado_activo ? 'danger' : 'primary'}
                            fullWidth
                            isLoading={confirmLoading}
                            onClick={handleConfirmToggle}
                        >
                            {confirmTarget?.estado_activo ? 'Sí, desactivar' : 'Sí, activar'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal de formulario */}
            <MiembroFormModal
                isOpen={showFormModal}
                onClose={handleCloseForm}
                onSubmit={handleSubmit}
                saving={saving}
                miembro={editingMiembro}
            />
        </div>
    );
};