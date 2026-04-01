import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Evento } from '../../types';
import { Download, Image as ImageIcon } from 'lucide-react';

interface PublicidadGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    evento: Evento | null;
    onGuardar?: (id: string, file: File) => Promise<string | null>;
}

const GRADIENTS = [
    { id: 'dark', label: 'Oscuro elegante', from: '#1a1a2e', to: '#16213e' },
    { id: 'church', label: 'Eclesiástico', from: '#7f1d1d', to: '#450a0a' },
    { id: 'sky', label: 'Cielo', from: '#0c4a6e', to: '#082f49' },
    { id: 'forest', label: 'Esmeralda', from: '#064e3b', to: '#022c22' },
    { id: 'purple', label: 'Púrpura', from: '#4c1d95', to: '#2e1065' },
];

const formatFechaPublicidad = (iso: string) =>
    new Date(iso).toLocaleDateString('es-EC', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
const formatHoraPublicidad = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

export const PublicidadGeneratorModal: React.FC<PublicidadGeneratorModalProps> = ({
    isOpen, onClose, evento, onGuardar,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[1]);
    const [guardando, setGuardando] = useState(false);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const bgFileRef = useRef<HTMLInputElement>(null);

    const ministerioColor = evento?.ministerios?.color || '#ef4444';

    useEffect(() => {
        if (isOpen && evento) renderCanvas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, evento, selectedGradient, bgImage]);

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !evento) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080, H = 1080;
        canvas.width = W;
        canvas.height = H;

        // Fondo
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, W, H);
            // Overlay oscuro
            const overlay = ctx.createLinearGradient(0, 0, 0, H);
            overlay.addColorStop(0, 'rgba(0,0,0,0.55)');
            overlay.addColorStop(1, 'rgba(0,0,0,0.75)');
            ctx.fillStyle = overlay;
            ctx.fillRect(0, 0, W, H);
        } else {
            const grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, selectedGradient.from);
            grad.addColorStop(1, selectedGradient.to);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Patrón de puntos sutil
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            for (let x = 0; x < W; x += 40) {
                for (let y = 0; y < H; y += 40) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Línea de color del ministerio (izquierda)
        ctx.fillStyle = ministerioColor;
        ctx.fillRect(0, 0, 8, H);

        // Círculo decorativo arriba-derecha
        ctx.beginPath();
        ctx.arc(W + 100, -100, 450, 0, Math.PI * 2);
        ctx.fillStyle = ministerioColor + '18';
        ctx.fill();

        // Nombre del ministerio
        ctx.fillStyle = ministerioColor;
        ctx.font = 'bold 38px Georgia, serif';
        ctx.letterSpacing = '4px';
        ctx.fillText((evento.ministerios?.nombre || 'IGLESIA').toUpperCase(), 80, 120);
        ctx.letterSpacing = '0px';

        // Separador
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(80, 145, W - 160, 1.5);

        // Título del evento
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 88px Georgia, serif';

        // Word wrap del título
        const words = evento.titulo.split(' ');
        let line = '';
        const lines: string[] = [];
        const maxWidth = W - 160;
        for (const word of words) {
            const testLine = line + word + ' ';
            const { width } = ctx.measureText(testLine);
            if (width > maxWidth && line !== '') {
                lines.push(line.trim());
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        let titleY = 300;
        for (const l of lines.slice(0, 3)) {
            ctx.fillText(l, 80, titleY);
            titleY += 100;
        }

        // Descripción
        if (evento.descripcion) {
            ctx.font = '34px Georgia, serif';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            const desc = evento.descripcion.length > 80
                ? evento.descripcion.slice(0, 80) + '...'
                : evento.descripcion;
            ctx.fillText(desc, 80, titleY + 40);
            titleY += 90;
        }

        // Separador inferior
        ctx.fillStyle = ministerioColor;
        ctx.fillRect(80, H - 260, 60, 4);

        // Fecha
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px Georgia, serif';
        ctx.fillText(formatFechaPublicidad(evento.fecha_inicio), 80, H - 200);

        // Hora
        ctx.fillStyle = ministerioColor;
        ctx.font = 'bold 52px Georgia, serif';
        ctx.fillText(
            `${formatHoraPublicidad(evento.fecha_inicio)} – ${formatHoraPublicidad(evento.fecha_fin)}`,
            80, H - 140
        );

        // Lugar
        if (evento.lugar) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '36px Georgia, serif';
            ctx.fillText(`📍 ${evento.lugar}`, 80, H - 80);
        }
    };

    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => { setBgImage(img); };
        img.src = URL.createObjectURL(file);
    };

    const handleDescargar = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `publicidad-${evento?.titulo?.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleGuardar = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !evento || !onGuardar) return;
        setGuardando(true);
        canvas.toBlob(async (blob) => {
            if (!blob) { setGuardando(false); return; }
            const file = new File([blob], `publicidad-${evento.id_evento}.png`, { type: 'image/png' });
            await onGuardar(evento.id_evento, file);
            setGuardando(false);
            onClose();
        }, 'image/png');
    };

    if (!evento) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generar publicidad" width="xl">
            <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Preview */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Vista previa (1080×1080)</p>
                        <canvas
                            ref={canvasRef}
                            className="w-full rounded-xl border border-gray-200 bg-gray-900"
                            style={{ aspectRatio: '1/1' }}
                        />
                    </div>

                    {/* Controles */}
                    <div className="space-y-5">
                        {/* Selección de fondo */}
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Fondo</p>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {GRADIENTS.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => { setBgImage(null); setSelectedGradient(g); }}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedGradient.id === g.id && !bgImage
                                                ? 'ring-2 ring-offset-1 border-transparent ring-red-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        style={{ background: `linear-gradient(to right, ${g.from}, ${g.to})`, color: '#fff' }}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full text-sm"
                                onClick={() => bgFileRef.current?.click()}
                            >
                                <ImageIcon className="w-4 h-4" />
                                {bgImage ? 'Cambiar imagen de fondo' : 'Subir imagen de fondo'}
                            </Button>
                            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
                        </div>

                        {/* Info del evento */}
                        <div className="p-4 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-500">
                            <p><strong className="text-gray-700">Título:</strong> {evento.titulo}</p>
                            <p><strong className="text-gray-700">Ministerio:</strong> {evento.ministerios?.nombre}</p>
                            <p><strong className="text-gray-700">Fecha:</strong> {formatFechaPublicidad(evento.fecha_inicio)}</p>
                            {evento.lugar && <p><strong className="text-gray-700">Lugar:</strong> {evento.lugar}</p>}
                        </div>

                        <p className="text-xs text-gray-400">
                            El color del ministerio ({ministerioColor}) se aplica automáticamente a los acentos del diseño.
                        </p>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <Button variant="secondary" fullWidth onClick={handleDescargar}>
                        <Download className="w-4 h-4" /> Descargar PNG
                    </Button>
                    {onGuardar && (
                        <Button fullWidth isLoading={guardando} onClick={handleGuardar}>
                            Guardar en evento
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};