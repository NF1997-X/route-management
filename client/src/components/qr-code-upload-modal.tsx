import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, X, QrCode } from "lucide-react";

// ImgBB API Configuration
const IMGBB_API_KEY = '4042c537845e8b19b443add46f4a859c';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

interface QrCodeUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (qrCodeUrl: string) => void;
  existingQrCode?: string;
}

export function QrCodeUploadModal({ open, onOpenChange, onSave, existingQrCode }: QrCodeUploadModalProps) {
  const [activeTab, setActiveTab] = useState<string>("url");
  const [isUploading, setIsUploading] = useState(false);
  
  // URL tab state
  const [imageUrl, setImageUrl] = useState(existingQrCode || "");
  
  // Upload tab state
  const [uploadedImageData, setUploadedImageData] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(existingQrCode || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setImageUrl("");
    setUploadedImageData(null);
    setUploadPreview(null);
    setIsUploading(false);
    setActiveTab("url");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // ImgBB Upload Function
  const uploadToImgBB = async (base64Image: string): Promise<string> => {
    try {
      const base64Data = base64Image.split(',')[1] || base64Image;
      
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Data);
      
      const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImageData(result);
        setUploadPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImageData(result);
        setUploadPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);

      if (activeTab === "url") {
        // URL tab
        if (!imageUrl) {
          alert('Please enter a QR code image URL');
          setIsUploading(false);
          return;
        }

        onSave(imageUrl);
      } else {
        // Upload tab
        if (!uploadedImageData) {
          alert('Please upload a QR code image');
          setIsUploading(false);
          return;
        }

        // Upload to ImgBB
        const uploadedUrl = await uploadToImgBB(uploadedImageData);

        onSave(uploadedUrl);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert('Failed to save QR code. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/70 dark:bg-black/30 backdrop-blur-2xl border-2 border-gray-200/60 dark:border-white/10 shadow-[0_20px_60px_0_rgba(0,0,0,0.25)] rounded-xl">
        {/* iOS Frosted Glass Layer */}
        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-white/60 via-white/40 to-white/50 dark:from-black/40 dark:via-black/20 dark:to-black/30 backdrop-blur-3xl border-0 shadow-inner" />
        
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <QrCode className="w-5 h-5" />
            Add QR Code
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Insert URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Photo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl" style={{fontSize: '10px'}}>QR Code Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/qr-code.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{fontSize: '10px'}}
              />
              <p className="text-muted-foreground" style={{fontSize: '9px'}}>Paste the direct URL to your QR code image</p>
            </div>

            {imageUrl && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <Label style={{fontSize: '10px'}} className="mb-2 block">Preview:</Label>
                <img
                  src={imageUrl}
                  alt="QR Code Preview"
                  className="max-w-full max-h-[200px] mx-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label style={{fontSize: '10px'}}>Upload QR Code Image</Label>
              <div
                className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors bg-purple-50/30 dark:bg-purple-950/20"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {uploadPreview ? (
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="QR Code Preview"
                      className="max-w-full max-h-[200px] mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadPreview(null);
                        setUploadedImageData(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-purple-600 dark:text-purple-400">
                    <QrCode className="w-12 h-12" />
                    <p style={{fontSize: '10px'}} className="font-medium">Click to upload or drag and drop</p>
                    <p style={{fontSize: '9px'}} className="text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isUploading}
            className="bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-red-600 hover:text-red-700"
            style={{fontSize: '10px'}}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUploading}
            className="bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-green-600 hover:text-green-700"
            style={{fontSize: '10px'}}
          >
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-1" />
                Save QR Code
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
