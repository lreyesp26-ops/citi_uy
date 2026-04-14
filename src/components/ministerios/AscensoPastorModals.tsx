import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertTriangle, ShieldCheck, KeyRound, UserCheck } from 'lucide-react';
import { PersonaParaLider, getCamposFaltantes } from '../../hooks/usePersonasParaLideres';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/Toast';

// ── Modal completar datos para ascenso a pastor ──────────────────────────────
interface CompletarDatosPastorModalProps {
    isOpen: boolean;
    onClose: () => void;
    persona: PersonaParaLider | null;
    onDatosCompletados: (p: PersonaParaLider) => void;
}

export const CompletarDatosPastorModal: React.FC<CompletarDatosPastorModalProps> = ({
    isOpen, onClose, persona, onDatosCompletados,
}) => {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        correo_electronico: '',
        numero_cedula: '',
        celular: '',
        direccion: '',
        fecha_nacimiento: '',
        genero: '',
        nivel_estudio: '',
        nacionalidad: '',
        profesion: '',
        estado_civil: '',
        lugar_trabajo: '',
    });

    useEffect(() => {
        if (isOpen && persona) {
            setForm({
                correo_electronico: persona.correo_electronico || '',
                numero_cedula: persona.numero_cedula || '',
                celular: persona.celular || '',
                direccion: persona.direccion || '',
                fecha_nacimiento: persona.fecha_nacimiento || '',
                genero: persona.genero || '',
                nivel_estudio: persona.nivel_estudio || '',
                nacionalidad: persona.nacionalidad || '',
                profesion: persona.profesion || '',
                estado_civil: persona.estado_civil || '',
                lugar_trabajo: persona.lugar_trabajo || '',
            });
        }
    }, [isOpen, persona]);

    const camposFaltantes = persona ? getCamposFaltantes(persona) : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!persona) return;
        setSaving(true);
        try {
            const cleaned = Object.fromEntries(
                Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])
            );
            const { error } = await supabase
                .from('personas')
                .update(cleaned)
                .eq('id_persona', persona.id_persona);
            if (error) throw error;
            toast.success('Datos actualizados.');
            onDatosCompletados({ ...persona, ...cleaned } as PersonaParaLider);
        } catch (err: any) {
            toast.error(err?.message || 'Error al actualizar.');
        } finally {
            setSaving(false);
        }
    };

    if (!persona) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Completar datos para ascenso a pastor" width="lg">
            <div className="space-y-5">
                <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-purple-800">Datos incompletos</p>
                        <p className="text-xs text-purple-700 mt-0.5">
                            Completa los datos de <strong>{persona.nombres} {persona.apellidos}</strong> antes de ascender a pastor:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {camposFaltantes.map(f => (
                                <span key={f} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{f}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Correo electrónico *" type="email" required value={form.correo_electronico}
                            onChange={e => setForm(p => ({ ...p, correo_electronico: e.target.value }))} />
                        <Input label="Número de cédula *" required value={form.numero_cedula}
                            onChange={e => setForm(p => ({ ...p, numero_cedula: e.target.value }))} />
                        <Input label="Celular *" required value={form.celular}
                            onChange={e => setForm(p => ({ ...p, celular: e.target.value }))} />
                        <Input label="Nacionalidad *" required value={form.nacionalidad}
                            onChange={e => setForm(p => ({ ...p, nacionalidad: e.target.value }))} />
                        <div className="sm:col-span-2">
                            <Input label="Dirección *" required value={form.direccion}
                                onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} />
                        </div>
                        <Input label="Fecha de nacimiento *" type="date" required value={form.fecha_nacimiento}
                            onChange={e => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
                            <select value={form.genero} onChange={e => setForm(p => ({ ...p, genero: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Seleccionar...</option>
                                <option>Masculino</option><option>Femenino</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil *</label>
                            <select value={form.estado_civil} onChange={e => setForm(p => ({ ...p, estado_civil: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Seleccionar...</option>
                                {['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'].map(e => <option key={e}>{e}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de estudio *</label>
                            <select value={form.nivel_estudio} onChange={e => setForm(p => ({ ...p, nivel_estudio: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">Seleccionar...</option>
                                {['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Postgrado'].map(n => <option key={n}>{n}</option>)}
                            </select>
                        </div>
                        <Input label="Profesión *" required value={form.profesion}
                            onChange={e => setForm(p => ({ ...p, profesion: e.target.value }))} />
                        <div className="sm:col-span-2">
                            <Input label="Lugar de trabajo *" required value={form.lugar_trabajo}
                                onChange={e => setForm(p => ({ ...p, lugar_trabajo: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button type="submit" fullWidth isLoading={saving}>
                            <UserCheck size={16} /> Guardar y continuar
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// ── Modal confirmar ascenso a pastor ─────────────────────────────────────────
interface ConfirmarAscensoPastorModalProps {
    isOpen: boolean;
    onClose: () => void;
    persona: PersonaParaLider | null;
    onConfirm: () => Promise<void>;
    ascending: boolean;
    usernamePreview: string;
    eraLider: boolean;
}

export const ConfirmarAscensoPastorModal: React.FC<ConfirmarAscensoPastorModalProps> = ({
    isOpen, onClose, persona, onConfirm, ascending, usernamePreview, eraLider,
}) => {
    if (!persona) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar ascenso a pastor" width="sm">
            <div className="space-y-5">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-purple-700">
                            {persona.nombres.charAt(0)}{persona.apellidos.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{persona.nombres} {persona.apellidos}</p>
                        <p className="text-xs text-gray-400">{persona.correo_electronico}</p>
                    </div>
                </div>

                {eraLider ? (
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-700">
                        <p className="font-semibold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Cambio de rol solamente
                        </p>
                        <p className="text-xs mt-1">Esta persona ya tiene cuenta como líder. Solo se actualizará su rol a <strong>Pastor</strong>. Conserva sus credenciales actuales.</p>
                    </div>
                ) : (
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-3">
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Credenciales de acceso</p>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-purple-500 w-20 flex-shrink-0">Usuario</span>
                            <code className="flex-1 text-sm font-mono bg-white border border-purple-100 px-3 py-1.5 rounded-lg text-gray-800">
                                {usernamePreview || '…'}
                            </code>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-purple-500 w-20 flex-shrink-0">Contraseña</span>
                            <code className="flex-1 text-sm font-mono bg-white border border-purple-100 px-3 py-1.5 rounded-lg text-gray-800 flex items-center gap-2">
                                <KeyRound className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                {persona.numero_cedula}
                            </code>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={onClose} disabled={ascending}>Cancelar</Button>
                    <Button fullWidth isLoading={ascending} onClick={onConfirm}
                        className="bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950">
                        <ShieldCheck size={16} /> Ascender a pastor
                    </Button>
                </div>
            </div>
        </Modal>
    );
};