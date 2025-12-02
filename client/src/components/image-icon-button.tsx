import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, ImageOff, Loader2 } from "lucide-react";
import { MediaWithCaption } from "@shared/schema";

interface ImageIconButtonProps {
  images: MediaWithCaption[];
  rowId: string;
}

export function ImageIconButton({
  images,
  rowId,
}: ImageIconButtonProps) {
  const hasImages = images && images.length > 0;
  const [isLoading, setIsLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    let gallery: any = null;

    const loadLightGallery = async () => {
      if (typeof window !== "undefined" && hasImages) {
        try {
          setIsLoading(true);
          
          // Preload all images first
          const imagePromises = images
            .filter(media => media.type !== 'video')
            .map(media => {
              return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => resolve(media.url);
                img.onerror = () => reject(media.url);
                img.src = media.url;
              });
            });
          
          await Promise.all(imagePromises).catch(err => console.warn("Some images failed to preload:", err));
          setImagesLoaded(true);
          
          await new Promise((resolve) => setTimeout(resolve, 150));

          const galleryElement = document.getElementById(
            `lightgallery-icon-${rowId}`,
          );
          if (!galleryElement) return;

          const imageLinks = galleryElement.querySelectorAll("a[data-src]");
          if (imageLinks.length === 0) return;

          const { default: lightGallery } = await import("lightgallery");
          const lgThumbnail = await import("lightgallery/plugins/thumbnail");
          const lgZoom = await import("lightgallery/plugins/zoom");
          const lgAutoplay = await import("lightgallery/plugins/autoplay");
          const lgFullscreen = await import("lightgallery/plugins/fullscreen");
          const lgVideo = await import("lightgallery/plugins/video");

          await import("lightgallery/css/lightgallery.css");
          await import("lightgallery/css/lg-thumbnail.css");
          await import("lightgallery/css/lg-zoom.css");
          await import("lightgallery/css/lg-autoplay.css");
          await import("lightgallery/css/lg-fullscreen.css");
          await import("lightgallery/css/lg-video.css");

          gallery = lightGallery(galleryElement, {
            licenseKey: 'GPLv3',
            plugins: [
              lgThumbnail.default,
              lgZoom.default,
              lgAutoplay.default,
              lgFullscreen.default,
              lgVideo.default,
            ],
            speed: 800,
            mode: "lg-slide",
            download: false,
            selector: "a[data-src]",
            thumbnail: true,
            animateThumb: true,
            showThumbByDefault: true,
            thumbWidth: 100,
            thumbHeight: 80,
            thumbMargin: 5,
            actualSize: false,
            startClass: "lg-start-zoom",
            backdropDuration: 300,
            hideBarsDelay: 3000,
            mousewheel: true,
            enableSwipe: true,
            enableDrag: true,
            autoplayFirstVideo: false,
            youTubePlayerParams: {
              modestbranding: 1,
              showinfo: 0,
              rel: 0,
              controls: 1,
              playsinline: 1
            },
            vimeoPlayerParams: {
              byline: 0,
              portrait: 0,
              color: '3B82F6',
              controls: 1,
              playsinline: 1
            },
            appendSubHtmlTo: '.lg-sub-html',
            subHtmlSelectorRelative: false,
          });
          
          setIsLoading(false);
        } catch (error) {
          console.error("Failed to load LightGallery:", error);
          setIsLoading(false);
        }
      }
    };

    loadLightGallery();

    return () => {
      if (gallery) {
        try {
          gallery.destroy();
        } catch (e) {
          console.warn("Error destroying lightGallery:", e);
        }
      }
    };
  }, [images, rowId, hasImages]);

  return (
    <div className="flex items-center justify-center" id={`lightgallery-icon-${rowId}`}>
      {hasImages ? (
        <>
          {/* First link is visible as button and triggers lightgallery */}
          <a
            href="javascript:void(0)"
            data-src={images[0].url}
            data-sub-html={`<div class="text-center"><h4 class="text-lg font-semibold mb-1">${images[0].caption || 'Image 1'}</h4></div>`}
            data-video={images[0].type === 'video' ? JSON.stringify({ 
              source: [{ 
                src: images[0].url, 
                type: images[0].mimeType || 'video/mp4'
              }], 
              attributes: { 
                preload: 'metadata', 
                controls: true,
                controlsList: 'nodownload',
                playsinline: true
              } 
            }) : undefined}
            data-poster={images[0].type === 'video' && images[0].thumbnail ? images[0].thumbnail : undefined}
            className="inline-flex items-center justify-center h-8 w-8 text-blue-500 hover:text-blue-600 cursor-pointer"
            title={`${images.length} image(s)`}
            data-testid={`image-button-${rowId}`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Image className="w-4 h-4" />
            )}
          </a>
          
          {/* Remaining images hidden */}
          {images.slice(1).map((media, index) => {
            const isVideo = media.type === 'video';
            const getMimeType = () => {
              if (media.mimeType) return media.mimeType;
              if (media.url.startsWith('data:')) {
                const match = media.url.match(/^data:([^;]+)/);
                return match ? match[1] : 'video/mp4';
              }
              if (media.url.includes('.webm')) return 'video/webm';
              if (media.url.includes('.ogg')) return 'video/ogg';
              if (media.url.includes('.mov')) return 'video/quicktime';
              return 'video/mp4';
            };
            
            const videoData = isVideo ? JSON.stringify({ 
              source: [{ 
                src: media.url, 
                type: getMimeType()
              }], 
              attributes: { 
                preload: 'metadata', 
                controls: true,
                controlsList: 'nodownload',
                playsinline: true
              } 
            }) : undefined;

            return (
              <a
                key={index + 1}
                href="javascript:void(0)"
                data-src={media.url}
                data-sub-html={`<div class="text-center"><h4 class="text-lg font-semibold mb-1">${media.caption || `Image ${index + 2}`}</h4></div>`}
                data-video={videoData}
                data-poster={isVideo && media.thumbnail ? media.thumbnail : undefined}
                className="hidden"
              />
            );
          })}
        </>
      ) : (
        <div className="h-8 w-8 flex items-center justify-center text-gray-400">
          <ImageOff className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
