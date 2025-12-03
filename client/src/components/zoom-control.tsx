import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";

// Add custom CSS for slider thumb
const sliderStyles = `
  .slider-thumb::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(59 130 246);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .slider-thumb::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgb(59 130 246);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .slider-thumb::-webkit-slider-thumb:hover {
    background: rgb(37 99 235);
    transform: scale(1.1);
  }
  
  .slider-thumb::-moz-range-thumb:hover {
    background: rgb(37 99 235);
    transform: scale(1.1);
  }
`;

interface ZoomControlProps {
  isOpen?: boolean;
  onClose?: () => void;
  onZoomChange?: (zoom: number) => void;
}

export function ZoomControl({ isOpen = false, onClose, onZoomChange }: ZoomControlProps) {
  const [zoom, setZoom] = useState(100);
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

  // Inject styles
  useEffect(() => {
    const styleId = 'zoom-slider-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = sliderStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseInt(e.target.value);
    setZoom(newZoom);
    applyZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  return (
    <div
      ref={controlRef}
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-blue-500/30 dark:border-blue-400/30 rounded-full shadow-lg px-6 py-3"
      style={{ userSelect: 'none' }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          disabled={zoom <= 50}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-[35px]">
            {zoom}%
          </span>
          
          <input
            type="range"
            min="50"
            max="200"
            step="10"
            value={zoom}
            onChange={handleSliderChange}
            className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-blue-600 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-blue-600"
            title={`Zoom: ${zoom}%`}
          />
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
          disabled={zoom >= 200}
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
