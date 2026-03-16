import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { supabase } from '../../lib/supabase';

// Reusable hook for stubbing data fetch logic on components
const useDashboardData = (table: string) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (!error && mounted) setData(data || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [table]);

  return { loading, data };
};

export const PastorDashboard: React.FC = () => {
  const { loading } = useDashboardData('personas'); // Example table
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Pastor</h1>
      <Card>
        <p className="text-gray-600">Bienvenido al panel de administración del Pastor.</p>
      </Card>
    </div>
  );
};

export const MiembrosPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Miembros</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const LideresPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Líderes</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const MinisteriosPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Ministerios</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const EventosPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestión de Eventos</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const ReportesPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const ConfiguracionPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};
