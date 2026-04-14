import React from 'react';
import { KeyRound } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { CambiarContrasenaForm } from '../../components/shared/CambiarContrasenaForm';

export const LiderConfiguracionPage: React.FC = () => {
    const { user } = useAuth();
    const persona = user?.persona;

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                <p className="text-sm text-gray-500 mt-1">Administra tu perfil y seguridad</p>
            </div>

            {/* Perfil */}
            <Card>
                <div className="flex items-center gap-4 pb-5 mb-5 border-b border-gray-100">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-red-700">
                            {persona?.nombres?.charAt(0)}{persona?.apellidos?.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{persona?.nombres} {persona?.apellidos}</p>
                        <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-red-600">
                            Líder
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {[
                        { label: 'Correo', value: persona?.correo_electronico },
                        { label: 'Cédula', value: persona?.numero_cedula },
                        { label: 'Celular', value: persona?.celular },
                        { label: 'Profesión', value: persona?.profesion },
                    ].map(f => f.value ? (
                        <div key={f.label}>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{f.label}</p>
                            <p className="text-gray-800 mt-0.5">{f.value}</p>
                        </div>
                    ) : null)}
                </div>
            </Card>

            {/* Cambiar contraseña */}
            <Card>
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="p-2.5 bg-red-50 rounded-xl">
                        <KeyRound className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">Cambiar contraseña</p>
                        <p className="text-xs text-gray-500">Actualiza tu contraseña de acceso al sistema</p>
                    </div>
                </div>
                <CambiarContrasenaForm />
            </Card>
        </div>
    );
};