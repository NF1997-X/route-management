import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Image, Video, Upload, Plus, X, PlayCircle, FileImage, List, FolderOpen } from "lucide-react";
import { MediaWithCaption } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (media: MediaWithCaption) => void;
  onSaveMultiple?: (mediaList: MediaWithCaption[]) => void;
}

export function MediaUploadModal({ open, onOpenChange, onSave, onSaveMultiple }: MediaUploadModalProps) {
  const [mode, setMode] = useState<"single" | "album">("single");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [albumItems, setAlbumItems] = useState<MediaWithCaption[]>([]);
  const [bulkUrls, setBulkUrls] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectVideoType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')) return 'direct';
    return 'unknown';
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const dataURL = await fileToDataURL(file);
    
    // Upload to ImgBB
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: dataURL,
        name: file.name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const uploadUrlToImgBB = async (imageUrl: string): Promise<string> => {
    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from URL');
    }
    
    // Convert to blob then to base64
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          
          // Upload to ImgBB
          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64data,
              name: 'uploaded-image',
            }),
          });

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Upload failed');
          }

          const result = await uploadResponse.json();
          resolve(result.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    try {
      if (mode === "single") {
        const file = files[0];
        
        if (file.type.startsWith('video/')) {
          // For videos, still use data URL (ImgBB is for images only)
          const dataURL = await fileToDataURL(file);
          const urlWithType = dataURL.includes('data:') 
            ? dataURL.replace(/^data:([^;]+)/, `data:${file.type}`) 
            : dataURL;
          setUrl(urlWithType);
          setMediaType('video');
        } else {
          // For images, upload to ImgBB
          setMediaType('image');
          toast({
            title: "Uploading...",
            description: `Uploading ${file.name} to ImgBB...`,
          });
          
          const uploadedUrl = await uploadToImgBB(file);
          setUrl(uploadedUrl);
          
          toast({
            title: "Upload Success",
            description: `${file.name} uploaded successfully!`,
          });
        }
      } else {
        // Album mode - process multiple files
        const newItems: MediaWithCaption[] = [];
        
        toast({
          title: "Uploading Album",
          description: `Uploading ${files.length} files to ImgBB...`,
        });
        
        for (const file of Array.from(files)) {
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          
          let finalUrl: string;
          if (type === 'video') {
            // For videos, use data URL
            const dataURL = await fileToDataURL(file);
            finalUrl = dataURL.includes('data:') 
              ? dataURL.replace(/^data:([^;]+)/, `data:${file.type}`) 
              : dataURL;
          } else {
            // For images, upload to ImgBB
            finalUrl = await uploadToImgBB(file);
          }
          
          newItems.push({
            url: finalUrl,
            caption: file.name,
            type: type,
          });
        }
        
        setAlbumItems([...albumItems, ...newItems]);
        
        toast({
          title: "Upload Success",
          description: `${files.length} file(s) uploaded to ImgBB and added to album`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload file(s)",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (mode === "single") {
      if (!url.trim()) return;

      setIsProcessing(true);
      
      try {
        let finalUrl = url.trim();
        
        // If it's an image URL (not data URL or video), upload to ImgBB
        if (mediaType === 'image' && !url.startsWith('data:') && (url.startsWith('http://') || url.startsWith('https://'))) {
          toast({
            title: "Uploading to ImgBB...",
            description: "Processing your image URL",
          });
          
          finalUrl = await uploadUrlToImgBB(url);
          
          toast({
            title: "Upload Success",
            description: "Image uploaded to ImgBB successfully!",
          });
        }

        const media: MediaWithCaption = {
          url: finalUrl,
          caption: caption.trim(),
          type: mediaType,
          ...(mediaType === "video" && thumbnail.trim() && { thumbnail: thumbnail.trim() }),
        };

        onSave(media);
        handleReset();
      } catch (error) {
        console.error('Save error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process image",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (albumItems.length === 0) return;
      onSaveMultiple?.(albumItems);
      handleReset();
    }
  };

  const addToAlbum = async () => {
    if (!url.trim()) return;

    setIsProcessing(true);
    
    try {
      let finalUrl = url.trim();
      
      // If it's an image URL (not data URL or video), upload to ImgBB
      if (mediaType === 'image' && !url.startsWith('data:') && (url.startsWith('http://') || url.startsWith('https://'))) {
        toast({
          title: "Uploading to ImgBB...",
          description: "Processing your image URL",
        });
        
        finalUrl = await uploadUrlToImgBB(url);
        
        toast({
          title: "Upload Success",
          description: "Image uploaded to ImgBB!",
        });
      }

      const media: MediaWithCaption = {
        url: finalUrl,
        caption: caption.trim(),
        type: mediaType,
        ...(mediaType === "video" && thumbnail.trim() && { thumbnail: thumbnail.trim() })
      };

      setAlbumItems([...albumItems, media]);
      setUrl("");
      setCaption("");
      setThumbnail("");
    } catch (error) {
      console.error('Add to album error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFromAlbum = (index: number) => {
    setAlbumItems(albumItems.filter((_, i) => i !== index));
  };

  const handleBulkAdd = async () => {
    const urls = bulkUrls.split('\n').filter(line => line.trim());
    if (urls.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing Bulk Upload",
        description: `Uploading ${urls.length} image(s) to ImgBB...`,
      });
      
      const newItems: MediaWithCaption[] = [];
      
      for (const url of urls) {
        let finalUrl = url.trim();
        
        // Upload image URLs to ImgBB
        if (mediaType === 'image' && (url.startsWith('http://') || url.startsWith('https://'))) {
          try {
            finalUrl = await uploadUrlToImgBB(url.trim());
          } catch (error) {
            console.error(`Failed to upload ${url}:`, error);
            // Skip failed uploads
            continue;
          }
        }
        
        newItems.push({
          url: finalUrl,
          caption: '',
          type: mediaType
        });
      }
      
      setAlbumItems([...albumItems, ...newItems]);
      setBulkUrls('');
      
      toast({
        title: "Bulk Upload Complete",
        description: `${newItems.length} image(s) uploaded successfully!`,
      });
    } catch (error) {
      console.error('Bulk add error:', error);
      toast({
        title: "Error",
        description: "Failed to process some images",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setCaption("");
    setThumbnail("");
    setMediaType("image");
    setAlbumItems([]);
    setBulkUrls("");
    setMode("single");
    setUploadMethod("url");
    setIsProcessing(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3m max-h-[90vh] flex flex-col bg-gray-200 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-xl">
        <DialogHeader className="flex-shrink-0 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-sm font-semibold">
            {mode === "single" ? <Upload className="w-5 h-5" /> : <List className="w-5 h-5" />}
            {mode === "single" ? "Add Media" : "Add Album"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm mt-2">
            {mode === "single" ? "Upload an image or video to the gallery" : "Create an album with multiple media items"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6 overflow-y-auto flex-1 pr-2 px-2">
          {/* Mode Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <Label className="text-sm font-medium text-foreground/90 mb-3 block">
              📁 Upload Mode
            </Label>
            <Tabs value={mode} onValueChange={(value) => setMode(value as "single" | "album")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-300 dark:bg-white/5">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  Single
                </TabsTrigger>
                <TabsTrigger value="album" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Album
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="mt-4">
                <div className="space-y-4">
                  {/* Upload Method Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground/90">📤 Upload Method</Label>
                    <RadioGroup
                      value={uploadMethod}
                      onValueChange={(value) => {
                        setUploadMethod(value as "url" | "file");
                        setUrl("");
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="url" id="method-url" />
                        <Label htmlFor="method-url" className="flex items-center gap-2 cursor-pointer">
                          🔗 URL
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="file" id="method-file" />
                        <Label htmlFor="method-file" className="flex items-center gap-2 cursor-pointer">
                          <FolderOpen className="w-4 h-4 text-green-400" />
                          Upload from Gallery
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Media Type Selection (only for URL method) */}
                  {uploadMethod === "url" && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground/90">📷 Media Type</Label>
                      <RadioGroup
                        value={mediaType}
                        onValueChange={(value) => setMediaType(value as "image" | "video")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="image" id="image" />
                          <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                            <Image className="w-4 h-4 text-blue-400" />
                            Image
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="video" id="video" />
                          <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                            <Video className="w-4 h-4 text-purple-400" />
                            Video
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* File Upload */}
                  {uploadMethod === "file" ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground/90">
                        📁 Select File
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {isProcessing ? "Processing..." : "Choose from Gallery"}
                      </Button>
                      {url && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            ✅ File loaded successfully! Add caption below and click "Add" to save.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* URL Input */
                    <div className="space-y-2">
                      <Label htmlFor="url" className="text-sm font-medium text-foreground/90">
                        🔗 {mediaType === "video" ? "Video URL" : "Image URL"}
                      </Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder={mediaType === "video" 
                          ? "YouTube, Vimeo, or direct video URL..." 
                          : "https://example.com/image.jpg"}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                      />
                      {mediaType === "video" && url && (
                        <p className="text-xs text-muted-foreground">
                          🎬 Detected: {detectVideoType(url)} video
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Thumbnail (only for videos) */}
                  {mediaType === "video" && (
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail" className="text-sm font-medium text-foreground/90">
                        🖼️ Thumbnail URL (optional)
                      </Label>
                      <Input
                        id="thumbnail"
                        type="url"
                        placeholder="https://example.com/thumbnail.jpg"
                        value={thumbnail}
                        onChange={(e) => setThumbnail(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="space-y-2">
                    <Label htmlFor="caption" className="text-sm font-medium text-foreground/90">
                      📝 Caption (optional)
                    </Label>
                    <Textarea
                      id="caption"
                      placeholder="Enter a caption or description..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={2}
                      className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="album" className="mt-4">
                <div className="space-y-4">
                  {/* Upload from Gallery (Album mode) */}
                  <div className="bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-lg p-3">
                    <Label className="text-sm font-medium text-foreground/90 mb-2 block">📁 Upload from Gallery</Label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="album-file-input"
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('album-file-input')?.click()}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {isProcessing ? "Processing..." : "Select Multiple Files"}
                    </Button>
                  </div>

                  {/* Album Builder */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground/90">📷 Media Type for URL Input</Label>
                    <RadioGroup
                      value={mediaType}
                      onValueChange={(value) => setMediaType(value as "image" | "video")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="album-image" />
                        <Label htmlFor="album-image" className="flex items-center gap-2 cursor-pointer">
                          <Image className="w-4 h-4 text-blue-400" />
                          Images
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="album-video" />
                        <Label htmlFor="album-video" className="flex items-center gap-2 cursor-pointer">
                          <Video className="w-4 h-4 text-purple-400" />
                          Videos
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Single Item Add */}
                  <div className="bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-lg p-3">
                    <Label className="text-sm font-medium text-foreground/90 mb-2 block">Add URL Item to Album</Label>
                    <div className="space-y-2">
                      <Input
                        type="url"
                        placeholder={mediaType === "video" 
                          ? "Video URL..." 
                          : "Image URL..."}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Caption (optional)"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                        />
                        <Button
                          type="button"
                          onClick={addToAlbum}
                          disabled={!url.trim()}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Add */}
                  <div className="bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-lg p-3">
                    <Label className="text-sm font-medium text-foreground/90 mb-2 block">Bulk Add URLs</Label>
                    <Textarea
                      placeholder="Paste multiple URLs (one per line)..."
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      rows={3}
                      className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleBulkAdd}
                      disabled={!bulkUrls.trim()}
                      className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      size="sm"
                    >
                      <List className="w-4 h-4 mr-2" />
                      Add All
                    </Button>
                  </div>

                  {/* Album Preview */}
                  {albumItems.length > 0 && (
                    <div className="bg-gray-300 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 rounded-lg p-3">
                      <Label className="text-sm font-medium text-foreground/90 mb-3 block">
                        📚 Album Preview ({albumItems.length} items)
                      </Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {albumItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-300 dark:bg-gray-900 rounded border border-gray-400 dark:border-gray-700">
                            {item.type === "video" ? (
                              <PlayCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            ) : (
                              <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            )}
                            <span className="text-xs text-foreground/70 truncate flex-1">
                              {item.caption || item.url}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromAlbum(index)}
                              className="h-6 w-6 p-0 hover:bg-red-500/20"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="space-x-3 flex-shrink-0 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl -mx-6 -mb-6 px-6 py-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={mode === "single" ? !url.trim() : albumItems.length === 0}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-sm shadow-blue-500/30"
          >
            <Upload className="w-4 h-4 mr-2" />
            {mode === "single" 
              ? `Add ${mediaType === "video" ? "Video" : "Image"}` 
              : `Add Album (${albumItems.length} items)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}