import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Plus, X, Edit, Trash, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageWithCaption, MediaWithCaption } from "@shared/schema";
import { UseMutationResult } from "@tanstack/react-query";
import { InlineLoading } from "./skeleton-loader";
import { MediaUploadModal } from "./media-upload-modal";

interface ImageEditSectionProps {
  rowId: string;
  images: ImageWithCaption[];
  location?: string;
  onClose: () => void;
  onAddImage: UseMutationResult<any, Error, { rowId: string; imageUrl: string; caption?: string }, unknown>;
  onUpdateImage: UseMutationResult<any, Error, { rowId: string; imageIndex: number; imageUrl?: string; caption?: string }, unknown>;
  onDeleteImage: UseMutationResult<any, Error, { rowId: string; imageIndex?: number }, unknown>;
}

export function ImageEditSection({ 
  rowId, 
  images, 
  location,
  onClose, 
  onAddImage, 
  onUpdateImage, 
  onDeleteImage 
}: ImageEditSectionProps) {
  const [mode, setMode] = useState<'add' | 'edit' | 'replace'>('add');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single');
  const [mediaUploadOpen, setMediaUploadOpen] = useState(false);
  const { toast } = useToast();

  const isValidImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || 
           url.includes('unsplash.com') || 
           url.includes('images.unsplash.com');
  };

  const handleMediaSave = async (media: MediaWithCaption) => {
    try {
      await onAddImage.mutateAsync({ 
        rowId, 
        imageUrl: media.url, 
        caption: media.caption 
      });
      
      toast({
        title: "Media Added",
        description: "Media has been added successfully.",
      });
      
      setMediaUploadOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add media.",
        variant: "destructive",
      });
    }
  };

  const handleMediaSaveMultiple = async (mediaList: MediaWithCaption[]) => {
    try {
      for (const media of mediaList) {
        await onAddImage.mutateAsync({ 
          rowId, 
          imageUrl: media.url, 
          caption: media.caption 
        });
      }
      
      toast({
        title: "Album Added",
        description: `${mediaList.length} media items have been added successfully.`,
      });
      
      setMediaUploadOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add some media items.",
        variant: "destructive",
      });
    }
  };

  const handleModeChange = (newMode: 'add' | 'edit' | 'replace') => {
    if (newMode === 'add') {
      setMediaUploadOpen(true);
      return;
    }
    
    setMode(newMode);
    if (newMode === 'edit' && images.length > 0) {
      setCaption(images[selectedImageIndex]?.caption || "");
      setImageUrl("");
    } else if (newMode === 'replace' && images.length > 0) {
      setImageUrl(images[selectedImageIndex]?.url || "");
      setCaption(images[selectedImageIndex]?.caption || "");
    } else {
      setImageUrl("");
      setCaption("");
    }
  };

  const handleImageIndexChange = (index: string) => {
    const newIndex = parseInt(index);
    setSelectedImageIndex(newIndex);
    if (mode === 'edit') {
      setCaption(images[newIndex]?.caption || "");
      setImageUrl("");
    } else if (mode === 'replace') {
      setImageUrl(images[newIndex]?.url || "");
      setCaption(images[newIndex]?.caption || "");
    }
  };

  const handleSubmit = async () => {
    if (mode === 'add') {
      if (!imageUrl.trim()) {
        toast({
          title: "Error",
          description: "Please enter an image URL.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidImageUrl(imageUrl)) {
        toast({
          title: "Error",
          description: "Please enter a valid image URL.",
          variant: "destructive",
        });
        return;
      }

      try {
        await onAddImage.mutateAsync({ rowId, imageUrl, caption: caption.trim() });
        toast({
          title: "Image Added",
          description: "Image has been added successfully.",
        });
        setImageUrl("");
        setCaption("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add image.",
          variant: "destructive",
        });
      }
    } else if (mode === 'edit') {
      try {
        await onUpdateImage.mutateAsync({ 
          rowId, 
          imageIndex: selectedImageIndex, 
          caption: caption.trim() 
        });
        toast({
          title: "Caption Updated",
          description: "Image caption has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update caption.",
          variant: "destructive",
        });
      }
    } else if (mode === 'replace') {
      if (!imageUrl.trim()) {
        toast({
          title: "Error",
          description: "Please enter an image URL.",
          variant: "destructive",
        });
        return;
      }

      if (!isValidImageUrl(imageUrl)) {
        toast({
          title: "Error",
          description: "Please enter a valid image URL.",
          variant: "destructive",
        });
        return;
      }

      try {
        await onUpdateImage.mutateAsync({ 
          rowId, 
          imageIndex: selectedImageIndex, 
          imageUrl, 
          caption: caption.trim() 
        });
        toast({
          title: "Image Replaced",
          description: "Image has been replaced successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to replace image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteClick = (mode: 'single' | 'all') => {
    setDeleteMode(mode);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteMode === 'all') {
        await onDeleteImage.mutateAsync({ rowId });
        toast({
          title: "All Images Deleted",
          description: "All images have been deleted successfully.",
        });
        onClose();
      } else {
        await onDeleteImage.mutateAsync({ rowId, imageIndex: selectedImageIndex });
        toast({
          title: "Image Deleted",
          description: "Image has been deleted successfully.",
        });
        if (images.length <= 1) {
          onClose();
        }
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image(s).",
        variant: "destructive",
      });
    }
  };

  const isPending = onAddImage.isPending || onUpdateImage.isPending || onDeleteImage.isPending;

  // Detect changes for green text indicator
  const hasChanges = (() => {
    if (mode === 'add') {
      return imageUrl.trim().length > 0;
    } else if (mode === 'edit') {
      const originalCaption = images[selectedImageIndex]?.caption || "";
      return caption !== originalCaption;
    } else if (mode === 'replace') {
      const originalUrl = images[selectedImageIndex]?.url || "";
      return imageUrl !== originalUrl;
    }
    return false;
  })();

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[90vw] max-w-[600px] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-90 duration-300 transition-all bg-white/70 dark:bg-black/30 backdrop-blur-2xl border-2 border-gray-200/60 dark:border-white/10 shadow-[0_20px_60px_0_rgba(0,0,0,0.25)] rounded-xl">
          {/* iOS Frosted Glass Layer */}
          <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-white/60 via-white/40 to-white/50 dark:from-black/40 dark:via-black/20 dark:to-black/30 backdrop-blur-3xl border-0 shadow-inner" />
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-xs font-semibold flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              📷 Manage Media for {location || 'Row'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative z-10 flex flex-col gap-4 py-4">
            {/* Mode Selection */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-blue-400/20 dark:border-blue-500/20 rounded-lg p-3">
              <label className="text-xs font-medium text-foreground/90 mb-2 block">🎬 Action:</label>
              <Select value={mode} onValueChange={handleModeChange}>
                <SelectTrigger className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-blue-400/30 dark:border-blue-500/30 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">📸 Add New Media</SelectItem>
                  {images.length > 0 && <SelectItem value="edit">✏️ Edit Caption</SelectItem>}
                  {images.length > 0 && <SelectItem value="replace">🔄 Replace Media</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Media Selection (for edit/replace modes) */}
            {(mode === 'edit' || mode === 'replace') && images.length > 1 && (
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-blue-400/20 dark:border-blue-500/20 rounded-lg p-3">
                <label className="text-xs font-medium text-foreground/90 mb-2 block">🎯 Select Media:</label>
                <Select value={selectedImageIndex.toString()} onValueChange={handleImageIndexChange}>
                  <SelectTrigger className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-blue-400/30 dark:border-blue-500/30 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {images.map((image, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {image.type === 'video' ? '🎥' : '📷'} Item {index + 1} {image.caption ? `- ${image.caption}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current Media Preview (for edit/replace modes) */}
            {(mode === 'edit' || mode === 'replace') && images[selectedImageIndex] && (
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-blue-400/20 dark:border-blue-500/20 rounded-lg p-3">
                <label className="text-xs font-medium text-foreground/90 mb-2 block">🖼️ Current {images[selectedImageIndex].type === 'video' ? 'Video' : 'Image'}:</label>
                {images[selectedImageIndex].type === 'video' ? (
                  <div className="relative">
                    <video
                      src={images[selectedImageIndex].url}
                      className="w-32 h-24 object-cover border border-white/20 rounded-lg"
                      controls={false}
                      poster={images[selectedImageIndex].thumbnail}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={images[selectedImageIndex].url}
                    alt={images[selectedImageIndex].caption || "Current image"}
                    className="w-32 h-24 object-cover border border-white/20 rounded-lg"
                  />
                )}
              </div>
            )}

            {/* Media URL Input (for add/replace modes) */}
            {(mode === 'add' || mode === 'replace') && (
              <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-blue-400/20 dark:border-blue-500/20 rounded-lg p-3">
                <label className="text-xs font-medium text-foreground/90 mb-2 block">
                  🔗 {mode === 'add' ? 'Media URL:' : 'New Media URL:'}
                </label>
                <Input
                  type="url"
                  placeholder="Image, video, YouTube, or Vimeo URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-blue-400/30 dark:border-blue-500/30 w-full text-xs"
                  data-testid="input-image-url"
                />
                {imageUrl && !isValidImageUrl(imageUrl) && (
                  <p className="text-amber-400 text-xs mt-2">⚠️ This looks like a video URL. For best compatibility, use direct image formats: jpg, png, gif, webp</p>
                )}
              </div>
            )}

            {/* Caption Input */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-blue-400/20 dark:border-blue-500/20 rounded-lg p-3">
              <label className="text-xs font-medium text-foreground/90 mb-2 block">📝 Caption:</label>
              <Input
                type="text"
                placeholder="Add caption (optional)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border-blue-400/30 dark:border-blue-500/30 w-full text-xs"
                data-testid="input-image-caption"
              />
            </div>

            {/* Delete Options */}
            {images.length > 0 && (
              <div className="bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-3">
                <label className="text-xs font-medium text-red-400 mb-2 block">🗑️ Delete Options:</label>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick('single')}
                    disabled={isPending}
                    className="flex-1 bg-transparent hover:bg-red-600/20 backdrop-blur-sm border-transparent text-red-400 hover:text-red-300 text-xs"
                    data-testid="button-delete-single"
                  >
                    <Trash className="w-3 h-3 mr-1" />
                    Delete This Item
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick('all')}
                    disabled={isPending}
                    className="flex-1 bg-transparent hover:bg-red-600/20 backdrop-blur-sm border-transparent text-red-400 hover:text-red-300 text-xs"
                    data-testid="button-delete-all"
                  >
                    <Trash className="w-3 h-3 mr-1" />
                    Delete All Items
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="relative z-10 flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-transparent text-red-500 hover:bg-red-500/10 backdrop-blur-sm text-xs"
              data-testid="button-cancel"
              disabled={isPending}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isPending}
              className={`flex-1 bg-transparent backdrop-blur-sm border-transparent text-xs transition-all ${
                hasChanges 
                  ? 'text-green-400 hover:text-green-300 hover:bg-green-600/20' 
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-500/10'
              }`}
              data-testid="button-submit"
            >
              {isPending ? (
                <InlineLoading type="triple" />
              ) : (
                <>
                  {mode === 'add' && <Plus className="w-3 h-3 mr-1" />}
                  {mode === 'edit' && <Edit className="w-3 h-3 mr-1" />}
                  {mode === 'replace' && <RotateCcw className="w-3 h-3 mr-1" />}
                  {mode === 'add' ? 'Add Media' : mode === 'edit' ? 'Update Caption' : 'Replace Media'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/70 dark:bg-black/30 backdrop-blur-2xl border-2 border-gray-200/60 dark:border-white/10 shadow-[0_20px_60px_0_rgba(0,0,0,0.25)] rounded-xl">
          {/* iOS Frosted Glass Layer */}
          <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-white/60 via-white/40 to-white/50 dark:from-black/40 dark:via-black/20 dark:to-black/30 backdrop-blur-3xl border-0 shadow-inner" />
          
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-xs font-semibold">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-xs">
              {deleteMode === 'all' 
                ? "Are you sure you want to delete ALL images? This action cannot be undone."
                : "Are you sure you want to delete this image? This action cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="relative z-10">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              data-testid="button-cancel-delete"
              disabled={isPending}
              className="bg-transparent border-transparent hover:bg-gray-500/10 backdrop-blur-sm text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              data-testid="button-confirm-delete"
              disabled={isPending}
              className="bg-transparent hover:bg-red-600/20 backdrop-blur-sm border-transparent text-red-400 hover:text-red-300 text-xs"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Upload Modal */}
      <MediaUploadModal
        open={mediaUploadOpen}
        onOpenChange={setMediaUploadOpen}
        onSave={handleMediaSave}
        onSaveMultiple={handleMediaSaveMultiple}
      />
    </>
  );
}