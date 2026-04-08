import React from 'react';
import { Card } from '../../components/ui/Card';

export const LiderDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Líder</h1>
            <Card>
                <p className="text-gray-600">Bienvenido al panel de gestión para líderes.</p>
            </Card>
        </div>
    );
};