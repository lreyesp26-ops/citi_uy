import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardLayout } from '../components/shared/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

import {
  PastorDashboard,
  MiembrosPage,
  LideresPage,
  MinisteriosPage,
  EventosPage,
  ReportesPage,
  ConfiguracionPage,
  CursosBiblicosPage,
  DiezmosPage,
  DevocionalPage
} from '../pages/pastor';

import {
  LiderDashboard,
  LiderMiembrosPage,
  LiderEventosPage,
  LiderConfiguracionPage
} from '../pages/lider';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<LoginPage />} />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        {/* Layout Wrapper */}
        <Route element={<DashboardLayout />}>

          {/* Pastor Routes */}
          <Route element={<RoleRoute allowedRoles={['pastor']} />}>
            <Route path="/pastor/dashboard" element={<PastorDashboard />} />
            <Route path="/pastor/miembros" element={<MiembrosPage />} />
            <Route path="/pastor/lideres" element={<LideresPage />} />
            <Route path="/pastor/ministerios" element={<MinisteriosPage />} />
            <Route path="/pastor/eventos" element={<EventosPage />} />
            <Route path="/pastor/reportes" element={<ReportesPage />} />
            <Route path="/pastor/configuracion" element={<ConfiguracionPage />} />
            <Route path="/pastor/cursos" element={<CursosBiblicosPage />} />
            <Route path="/pastor/diezmos" element={<DiezmosPage />} />
            <Route path="/pastor/devocional" element={<DevocionalPage />} />
          </Route>

          {/* Lider Routes */}
          <Route element={<RoleRoute allowedRoles={['lider']} />}>
            <Route path="/lider/dashboard" element={<LiderDashboard />} />
            <Route path="/lider/miembros" element={<LiderMiembrosPage />} />
            <Route path="/lider/eventos" element={<LiderEventosPage />} />
            <Route path="/lider/configuracion" element={<LiderConfiguracionPage />} />
          </Route>

        </Route>
      </Route>

      {/* Catch All - 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
