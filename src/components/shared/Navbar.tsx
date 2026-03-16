import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('session_only');
    sessionStorage.removeItem('active_tab');
    window.location.href = '/';
  };

  const fullName = user?.persona 
    ? `${user.persona.nombres} ${user.persona.apellidos}`
    : 'Usuario';

  const role = user?.persona?.rol || '';
  
  // Format role to capitalize first letter
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Rol Desconocido';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 w-full">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 -ml-2 mr-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 lg:hidden"
              onClick={onMenuClick}
            >
              <span className="sr-only">Abrir menú</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 bg-clip-text text-transparent lg:hidden">
                CENTI CITI
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900 leading-tight">
                {fullName}
              </span>
              {role && (
                <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-xs font-medium bg-red-100 text-red-800 leading-tight">
                  {displayRole}
                </span>
              )}
            </div>
            
            <div className="h-9 w-9 rounded-full border border-gray-200 bg-gray-50 flex flex-shrink-0 items-center justify-center text-gray-500 sm:hidden">
              <User size={18} />
            </div>

            <div className="h-6 border-l border-gray-200 hidden sm:block mx-2"></div>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Salir</span>
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Cerrar Sesión"
        width="sm"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-700 font-medium mb-6">
            ¿Estás seguro que deseas cerrar sesión?
          </p>
          <div className="flex w-full gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLogoutModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
