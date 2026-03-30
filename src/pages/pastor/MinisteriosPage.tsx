import React, { useState, useMemo } from 'react';
import { Plus, Heart, Search, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { MinisterioCard } from '../../components/ministerios/MinisterioCard';
import { MinisterioFormModal } from '../../components/ministerios/MinisterioFormModal';
import { useMinisterios } from '../../hooks/useMinisterios';
import { usePersonasParaLideres } from '../../hooks/usePersonasParaLideres';
import { useAuth } from '../../hooks/useAuth';
import { Ministerio, MinisterioFormData } from '../../types';

export const MinisteriosPage: React.FC = () => {
    const { user } = useAuth();
    const isPastor = user?.persona?.rol === 'pastor';
    const myPersonaId = user?.persona?.id_persona || '';

    const { ministerios, loading, saving, crearMinisterio, actualizarMinisterio, toggleEstado } = useMinisterios();
    const { personas, refetch: refetchPersonas } = usePersonasParaLideres();

    const [search, setSearch] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingMinisterio, setEditingMinisterio] = useState<Ministerio | null>(null);
    const [confirmToggle, setConfirmToggle] = useState<Ministerio | null>(null);
    const [toggleLoading, setToggleLoading] = useState(false);

    const misMinisteriosComo = useMemo(() => {
        if (isPastor) return [];
        return ministerios.filter(m =>
            m.ministerio_lideres.some(ml => ml.id_persona === myPersonaId)
        );
    }, [ministerios, myPersonaId, isPastor]);

    const restosMinisterios = useMemo(() => {
        if (isPastor) return ministerios;
        return ministerios.filter(m =>
            !m.ministerio_lideres.some(ml => ml.id_persona === myPersonaId)
        );
    }, [ministerios, myPersonaId, isPastor]);

    const filterFn = (list: Ministerio[]) => {
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(m =>
            m.nombre.toLowerCase().includes(q) ||
            m.descripcion?.toLowerCase().includes(q)
        );
    };

    const pastorPrincipales = filterFn(ministerios.filter(m => m.es_principal));
    const pastorResto = filterFn(ministerios.filter(m => !m.es_principal));

    const handleEdit = (m: Ministerio) => {
        setEditingMinisterio(m);
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingMinisterio(null);
    };

    const handleSubmit = async (
        data: MinisterioFormData,
        logoFile: File | null,
        lideresIds: string[]
    ): Promise<boolean> => {
        if (editingMinisterio) {
            return actualizarMinisterio(editingMinisterio.id_ministerio, data, logoFile, lideresIds);
        }
        return crearMinisterio(data, logoFile, lideresIds);
    };

    const handleConfirmToggle = async () => {
        if (!confirmToggle) return;
        setToggleLoading(true);
        await toggleEstado(confirmToggle.id_ministerio, confirmToggle.estado_activo);
        setToggleLoading(false);
        setConfirmToggle(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const totalActivos = ministerios.filter(m => m.estado_activo).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ministerios</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {ministerios.length} ministerios · {totalActivos} activos
                    </p>
                </div>
                {isPastor && (
                    <Button
                        onClick={() => { setEditingMinisterio(null); setShowFormModal(true); }}
                        className="flex items-center gap-2 flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nuevo ministerio</span>
                        <span className="sm:hidden">Nuevo</span>
                    </Button>
                )}
            </div>

            {/* Búsqueda */}
            {ministerios.length > 0 && (
                <div className="max-w-sm">
                    <Input
                        placeholder="Buscar ministerio..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        icon={<Search className="w-4 h-4" />}
                    />
                </div>
            )}

            {/* Vista pastor */}
            {isPastor && (
                <>
                    {pastorPrincipales.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                                Ministerios principales
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pastorPrincipales.map(m => (
                                    <MinisterioCard key={m.id_ministerio} ministerio={m} onEdit={handleEdit} onToggle={setConfirmToggle} isPastor={isPastor} />
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        {pastorPrincipales.length > 0 && (
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                                Todos los ministerios
                            </h2>
                        )}
                        {pastorResto.length === 0 && pastorPrincipales.length === 0 ? (
                            <EmptyState
                                icon={<Heart className="w-12 h-12 text-gray-400" />}
                                title="Sin ministerios"
                                description="Crea el primer ministerio de la iglesia."
                                action={
                                    <Button onClick={() => setShowFormModal(true)} className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Crear primer ministerio
                                    </Button>
                                }
                            />
                        ) : pastorResto.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pastorResto.map(m => (
                                    <MinisterioCard key={m.id_ministerio} ministerio={m} onEdit={handleEdit} onToggle={setConfirmToggle} isPastor={isPastor} />
                                ))}
                            </div>
                        ) : null}
                    </section>
                </>
            )}

            {/* Vista líder */}
            {!isPastor && (
                <>
                    {misMinisteriosComo.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                                Ministerios a tu cargo
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterFn(misMinisteriosComo).map(m => (
                                    <MinisterioCard key={m.id_ministerio} ministerio={m} onEdit={handleEdit} onToggle={setConfirmToggle} isPastor={false} />
                                ))}
                            </div>
                        </section>
                    )}
                    {restosMinisterios.length > 0 && (
                        <section>
                            {misMinisteriosComo.length > 0 && (
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                                    Otros ministerios
                                </h2>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filterFn(restosMinisterios).map(m => (
                                    <MinisterioCard key={m.id_ministerio} ministerio={m} onEdit={() => { }} onToggle={() => { }} isPastor={false} />
                                ))}
                            </div>
                        </section>
                    )}
                    {ministerios.length === 0 && (
                        <EmptyState
                            icon={<Heart className="w-12 h-12 text-gray-400" />}
                            title="Sin ministerios"
                            description="Aún no hay ministerios registrados en el sistema."
                        />
                    )}
                </>
            )}

            {/* Modal confirmación toggle */}
            <Modal
                isOpen={!!confirmToggle}
                onClose={() => setConfirmToggle(null)}
                title={confirmToggle?.estado_activo ? 'Desactivar ministerio' : 'Activar ministerio'}
                width="sm"
            >
                <div className="flex flex-col items-center text-center p-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmToggle?.estado_activo ? 'bg-red-100' : 'bg-green-100'}`}>
                        <AlertTriangle className={`w-6 h-6 ${confirmToggle?.estado_activo ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                        ¿{confirmToggle?.estado_activo ? 'Desactivar' : 'Activar'} este ministerio?
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        <span className="font-semibold text-gray-700">{confirmToggle?.nombre}</span>
                        {confirmToggle?.estado_activo
                            ? ' quedará como inactivo en el sistema.'
                            : ' volverá a estar activo en el sistema.'}
                    </p>
                    <div className="flex w-full gap-3">
                        <Button variant="secondary" fullWidth onClick={() => setConfirmToggle(null)} disabled={toggleLoading}>
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmToggle?.estado_activo ? 'danger' : 'primary'}
                            fullWidth
                            isLoading={toggleLoading}
                            onClick={handleConfirmToggle}
                        >
                            {confirmToggle?.estado_activo ? 'Sí, desactivar' : 'Sí, activar'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal formulario */}
            {isPastor && (
                <MinisterioFormModal
                    isOpen={showFormModal}
                    onClose={handleCloseForm}
                    onSubmit={handleSubmit}
                    saving={saving}
                    ministerio={editingMinisterio}
                    personas={personas}
                    myPersonaId={myPersonaId}
                    onPersonasRefetch={refetchPersonas}
                />
            )}
        </div>
    );
};