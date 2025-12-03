import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";

interface ZoomControlProps {
  isOpen?: boolean;
  onClose?: () => void;
  onZoomChange?: (zoom: number) => void;
}

export function ZoomControl({ isOpen = false, onClose, onZoomChange }: ZoomControlProps) {
  // Get current zoom from localStorage or use default 100
  const getCurrentZoom = () => {
    // First check localStorage
    const savedZoom = localStorage.getItem('appZoomLevel');
    if (savedZoom) {
      return parseInt(savedZoom);
    }
    return 100;
  };

  const [zoom, setZoom] = useState(getCurrentZoom);
  const controlRef = useRef<HTMLDivElement>(null);
  
  // Zoom levels: 100% (default), 110%, 120%, 130%
  const zoomLevels = [100, 110, 120, 130];

  const applyZoom = (zoomLevel: number) => {
    const scale = zoomLevel / 100;
    
    // Apply zoom to content container - adjust width to prevent overflow
    const zoomableContent = document.getElementById('zoomable-content');
    if (zoomableContent) {
      (zoomableContent as HTMLElement).style.transform = `scale(${scale})`;
      (zoomableContent as HTMLElement).style.transformOrigin = "top center";
      
      // Adjust width inversely to scale to prevent overflow
      const adjustedWidth = 100 / scale;
      (zoomableContent as HTMLElement).style.width = `${adjustedWidth}%`;
      (zoomableContent as HTMLElement).style.maxWidth = `${adjustedWidth}%`;
      
      // Store zoom level in localStorage for persistence
      localStorage.setItem('appZoomLevel', zoomLevel.toString());
    }
  };

  // Apply saved zoom on mount
  useEffect(() => {
    const savedZoom = getCurrentZoom();
    if (savedZoom !== 100) {
      applyZoom(savedZoom);
      setZoom(savedZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update zoom state when control opens
  useEffect(() => {
    if (isOpen) {
      setZoom(getCurrentZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    if (currentIndex < zoomLevels.length - 1) {
      const newZoom = zoomLevels[currentIndex + 1];
      setZoom(newZoom);
      applyZoom(newZoom);
      onZoomChange?.(newZoom);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    if (currentIndex > 0) {
      const newZoom = zoomLevels[currentIndex - 1];
      setZoom(newZoom);
      applyZoom(newZoom);
      onZoomChange?.(newZoom);
    }
  };

  const handleReset = () => {
    setZoom(100);
    applyZoom(100);
    onZoomChange?.(100);
  };

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
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-500/30 dark:border-blue-400/30 rounded-full shadow-lg px-4 py-2"
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          disabled={zoom <= 100}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[50px] text-center">
          {zoom}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          disabled={zoom >= 130}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          title="Reset to 100%"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 rounded-full hover:bg-red-500/10"
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
