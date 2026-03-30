import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertTriangle, UserCheck, KeyRound } from 'lucide-react';
import { PersonaParaLider, getCamposFaltantes } from '../../hooks/usePersonasParaLideres';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/Toast';

const GENEROS = ['Masculino', 'Femenino'];
const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'];
const NIVELES_ESTUDIO = ['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Postgrado'];

// ─────────────────────────────────────────────
// Modal: completar datos faltantes del miembro
// ─────────────────────────────────────────────
interface CompletarDatosLiderModalProps {
    isOpen: boolean;
    onClose: () => void;
    persona: PersonaParaLider | null;
    onDatosCompletados: (personaActualizada: PersonaParaLider) => void;
}

export const CompletarDatosLiderModal: React.FC<CompletarDatosLiderModalProps> = ({
    isOpen, onClose, persona, onDatosCompletados,
}) => {
    const [saving, setSaving] = useState(false);
    const camposFaltantes = persona ? getCamposFaltantes(persona) : [];

    const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
        defaultValues: {},
    });

    useEffect(() => {
        if (isOpen && persona) {
            reset({
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
    }, [isOpen, persona, reset]);

    const onSubmit = async (formData: any) => {
        if (!persona) return;
        setSaving(true);
        try {
            const cleaned = Object.fromEntries(
                Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
            );
            const { error } = await supabase
                .from('personas')
                .update(cleaned)
                .eq('id_persona', persona.id_persona);
            if (error) throw error;
            toast.success('Datos actualizados correctamente.');
            onDatosCompletados({ ...persona, ...cleaned } as PersonaParaLider);
        } catch (err: any) {
            toast.error(err?.message || 'Error al actualizar los datos.');
        } finally {
            setSaving(false);
        }
    };

    if (!persona) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Completar datos del miembro" width="lg">
            <div className="space-y-5">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">
                            Datos incompletos para ascender a líder
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Para crear el acceso de <strong>{persona.nombres} {persona.apellidos}</strong> completa los campos faltantes:
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                            {camposFaltantes.map(campo => (
                                <li key={campo} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                    {campo}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Correo electrónico *"
                            type="email"
                            {...register('correo_electronico', { required: 'Requerido' })}
                            error={errors.correo_electronico?.message as string}
                            placeholder="correo@ejemplo.com"
                        />
                        <Input
                            label="Número de cédula *"
                            {...register('numero_cedula', { required: 'Requerido' })}
                            error={errors.numero_cedula?.message as string}
                            placeholder="0123456789"
                        />
                        <Input
                            label="Celular *"
                            {...register('celular', { required: 'Requerido' })}
                            error={errors.celular?.message as string}
                            placeholder="0987654321"
                        />
                        <Input
                            label="Nacionalidad *"
                            {...register('nacionalidad', { required: 'Requerido' })}
                            error={errors.nacionalidad?.message as string}
                            placeholder="Ecuatoriana"
                        />
                        <div className="sm:col-span-2">
                            <Input
                                label="Dirección *"
                                {...register('direccion', { required: 'Requerido' })}
                                error={errors.direccion?.message as string}
                                placeholder="Calle principal, ciudad"
                            />
                        </div>
                        <Input
                            label="Fecha de nacimiento *"
                            type="date"
                            {...register('fecha_nacimiento', { required: 'Requerido' })}
                            error={errors.fecha_nacimiento?.message as string}
                        />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Género *</label>
                            <select
                                {...register('genero', { required: 'Requerido' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            {errors.genero && <p className="mt-1 text-sm text-red-600">{errors.genero.message as string}</p>}
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado civil *</label>
                            <select
                                {...register('estado_civil', { required: 'Requerido' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {ESTADOS_CIVILES.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            {errors.estado_civil && <p className="mt-1 text-sm text-red-600">{errors.estado_civil.message as string}</p>}
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de estudio *</label>
                            <select
                                {...register('nivel_estudio', { required: 'Requerido' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Seleccionar...</option>
                                {NIVELES_ESTUDIO.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            {errors.nivel_estudio && <p className="mt-1 text-sm text-red-600">{errors.nivel_estudio.message as string}</p>}
                        </div>
                        <Input
                            label="Profesión *"
                            {...register('profesion', { required: 'Requerido' })}
                            error={errors.profesion?.message as string}
                            placeholder="Ingeniero, Docente..."
                        />
                        <div className="sm:col-span-2">
                            <Input
                                label="Lugar de trabajo *"
                                {...register('lugar_trabajo', { required: 'Requerido' })}
                                error={errors.lugar_trabajo?.message as string}
                                placeholder="Empresa o institución"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button type="submit" fullWidth isLoading={saving}>
                            <UserCheck size={16} className="mr-1.5" /> Guardar y continuar
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// ─────────────────────────────────────────────
// Modal: confirmar ascenso — muestra usuario y contraseña
// NO muestra correo interno, solo username + cédula
// ─────────────────────────────────────────────
interface ConfirmarAscensoModalProps {
    isOpen: boolean;
    onClose: () => void;
    persona: PersonaParaLider | null;
    onConfirm: () => Promise<void>;
    ascending: boolean;
    usernamePreview: string;
}

export const ConfirmarAscensoModal: React.FC<ConfirmarAscensoModalProps> = ({
    isOpen, onClose, persona, onConfirm, ascending, usernamePreview,
}) => {
    if (!persona) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar ascenso a líder" width="sm">
            <div className="space-y-5">

                {/* Resumen persona */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-red-700">
                            {persona.nombres.charAt(0)}{persona.apellidos.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{persona.nombres} {persona.apellidos}</p>
                        <p className="text-xs text-gray-400">{persona.correo_electronico}</p>
                    </div>
                </div>

                {/* Credenciales */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Credenciales de acceso
                    </p>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-500 w-20 flex-shrink-0">Usuario</span>
                        <code className="flex-1 text-sm font-mono bg-white border border-blue-100 px-3 py-1.5 rounded-lg text-gray-800">
                            {usernamePreview || '…'}
                        </code>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-500 w-20 flex-shrink-0">Contraseña</span>
                        <code className="flex-1 text-sm font-mono bg-white border border-blue-100 px-3 py-1.5 rounded-lg text-gray-800 flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {persona.numero_cedula}
                        </code>
                    </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                    El líder inicia sesión con su usuario y cédula. Puede cambiar la contraseña desde configuración.
                </p>

                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={onClose} disabled={ascending}>
                        Cancelar
                    </Button>
                    <Button fullWidth isLoading={ascending} onClick={onConfirm}>
                        <UserCheck size={16} className="mr-1.5" /> Ascender a líder
                    </Button>
                </div>
            </div>
        </Modal>
    );
};