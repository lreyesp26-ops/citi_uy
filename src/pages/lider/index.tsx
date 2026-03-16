import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { supabase } from '../../lib/supabase';

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

export const LiderDashboard: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Líder</h1>
      <Card>
        <p className="text-gray-600">Bienvenido al panel de gestión para líderes.</p>
      </Card>
    </div>
  );
};

export const LiderMiembrosPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis Miembros</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const LiderEventosPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis Eventos</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};

export const LiderConfiguracionPage: React.FC = () => {
  const { loading } = useDashboardData('personas');
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      <Card><p className="text-gray-600">Módulo en construcción...</p></Card>
    </div>
  );
};
