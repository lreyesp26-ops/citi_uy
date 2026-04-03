import React, { useState, useMemo, useRef } from 'react';
import {
    DollarSign, Plus, ArrowLeft, ChevronRight, Edit2, Trash2,
    Save, X, AlertTriangle, Calendar, FileText, Search,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import {
    useDiezmos, useRegistrosDiezmo,
    type DiezmoCierre, type DiezmoRegistro,
    type CierreFormData, type RegistroFormData,
} from '../../hooks/useDiezmos';

// ── Utilidades ───────────────────────────────────────────────────────────────
const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtMonto = (n: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

// ── Formulario de Cierre ─────────────────────────────────────────────────────
const CierreFormModal: React.FC<{
    isOpen: boolean; onClose: () => void;
    onSubmit: (d: CierreFormData) => Promise<boolean>;
    saving: boolean; defaultValues?: Partial<CierreFormData>;
}> = ({ isOpen, onClose, onSubmit, saving, defaultValues }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CierreFormData>({ defaultValues });
    React.useEffect(() => { if (isOpen) reset(defaultValues || { fecha_cierre: new Date().toISOString().split('T')[0] }); }, [isOpen]);

    const go = async (d: CierreFormData) => { if (await onSubmit(d)) onClose(); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={defaultValues?.fecha_cierre ? 'Editar Cierre' : 'Nuevo Cierre'} width="md">
            <form onSubmit={handleSubmit(go)} className="space-y-4">
                <Input label="Fecha del cierre *" type="date"
                    {...register('fecha_cierre', { required: 'Requerido' })}
                    error={errors.fecha_cierre?.message} />
                <Input label="Asunto / Motivo"
                    {...register('asunto')} placeholder="Ej. Cierre diezmos enero 2026" />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea {...register('descripcion')} rows={2} placeholder="Notas opcionales..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button type="submit" fullWidth isLoading={saving}>Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

// ── Fila de registro con edición inline ──────────────────────────────────────
const FilaRegistro: React.FC<{
    registro: DiezmoRegistro;
    personas: any[];
    onActualizar: (id: string, d: Partial<RegistroFormData>) => Promise<boolean>;
    onEliminar: (id: string) => void;
    duplicado: boolean;
}> = ({ registro, personas, onActualizar, onEliminar, duplicado }) => {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState({
        id_persona: registro.id_persona || '',
        fecha: registro.fecha,
        monto: String(registro.monto),
        asunto: registro.asunto || '',
        descripcion: registro.descripcion || '',
    });

    const guardar = async () => {
        const ok = await onActualizar(registro.id_registro, {
            ...local, monto: Number(local.monto), id_persona: local.id_persona || undefined,
        });
        if (ok) setEditing(false);
    };

    if (editing) {
        return (
            <tr className="bg-blue-50/40">
                <td className="px-4 py-2">
                    <select value={local.id_persona} onChange={e => setLocal(p => ({ ...p, id_persona: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400">
                        <option value="">— Anónimo —</option>
                        {personas.map(p => <option key={p.id_persona} value={p.id_persona}>{p.apellidos}, {p.nombres}</option>)}
                    </select>
                </td>
                <td className="px-4 py-2">
                    <input type="date" value={local.fecha} onChange={e => setLocal(p => ({ ...p, fecha: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </td>
                <td className="px-4 py-2">
                    <input type="number" min={0.01} step={0.01} value={local.monto}
                        onChange={e => setLocal(p => ({ ...p, monto: e.target.value }))}
                        className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-400" />
                </td>
                <td className="px-4 py-2">
                    <input value={local.asunto} onChange={e => setLocal(p => ({ ...p, asunto: e.target.value }))}
                        placeholder="Asunto..."
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </td>
                <td className="px-4 py-2">
                    <div className="flex gap-1.5">
                        <button onClick={guardar} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className={`hover:bg-gray-50 transition-colors ${duplicado ? 'bg-amber-50/40' : ''}`}>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {duplicado && <span title="Posible duplicado" className="flex"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /></span>}
                    <span className="text-sm text-gray-800">
                        {registro.personas
                            ? `${registro.personas.apellidos}, ${registro.personas.nombres}`
                            : <span className="text-gray-400 italic">Anónimo</span>}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmt(registro.fecha)}</td>
            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmtMonto(registro.monto)}</td>
            <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{registro.asunto || '—'}</td>
            <td className="px-4 py-3">
                <div className="flex gap-1.5">
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onEliminar(registro.id_registro)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </td>
        </tr>
    );
};

// ── Nueva fila de registro ────────────────────────────────────────────────────
const NuevaFilaRegistro: React.FC<{
    personas: any[];
    fechaDefecto: string;
    onAgregar: (d: RegistroFormData) => Promise<boolean>;
    saving: boolean;
}> = ({ personas, fechaDefecto, onAgregar, saving }) => {
    const [local, setLocal] = useState({ id_persona: '', fecha: fechaDefecto, monto: '', asunto: '', descripcion: '' });
    const montoRef = useRef<HTMLInputElement>(null);

    const agregar = async () => {
        if (!local.monto || Number(local.monto) <= 0) { montoRef.current?.focus(); return; }
        const ok = await onAgregar({ ...local, monto: Number(local.monto), id_persona: local.id_persona || undefined });
        if (ok) setLocal(p => ({ ...p, monto: '', asunto: '' }));
    };

    return (
        <tr className="bg-green-50/30 border-t-2 border-green-100">
            <td className="px-4 py-2">
                <select value={local.id_persona} onChange={e => setLocal(p => ({ ...p, id_persona: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
                    <option value="">— Anónimo —</option>
                    {personas.map(p => <option key={p.id_persona} value={p.id_persona}>{p.apellidos}, {p.nombres}</option>)}
                </select>
            </td>
            <td className="px-4 py-2">
                <input type="date" value={local.fecha} onChange={e => setLocal(p => ({ ...p, fecha: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </td>
            <td className="px-4 py-2">
                <input ref={montoRef} type="number" min={0.01} step={0.01} value={local.monto}
                    placeholder="0.00"
                    onChange={e => setLocal(p => ({ ...p, monto: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
                    className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-400" />
            </td>
            <td className="px-4 py-2">
                <input value={local.asunto} onChange={e => setLocal(p => ({ ...p, asunto: e.target.value }))}
                    placeholder="Asunto opcional..."
                    onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </td>
            <td className="px-4 py-2">
                <Button className="text-xs h-8" onClick={agregar} isLoading={saving}>
                    <Plus className="w-3.5 h-3.5" /> Agregar
                </Button>
            </td>
        </tr>
    );
};

// ── Detalle de un Cierre ──────────────────────────────────────────────────────
const DetalleCierre: React.FC<{ cierre: DiezmoCierre; onBack: () => void; onCierreActualizado: () => void }> = ({
    cierre, onBack, onCierreActualizado,
}) => {
    const { registros, loading, saving, agregar, actualizar, eliminar } = useRegistrosDiezmo(cierre.id_cierre);
    const [personas, setPersonas] = React.useState<any[]>([]);
    const [editCierre, setEditCierre] = React.useState(false);
    const { actualizarCierre, saving: savingCierre } = useDiezmos();
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        supabase.from('personas').select('id_persona, nombres, apellidos')
            .eq('estado_activo', true).order('apellidos')
            .then(({ data }) => setPersonas(data || []));
    }, []);

    // Detectar duplicados: mismo id_persona + misma fecha + mismo monto
    const duplicados = useMemo(() => {
        const seen = new Map<string, number>();
        const dup = new Set<string>();
        registros.forEach(r => {
            const key = `${r.id_persona || 'anon'}_${r.fecha}_${r.monto}`;
            const prev = seen.get(key);
            if (prev !== undefined) {
                dup.add(r.id_registro);
                // también marcar el anterior
                const anterior = registros.find((x, i) => i < registros.indexOf(r) && `${x.id_persona || 'anon'}_${x.fecha}_${x.monto}` === key);
                if (anterior) dup.add(anterior.id_registro);
            }
            seen.set(key, (prev || 0) + 1);
        });
        return dup;
    }, [registros]);

    const filtrados = registros.filter(r => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            r.personas ? `${r.personas.nombres} ${r.personas.apellidos}`.toLowerCase().includes(q) : false
        ) || r.asunto?.toLowerCase().includes(q);
    });

    if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Diezmos
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="font-medium text-gray-700 truncate">{cierre.asunto || fmt(cierre.fecha_cierre)}</span>
            </div>

            {/* Header del cierre */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-gray-900">{cierre.asunto || 'Cierre de diezmos'}</h2>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {fmt(cierre.fecha_cierre)}
                            </span>
                        </div>
                        {cierre.descripcion && <p className="text-sm text-gray-500">{cierre.descripcion}</p>}
                        <p className="text-xs text-gray-400">{registros.length} registro{registros.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Total del cierre</p>
                            <p className="text-2xl font-bold text-green-700">{fmtMonto(cierre.total)}</p>
                        </div>
                        <button onClick={() => setEditCierre(true)}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {duplicados.size > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        Se detectaron {duplicados.size} registros posiblemente duplicados (mismo miembro, fecha y monto). Están marcados en amarillo.
                    </div>
                )}
            </div>

            {/* Búsqueda */}
            <div className="max-w-xs">
                <Input placeholder="Buscar por nombre o asunto..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    icon={<Search className="w-4 h-4" />} />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Miembro</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asunto</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtrados.map(r => (
                                <FilaRegistro
                                    key={r.id_registro} registro={r} personas={personas}
                                    onActualizar={actualizar} onEliminar={eliminar}
                                    duplicado={duplicados.has(r.id_registro)}
                                />
                            ))}
                            {/* Fila de agregar (solo si no hay búsqueda) */}
                            {!search && (
                                <NuevaFilaRegistro
                                    personas={personas}
                                    fechaDefecto={cierre.fecha_cierre}
                                    onAgregar={agregar}
                                    saving={saving}
                                />
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer total */}
                <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{registros.length} registros</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Total:</span>
                        <span className="text-xl font-bold text-green-700">{fmtMonto(cierre.total)}</span>
                    </div>
                </div>
            </div>

            {/* Modal editar cierre */}
            <CierreFormModal
                isOpen={editCierre} onClose={() => setEditCierre(false)} saving={savingCierre}
                defaultValues={{ fecha_cierre: cierre.fecha_cierre, asunto: cierre.asunto || '', descripcion: cierre.descripcion || '' }}
                onSubmit={async d => {
                    const ok = await actualizarCierre(cierre.id_cierre, d);
                    if (ok) { onCierreActualizado(); setEditCierre(false); }
                    return ok;
                }}
            />
        </div>
    );
};

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export const DiezmosPage: React.FC = () => {
    const { cierres, loading, saving, fetchCierres, crearCierre, eliminarCierre } = useDiezmos();
    const [cierreSeleccionado, setCierreSeleccionado] = useState<DiezmoCierre | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Refrescar cierre seleccionado cuando cambian los cierres
    React.useEffect(() => {
        if (cierreSeleccionado) {
            const actualizado = cierres.find(c => c.id_cierre === cierreSeleccionado.id_cierre);
            if (actualizado) setCierreSeleccionado(actualizado);
        }
    }, [cierres]);

    if (cierreSeleccionado) {
        return (
            <DetalleCierre
                cierre={cierreSeleccionado}
                onBack={() => { setCierreSeleccionado(null); fetchCierres(); }}
                onCierreActualizado={fetchCierres}
            />
        );
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    const totalGeneral = cierres.reduce((s, c) => s + Number(c.total), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-600" /> Diezmos
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {cierres.length} cierre{cierres.length !== 1 ? 's' : ''} · Total acumulado: <span className="font-semibold text-green-700">{fmtMonto(totalGeneral)}</span>
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo cierre</span>
                </Button>
            </div>

            {cierres.length === 0 ? (
                <EmptyState
                    icon={<DollarSign className="w-12 h-12 text-gray-300" />}
                    title="Sin registros de diezmos"
                    description="Crea el primer cierre para empezar a registrar los diezmos de la iglesia."
                    action={<Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Crear primer cierre</Button>}
                />
            ) : (
                <div className="space-y-3">
                    {cierres.map(c => (
                        <div key={c.id_cierre}
                            className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-hidden group">
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{c.asunto || 'Cierre de diezmos'}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {fmt(c.fecha_cierre)}
                                        </span>
                                        {c.descripcion && (
                                            <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                                <FileText className="w-3 h-3 inline mr-0.5" />{c.descripcion}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-lg font-bold text-green-700">{fmtMonto(c.total)}</p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={e => { e.stopPropagation(); eliminarCierre(c.id_cierre); }}
                                        className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <button onClick={() => setCierreSeleccionado(c)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors flex-shrink-0">
                                    Ver <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CierreFormModal
                isOpen={showForm} onClose={() => setShowForm(false)} saving={saving}
                onSubmit={async d => { const id = await crearCierre(d); if (id) { setShowForm(false); return true; } return false; }}
            />
        </div>
    );
};