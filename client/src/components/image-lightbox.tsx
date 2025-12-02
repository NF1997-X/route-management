import { useEffect, useRef } from "react";
import type { MediaWithCaption } from "@shared/schema";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: MediaWithCaption[];
  initialIndex?: number;
  location?: string;
}

export function ImageLightbox({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  location
}: ImageLightboxProps) {
  const galleryRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const loadLightGallery = async () => {
      if (!open || !images || images.length === 0 || isInitializedRef.current) return;

      try {
        // Small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 150));

        const galleryElement = containerRef.current;
        if (!galleryElement) return;

        // Dynamic import LightGallery
        const { default: lightGallery } = await import("lightgallery");
        const lgThumbnail = await import("lightgallery/plugins/thumbnail");
        const lgZoom = await import("lightgallery/plugins/zoom");
        const lgAutoplay = await import("lightgallery/plugins/autoplay");
        const lgFullscreen = await import("lightgallery/plugins/fullscreen");

        // Import CSS
        await import("lightgallery/css/lightgallery.css");
        await import("lightgallery/css/lg-thumbnail.css");
        await import("lightgallery/css/lg-zoom.css");
        await import("lightgallery/css/lg-autoplay.css");
        await import("lightgallery/css/lg-fullscreen.css");

        const gallery = lightGallery(galleryElement, {
          licenseKey: 'GPLv3',
          plugins: [
            lgThumbnail.default,
            lgZoom.default,
            lgAutoplay.default,
            lgFullscreen.default,
          ],
          speed: 500,
          mode: "lg-fade",
          download: true,
          selector: "a[data-src]",
          thumbnail: true,
          animateThumb: true,
          showThumbByDefault: true,
          actualSize: true,
          startClass: "lg-start-zoom",
          backdropDuration: 300,
          hideBarsDelay: 4000,
          mousewheel: true,
          enableSwipe: true,
          enableDrag: true,
          counter: true,
          appendSubHtmlTo: ".lg-sub-html",
          subHtmlSelectorRelative: false,
        } as any);

        galleryRef.current = gallery;
        isInitializedRef.current = true;

        // Auto-open at initial index
        setTimeout(() => {
          if (galleryRef.current) {
            galleryRef.current.openGallery(initialIndex);
          }
        }, 100);

        // Listen for close event using LG event system
        galleryElement.addEventListener("lgAfterClose", () => {
          onOpenChange(false);
          // Cleanup after close
          setTimeout(() => {
            if (galleryRef.current) {
              galleryRef.current.destroy();
              galleryRef.current = null;
              isInitializedRef.current = false;
            }
          }, 100);
        });

      } catch (error) {
        console.error("Failed to load LightGallery:", error);
        isInitializedRef.current = false;
      }
    };

    if (open) {
      loadLightGallery();
    }

    return () => {
      if (galleryRef.current && !open) {
        try {
          galleryRef.current.destroy();
          galleryRef.current = null;
          isInitializedRef.current = false;
        } catch (error) {
          console.error("Error destroying gallery:", error);
        }
      }
    };
  }, [open, images, initialIndex, onOpenChange]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      id="image-lightbox-gallery"
      style={{ display: "none" }}
    >
      {images.map((media, index) => (
        <a
          key={index}
          href={media.url}
          data-src={media.url}
          data-sub-html={`<div class="text-center"><h4 class="text-lg font-semibold mb-1">${media.caption || `Image ${index + 1}`}</h4>${location ? `<p class="text-sm text-gray-400">${location}</p>` : ''}</div>`}
        >
          <img alt={media.caption || `Image ${index + 1}`} src={media.url} />
        </a>
      ))}
    </div>
  );
}
