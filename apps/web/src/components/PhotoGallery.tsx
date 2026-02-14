import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { Maximize2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Photo {
    url: string;
    caption?: string;
    status: 'OK' | 'PROBLEM';
    notes?: string;
}

interface PhotoGalleryProps {
    photos: Photo[];
    title?: string;
}

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
    if (!photos || photos.length === 0) return null;

    return (
        <div className="space-y-3">
            {title && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {title} <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{photos.length}</span>
                </h3>
            )}

            <PhotoProvider
                maskOpacity={0.9}
                speed={() => 300}
                easing={(type) => (type === 2 ? 'cubic-bezier(0.36, 0, 0.66, -0.56)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)')}
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {photos.map((photo, index) => (
                        <div key={index} className="group relative aspect-square rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all">
                            <PhotoView src={photo.url}>
                                <div className="w-full h-full cursor-pointer overflow-hidden bg-muted">
                                    <img
                                        src={photo.url}
                                        alt={photo.caption || `Foto ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Maximize2 className="text-white drop-shadow-md" size={24} />
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                        {photo.status === 'OK' ? (
                                            <div className="bg-green-500/90 text-white p-1 rounded-full shadow-sm backdrop-blur-sm">
                                                <CheckCircle2 size={12} />
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/90 text-white p-1 rounded-full shadow-sm backdrop-blur-sm animate-pulse">
                                                <AlertCircle size={12} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Caption/Notes bar */}
                                    {(photo.caption || photo.notes) && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-white text-[10px] truncate">
                                            {photo.notes || photo.caption}
                                        </div>
                                    )}
                                </div>
                            </PhotoView>
                        </div>
                    ))}
                </div>
            </PhotoProvider>
        </div>
    );
}
