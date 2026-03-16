import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <EmptyState
          title="Página no encontrada"
          description="Lo sentimos, la ruta que intentas visitar no existe o no tienes los permisos necesarios."
          action={
            <Button onClick={() => navigate('/')}>
              Volver al inicio
            </Button>
          }
        />
      </div>
    </div>
  );
};
