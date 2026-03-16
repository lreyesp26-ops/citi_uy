import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleRouteProps {
  allowedRoles: ('pastor' | 'lider')[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user?.persona) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.persona.rol)) {
    // Determine fallback dashboard based on their actual role
    const fallbackPath = user.persona.rol === 'pastor' ? '/pastor/dashboard' : '/lider/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
