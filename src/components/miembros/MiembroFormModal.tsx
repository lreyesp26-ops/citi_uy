import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Miembro, MiembroFormData } from '../../types';

interface MiembroFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MiembroFormData) => Promise<boolean>;
    saving: boolean;
    miembro?: Miembro | null;
}

const GENEROS = ['Masculino', 'Femenino'];
const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión libre'];
const NIVELES_ESTUDIO = ['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Postgrado'];

const SelectField: React.FC<{
    label: string;
    error?: string;
    children: React.ReactNode;
    id: string;
}> = ({ label, error, children, id }) => (
    <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            id={id}
            className={`w-full px-4 py-2 border rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors
        ${error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
        >
            {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

export const MiembroFormModal: React.FC<MiembroFormModalProps> = ({
    isOpen, onClose, onSubmit, saving, miembro
}) => {
    const isEditing = !!miembro;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<MiembroFormData>({
        defaultValues: miembro ? {
            nombres: miembro.nombres,
            apellidos: miembro.apellidos,
            correo_electronico: miembro.correo_electronico || '',
            numero_cedula: miembro.numero_cedula || '',
            celular: miembro.celular || '',
            direccion: miembro.direccion || '',
            fecha_nacimiento: miembro.fecha_nacimiento || '',
            genero: miembro.genero || '',
            nivel_estudio: miembro.nivel_estudio || '',
            nacionalidad: miembro.nacionalidad || '',
            profesion: miembro.profesion || '',
            estado_civil: miembro.estado_civil || '',
            lugar_trabajo: miembro.lugar_trabajo || '',
        } : {}
    });

    useEffect(() => {
        if (isOpen) {
            reset(miembro ? {
                nombres: miembro.nombres,
                apellidos: miembro.apellidos,
                correo_electronico: miembro.correo_electronico || '',
                numero_cedula: miembro.numero_cedula || '',
                celular: miembro.celular || '',
                direccion: miembro.direccion || '',
                fecha_nacimiento: miembro.fecha_nacimiento || '',
                genero: miembro.genero || '',
                nivel_estudio: miembro.nivel_estudio || '',
                nacionalidad: miembro.nacionalidad || '',
                profesion: miembro.profesion || '',
                estado_civil: miembro.estado_civil || '',
                lugar_trabajo: miembro.lugar_trabajo || '',
            } : {});
        }
    }, [isOpen, miembro, reset]);

    const onFormSubmit = async (data: MiembroFormData) => {
        // Clean empty strings to undefined
        const cleaned: MiembroFormData = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
        ) as MiembroFormData;
        const success = await onSubmit(cleaned);
        if (success) {
            reset();
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Miembro' : 'Registrar Nuevo Miembro'}
            width="lg"
        >
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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
                            <label htmlFor="genero" className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                            <select
                                id="genero"
                                {...register('genero')}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                                <option value="">Seleccionar...</option>
                                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Fecha de nacimiento"
                            type="date"
                            {...register('fecha_nacimiento')}
                        />
                        <div className="w-full">
                            <label htmlFor="estado_civil" className="block text-sm font-medium text-gray-700 mb-1">Estado civil</label>
                            <select
                                id="estado_civil"
                                {...register('estado_civil')}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                                <option value="">Seleccionar...</option>
                                {ESTADOS_CIVILES.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Nacionalidad"
                            {...register('nacionalidad')}
                            placeholder="Ecuatoriana"
                        />
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
                        <Input
                            label="Celular"
                            {...register('celular')}
                            placeholder="0987654321"
                        />
                        <div className="sm:col-span-2">
                            <Input
                                label="Dirección"
                                {...register('direccion')}
                                placeholder="Calle principal, ciudad"
                            />
                        </div>
                    </div>
                </div>

                {/* Información académica y laboral */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                        Académico y laboral
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="w-full">
                            <label htmlFor="nivel_estudio" className="block text-sm font-medium text-gray-700 mb-1">Nivel de estudio</label>
                            <select
                                id="nivel_estudio"
                                {...register('nivel_estudio')}
                                className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                                <option value="">Seleccionar...</option>
                                {NIVELES_ESTUDIO.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Profesión"
                            {...register('profesion')}
                            placeholder="Ingeniero, Docente..."
                        />
                        <div className="sm:col-span-2">
                            <Input
                                label="Lugar de trabajo"
                                {...register('lugar_trabajo')}
                                placeholder="Empresa o institución"
                            />
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