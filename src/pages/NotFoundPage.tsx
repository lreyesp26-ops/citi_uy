import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHome = () => {
    if (user?.persona?.rol === 'pastor') navigate('/pastor/dashboard');
    else if (user?.persona?.rol === 'lider') navigate('/lider/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">

        {/* Número 404 decorativo */}
        <div className="relative mb-8 select-none">
          <span className="text-[9rem] font-black text-gray-100 leading-none block">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-lg shadow-red-200 rotate-3">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Texto */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          La ruta que intentas visitar no existe o no tienes los permisos necesarios para verla.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            ← Volver atrás
          </button>
          <button
            onClick={handleHome}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-sm shadow-red-200"
          >
            Ir al dashboard
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-300">CENTI CITI · Sistema de Gestión</p>
      </div>
    </div>
  );
};