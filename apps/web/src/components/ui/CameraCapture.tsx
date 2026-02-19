import React, { useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { Button } from './Button';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Prefer back camera
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError('Não foi possível acessar a câmera. Verifique as permissões.');
            console.error(err);
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
            }
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            // Convert dataUrl to File
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    stopCamera();
                });
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    React.useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-lg aspect-[3/4] bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white bg-black/80">
                                <p>{error}</p>
                            </div>
                        )}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                            <Button
                                variant="danger"
                                size="lg"
                                className="rounded-full w-16 h-16 p-0"
                                onClick={onClose}
                            >
                                <X size={32} />
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                className="rounded-full w-20 h-20 p-0 border-4 border-white/20 bg-white text-black hover:bg-neutral-200"
                                onClick={capturePhoto}
                                disabled={!!error}
                            >
                                <Camera size={40} />
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="rounded-full w-16 h-16 p-0"
                                onClick={retakePhoto}
                            >
                                <RefreshCw size={24} />
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                className="rounded-full w-20 h-20 p-0 bg-emerald-600 hover:bg-emerald-700"
                                onClick={confirmPhoto}
                            >
                                <Check size={40} />
                            </Button>
                        </div>
                    </>
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>
            <p className="mt-6 text-white text-sm font-medium opacity-60">
                {capturedImage ? 'Revise a foto tirada' : 'Posicione a câmera para a evidência'}
            </p>
        </div>
    );
};
