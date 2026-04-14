import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { XCircle } from 'lucide-react';

interface RechazoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (motivo: string) => Promise<void>;
    procesando: boolean;
    tituloEvento?: string;
}

export const RechazoModal: React.FC<RechazoModalProps> = ({
    isOpen, onClose, onConfirm, procesando, tituloEvento,
}) => {
    const [motivo, setMotivo] = useState('');

    useEffect(() => {
        if (isOpen) setMotivo('');
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!motivo.trim()) return;
        await onConfirm(motivo.trim());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Motivo del rechazo" width="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">
                            Rechazando{tituloEvento ? `: "${tituloEvento}"` : ' evento'}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                            El líder recibirá una notificación con el motivo para que pueda corregirlo.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo del rechazo *
                    </label>
                    <textarea
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        rows={4}
                        placeholder="Ej. Las fechas se cruzan con otro evento ya aprobado. Por favor reagenda para la siguiente semana."
                        className="w-full px-4 py-2 border border-gray-300 hover:border-gray-400 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition-colors"
                        autoFocus
                    />
                    {motivo.trim() === '' && (
                        <p className="mt-1 text-xs text-red-500">El motivo es obligatorio para notificar al líder.</p>
                    )}
                </div>

                <div className="flex gap-3 pt-1">
                    <Button variant="secondary" fullWidth onClick={onClose} disabled={procesando}>
                        Cancelar
                    </Button>
                    <Button
                        fullWidth
                        isLoading={procesando}
                        disabled={!motivo.trim()}
                        onClick={handleConfirm}
                        className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-600"
                    >
                        Confirmar rechazo
                    </Button>
                </div>
            </div>
        </Modal>
    );
};