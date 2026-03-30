import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ministerio, MinisterioFormData, Persona } from '../../types';
import { Upload, X, Check, Star } from 'lucide-react';

interface MinisterioFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MinisterioFormData, logoFile: File | null, lideresIds: string[]) => Promise<boolean>;
    saving: boolean;
    ministerio?: Ministerio | null;
    personas: Persona[];          // líderes y pastores disponibles
    myPersonaId: string;          // para marcar "Yo" en la lista
}

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6',
    '#ec4899', '#6366f1', '#06b6d4', '#64748b',
];

export const MinisterioFormModal: React.FC<MinisterioFormModalProps> = ({
    isOpen, onClose, onSubmit, saving, ministerio, personas, myPersonaId,
}) => {
    const isEditing = !!ministerio;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedLideres, setSelectedLideres] = useState<string[]>([]);
    const [searchLider, setSearchLider] = useState('');

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<MinisterioFormData>({
        defaultValues: { nombre: '', descripcion: '', color: '#ef4444', es_principal: false },
    });

    const colorActual = watch('color');

    useEffect(() => {
        if (isOpen) {
            if (ministerio) {
                reset({
                    nombre: ministerio.nombre,
                    descripcion: ministerio.descripcion || '',
                    color: ministerio.color,
                    es_principal: ministerio.es_principal,
                });
                setLogoPreview(ministerio.logo_url || null);
                setSelectedLideres(ministerio.ministerio_lideres.map(ml => ml.id_persona));
            } else {
                reset({ nombre: '', descripcion: '', color: '#ef4444', es_principal: false });
                setLogoPreview(null);
                setSelectedLideres([]);
            }
            setLogoFile(null);
            setSearchLider('');
        }
    }, [isOpen, ministerio, reset]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = ev => setLogoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const toggleLider = (id: string) => {
        setSelectedLideres(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredPersonas = personas.filter(p => {
        const q = searchLider.toLowerCase();
        return (
            p.nombres.toLowerCase().includes(q) ||
            p.apellidos.toLowerCase().includes(q)
        );
    });

    const onFormSubmit = async (data: MinisterioFormData) => {
        const ok = await onSubmit(data, logoFile, selectedLideres);
        if (ok) {
            reset();
            setLogoFile(null);
            setLogoPreview(null);
            setSelectedLideres([]);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Ministerio' : 'Crear Ministerio'}
            width="lg"
        >
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

                {/* Nombre + es_principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <Input
                            label="Nombre del ministerio *"
                            {...register('nombre', { required: 'El nombre es obligatorio' })}
                            error={errors.nombre?.message}
                            placeholder="Ministerio de Jóvenes"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            {...register('descripcion')}
                            rows={2}
                            placeholder="Descripción breve del ministerio..."
                            className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Color */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color del ministerio</label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setValue('color', c)}
                                className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0"
                                style={{
                                    backgroundColor: c,
                                    borderColor: colorActual === c ? '#1f2937' : 'transparent',
                                    transform: colorActual === c ? 'scale(1.15)' : 'scale(1)',
                                }}
                            >
                                {colorActual === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                            </button>
                        ))}
                        {/* Color personalizado */}
                        <div className="relative">
                            <input
                                type="color"
                                value={colorActual}
                                onChange={e => setValue('color', e.target.value)}
                                className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer p-0 overflow-hidden"
                                title="Color personalizado"
                            />
                        </div>
                        <span
                            className="ml-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: colorActual }}
                        >
                            {colorActual}
                        </span>
                    </div>
                </div>

                {/* Logo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo del ministerio</label>
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50"
                            style={logoPreview ? {} : { borderColor: colorActual }}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colorActual + '33' }}>
                                    <span className="text-lg font-bold" style={{ color: colorActual }}>
                                        {watch('nombre')?.charAt(0)?.toUpperCase() || 'M'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex items-center gap-2 text-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4" />
                                {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                            </Button>
                            {logoPreview && (
                                <button
                                    type="button"
                                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                    className="text-xs text-gray-400 hover:text-red-600 transition-colors text-left"
                                >
                                    Quitar logo
                                </button>
                            )}
                            <p className="text-xs text-gray-400">PNG, JPG, WebP · máx. 2MB</p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                    />
                </div>

                {/* Es principal */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <input
                        id="es_principal"
                        type="checkbox"
                        {...register('es_principal')}
                        className="h-4 w-4 rounded text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <div>
                        <label htmlFor="es_principal" className="text-sm font-medium text-amber-800 flex items-center gap-1.5 cursor-pointer">
                            <Star className="w-3.5 h-3.5" /> Ministerio principal de la iglesia
                        </label>
                        <p className="text-xs text-amber-600 mt-0.5">Aparecerá destacado en el dashboard (ej: Ministerio Río)</p>
                    </div>
                </div>

                {/* Líderes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Líderes asignados
                        {selectedLideres.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: colorActual }}>
                                {selectedLideres.length}
                            </span>
                        )}
                    </label>

                    <Input
                        placeholder="Buscar persona..."
                        value={searchLider}
                        onChange={e => setSearchLider(e.target.value)}
                        className="mb-2"
                    />

                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-50">
                        {filteredPersonas.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No hay personas disponibles</p>
                        ) : (
                            filteredPersonas.map(p => {
                                const isSelected = selectedLideres.includes(p.id_persona);
                                const isMe = p.id_persona === myPersonaId;
                                const initials = `${p.nombres.charAt(0)}${p.apellidos.charAt(0)}`.toUpperCase();
                                return (
                                    <button
                                        key={p.id_persona}
                                        type="button"
                                        onClick={() => toggleLider(p.id_persona)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                            style={{ backgroundColor: isSelected ? colorActual : '#9ca3af' }}
                                        >
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {p.nombres} {p.apellidos}
                                                {isMe && <span className="ml-1.5 text-xs text-gray-400">(Yo)</span>}
                                            </p>
                                            <p className="text-xs text-gray-400 capitalize">{p.rol}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${isSelected ? 'border-red-600 bg-red-600' : 'border-gray-300'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" fullWidth isLoading={saving}>
                        {isEditing ? 'Guardar cambios' : 'Crear ministerio'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};