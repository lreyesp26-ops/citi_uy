import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ministerio, MinisterioFormData } from '../../types';
import { Upload, Check, Star, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';
import { PersonaParaLider, getCamposFaltantes } from '../../hooks/usePersonasParaLideres';
import { useAscenderLider } from '../../hooks/useAscenderLider';
import { CompletarDatosLiderModal, ConfirmarAscensoModal } from './AscensoLiderModals';

interface MinisterioFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MinisterioFormData, logoFile: File | null, lideresIds: string[]) => Promise<boolean>;
    saving: boolean;
    ministerio?: Ministerio | null;
    personas: PersonaParaLider[];
    myPersonaId: string;
    onPersonasRefetch?: () => void;
}

const MAX_LIDERES = 2;

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6',
    '#ec4899', '#6366f1', '#06b6d4', '#64748b',
];

const ROL_BADGE: Record<string, { label: string; color: string }> = {
    pastor: { label: 'Pastor', color: 'bg-purple-100 text-purple-700' },
    lider: { label: 'Líder', color: 'bg-blue-100 text-blue-700' },
    miembro: { label: 'Miembro', color: 'bg-gray-100 text-gray-600' },
};

export const MinisterioFormModal: React.FC<MinisterioFormModalProps> = ({
    isOpen, onClose, onSubmit, saving, ministerio, personas, myPersonaId, onPersonasRefetch,
}) => {
    const isEditing = !!ministerio;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedLideres, setSelectedLideres] = useState<string[]>([]);
    const [searchLider, setSearchLider] = useState('');

    const [personaParaCompletar, setPersonaParaCompletar] = useState<PersonaParaLider | null>(null);
    const [personaParaAscender, setPersonaParaAscender] = useState<PersonaParaLider | null>(null);
    const [personasLocal, setPersonasLocal] = useState<PersonaParaLider[]>([]);

    const { ascending, ascenderALider, previewUsername } = useAscenderLider();

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<MinisterioFormData>({
        defaultValues: { nombre: '', descripcion: '', color: '#ef4444', es_principal: false },
    });

    const colorActual = watch('color');
    const nombreActual = watch('nombre');
    const esPrincipalActual = watch('es_principal');

    const limiteAlcanzado = selectedLideres.length >= MAX_LIDERES;

    useEffect(() => { setPersonasLocal(personas); }, [personas]);

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
            setPersonaParaCompletar(null);
            setPersonaParaAscender(null);
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

    const handlePersonaClick = (persona: PersonaParaLider) => {
        const id = persona.id_persona;

        // Deseleccionar si ya está
        if (selectedLideres.includes(id)) {
            setSelectedLideres(prev => prev.filter(x => x !== id));
            return;
        }

        // Bloquear si ya hay 2
        if (selectedLideres.length >= MAX_LIDERES) return;

        // Pastor o líder con cuenta → seleccionar directo
        if (persona.id_usuario || persona.rol === 'pastor' || persona.rol === 'lider') {
            setSelectedLideres(prev => [...prev, id]);
            return;
        }

        // Miembro → flujo de ascenso
        const faltantes = getCamposFaltantes(persona);
        if (faltantes.length > 0) {
            setPersonaParaCompletar(persona);
        } else {
            setPersonaParaAscender(persona);
        }
    };

    const handleDatosCompletados = (personaActualizada: PersonaParaLider) => {
        setPersonasLocal(prev =>
            prev.map(p => p.id_persona === personaActualizada.id_persona ? personaActualizada : p)
        );
        setPersonaParaCompletar(null);
        const faltantes = getCamposFaltantes(personaActualizada);
        if (faltantes.length === 0) {
            setPersonaParaAscender(personaActualizada);
        }
    };

    const handleConfirmarAscenso = async () => {
        if (!personaParaAscender) return;
        const result = await ascenderALider(personaParaAscender);
        if (result.success) {
            setPersonasLocal(prev =>
                prev.map(p =>
                    p.id_persona === personaParaAscender.id_persona
                        ? { ...p, rol: 'lider', username: result.username }
                        : p
                )
            );
            setSelectedLideres(prev => [...prev, personaParaAscender.id_persona]);
            setPersonaParaAscender(null);
            onPersonasRefetch?.();
        }
    };

    const filteredPersonas = personasLocal.filter(p => {
        const q = searchLider.toLowerCase();
        return p.nombres.toLowerCase().includes(q) || p.apellidos.toLowerCase().includes(q);
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
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Ministerio' : 'Crear Ministerio'} width="lg">
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

                    {/* Nombre + descripción */}
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
                                <button key={c} type="button" onClick={() => setValue('color', c)}
                                    className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: c, borderColor: colorActual === c ? '#1f2937' : 'transparent', transform: colorActual === c ? 'scale(1.15)' : 'scale(1)' }}
                                >
                                    {colorActual === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                                </button>
                            ))}
                            <input type="color" value={colorActual} onChange={e => setValue('color', e.target.value)}
                                className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer p-0 overflow-hidden" title="Color personalizado" />
                            <span className="ml-1 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: colorActual }}>
                                {colorActual}
                            </span>
                        </div>
                    </div>

                    {/* Logo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo del ministerio</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50"
                                style={logoPreview ? {} : { borderColor: colorActual }}>
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colorActual + '33' }}>
                                        <span className="text-lg font-bold" style={{ color: colorActual }}>
                                            {nombreActual?.charAt(0)?.toUpperCase() || 'M'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button type="button" variant="secondary" className="text-sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="w-4 h-4" /> {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                                </Button>
                                {logoPreview && (
                                    <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                        className="text-xs text-gray-400 hover:text-red-600 transition-colors text-left">
                                        Quitar logo
                                    </button>
                                )}
                                <p className="text-xs text-gray-400">PNG, JPG, WebP · máx. 2MB</p>
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>

                    {/* Es principal */}
                    <div
                        className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer"
                        onClick={() => setValue('es_principal', !esPrincipalActual)}
                    >
                        <input
                            id="es_principal"
                            type="checkbox"
                            checked={!!esPrincipalActual}
                            readOnly
                            className="h-4 w-4 rounded text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                        />
                        <div>
                            <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5 cursor-pointer">
                                <Star className="w-3.5 h-3.5 cursor-pointer" /> Ministerio principal de la iglesia
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">Aparecerá destacado en el dashboard</p>
                        </div>
                    </div>

                    {/* Líderes */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <label className="block text-sm font-medium text-gray-700">
                                Líderes asignados
                            </label>
                            <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: limiteAlcanzado ? '#6b7280' : colorActual }}
                            >
                                {selectedLideres.length}/{MAX_LIDERES}
                            </span>
                            {limiteAlcanzado && (
                                <span className="text-xs text-amber-600 font-medium">
                                    · Desmarca uno para cambiar
                                </span>
                            )}
                        </div>

                        {/* Leyenda */}
                        <div className="flex flex-wrap items-center gap-3 mb-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Pastor</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Líder</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Miembro
                                <span className="text-amber-500 font-medium">(se ascenderá al seleccionar)</span>
                            </span>
                        </div>

                        <Input placeholder="Buscar persona..." value={searchLider}
                            onChange={e => setSearchLider(e.target.value)} className="mb-2" />

                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-50">
                            {filteredPersonas.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No hay personas disponibles</p>
                            ) : (
                                filteredPersonas.map(p => {
                                    const isSelected = selectedLideres.includes(p.id_persona);
                                    const isDisabled = limiteAlcanzado && !isSelected;
                                    const isMe = p.id_persona === myPersonaId;
                                    const initials = `${p.nombres.charAt(0)}${p.apellidos.charAt(0)}`.toUpperCase();
                                    const esMiembro = !p.id_usuario && p.rol !== 'pastor' && p.rol !== 'lider';
                                    const faltanDatos = esMiembro && getCamposFaltantes(p).length > 0;
                                    const badge = ROL_BADGE[p.rol] || ROL_BADGE['miembro'];

                                    return (
                                        <button
                                            key={p.id_persona}
                                            type="button"
                                            onClick={() => handlePersonaClick(p)}
                                            disabled={isDisabled}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left
                                                ${isSelected ? 'bg-red-50' : ''}
                                                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                                style={{ backgroundColor: isSelected ? colorActual : '#9ca3af' }}>
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {p.nombres} {p.apellidos}
                                                        {isMe && <span className="ml-1 text-xs text-gray-400">(Yo)</span>}
                                                    </p>
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                </div>
                                                {esMiembro && !isSelected && !isDisabled && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        {faltanDatos ? (
                                                            <>
                                                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                                <span className="text-xs text-amber-600">Datos incompletos · clic para completar</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                                                <span className="text-xs text-blue-600">Se ascenderá a líder al confirmar</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                {isSelected && esMiembro && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <ShieldCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                        <span className="text-xs text-green-600">Ascendido a líder</span>
                                                    </div>
                                                )}
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

            <CompletarDatosLiderModal
                isOpen={!!personaParaCompletar}
                onClose={() => setPersonaParaCompletar(null)}
                persona={personaParaCompletar}
                onDatosCompletados={handleDatosCompletados}
            />

            <ConfirmarAscensoModal
                isOpen={!!personaParaAscender}
                onClose={() => setPersonaParaAscender(null)}
                persona={personaParaAscender}
                onConfirm={handleConfirmarAscenso}
                ascending={ascending}
                usernamePreview={personaParaAscender
                    ? previewUsername(personaParaAscender.nombres, personaParaAscender.apellidos)
                    : ''}
            />
        </>
    );
};