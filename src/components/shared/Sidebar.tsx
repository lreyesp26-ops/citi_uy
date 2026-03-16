import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Heart, 
  Calendar, 
  PieChart, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.persona?.rol;

  const pastorLinks = [
    { name: 'Dashboard', to: '/pastor/dashboard', icon: LayoutDashboard },
    { name: 'Miembros', to: '/pastor/miembros', icon: Users },
    { name: 'Líderes', to: '/pastor/lideres', icon: UserCheck },
    { name: 'Ministerios', to: '/pastor/ministerios', icon: Heart },
    { name: 'Eventos', to: '/pastor/eventos', icon: Calendar },
    { name: 'Reportes', to: '/pastor/reportes', icon: PieChart },
    { name: 'Configuración', to: '/pastor/configuracion', icon: Settings },
  ];

  const liderLinks = [
    { name: 'Dashboard', to: '/lider/dashboard', icon: LayoutDashboard },
    { name: 'Mis Miembros', to: '/lider/miembros', icon: Users },
    { name: 'Mis Eventos', to: '/lider/eventos', icon: Calendar },
    { name: 'Configuración', to: '/lider/configuracion', icon: Settings },
  ];

  const links = role === 'pastor' ? pastorLinks : role === 'lider' ? liderLinks : [];

  return (
    <>
      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
          <span className="text-xl font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 bg-clip-text text-transparent">
            CENTI CITI
          </span>
          <button
            type="button"
            className="p-2 -mr-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar menú</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <nav className="px-4 mt-6 space-y-1.5 overflow-y-auto pb-6">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`mr-3.5 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-red-700' : 'text-gray-400'
                      }`} 
                      aria-hidden="true" 
                    />
                    {link.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72 bg-white border-r border-gray-200 pt-0">
          <div className="flex items-center h-16 px-6 border-b border-gray-100">
             <span className="text-xl font-bold bg-gradient-to-r from-red-700 via-red-600 to-red-800 bg-clip-text text-transparent">
                CENTI CITI
              </span>
          </div>
          
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              <div className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Menú Principal
              </div>
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`mr-3.5 h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-red-700' : 'text-gray-400'
                        }`} aria-hidden="true" />
                        {link.name}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
