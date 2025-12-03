import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";

interface ZoomControlProps {
  isOpen?: boolean;
  onClose?: () => void;
  onZoomChange?: (zoom: number) => void;
}

export function ZoomControl({ isOpen = false, onClose, onZoomChange }: ZoomControlProps) {
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 20, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const controlRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    setZoom(newZoom);
    applyZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50);
    setZoom(newZoom);
    applyZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleReset = () => {
    setZoom(100);
    applyZoom(100);
    onZoomChange?.(100);
  };

  const applyZoom = (zoomLevel: number) => {
    const scale = zoomLevel / 100;
    
    // Apply zoom to content container only
    const zoomableContent = document.getElementById('zoomable-content');
    if (zoomableContent) {
      (zoomableContent as HTMLElement).style.transform = `scale(${scale})`;
      (zoomableContent as HTMLElement).style.transformOrigin = "top center";
      
      // Adjust width to prevent overflow when zoomed
      const adjustedWidth = 100 / scale;
      (zoomableContent as HTMLElement).style.width = `${adjustedWidth}%`;
      (zoomableContent as HTMLElement).style.maxWidth = `${adjustedWidth}%`;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (controlRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (controlRef.current?.offsetHeight || 0);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlRef.current && !controlRef.current.contains(event.target as Node) && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={controlRef}
      className={`fixed z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-500/30 dark:border-blue-400/30 rounded-xl shadow-lg hover:shadow-xl transition-all ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between gap-2 mb-2 px-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="h-5 w-5 p-0 hover:bg-red-500/10"
          >
            <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="w-full h-8 hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          disabled={zoom >= 200}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="w-full h-8 hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="w-full h-8 hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          disabled={zoom <= 50}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
