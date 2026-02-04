import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ZoomableImageViewer = ({ src, alt, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newScale = Math.min(Math.max(1, scale + delta), 4);
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4" onClick={onClose}>
            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex items-center gap-4 z-10" onClick={e => e.stopPropagation()}>
                <button
                    onClick={(e) => { e.stopPropagation(); setScale(Math.min(scale + 0.5, 4)); }}
                    className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition backdrop-blur-sm"
                >
                    <ZoomIn size={20} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setScale(Math.max(1, scale - 0.5)); setPosition({ x: 0, y: 0 }); }}
                    className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition backdrop-blur-sm"
                >
                    <ZoomOut size={20} />
                </button>
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 text-white rounded-full hover:bg-red-500/20 hover:text-red-500 transition backdrop-blur-sm"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Image Container */}
            <div
                className="relative overflow-hidden w-full h-full flex items-center justify-center cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        maxHeight: '90vh',
                        maxWidth: '90vw',
                        objectFit: 'contain'
                    }}
                    className="select-none"
                />
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                Scroll to Zoom • Drag to Pan
            </div>
        </div>
    );
};

export default ZoomableImageViewer;
