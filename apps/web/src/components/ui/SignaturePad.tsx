import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, X } from 'lucide-react';
import { Button } from './Button';

interface SignaturePadProps {
    onSave: (file: File) => void;
    onCancel: () => void;
    title?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, title = "Assinatura Digital" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) context.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        context.lineWidth = 3;
        context.lineCap = 'round';
        context.strokeStyle = '#000';

        context.lineTo(x, y);
        context.stroke();
        context.beginPath();
        context.moveTo(x, y);

        setIsEmpty(false);
    };

    const clear = () => {
        if (!canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (!context) return;
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setIsEmpty(true);
    };

    const save = () => {
        if (isEmpty || !canvasRef.current) return;

        const dataUrl = canvasRef.current.toDataURL('image/png');
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });
                onSave(file);
            });
    };

    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="fixed inset-0 z-[65] bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-neutral-50">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-neutral-900">{title}</h3>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Utilize o dedo ou uma caneta capacitiva</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 min-h-[300px] bg-neutral-50/50 relative touch-none">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseMove={draw}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                        className="w-full h-full cursor-crosshair"
                    />
                    {isEmpty && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <p className="text-xl font-bold uppercase tracking-[0.2em] -rotate-12 border-4 border-neutral-900 p-4">Assine Aqui</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-neutral-50 border-t flex gap-4">
                    <Button
                        variant="ghost"
                        className="flex-1 py-4 font-black uppercase tracking-widest text-xs"
                        onClick={clear}
                        disabled={isEmpty}
                    >
                        <Eraser className="mr-2" size={18} />
                        Limpar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-[2] py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700"
                        onClick={save}
                        disabled={isEmpty}
                    >
                        <Check className="mr-2" size={18} />
                        Confirmar Assinatura
                    </Button>
                </div>
            </div>
        </div>
    );
};
