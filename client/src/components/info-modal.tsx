import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, ListChecks, QrCode, ExternalLink, CheckCircle, Save, X, FileText, Loader2, FolderOpen } from "lucide-react";
import { SiGooglemaps, SiWaze } from "react-icons/si";
import { MiniMap } from "@/components/mini-map";
import { SlidingDescription } from "@/components/sliding-description";
import { EditableDescriptionList } from "@/components/editable-description-list";
import { QrCodeUploadModal } from "@/components/qr-code-upload-modal";
import QrScanner from "qr-scanner";

interface InfoModalProps {
  info: string;
  rowId: string;
  code?: string;
  route?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  qrCode?: string;
  no?: number;
  markerColor?: string;
  images?: Array<{ url: string; caption?: string }>;
  onUpdateRow?: (updates: any) => void;
  onOpenImageModal?: () => void;
  editMode?: boolean;
  allRows?: any[];
  iconType?: 'info' | 'filetext';
}

export function InfoModal({ info, rowId, code, route, location, latitude, longitude, qrCode, no, markerColor, images = [], onUpdateRow, onOpenImageModal, editMode = false, allRows = [], iconType = 'info' }: InfoModalProps) {
  const [open, setOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [scannedResult, setScannedResult] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [showChecklistConfirm, setShowChecklistConfirm] = useState(false);
  const [showNavigationConfirm, setShowNavigationConfirm] = useState(false);
  const [navigationType, setNavigationType] = useState<'google' | 'waze'>('google');
  const [showUrlConfirm, setShowUrlConfirm] = useState(false);
  const [urlToOpen, setUrlToOpen] = useState<string>("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [scanningDots, setScanningDots] = useState("");
  const [showQrUploadModal, setShowQrUploadModal] = useState(false);
  
  // Swipe down gesture state
  const [touchStart, setTouchStart] = useState(0);
  const [touchDelta, setTouchDelta] = useState(0);
  
  // State for tracking edits
  const [originalData, setOriginalData] = useState({ info: "", qrCode: "", latitude: "", longitude: "", markerColor: "" });
  const [currentData, setCurrentData] = useState({ info: "", qrCode: "", latitude: "", longitude: "", markerColor: "" });
  
  // Initialize data when modal opens
  useEffect(() => {
    if (open) {
      const data = {
        info: info || "",
        qrCode: qrCode || "",
        latitude: latitude || "",
        longitude: longitude || "",
        markerColor: markerColor || "#3388ff"
      };
      setOriginalData(data);
      setCurrentData(data);
    }
  }, [open, info, qrCode, latitude, longitude, markerColor]);
  
  // Animate scanning dots
  useEffect(() => {
    if (!qrScanning) {
      setScanningDots("");
      return;
    }
    
    const interval = setInterval(() => {
      setScanningDots(prev => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 400);
    
    return () => clearInterval(interval);
  }, [qrScanning]);
  
  // Check if there are any changes
  const hasChanges = () => {
    return (
      currentData.info !== originalData.info ||
      currentData.qrCode !== originalData.qrCode ||
      currentData.latitude !== originalData.latitude ||
      currentData.longitude !== originalData.longitude ||
      currentData.markerColor !== originalData.markerColor
    );
  };

  // Format code to 4 digits with leading zeros
  const formatCode = (codeValue?: string) => {
    if (!codeValue) return '0000';
    const numericCode = parseInt(codeValue.replace(/\D/g, ''), 10) || 0;
    return numericCode.toString().padStart(4, '0');
  };

  const handleEditClick = () => {
    setShowChecklistConfirm(true);
  };

  const handleConfirmEditClick = () => {
    const formattedCode = formatCode(code);
    const editUrl = `https://fmvending.web.app/refill-service/M${formattedCode}`;
    window.open(editUrl, '_blank');
    setShowChecklistConfirm(false);
  };

  const handleDirectionClick = () => {
    setNavigationType('google');
    setShowNavigationConfirm(true);
  };

  const handleConfirmDirectionClick = () => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(directionsUrl, '_blank');
    }
    setShowNavigationConfirm(false);
  };

  const handleWazeClick = () => {
    setNavigationType('waze');
    setShowNavigationConfirm(true);
  };

  const handleConfirmWazeClick = () => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      window.open(wazeUrl, '_blank');
    }
    setShowNavigationConfirm(false);
  };

  const handleQrCodeClick = async () => {
    if (!qrCode) return;

    setQrScanning(true);
    
    // Show scanning animation for at least 800ms
    await new Promise(resolve => setTimeout(resolve, 800));

    setIsScanning(true);
    try {
      let imageSource: string | Blob = qrCode;

      // If it's a remote URL, use our proxy to avoid CORS issues
      if (qrCode.startsWith('http')) {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(qrCode)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.statusText}`);
        }
        imageSource = await response.blob();
      }

      // Try to decode QR code from the image
      const result = await QrScanner.scanImage(imageSource, { returnDetailedScanResult: true });
      setScannedResult(result.data);
      setQrScanning(false);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("QR scanning error:", error);
      setQrScanning(false);
      // Show error toast instead of incorrect navigation
      alert("Could not read QR code from the image. Please check if the image contains a valid QR code.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmNavigation = () => {
    if (scannedResult) {
      // Check if it's a valid URL, if not, treat it as a search query
      let targetUrl = scannedResult;
      
      // If it doesn't start with http/https, assume it's a search or add https
      if (!scannedResult.match(/^https?:\/\//)) {
        // If it looks like a URL without protocol, add https
        if (scannedResult.includes('.') && !scannedResult.includes(' ')) {
          targetUrl = `https://${scannedResult}`;
        } else {
          // Otherwise, search on Google
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(scannedResult)}`;
        }
      }
      
      window.open(targetUrl, '_blank');
    }
    setShowConfirmDialog(false);
    setScannedResult("");
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setScannedResult("");
  };

  const handleUrlClick = (url: string) => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    setUrlToOpen(targetUrl);
    setShowUrlConfirm(true);
  };

  const handleConfirmUrlOpen = () => {
    if (urlToOpen) {
      window.open(urlToOpen, '_blank');
    }
    setShowUrlConfirm(false);
    setUrlToOpen("");
  };
  
  const handleSaveClick = () => {
    if (hasChanges()) {
      setShowSaveConfirm(true);
    }
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);
    setIsSaving(true);
    
    try {
      if (hasChanges() && onUpdateRow) {
        const updates: any = {};
        
        if (currentData.info !== originalData.info) {
          updates.info = currentData.info;
        }
        if (currentData.qrCode !== originalData.qrCode) {
          updates.qrCode = currentData.qrCode || null;
        }
        if (currentData.latitude !== originalData.latitude) {
          updates.latitude = currentData.latitude ? parseFloat(currentData.latitude) : null;
        }
        if (currentData.longitude !== originalData.longitude) {
          updates.longitude = currentData.longitude ? parseFloat(currentData.longitude) : null;
        }
        if (currentData.markerColor !== originalData.markerColor) {
          updates.markerColor = currentData.markerColor;
        }
        
        await onUpdateRow(updates);
        
        // Update original data to reflect saved changes
        setOriginalData(currentData);
        
        // Show success message (keep modal open so user can see changes in the map)
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    // Revert to original data
    setCurrentData(originalData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-blue-400 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-400"
          data-testid={`button-info-${rowId}`}
        >
          {editMode ? (
            <Info className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-lg overflow-hidden flex flex-col bg-white/70 dark:bg-black/30 backdrop-blur-2xl border-2 border-gray-200/60 dark:border-white/10 shadow-[0_20px_60px_0_rgba(0,0,0,0.25)] rounded-xl transition-smooth data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-95 duration-300 ease-out"
        style={{
          maxHeight: 'min(90vh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 40px))',
          touchAction: 'pan-y',
        }}
      >
        {/* iOS Frosted Glass Layer */}
        <div 
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-white/60 via-white/40 to-white/50 dark:from-black/40 dark:via-black/20 dark:to-black/30 border-0 shadow-inner" 
          style={{
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
          }}
        />
        <DialogHeader 
          className="pb-6 border-b border-blue-900 dark:border-cyan-400/50 flex-shrink-0"
          style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
        >
          <DialogTitle className="font-semibold text-center text-slate-900 dark:text-slate-400" style={{fontSize: '10px'}}>
            {location || 'Location'}
          </DialogTitle>
          <div className="text-center text-muted-foreground pt-2" style={{fontSize: '10px'}}>
            {code || ''}
          </div>
        </DialogHeader>
        
        <div 
          className="py-6 space-y-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Mini Map Section - MOVED TO TOP */}
          {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
            <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 dark:bg-green-300 rounded-full animate-pulse"></div>
                <h4 className="font-semibold text-green-500 dark:text-green-300" style={{fontSize: '10px'}}>🗺️ Location Map</h4>
              </div>
              <MiniMap 
                locations={(() => {
                  const currentLocation = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    label: location || 'Location',
                    code: route || code,
                    isCurrent: true,
                    markerColor: currentData.markerColor || markerColor
                  };
                  
                  // For fullscreen: collect all locations from allRows with valid coordinates
                  const allLocations = allRows
                    .filter(row => 
                      row.latitude && 
                      row.longitude && 
                      !isNaN(parseFloat(String(row.latitude))) && 
                      !isNaN(parseFloat(String(row.longitude)))
                    )
                    .map(row => ({
                      latitude: parseFloat(String(row.latitude)),
                      longitude: parseFloat(String(row.longitude)),
                      label: row.location || 'Location',
                      code: row.route || row.code,
                      isCurrent: row.id === rowId,
                      markerColor: row.markerColor
                    }));
                  
                  // For mini view, show only current location
                  // For fullscreen, it will show all locations
                  return allLocations.length > 1 ? allLocations : [currentLocation];
                })()}
                height="160px"
                showFullscreenButton={true}
              />
              
              {/* Full Address Caption */}
              <div className="mt-3 pt-3 border-t border-blue-200/50 dark:border-white/10">
                <SlidingDescription
                  value={(() => {
                    const infoValue = currentData.info || "";
                    if (!infoValue) return "";
                    if (infoValue.includes("|||DESCRIPTION|||")) {
                      return infoValue.split("|||DESCRIPTION|||")[0] || "";
                    }
                    return infoValue;
                  })()}
                  onSave={(value) => {
                    const currentInfo = currentData.info || "";
                    let newInfo = value;
                    
                    // Preserve description if it exists
                    if (currentInfo.includes("|||DESCRIPTION|||")) {
                      const description = currentInfo.split("|||DESCRIPTION|||")[1] || "";
                      if (description.trim()) {
                        newInfo = `${value}|||DESCRIPTION|||${description}`;
                      }
                    }
                    
                    setCurrentData(prev => ({ ...prev, info: newInfo }));
                  }}
                  isEditable={editMode}
                />
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
              <h4 className="font-semibold text-purple-600 dark:text-purple-400" style={{fontSize: '10px'}}>📝 Description</h4>
            </div>
            <EditableDescriptionList
              value={(() => {
                const infoValue = currentData.info || "";
                if (!infoValue) return "";
                if (infoValue.includes("|||DESCRIPTION|||")) {
                  const withDescription = infoValue.split("|||DESCRIPTION|||")[1] || "";
                  if (withDescription.includes("|||URL|||")) {
                    return withDescription.split("|||URL|||")[0] || "";
                  }
                  return withDescription;
                }
                return "";
              })()}
              onSave={(value) => {
                const currentInfo = currentData.info || "";
                let address = "";
                let url = "";
                
                // Parse current info to extract address and URL
                if (currentInfo.includes("|||DESCRIPTION|||")) {
                  address = currentInfo.split("|||DESCRIPTION|||")[0] || "";
                  const descriptionPart = currentInfo.split("|||DESCRIPTION|||")[1] || "";
                  if (descriptionPart.includes("|||URL|||")) {
                    url = descriptionPart.split("|||URL|||")[1] || "";
                  }
                } else {
                  // If no description separator, check for URL separator
                  if (currentInfo.includes("|||URL|||")) {
                    address = currentInfo.split("|||URL|||")[0] || "";
                    url = currentInfo.split("|||URL|||")[1] || "";
                  } else {
                    address = currentInfo;
                  }
                }
                
                // Rebuild info with updated description
                let newInfo = address.trim();
                
                // Add description if it has content
                if (value.trim()) {
                  newInfo += `|||DESCRIPTION|||${value.trim()}`;
                }
                
                // Add URL if it exists
                if (url.trim()) {
                  // If we have description, append URL to it
                  if (value.trim()) {
                    newInfo += `|||URL|||${url.trim()}`;
                  } else {
                    // If no description but have URL, add it directly
                    newInfo += `|||DESCRIPTION||||||URL|||${url.trim()}`;
                  }
                }
                
                setCurrentData(prev => ({ ...prev, info: newInfo }));
              }}
              isEditable={editMode}
            />
          </div>

          {/* URL Section - Only show in edit mode */}
          {editMode && (
            <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full"></div>
                <h4 className="font-semibold text-cyan-600 dark:text-cyan-400" style={{fontSize: '10px'}}>🌐 Website URL</h4>
              </div>
              <SlidingDescription
                value={(() => {
                  const infoValue = currentData.info || "";
                  if (!infoValue) return "";
                  if (infoValue.includes("|||URL|||")) {
                    return infoValue.split("|||URL|||").pop() || "";
                  }
                  return "";
                })()}
                onSave={(value) => {
                  const currentInfo = currentData.info || "";
                  let address = "";
                  let description = "";
                  
                  // Parse current info
                  if (currentInfo.includes("|||DESCRIPTION|||")) {
                    address = currentInfo.split("|||DESCRIPTION|||")[0] || "";
                    const descriptionPart = currentInfo.split("|||DESCRIPTION|||")[1] || "";
                    if (descriptionPart.includes("|||URL|||")) {
                      description = descriptionPart.split("|||URL|||")[0] || "";
                    } else {
                      description = descriptionPart;
                    }
                  } else {
                    address = currentInfo;
                  }
                  
                  // Combine with new URL
                  let newInfo = address;
                  if (description.trim() || value.trim()) {
                    newInfo += `|||DESCRIPTION|||${description}`;
                    if (value.trim()) {
                      newInfo += `|||URL|||${value}`;
                    }
                  }
                  
                  setCurrentData(prev => ({ ...prev, info: newInfo }));
                }}
                isEditable={editMode}
              />
            </div>
          )}

          {/* QR Code URL Section - Only show in edit mode */}
          {editMode && (
            <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                <h4 className="font-semibold text-purple-600 dark:text-purple-400" style={{fontSize: '10px'}}><QrCode className="w-4 h-4 inline mr-1" />QR Code</h4>
              </div>
              <div className="space-y-3">
                {/* Current QR Code Display */}
                {currentData.qrCode && (
                  <div className="border rounded-lg p-3 bg-purple-50/30 dark:bg-purple-950/20">
                    <Label style={{fontSize: '9px'}} className="mb-2 block text-purple-600 dark:text-purple-400">Current QR Code:</Label>
                    <div className="flex items-center gap-2">
                      <img
                        src={currentData.qrCode}
                        alt="Current QR Code"
                        className="w-20 h-20 object-contain rounded border border-purple-200 dark:border-purple-800"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <p className="text-muted-foreground break-all flex-1" style={{fontSize: '9px'}}>
                        {currentData.qrCode}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Upload/Change Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQrUploadModal(true)}
                  className="w-full bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400"
                  style={{fontSize: '10px'}}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {currentData.qrCode ? 'Change QR Code' : 'Add QR Code'}
                </Button>
                <p className="text-muted-foreground text-center" style={{fontSize: '9px'}}>
                  Upload QR code image or insert URL
                </p>
              </div>
            </div>
          )}

          {/* Location Coordinates Section - Only show in edit mode */}
          {editMode && (
            <div className="bg-transparent backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                <h4 className="font-semibold text-green-600 dark:text-green-400" style={{fontSize: '10px'}}>📍 Coordinates</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude" style={{fontSize: '10px'}}>Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={currentData.latitude}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g., 3.1390"
                    style={{fontSize: '10px'}}
                    data-testid="input-latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" style={{fontSize: '10px'}}>Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={currentData.longitude}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g., 101.6869"
                    style={{fontSize: '10px'}}
                    data-testid="input-longitude"
                  />
                </div>
              </div>
              <p className="text-muted-foreground" style={{fontSize: '10px'}}>GPS coordinates for map location</p>
              
              {/* Marker Color Picker */}
              <div className="space-y-2 pt-3">
                <Label htmlFor="markerColor" style={{fontSize: '10px'}}>🎨 Marker Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="markerColor"
                    type="color"
                    value={currentData.markerColor}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, markerColor: e.target.value }))}
                    className="w-20 h-10 cursor-pointer"
                    data-testid="input-marker-color"
                  />
                  <Input
                    type="text"
                    value={currentData.markerColor}
                    onChange={(e) => setCurrentData(prev => ({ ...prev, markerColor: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                    style={{fontSize: '10px'}}
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <p className="text-muted-foreground" style={{fontSize: '10px'}}>Custom color for map marker pin</p>
              </div>
              
              {/* Save/Cancel Buttons - Right below coordinates */}
              <div className="flex justify-end gap-2 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentData(originalData);
                    setOpen(false);
                  }}
                  className="bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-red-600 hover:text-red-700"
                  style={{fontSize: '10px'}}
                  data-testid="button-cancel-info"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveClick}
                  disabled={isSaving || !hasChanges()}
                  className={hasChanges() ? 'bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-green-600 hover:text-green-700' : 'bg-transparent border-transparent text-gray-400 cursor-not-allowed'}
                  style={{fontSize: '10px'}}
                  data-testid="button-save-info"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>
        <DialogFooter 
          className="pt-5 mt-0 border-t border-gray-200/60 dark:border-gray-800/60 bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl rounded-b-3xl -mx-6 -mb-6 px-6 relative overflow-hidden transition-all duration-300"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          {/* Main Grid Button - Apple Style */}
          <div className={`flex justify-center items-center w-full transition-all duration-500 ease-out my-2 ${showActionsMenu ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100'}`}>
            <Button
              variant="ghost"
              className="h-11 w-11 p-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-400/10 dark:to-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:from-blue-500/20 hover:to-blue-600/20 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all duration-300 rounded-2xl backdrop-blur-sm"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              data-testid="button-actions-menu"
            >
              <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </Button>
          </div>
          
          {/* Sliding Actions Menu - Apple Style */}
          <div 
            className={`absolute left-0 right-0 bottom-0 bg-transparent backdrop-blur-none transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              showActionsMenu 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-full opacity-0 pointer-events-none'
            }`}
            style={{ 
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
              transform: showActionsMenu ? `translateY(${Math.max(touchDelta, 0)}px)` : undefined,
            }}
            onTouchStart={(e) => {
              setTouchStart(e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              const delta = e.touches[0].clientY - touchStart;
              setTouchDelta(delta);
            }}
            onTouchEnd={() => {
              if (touchDelta > 50) {
                setShowActionsMenu(false);
              }
              setTouchDelta(0);
              setTouchStart(0);
            }}
          >
            {/* Actions Grid - Apple Style with Horizontal Scroll */}
            <div className="overflow-x-auto overflow-y-hidden px-6 pt-6 pb-3">
              <div className="flex gap-3 min-w-max justify-center">
              {location !== "QL Kitchen" && (
                <div className="flex items-center justify-center animate-in slide-in-from-right-10 duration-300" style={{animationDelay: '50ms'}}>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 bg-transparent hover:bg-green-500/10 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl border border-green-500/30"
                    onClick={() => {
                      handleEditClick();
                    }}
                    data-testid={`button-edit-${rowId}`}
                  >
                    <ListChecks className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </Button>
                </div>
              )}
              
              {qrCode && (
                <div className="flex items-center justify-center animate-in slide-in-from-right-10 duration-300" style={{animationDelay: '100ms'}}>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 p-0 bg-transparent hover:bg-purple-500/10 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed border border-purple-500/30 relative overflow-hidden"
                    onClick={() => {
                      handleQrCodeClick();
                    }}
                    disabled={isScanning || qrScanning}
                    data-testid={`button-qrcode-${rowId}`}
                  >
                    {qrScanning ? (
                      <>
                        <div className="relative flex flex-col items-center justify-center w-full gap-0.5">
                          <Loader2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-spin" />
                          <span className="text-[7px] font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                            Scan
                          </span>
                        </div>
                      </>
                    ) : (
                      <QrCode className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </Button>
                </div>
              )}
              
              {(() => {
                const url = (() => {
                  if (!info) return "";
                  if (info.includes("|||URL|||")) {
                    return info.split("|||URL|||").pop() || "";
                  }
                  return "";
                })();
                
                return url.trim() ? (
                  <div className="flex items-center justify-center animate-in slide-in-from-right-10 duration-300" style={{animationDelay: '150ms'}}>
                    <Button
                      variant="ghost"
                      className="h-10 w-10 p-0 bg-transparent hover:bg-cyan-500/10 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl border border-cyan-500/30"
                      onClick={() => {
                        handleUrlClick(url);
                      }}
                      data-testid={`button-open-url-${rowId}`}
                    >
                      <ExternalLink className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </Button>
                  </div>
                ) : null;
              })()}
              
              {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
                <>
                  <div className="flex items-center justify-center animate-in slide-in-from-right-10 duration-300" style={{animationDelay: '200ms'}}>
                    <Button
                      variant="ghost"
                      className="h-10 w-10 p-0 bg-transparent hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl border border-red-500/30"
                      onClick={() => {
                        handleDirectionClick();
                      }}
                      data-testid={`button-direction-${rowId}`}
                    >
                      <SiGooglemaps className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center animate-in slide-in-from-right-10 duration-300" style={{animationDelay: '250ms'}}>
                    <Button
                      variant="ghost"
                      className="h-10 w-10 p-0 bg-transparent hover:bg-sky-500/10 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl border border-sky-500/30"
                      onClick={() => {
                        handleWazeClick();
                      }}
                      data-testid={`button-waze-${rowId}`}
                    >
                      <SiWaze className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </Button>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      
      {/* QR Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={handleCancelNavigation}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200 bg-gradient-to-br from-background/95 via-background/98 to-background dark:from-black/95 dark:via-black/98 dark:to-black border-2 border-blue-500/20 dark:border-blue-400/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-5 h-5" />
              QR Code Detected
            </DialogTitle>
            <DialogDescription>
              A QR code was scanned and contains a link.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Detected content:</p>
                  <div className="bg-background/50 dark:bg-black/50 p-2 rounded text-sm font-mono break-all">
                    {scannedResult}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Do you want to navigate to this link? It will open in a new tab.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelNavigation}
              data-testid="button-cancel-qr-navigation"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmNavigation}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-qr-navigation"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Web Portal Confirmation Dialog */}
      <Dialog open={showChecklistConfirm} onOpenChange={setShowChecklistConfirm}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200 bg-gradient-to-br from-background/95 via-background/98 to-background dark:from-black/95 dark:via-black/98 dark:to-black border-2 border-blue-500/20 dark:border-blue-400/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ListChecks className="w-5 h-5" />
              Open Web Portal
            </DialogTitle>
            <DialogDescription>
              Access the refill service web portal for this location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">External Link:</p>
                  <div className="bg-background/50 dark:bg-black/50 p-2 rounded text-sm font-mono break-all">
                    https://fmvending.web.app/refill-service/M{formatCode(code)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Do you want to open the refill service web portal? It will open in a new tab.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowChecklistConfirm(false)}
              data-testid="button-cancel-checklist"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEditClick}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-checklist"
            >
              <ListChecks className="w-4 h-4 mr-2" />
              Open Web Portal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation Confirmation Dialog */}
      <Dialog open={showNavigationConfirm} onOpenChange={setShowNavigationConfirm}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200 bg-gradient-to-br from-background/95 via-background/98 to-background dark:from-black/95 dark:via-black/98 dark:to-black border-2 border-blue-500/20 dark:border-blue-400/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              {navigationType === 'google' ? (
                <SiGooglemaps className="w-5 h-5" />
              ) : (
                <SiWaze className="w-5 h-5" />
              )}
              Open Navigation
            </DialogTitle>
            <DialogDescription>
              Navigate to this location using {navigationType === 'google' ? 'Google Maps' : 'Waze'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Navigation to:</p>
                  <div className="bg-background/50 dark:bg-black/50 p-2 rounded text-sm">
                    {location || 'Location'} ({latitude}, {longitude})
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Using {navigationType === 'google' ? 'Google Maps' : 'Waze'}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Do you want to open navigation to this location? It will open in a new tab.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNavigationConfirm(false)}
              data-testid="button-cancel-navigation"
            >
              Cancel
            </Button>
            <Button 
              onClick={navigationType === 'google' ? handleConfirmDirectionClick : handleConfirmWazeClick}
              className={navigationType === 'google' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
              data-testid="button-confirm-navigation"
            >
              {navigationType === 'google' ? (
                <SiGooglemaps className="w-4 h-4 mr-2" />
              ) : (
                <SiWaze className="w-4 h-4 mr-2" />
              )}
              Open {navigationType === 'google' ? 'Google Maps' : 'Waze'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* URL Confirmation Dialog */}
      <Dialog open={showUrlConfirm} onOpenChange={setShowUrlConfirm}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200 bg-gradient-to-br from-background/95 via-background/98 to-background dark:from-black/95 dark:via-black/98 dark:to-black border-2 border-blue-500/20 dark:border-blue-400/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ExternalLink className="w-5 h-5" />
              Open External Link
            </DialogTitle>
            <DialogDescription>
              This will open a website in a new tab.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Website URL:</p>
                  <div className="bg-background/50 dark:bg-black/50 p-2 rounded text-sm font-mono break-all">
                    {urlToOpen}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Do you want to open this external link? It will open in a new tab and may use your data.
            </p>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUrlConfirm(false)}
              data-testid="button-cancel-url"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUrlOpen}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-confirm-url"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-200 bg-gradient-to-br from-background/95 via-background/98 to-background dark:from-black/95 dark:via-black/98 dark:to-black border-2 border-green-500/20 dark:border-green-400/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Save className="w-5 h-5" />
              Save Changes
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes to the location information?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50/50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">Changes to be saved:</p>
                  <ul className="text-sm space-y-1">
                    {currentData.info !== originalData.info && (
                      <li className="text-green-700 dark:text-green-300">• Location details updated</li>
                    )}
                    {currentData.qrCode !== originalData.qrCode && (
                      <li className="text-green-700 dark:text-green-300">• QR code URL updated</li>
                    )}
                    {currentData.latitude !== originalData.latitude && (
                      <li className="text-green-700 dark:text-green-300">• Latitude updated</li>
                    )}
                    {currentData.longitude !== originalData.longitude && (
                      <li className="text-green-700 dark:text-green-300">• Longitude updated</li>
                    )}
                    {currentData.markerColor !== originalData.markerColor && (
                      <li className="text-green-700 dark:text-green-300">• Marker color updated</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSaveConfirm(false)}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSave}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-save"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 duration-300">
          <Alert className="bg-green-600 text-white border-green-700 shadow-lg">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Success!</strong> Information saved successfully.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* QR Code Upload Modal */}
      <QrCodeUploadModal
        open={showQrUploadModal}
        onOpenChange={setShowQrUploadModal}
        onSave={(qrCodeUrl) => {
          setCurrentData(prev => ({ ...prev, qrCode: qrCodeUrl }));
          setShowQrUploadModal(false);
        }}
        existingQrCode={currentData.qrCode}
      />
    </Dialog>
  );
}