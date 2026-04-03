import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
    BookOpen, Plus, ChevronLeft, ChevronRight, Download,
    Save, Edit2, Image as ImageIcon, FileText, Upload, X, Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useDevocional, useDevocionalDias, type Devocional, type DevocionalDia } from '../../hooks/useDevocional';

// ── Constantes ────────────────────────────────────────────────────────────────
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const diasEnMes = (anio: number, mes: number) =>
    new Date(anio, mes, 0).getDate(); // mes en base-1

// ── Utilidades canvas ─────────────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > maxW && line !== '') {
            ctx.fillText(line.trim(), x, curY);
            line = w + ' ';
            curY += lineH;
        } else { line = test; }
    }
    if (line.trim()) { ctx.fillText(line.trim(), x, curY); curY += lineH; }
    return curY;
}

// ── Panel de un día ───────────────────────────────────────────────────────────
interface DiaData { dia: number; promesa: string; lecturas: string[] }

const PanelDia: React.FC<{
    data: DiaData;
    onChange: (d: DiaData) => void;
}> = ({ data, onChange }) => {
    const addLectura = () => onChange({ ...data, lecturas: [...data.lecturas, ''] });
    const setLectura = (i: number, v: string) => {
        const l = [...data.lecturas]; l[i] = v;
        onChange({ ...data, lecturas: l });
    };
    const removeLectura = (i: number) => {
        onChange({ ...data, lecturas: data.lecturas.filter((_, j) => j !== i) });
    };

    return (
        <div className="space-y-2.5">
            {/* Promesa */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Promesa del día</label>
                <textarea
                    value={data.promesa}
                    onChange={e => onChange({ ...data, promesa: e.target.value })}
                    rows={2}
                    placeholder="Escribe la promesa o versículo del día..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
            </div>

            {/* Lecturas */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Lecturas bíblicas</label>
                    <button onClick={addLectura}
                        className="text-xs text-red-600 hover:underline flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Agregar
                    </button>
                </div>
                <div className="space-y-1.5">
                    {data.lecturas.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Sin lecturas. Haz clic en "Agregar".</p>
                    )}
                    {data.lecturas.map((l, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                                value={l}
                                onChange={e => setLectura(i, e.target.value)}
                                placeholder={`Ej. Salmos ${i * 10 + 1}-${i * 10 + 10}`}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                            <button onClick={() => removeLectura(i)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Editor del Devocional ────────────────────────────────────────────────────
const EditorDevocional: React.FC<{
    devocional: Devocional;
    onSaved: () => void;
}> = ({ devocional, onSaved }) => {
    const { dias, loading, saving, guardarTodos } = useDevocionalDias(devocional.id_devocional);
    const { subirLogo } = useDevocional();

    const totalDias = diasEnMes(devocional.anio, devocional.mes);
    const [diaActivo, setDiaActivo] = useState(1);
    const [local, setLocal] = useState<Record<number, DiaData>>({});
    const [logoPreview, setLogoPreview] = useState<string | undefined>(devocional.logo_url);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const logoRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [exportando, setExportando] = useState(false);
    const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

    // Inicializar estado local desde BD
    React.useEffect(() => {
        const m: Record<number, DiaData> = {};
        for (let d = 1; d <= totalDias; d++) {
            const found = dias.find(x => x.dia === d);
            m[d] = { dia: d, promesa: found?.promesa || '', lecturas: found?.lecturas || [] };
        }
        setLocal(m);
    }, [dias, totalDias]);

    const data = local[diaActivo] || { dia: diaActivo, promesa: '', lecturas: [] };
    const setData = (d: DiaData) => setLocal(p => ({ ...p, [diaActivo]: d }));

    const guardar = async () => {
        const items = Object.values(local);
        const ok = await guardarTodos(items);
        if (ok && logoFile) {
            await subirLogo(devocional.id_devocional, logoFile);
        }
        if (ok) onSaved();
    };

    // Cuenta dias con contenido
    const diasConContenido = Object.values(local).filter(d => d.promesa || d.lecturas.length > 0).length;

    // ── Render Canvas ────────────────────────────────────────────────────────────
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080, H = 1920; // formato vertical 9:16
        canvas.width = W; canvas.height = H;

        // Fondo
        if (bgImg) {
            ctx.drawImage(bgImg, 0, 0, W, H);
            ctx.fillStyle = 'rgba(10,10,20,0.72)';
            ctx.fillRect(0, 0, W, H);
        } else {
            const grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, '#1a0a0a');
            grad.addColorStop(0.5, '#2d0a0a');
            grad.addColorStop(1, '#0a0a1a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            // dots
            ctx.fillStyle = 'rgba(255,255,255,0.025)';
            for (let x = 0; x < W; x += 50) for (let y = 0; y < H; y += 50) {
                ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Franja lateral izquierda
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(0, 0, 10, H);

        // Logo o texto iglesia (arriba)
        if (logoPreview && !logoFile) {
            // intentar dibujar logo (si ya cargado)
            const img = new Image();
            img.onload = () => {
                ctx.save();
                ctx.beginPath();
                ctx.arc(540, 140, 80, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(img, 460, 60, 160, 160);
                ctx.restore();
            };
            img.src = logoPreview;
        }

        // Encabezado: mes y año
        ctx.textAlign = 'center';
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 52px Georgia, serif';
        ctx.letterSpacing = '6px';
        ctx.fillText(MESES[devocional.mes - 1].toUpperCase(), W / 2, 280);
        ctx.letterSpacing = '0';

        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '32px Georgia, serif';
        ctx.fillText(String(devocional.anio), W / 2, 325);

        // Línea separadora
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(80, 355); ctx.lineTo(W - 80, 355); ctx.stroke();

        // Tabla de días
        const COLS = 5;
        const cellW = (W - 160) / COLS;
        const cellH = 90;
        const startX = 80;
        let startY = 390;

        const allDias = Object.values(local);

        for (let i = 0; i < totalDias; i++) {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = startX + col * cellW;
            const y = startY + row * (cellH + 12);
            const dNum = i + 1;
            const dData = allDias.find(d => d.dia === dNum);
            const tieneContenido = dData && (dData.promesa || dData.lecturas.length > 0);

            // Celda fondo
            ctx.fillStyle = tieneContenido ? 'rgba(192,57,43,0.18)' : 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            (ctx as any).roundRect?.(x + 4, y, cellW - 8, cellH, 10) || ctx.rect(x + 4, y, cellW - 8, cellH);
            ctx.fill();

            // Número del día
            ctx.textAlign = 'center';
            ctx.fillStyle = tieneContenido ? '#e74c3c' : 'rgba(255,255,255,0.6)';
            ctx.font = `bold 28px Georgia, serif`;
            ctx.fillText(String(dNum), x + cellW / 2, y + 40);

            // Primera lectura (pequeña)
            if (dData?.lecturas?.[0]) {
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.font = '14px Arial, sans-serif';
                const lec = dData.lecturas[0].length > 14 ? dData.lecturas[0].slice(0, 14) + '…' : dData.lecturas[0];
                ctx.fillText(lec, x + cellW / 2, y + 65);
            }
        }

        // Calcular Y después de la grilla
        const rows = Math.ceil(totalDias / COLS);
        let curY = startY + rows * (cellH + 12) + 60;

        // Línea
        ctx.strokeStyle = 'rgba(192,57,43,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(80, curY); ctx.lineTo(W - 80, curY); ctx.stroke();
        curY += 50;

        // Promesa del día 1 (o un versículo destacado)
        const diaDestacado = allDias.find(d => d.dia === 1);
        if (diaDestacado?.promesa) {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'italic 30px Georgia, serif';
            curY = wrapText(ctx, `"${diaDestacado.promesa}"`, W / 2, curY, W - 200, 44) + 20;
        }

        // Pie de página
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '22px Arial, sans-serif';
        ctx.fillText('CENTI CITI · Iglesia Cristiana Mundial', W / 2, H - 60);
    }, [local, devocional, totalDias, logoPreview, bgImg]);

    React.useEffect(() => { renderCanvas(); }, [renderCanvas]);

    const exportar = (tipo: 'png' | 'pdf') => {
        setExportando(true);
        try {
            renderCanvas();
            const canvas = canvasRef.current;
            if (!canvas) return;
            const nombre = `devocional-${MESES[devocional.mes - 1].toLowerCase()}-${devocional.anio}`;

            if (tipo === 'png') {
                const link = document.createElement('a');
                link.download = `${nombre}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                // PDF simple: canvas → imagen → iframe print
                canvas.toBlob(blob => {
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const win = window.open('');
                    if (!win) return;
                    win.document.write(`
            <html><head><title>${nombre}</title>
            <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000}
            img{max-height:100vh;width:auto}</style></head>
            <body><img src="${url}" onload="window.print()"/></body></html>
          `);
                }, 'image/png');
            }
        } finally { setExportando(false); }
    };

    const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => setBgImg(img);
        img.src = URL.createObjectURL(file);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = ev => setLogoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    if (loading) return <div className="py-12 flex justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Columna izquierda: editor */}
            <div className="space-y-5">
                {/* Progreso */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">Días completados</span>
                        <span className="font-bold text-red-600">{diasConContenido}/{totalDias}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-red-600 to-red-400 h-2 rounded-full transition-all"
                            style={{ width: totalDias ? `${diasConContenido / totalDias * 100}%` : '0%' }} />
                    </div>
                </div>

                {/* Selector de días */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Seleccionar día</p>
                    <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: totalDias }, (_, i) => i + 1).map(d => {
                            const d2 = local[d];
                            const tiene = d2 && (d2.promesa || d2.lecturas.length > 0);
                            return (
                                <button key={d} onClick={() => setDiaActivo(d)}
                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${diaActivo === d
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : tiene
                                                ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                        }`}>
                                    {d}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Editor del día */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                            Día {diaActivo} — {MESES[devocional.mes - 1]} {devocional.anio}
                        </h3>
                        <div className="flex gap-1">
                            <button onClick={() => setDiaActivo(d => Math.max(1, d - 1))} disabled={diaActivo === 1}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDiaActivo(d => Math.min(totalDias, d + 1))} disabled={diaActivo === totalDias}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <PanelDia data={data} onChange={setData} />
                </div>

                {/* Logo / fondo */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                    <p className="text-sm font-semibold text-gray-700">Personalización</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Logo de la iglesia</p>
                            <button onClick={() => logoRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors">
                                {logoPreview
                                    ? <img src={logoPreview} className="h-8 w-8 object-cover rounded-lg" alt="logo" />
                                    : <Upload className="w-4 h-4" />}
                                {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                            </button>
                            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Imagen de fondo</p>
                            <label className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors cursor-pointer">
                                <ImageIcon className="w-4 h-4" />
                                {bgImg ? 'Cambiar fondo' : 'Subir fondo'}
                                <input type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Acciones guardar */}
                <Button fullWidth isLoading={saving} onClick={guardar}>
                    <Save className="w-4 h-4" /> Guardar devocional
                </Button>
            </div>

            {/* Columna derecha: preview + exportar */}
            <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Vista previa
                    </p>
                    <canvas
                        ref={canvasRef}
                        className="w-full rounded-xl border border-gray-200 bg-gray-900"
                        style={{ aspectRatio: '9/16' }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" fullWidth onClick={() => exportar('png')} disabled={exportando}>
                            <ImageIcon className="w-4 h-4" /> Exportar PNG
                        </Button>
                        <Button variant="secondary" fullWidth onClick={() => exportar('pdf')} disabled={exportando}>
                            <FileText className="w-4 h-4" /> Exportar PDF
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export const DevocionalPage: React.FC = () => {
    const { devocionales, loading, saving, crearOActualizar } = useDevocional();
    const hoy = new Date();
    const [anioNav, setAnioNav] = useState(hoy.getFullYear());
    const [editando, setEditando] = useState<Devocional | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [nuevoAnio, setNuevoAnio] = useState(String(hoy.getFullYear()));
    const [nuevoMes, setNuevoMes] = useState(hoy.getMonth() + 1);

    const devoDelAnio = useMemo(
        () => devocionales.filter(d => d.anio === anioNav),
        [devocionales, anioNav]
    );

    if (editando) {
        return (
            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => setEditando(null)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Devocionales
                    </button>
                    <span className="text-gray-300">/</span>
                    <span className="font-medium text-gray-700">{MESES[editando.mes - 1]} {editando.anio}</span>
                </div>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{MESES[editando.mes - 1]} {editando.anio}</h2>
                </div>
                <EditorDevocional
                    devocional={editando}
                    onSaved={() => setEditando(null)}
                />
            </div>
        );
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-red-600" /> Devocional Mensual
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{devocionales.length} devocionale{devocionales.length !== 1 ? 's' : ''} creado{devocionales.length !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={() => setShowNew(true)}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo devocional</span>
                </Button>
            </div>

            {/* Navegación por año */}
            <div className="flex items-center gap-3">
                <button onClick={() => setAnioNav(v => v - 1)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold text-gray-900 min-w-[4rem] text-center">{anioNav}</span>
                <button onClick={() => setAnioNav(v => v + 1)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Grid de meses */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {MESES.map((mes, i) => {
                    const mesNum = i + 1;
                    const devo = devoDelAnio.find(d => d.mes === mesNum);
                    const esHoy = anioNav === hoy.getFullYear() && mesNum === hoy.getMonth() + 1;
                    return (
                        <div key={mesNum}
                            className={`relative bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md group cursor-pointer ${devo ? 'border-red-100' : 'border-gray-100 border-dashed'
                                } ${esHoy ? 'ring-2 ring-red-200 ring-offset-1' : ''}`}
                            onClick={async () => {
                                if (devo) { setEditando(devo); return; }
                                // crear
                                const id = await crearOActualizar(anioNav, mesNum);
                                if (id) {
                                    const nuevo: Devocional = { id_devocional: id, anio: anioNav, mes: mesNum };
                                    setEditando(nuevo);
                                }
                            }}>
                            {devo && <div className="h-1 w-full bg-gradient-to-r from-red-600 to-red-400" />}
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className={`text-base font-bold ${devo ? 'text-gray-900' : 'text-gray-400'}`}>{mes}</p>
                                        <p className="text-xs text-gray-400">{anioNav}</p>
                                    </div>
                                    {devo ? (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Listo
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">
                                            Vacío
                                        </span>
                                    )}
                                </div>
                                {devo && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <Edit2 className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-xs text-red-600 font-medium">Editar</span>
                                    </div>
                                )}
                                {!devo && (
                                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-400">Crear</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal nuevo devocional */}
            <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Nuevo Devocional" width="sm">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                            <input type="number" value={nuevoAnio}
                                onChange={e => setNuevoAnio(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                            <select value={nuevoMes} onChange={e => setNuevoMes(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500">
                                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setShowNew(false)}>Cancelar</Button>
                        <Button fullWidth isLoading={saving}
                            onClick={async () => {
                                const id = await crearOActualizar(Number(nuevoAnio), nuevoMes);
                                if (id) {
                                    setShowNew(false);
                                    setEditando({ id_devocional: id, anio: Number(nuevoAnio), mes: nuevoMes });
                                }
                            }}>
                            Crear y editar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};