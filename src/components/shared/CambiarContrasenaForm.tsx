import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { toast } from '../ui/Toast';

export const CambiarContrasenaForm: React.FC = () => {
    const [form, setForm] = useState({
        actual: '',
        nueva: '',
        confirmar: '',
    });
    const [showActual, setShowActual] = useState(false);
    const [showNueva, setShowNueva] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const validarFuerza = (p: string) => {
        if (p.length === 0) return null;
        if (p.length < 6) return 'débil';
        if (p.length < 10 || !/[0-9]/.test(p)) return 'media';
        return 'fuerte';
    };

    const fuerza = validarFuerza(form.nueva);
    const fuerzaConfig = {
        débil: { label: 'Débil', color: 'bg-red-400', textColor: 'text-red-600', width: 'w-1/3' },
        media: { label: 'Media', color: 'bg-amber-400', textColor: 'text-amber-600', width: 'w-2/3' },
        fuerte: { label: 'Fuerte', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-full' },
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.actual || !form.nueva || !form.confirmar) {
            toast.error('Completa todos los campos.');
            return;
        }
        if (form.nueva !== form.confirmar) {
            toast.error('Las contraseñas nuevas no coinciden.');
            return;
        }
        if (form.nueva.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setSaving(true);
        try {
            const { data, error } = await supabase.rpc('cambiar_contrasena', {
                p_contrasena_actual: form.actual,
                p_contrasena_nueva: form.nueva,
            });
            if (error) throw error;
            setSuccess(true);
            setForm({ actual: '', nueva: '', confirmar: '' });
            toast.success('Contraseña actualizada correctamente.');
            setTimeout(() => setSuccess(false), 4000);
        } catch (err: any) {
            const msg: string = err?.message || '';
            if (msg.includes('incorrecta')) {
                toast.error('La contraseña actual es incorrecta.');
            } else {
                toast.error(msg || 'Error al cambiar la contraseña.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-semibold text-gray-800">¡Contraseña actualizada!</p>
                <p className="text-sm text-gray-500">Tu contraseña ha sido cambiada exitosamente.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            {/* Contraseña actual */}
            <div className="relative">
                <Input
                    label="Contraseña actual"
                    type={showActual ? 'text' : 'password'}
                    value={form.actual}
                    onChange={e => setForm(p => ({ ...p, actual: e.target.value }))}
                    placeholder="Tu contraseña actual"
                    required
                />
                <button type="button" onClick={() => setShowActual(v => !v)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {/* Nueva contraseña */}
            <div className="relative">
                <Input
                    label="Nueva contraseña"
                    type={showNueva ? 'text' : 'password'}
                    value={form.nueva}
                    onChange={e => setForm(p => ({ ...p, nueva: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    required
                />
                <button type="button" onClick={() => setShowNueva(v => !v)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                    {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {/* Indicador de fuerza */}
                {fuerza && (
                    <div className="mt-2 space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${fuerzaConfig[fuerza].color} ${fuerzaConfig[fuerza].width}`} />
                        </div>
                        <p className={`text-xs font-medium ${fuerzaConfig[fuerza].textColor}`}>
                            Contraseña {fuerzaConfig[fuerza].label}
                        </p>
                    </div>
                )}
            </div>

            {/* Confirmar */}
            <div>
                <Input
                    label="Confirmar nueva contraseña"
                    type="password"
                    value={form.confirmar}
                    onChange={e => setForm(p => ({ ...p, confirmar: e.target.value }))}
                    placeholder="Repite la nueva contraseña"
                    required
                />
                {form.confirmar && form.nueva !== form.confirmar && (
                    <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
                )}
                {form.confirmar && form.nueva === form.confirmar && form.nueva.length >= 6 && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Coinciden
                    </p>
                )}
            </div>

            <Button type="submit" fullWidth isLoading={saving}
                disabled={!form.actual || !form.nueva || !form.confirmar || form.nueva !== form.confirmar}>
                <KeyRound className="w-4 h-4" /> Cambiar contraseña
            </Button>
        </form>
    );
};