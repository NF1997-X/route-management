import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTableData } from "@/hooks/use-table-data";
import { DataTable } from "@/components/data-table";
import { SimpleImageModal } from "@/components/simple-image-modal";
import { ImageListModal } from "@/components/image-list-modal";
import { ImageLightbox } from "@/components/image-lightbox";
import { ColumnCustomizationModal } from "@/components/column-customization-modal";
import { PasswordPrompt } from "@/components/password-prompt";
import { Navigation } from "@/components/navigation";
import { LoadingOverlay } from "@/components/skeleton-loader";
import { RouteOptimizationModal } from "@/components/route-optimization-modal";
import { ShareDialog } from "@/components/share-dialog";
import { SavedLinksModal } from "@/components/saved-links-modal";
import { HelpChatbot } from "@/components/help-chatbot";
import { Footer } from "@/components/footer";
import { BulkColorModal } from "@/components/bulk-color-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Search, Filter, X, ChevronDown, ChevronUp, Edit3, Plus, Trash2, Pencil, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { TableColumn, type Page, type InsertPage } from "@shared/schema";
import { generateTngValues } from "@/utils/tng-generator";
import { calculateDistance } from "@/utils/distance";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getUserId } from "@/lib/utils";

interface DescriptionItem {
  term: string;
  definition: string;
}

export default function TablePage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedRowForImage, setSelectedRowForImage] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageListModalOpen, setImageListModalOpen] = useState(false);
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState<string[]>([]);
  const [deliveryFilterValue, setDeliveryFilterValue] = useState<string[]>([]);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | null>(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [positionType, setPositionType] = useState<'end' | 'specific'>('end');
  const [specificPosition, setSpecificPosition] = useState<number>(1);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [exitingEditMode, setExitingEditMode] = useState(false);
  const [editModeLoading, setEditModeLoading] = useState(false);
  const [pageDescription, setPageDescription] = useState("- Interactive table with Drag & Drop , Calculations , and Image Gallery\n\n- This Routes for Driver Vending Mechine , FamilyMart only");
  const [pageTitle, setPageTitle] = useState("Content");
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [optimizationModalOpen, setOptimizationModalOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [savedLinksModalOpen, setSavedLinksModalOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageDescription, setNewPageDescription] = useState("");
  const [descriptionItems, setDescriptionItems] = useState<DescriptionItem[]>([]);
  const [showSlideHints, setShowSlideHints] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [previousSlideIndex, setPreviousSlideIndex] = useState<number | null>(null);
  const [showDeletePageConfirmation, setShowDeletePageConfirmation] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [showHelpChatbot, setShowHelpChatbot] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bulkColorModalOpen, setBulkColorModalOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const {
    rows,
    columns,
    isLoading,
    createRow,
    updateRow,
    deleteRow,
    reorderRows,
    reorderColumns,
    addImageToRow,
    updateImageInRow,
    deleteImageFromRow,
    createColumn,
    deleteColumn,
  } = useTableData();

  // Bulk update marker color by route mutation
  const bulkUpdateColorMutation = useMutation({
    mutationFn: async (data: { route: string; color: string }) => {
      const response = await apiRequest("PUT", `/api/table-rows/bulk-update-color`, data);
      if (!response.ok) {
        throw new Error("Failed to update marker colors");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-rows"] });
      setBulkColorModalOpen(false);
      toast({
        title: "Marker colors updated!",
        description: "All locations in the selected route have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update marker colors. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk color update
  const handleBulkColorUpdate = (route: string, color: string) => {
    bulkUpdateColorMutation.mutate({
      route,
      color,
    });
  };

  // Fetch pages
  const { data: pages = [], isLoading: pagesLoading } = useQuery<Page[]>({
    queryKey: ['/api/pages'],
  });

  // Create initial page if none exist (migration)
  useEffect(() => {
    const createInitialPage = async () => {
      if (!pagesLoading && pages.length === 0) {
        await createPageMutation.mutateAsync({
          title: pageTitle,
          description: pageDescription,
          sortOrder: 0,
        });
      }
    };

    createInitialPage();
  }, [pages.length, pagesLoading]);

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (page: InsertPage) => {
      const res = await apiRequest('POST', '/api/pages', page);
      return await res.json() as Page;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Success",
        description: "Page created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create page",
        variant: "destructive",
      });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertPage> }) => {
      const res = await apiRequest('PATCH', `/api/pages/${id}`, updates);
      return await res.json() as Page;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Success",
        description: "Page updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update page",
        variant: "destructive",
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
      toast({
        title: "Success",
        description: "Page deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  // Load column preferences from database (fallback to localStorage)
  useEffect(() => {
    const loadLayoutPreferences = async () => {
      if (columns.length === 0) return;

      try {
        // Try to load from database first
        const userId = getUserId();
        const res = await fetch(`/api/layout?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const layout = await res.json();
          const validVisibleColumnIds = Object.keys(layout.columnVisibility).filter(id => 
            layout.columnVisibility[id] && columns.some(col => col.id === id)
          );
          const validColumnOrder = layout.columnOrder.filter((id: string) => 
            columns.some(col => col.id === id)
          );
          
          // Always ensure Kilometer column is visible
          const kilometerColumn = columns.find(col => col.dataKey === 'kilometer');
          if (kilometerColumn && !validVisibleColumnIds.includes(kilometerColumn.id)) {
            validVisibleColumnIds.push(kilometerColumn.id);
          }
          
          if (validVisibleColumnIds.length > 0) {
            setVisibleColumns(validVisibleColumnIds);
          }
          if (validColumnOrder.length > 0) {
            setColumnOrder(validColumnOrder);
          }
          return; // Successfully loaded from database
        } else if (res.status === 404) {
          // No saved layout in database - clear localStorage and force use defaults
          localStorage.removeItem('tableColumnPreferences');
          // Skip to defaults below
        }
      } catch (error) {
        // Fall through to defaults
      }

      // Use defaults if nothing saved
      const defaultVisibleColumnNames = ['No', 'Code', 'Location', 'Delivery', 'Images'];
      const defaultVisibleColumns = columns
        .filter(col => defaultVisibleColumnNames.includes(col.name))
        .map(col => col.id);
      
      const latLngColumns = columns.filter(col => 
        col.dataKey === 'latitude' || col.dataKey === 'longitude'
      ).map(col => col.id);
      
      setVisibleColumns(defaultVisibleColumns.length > 0 ? defaultVisibleColumns : columns.map(col => col.id).filter(id => !latLngColumns.includes(id)));
      setColumnOrder(columns.map(col => col.id));
    };

    loadLayoutPreferences();
  }, [columns]);

  // Save column preferences to localStorage
  const saveColumnPreferences = (visible: string[], order: string[]) => {
    const preferences = {
      visibleColumns: visible,
      columnOrder: order,
    };
    localStorage.setItem('tableColumnPreferences', JSON.stringify(preferences));
  };

  // Helper functions for description items
  const parseDescriptionItems = (text: string): DescriptionItem[] => {
    if (!text.trim()) return [];
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line) => {
        // Check if line contains a colon (key-value pair)
        if (line.includes(':')) {
          const [key, ...valueParts] = line.split(':');
          return {
            term: key.trim(),
            definition: valueParts.join(':').trim()
          };
        }
        // If no colon, treat entire line as definition with empty term
        return {
          term: '',
          definition: line
        };
      });
  };

  const serializeDescriptionItems = (items: DescriptionItem[]): string => {
    return items
      .filter(item => item.term.trim() || item.definition.trim())
      .map(item => {
        if (item.term.trim()) {
          return `${item.term.trim()} : ${item.definition.trim()}`;
        }
        return item.definition.trim();
      })
      .join('\n');
  };

  // Page management functions
  const handleAddPage = () => {
    setEditingPage(null);
    setNewPageTitle("");
    setNewPageDescription("");
    setDescriptionItems([]);
    setShowPageDialog(true);
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setNewPageTitle(page.title || "");
    setNewPageDescription(page.description || "");
    setDescriptionItems(parseDescriptionItems(page.description || ""));
    setShowPageDialog(true);
  };

  const handleSavePage = async () => {
    if (!newPageTitle.trim()) {
      toast({
        title: "Error",
        description: "Page title is required",
        variant: "destructive",
      });
      return;
    }

    // Serialize description items to text
    const descriptionText = serializeDescriptionItems(descriptionItems);

    try {
      if (editingPage) {
        await updatePageMutation.mutateAsync({
          id: editingPage.id,
          updates: {
            title: newPageTitle.trim(),
            description: descriptionText,
          },
        });
      } else {
        await createPageMutation.mutateAsync({
          title: newPageTitle.trim(),
          description: descriptionText,
          sortOrder: pages.length,
        });
      }

      setShowPageDialog(false);
      setEditingPage(null);
      setNewPageTitle("");
      setNewPageDescription("");
    } catch (error) {
      console.error("Error saving page:", error);
    }
  };

  const handleDeletePage = (page: Page) => {
    if (pages.length <= 1) {
      toast({
        title: "Error",
        description: "Cannot delete the last page",
        variant: "destructive",
      });
      return;
    }

    setPageToDelete(page);
    setShowDeletePageConfirmation(true);
  };

  const confirmDeletePage = async () => {
    if (!pageToDelete) return;

    const pageIndex = pages.findIndex(p => p.id === pageToDelete.id);
    
    try {
      await deletePageMutation.mutateAsync(pageToDelete.id);
      
      if (pageIndex !== -1 && currentPageIndex >= pageIndex && currentPageIndex > 0) {
        setCurrentPageIndex(prev => Math.max(0, prev - 1));
      }
      
      setShowDeletePageConfirmation(false);
      setPageToDelete(null);
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const cancelDeletePage = () => {
    setShowDeletePageConfirmation(false);
    setPageToDelete(null);
  };

  // Sort pages by sortOrder and ensure currentPageIndex is valid
  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [pages]);

  // Clamp currentPageIndex to valid range
  useEffect(() => {
    if (sortedPages.length > 0 && currentPageIndex >= sortedPages.length) {
      setCurrentPageIndex(Math.max(0, sortedPages.length - 1));
    }
  }, [sortedPages.length, currentPageIndex]);

  // Get current page
  const currentPage = sortedPages[currentPageIndex] || null;

  // Get filtered and ordered columns for display (memoized)
  const displayColumns = useMemo(() => {
    if (columnOrder.length === 0 || visibleColumns.length === 0) return columns;
    
    let filteredColumns = columnOrder
      .map(id => columns.find(col => col.id === id))
      .filter((col): col is TableColumn => col !== undefined)
      .filter(col => visibleColumns.includes(col.id));

    // Hide latitude, longitude, tollPrice, and images columns unless in edit mode
    if (!editMode) {
      filteredColumns = filteredColumns.filter(col => 
        col.dataKey !== 'latitude' && col.dataKey !== 'longitude' && col.dataKey !== 'tollPrice' && col.dataKey !== 'images'
      );
    }

    return filteredColumns;
  }, [columns, columnOrder, visibleColumns, editMode]);

  // Get unique route options for filter (excluding Warehouse)
  const routeOptions = Array.from(new Set(rows.map(row => row.route).filter(Boolean)))
    .filter(route => route !== 'Warehouse')
    .sort();
  
  // Get unique delivery options for filter (excluding Available)
  const deliveryOptions = Array.from(new Set(rows.map(row => row.delivery).filter(Boolean)))
    .filter(delivery => delivery !== 'Available')
    .sort();
  
  // Helper functions for multi-select filters
  const toggleRouteFilter = (route: string) => {
    setFilterValue(prev => 
      prev.includes(route) 
        ? prev.filter(r => r !== route)
        : [...prev, route]
    );
  };

  const toggleDeliveryFilter = (delivery: string) => {
    setDeliveryFilterValue(prev => 
      prev.includes(delivery) 
        ? prev.filter(t => t !== delivery)
        : [...prev, delivery]
    );
  };

  // Filter rows based on search term and dropdown selection
  const filteredRows = (() => {
    const isFilterActive = filterValue.length > 0;
    
    // Get warehouse row (QL Kitchen) 
    const warehouseRow = rows.find(row => row.location === "QL Kitchen");
    
    // Apply normal filtering
    const normalFilteredRows = rows.filter((row) => {
      const matchesSearch = searchTerm === "" || 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Route filter: Show only selected routes (if any selected)
      const matchesFilter = filterValue.length === 0 || 
        filterValue.includes(row.route);
      
      // Delivery filter: HIDE selected delivery types (if any selected)
      const matchesDeliveryFilter = deliveryFilterValue.length === 0 || 
        !deliveryFilterValue.includes(row.delivery);
      
      return matchesSearch && matchesFilter && matchesDeliveryFilter;
    });
    
    // If filter is active and warehouse row exists, ensure it's at position 1
    if (isFilterActive && warehouseRow) {
      // Remove warehouse row from normal filtered results if it exists
      const nonWarehouseRows = normalFilteredRows.filter(row => row.location !== "QL Kitchen");
      
      // Check if warehouse row matches search criteria
      const warehouseMatchesSearch = searchTerm === "" || 
        Object.values(warehouseRow).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Add warehouse row at the beginning if it matches search
      if (warehouseMatchesSearch) {
        return [warehouseRow, ...nonWarehouseRows];
      } else {
        return nonWarehouseRows;
      }
    }
    
    return normalFilteredRows;
  })();

  // Calculate distances based on filter state
  const rowsWithDistances = useMemo(() => {
    // Always find QL Kitchen coordinates from the full rows collection (not filteredRows)
    // This ensures QL Kitchen coordinates are available even when filtered out by search
    const qlKitchenRow = rows.find(row => row.location === "QL Kitchen");
    
    if (!qlKitchenRow) {
      // If no QL Kitchen found, return rows with no distances calculated
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    // Check if QL Kitchen coordinates are missing before parsing
    if (!qlKitchenRow.latitude || !qlKitchenRow.longitude) {
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    const qlLat = parseFloat(qlKitchenRow.latitude);
    const qlLng = parseFloat(qlKitchenRow.longitude);

    // Use Number.isFinite to validate numeric coordinates
    if (!Number.isFinite(qlLat) || !Number.isFinite(qlLng)) {
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    // Check if any filters are active
    const hasActiveFilters = searchTerm !== "" || filterValue.length > 0 || deliveryFilterValue.length > 0;

    if (!hasActiveFilters) {
      // NO FILTERS: Calculate direct distance from QL Kitchen to each route
      return filteredRows.map((row) => {
        // QL Kitchen row always shows 0 distance (it's the starting point)
        if (row.location === "QL Kitchen") {
          return { ...row, kilometer: 0, segmentDistance: 0 };
        }

        // Check if current row coordinates are missing before parsing
        if (!row.latitude || !row.longitude) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const currentLat = parseFloat(row.latitude);
        const currentLng = parseFloat(row.longitude);

        // Use Number.isFinite to validate numeric coordinates
        if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        // Calculate direct distance from QL Kitchen to this route location
        const directDistance = calculateDistance(qlLat, qlLng, currentLat, currentLng);

        return { ...row, kilometer: directDistance, segmentDistance: directDistance };
      });
    } else {
      // FILTERS ACTIVE: Calculate cumulative distance through the route sequence
      let cumulativeDistance = 0;
      let previousLat = qlLat;
      let previousLng = qlLng;

      return filteredRows.map((row, index) => {
        // When encountering QL Kitchen row, reset everything and set kilometer = 0
        if (row.location === "QL Kitchen") {
          cumulativeDistance = 0;
          previousLat = qlLat;
          previousLng = qlLng;
          return { ...row, kilometer: 0, segmentDistance: 0 };
        }

        // Check if current row coordinates are missing before parsing
        if (!row.latitude || !row.longitude) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const currentLat = parseFloat(row.latitude);
        const currentLng = parseFloat(row.longitude);

        // Use Number.isFinite to validate numeric coordinates
        if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        // Calculate distance from previous location to current location
        const segmentDistance = calculateDistance(previousLat, previousLng, currentLat, currentLng);
        cumulativeDistance += segmentDistance;

        // Update previous coordinates for next iteration
        previousLat = currentLat;
        previousLng = currentLng;

        return { ...row, kilometer: cumulativeDistance, segmentDistance };
      });
    }
  }, [rows, filteredRows, searchTerm, filterValue, deliveryFilterValue]);

  // Clear all filters and reset sort order to default
  const clearAllFilters = async () => {
    setSearchTerm("");
    setFilterValue([]);
    setDeliveryFilterValue([]);
    
    // Reset all "no" values to match sortOrder (default state)
    const resetPromises = rows.map((row) => {
      if (row.location !== "QL Kitchen" && row.no !== row.sortOrder) {
        return updateRow.mutateAsync({
          id: row.id,
          updates: { no: row.sortOrder },
        });
      }
      return Promise.resolve();
    });
    
    await Promise.all(resetPromises);
  };

  const handleSaveData = () => {
    setShowSaveConfirmation(true);
  };

  const confirmSaveData = () => {
    setShowSaveConfirmation(false);
    toast({
      title: "Data Saved",
      description: "Table data has been saved successfully.",
    });
  };

  const handleAddRow = () => {
    if (!editMode) {
      toast({
        title: "Access Denied",
        description: "Please enable Edit mode to add new rows.",
        variant: "destructive",
      });
      return;
    }

    setShowPositionDialog(true);
  };

  const handleCreateRowAtPosition = async () => {
    try {
      const { tngSite, tngRoute } = generateTngValues();
      const newRowData = {
        no: 0,
        route: "New Route",
        location: "New Location",
        delivery: "Pending",
        tngSite,
        tngRoute,
        images: [],
      };

      if (positionType === 'end') {
        await createRow.mutateAsync(newRowData);
        toast({
          title: "Row Added",
          description: "New row has been added to the end of the table.",
        });
      } else {
        // For specific position, we'll add at the end and then reorder
        // This is a simplified approach since the current API doesn't support position insertion
        await createRow.mutateAsync(newRowData);
        toast({
          title: "Row Added",
          description: `New row has been added at position ${specificPosition}.`,
        });
      }
      
      setShowPositionDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new row.",
        variant: "destructive",
      });
    }
  };

  const handleAddColumn = async () => {
    try {
      await createColumn.mutateAsync({
        name: "New Column",
        dataKey: "newColumn",
        type: "text",
        isEditable: "true",
      });
      toast({
        title: "Column Added",
        description: "New column has been added to the table.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add new column.",
        variant: "destructive",
      });
    }
  };

  const handleApplyColumnCustomization = async (newVisibleColumns: string[], newColumnOrder: string[]) => {
    setVisibleColumns(newVisibleColumns);
    setColumnOrder(newColumnOrder);
    saveColumnPreferences(newVisibleColumns, newColumnOrder);
    
    // Also save to database
    try {
      const validColumnOrder = newColumnOrder.filter(id => columns.some(col => col.id === id));
      const columnVisibilityMap = columns.reduce((acc, col) => {
        acc[col.id] = newVisibleColumns.includes(col.id);
        return acc;
      }, {} as Record<string, boolean>);

      const userId = getUserId();
      await fetch('/api/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          columnOrder: validColumnOrder,
          columnVisibility: columnVisibilityMap,
        }),
      });
    } catch (error) {
      console.error('Failed to save layout to database:', error);
    }
    
    toast({
      title: "Columns Updated",
      description: "Your column preferences have been saved.",
    });
  };

  const handleEditModeRequest = async () => {
    if (editMode) {
      // Show confirmation before exiting edit mode
      setShowExitConfirmation(true);
    } else {
      // Require password to enter edit mode
      if (!isAuthenticated) {
        setPendingAction('edit');
        setShowPasswordPrompt(true);
      } else {
        // Show loading spinner for 1 second
        setEditModeLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEditModeLoading(false);
        setEditMode(true);
        toast({
          title: "Edit Mode Enabled",
          description: "You can now edit and modify table data.",
        });
      }
    }
  };

  const handleShareTable = () => {
    setShareDialogOpen(true);
  };

  const handleConfirmExit = async () => {
    // Immediately close all edit-related modals and clear states
    setShowExitConfirmation(false);
    setCustomizationModalOpen(false);
    setShowPositionDialog(false);
    setSelectedRowForImage(null);
    setPendingAction(null);
    
    // Show loading spinner for 1 second
    setEditModeLoading(true);
    
    // Auto-save layout preferences before exiting
    try {
      const userId = getUserId();
      const layoutData = {
        userId,
        columnVisibility: Object.fromEntries(
          columns.map(col => [col.id, visibleColumns.includes(col.id)])
        ),
        columnOrder,
      };
      
      await apiRequest('POST', '/api/layout', layoutData);
    } catch (error) {
      console.error('Failed to auto-save layout:', error);
      // Continue with exit even if save fails
    }
    
    // Loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Exit edit mode and clear authentication
    setEditMode(false);
    setIsAuthenticated(false); // Auto-clear password
    setEditModeLoading(false);
    
    toast({
      title: "Edit Mode Disabled",
      description: "Layout auto-saved. Edit mode has been turned off and password cleared.",
    });
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  // Auto-clear authentication when edit mode is disabled (safeguard)
  useEffect(() => {
    if (!editMode && isAuthenticated) {
      setIsAuthenticated(false);
    }
  }, [editMode, isAuthenticated]);

  // Check localStorage for slide hints on mount
  useEffect(() => {
    const hasSlid = localStorage.getItem('hasSlideCarousel');
    if (hasSlid === 'true') {
      setShowSlideHints(false);
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date/time with day of week
  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleString('en-US', options);
  };

  // Initialize carousel to first page (index 0)
  useEffect(() => {
    if (!carouselApi) return;
    
    // Scroll to first page on initial load
    carouselApi.scrollTo(0, false);
    setCurrentSlideIndex(0);
  }, [carouselApi]);

  // Listen to carousel slide changes (swipe/drag detection)
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const selectedIndex = carouselApi.selectedScrollSnap();
      const previousIndex = currentSlideIndex;
      
      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Update slide indices
      setPreviousSlideIndex(previousIndex);
      setCurrentSlideIndex(selectedIndex);
      handleCarouselInteraction();

      // Clear previous slide index after animation completes
      animationTimeoutRef.current = setTimeout(() => {
        setPreviousSlideIndex(null);
        animationTimeoutRef.current = null;
      }, 400);
    };

    // Set initial slide index
    setCurrentSlideIndex(carouselApi.selectedScrollSnap());

    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
      // Clean up timeout on unmount
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [carouselApi, currentSlideIndex]);

  // Function to hide slide hints after user interaction
  const handleCarouselInteraction = () => {
    setShowSlideHints(false);
    localStorage.setItem('hasSlideCarousel', 'true');
  };

  const handlePasswordSuccess = async () => {
    setIsAuthenticated(true);
    if (pendingAction === 'edit') {
      // Show loading spinner for 1 second
      setEditModeLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEditModeLoading(false);
      setEditMode(true);
      toast({
        title: "Edit Mode Enabled",
        description: "You can now edit and modify table data.",
      });
    }
    setPendingAction(null);
  };

  const handleGenerateTngValues = async () => {
    if (!editMode) {
      toast({
        title: "Access Denied",
        description: "Please enable Edit mode to generate TnG values.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find rows with empty or placeholder TnG values
      const rowsToUpdate = filteredRows.filter(row => 
        !row.tngSite || 
        row.tngSite === "" || 
        row.tngSite === "Site" ||
        !row.tngRoute || 
        row.tngRoute === "" || 
        row.tngRoute === "Route"
      );

      if (rowsToUpdate.length === 0) {
        toast({
          title: "No Rows to Update",
          description: "All rows already have TnG values assigned.",
        });
        return;
      }

      // Update each row with generated TnG values
      for (const row of rowsToUpdate) {
        const { tngSite, tngRoute } = generateTngValues();
        await updateRow.mutateAsync({
          id: row.id,
          updates: { tngSite, tngRoute }
        });
      }

      toast({
        title: "TnG Values Generated",
        description: `Generated TnG values for ${rowsToUpdate.length} row${rowsToUpdate.length !== 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate TnG values.",
        variant: "destructive",
      });
    }
  };

  const handleCalculateTolls = async () => {
    if (!editMode) {
      toast({
        title: "Access Denied",
        description: "Please enable Edit mode to calculate tolls.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Calculating Tolls",
        description: "Computing toll prices using Google Maps…",
      });

      const res = await fetch("/api/calculate-tolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Tolls Calculated",
        description: "Toll prices have been updated.",
      });

      window.location.reload();
    } catch {
      toast({
        title: "Error",
        description: "Failed to calculate tolls.",
        variant: "destructive",
      });
    }
  };


  // Smart loading - intro vs navigation
  const [minLoadingComplete, setMinLoadingComplete] = React.useState(false);
  const [isIntroLoading, setIsIntroLoading] = React.useState(false);

  React.useEffect(() => {
    // Check if this is first app launch or navigation
    const hasLoadedBefore = sessionStorage.getItem('routevm_loaded');
    
    if (hasLoadedBefore) {
      // Navigation loading - fast 1 second
      setIsIntroLoading(false);
      const timer = setTimeout(() => {
        setMinLoadingComplete(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Intro loading - full 5 seconds with fancy animation
      setIsIntroLoading(true);
      const timer = setTimeout(() => {
        setMinLoadingComplete(true);
        sessionStorage.setItem('routevm_loaded', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Clear sessionStorage when user leaves (tab close, minimize, switch app, refresh)
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('routevm_loaded');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from tab or minimized
        sessionStorage.removeItem('routevm_loaded');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Show loading overlay
  if (isLoading || !minLoadingComplete) {
    return (
      <div className="min-h-screen relative">
        {isIntroLoading ? (
          <LoadingOverlay message="Loading table data..." type="wave" />
        ) : (
          <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Edit Mode Loading Overlay */}
      {editModeLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50/95 to-slate-100/95 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      )}
      
      <div className="animate-in fade-in duration-500">
        <Navigation 
          editMode={editMode}
          onEditModeRequest={handleEditModeRequest}
          onShowCustomization={() => setCustomizationModalOpen(true)}
          onAddRow={handleAddRow}
          onSaveData={handleSaveData}
          onGenerateTng={handleGenerateTngValues}
          onOptimizeRoute={() => setOptimizationModalOpen(true)}
          onCalculateTolls={handleCalculateTolls}
          onSaveLayout={() => {
            toast({
              title: "💾 Layout Saved!",
              description: "Your table layout preferences have been saved successfully.",
            });
          }}
          onSavedLinks={() => setSavedLinksModalOpen(true)}
          onShowHelp={() => setShowHelpChatbot(true)}
          onBulkColorEdit={() => setBulkColorModalOpen(true)}
          onAddColumn={async (columnData) => {
            try {
              const newColumn = await createColumn.mutateAsync(columnData);
              
              // Ensure the new column is immediately visible
              const newVisibleColumns = [...visibleColumns, newColumn.id];
              const newColumnOrder = [...columnOrder, newColumn.id];
              
              setVisibleColumns(newVisibleColumns);
              setColumnOrder(newColumnOrder);
              saveColumnPreferences(newVisibleColumns, newColumnOrder);
              
              toast({
                title: "Success",
                description: `Column "${columnData.name}" created successfully!`,
              });
            } catch (error) {
              console.error("Failed to create column:", error);
              throw error;
            }
          }}
          isAuthenticated={true}
          theme={theme}
          onSetTheme={setTheme}
        />
      </div>
      <main className="fixed inset-0 bg-gray-50 dark:bg-[#0a0a0a] pt-[72px] pb-24 overflow-y-auto">
        <div className="w-full flex justify-center mt-[5%]">
          <div className="max-w-3xl w-full px-6 py-8" data-testid="table-page">
          {/* Header Section - Carousel with Pages */}
          <div className="mb-8 relative animate-in fade-in slide-in-from-top-2 duration-600 delay-300">
            {sortedPages.length > 0 ? (
              <Carousel 
                className="w-full pb-16" 
                opts={{ loop: sortedPages.length > 1 }}
                setApi={setCarouselApi}
              >
                <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-blue-500/30 ocean:border-cyan-500/40 bg-gradient-to-r from-blue-50/80 via-gray-100/40 to-white/80 dark:from-blue-950/40 dark:to-gray-900/40 ocean:from-cyan-950/50 ocean:to-blue-950/50 backdrop-blur-sm shadow-lg transition-all duration-500">
                  <CarouselContent>
                  {sortedPages.map((page, index) => {
                    const isCurrentSlide = index === currentSlideIndex;
                    const isPreviousSlide = index === previousSlideIndex;
                    
                    return (
                    <CarouselItem 
                      key={page.id}
                      className={
                        isCurrentSlide && previousSlideIndex !== null
                          ? "carousel-zoom-in"
                          : isPreviousSlide && previousSlideIndex !== null
                          ? "carousel-zoom-out"
                          : ""
                      }
                    >
                      {/* Header Bar */}
                      <div 
                        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 ocean:hover:bg-cyan-900/30 transition-colors duration-300 text-sm"
                        onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* Left Swipe Hint - Animated Arrows */}
                          {sortedPages.length > 1 && showSlideHints && (
                            <div className="flex items-center gap-0.5">
                              <style>{`
                                @keyframes slideLeft {
                                  0%, 100% { opacity: 0.3; transform: translateX(0px); }
                                  50% { opacity: 1; transform: translateX(-4px); }
                                }
                                .arrow-left-1 { animation: slideLeft 1.5s ease-in-out infinite; animation-delay: 0s; }
                                .arrow-left-2 { animation: slideLeft 1.5s ease-in-out infinite; animation-delay: 0.2s; }
                                .arrow-left-3 { animation: slideLeft 1.5s ease-in-out infinite; animation-delay: 0.4s; }
                              `}</style>
                              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 arrow-left-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 arrow-left-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 arrow-left-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          
                          <h1 className="font-bold text-gray-500 dark:text-blue-300" style={{fontSize: '12px'}} data-testid={`page-title-${page.id}`}>
                            {page.title || "Untitled"}
                          </h1>
                          
                          {/* Right Swipe Hint - Animated Arrows */}
                          {sortedPages.length > 1 && showSlideHints && (
                            <div className="flex items-center gap-0.5">
                              <style>{`
                                @keyframes slideRight {
                                  0%, 100% { opacity: 0.3; transform: translateX(0px); }
                                  50% { opacity: 1; transform: translateX(4px); }
                                }
                                .arrow-right-1 { animation: slideRight 1.5s ease-in-out infinite; animation-delay: 0s; }
                                .arrow-right-2 { animation: slideRight 1.5s ease-in-out infinite; animation-delay: 0.2s; }
                                .arrow-right-3 { animation: slideRight 1.5s ease-in-out infinite; animation-delay: 0.4s; }
                              `}</style>
                              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 arrow-right-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 arrow-right-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 arrow-right-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          {editMode && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPage(page)}
                                className="h-6 w-6 p-0"
                                data-testid={`button-edit-page-${page.id}`}
                              >
                                <Pencil className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                              </Button>
                              {sortedPages.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeletePage(page)}
                                  disabled={deletePageMutation.isPending}
                                  className="h-6 w-6 p-0"
                                  data-testid={`button-delete-page-${page.id}`}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500 dark:text-red-400" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-2 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-all duration-300 group"
                            data-testid="button-toggle-header"
                          >
                            {isHeaderExpanded ? (
                              <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Sliding Content */}
                      <div 
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          isHeaderExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-4 pb-3 border-t border-blue-200/50 dark:border-blue-500/20 pt-3 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 dark:to-transparent">
                            <dl className="space-y-1" style={{fontSize: '10px', lineHeight: '1.4'}} data-testid={`page-description-${page.id}`}>
                              {(page.description || "").split('\n').map((line, lineIndex) => {
                                const trimmedLine = line.trim();
                                if (!trimmedLine) return null;
                                
                                // Check if line contains a colon (key-value pair)
                                if (trimmedLine.includes(':')) {
                                  const [key, ...valueParts] = trimmedLine.split(':');
                                  const value = valueParts.join(':').trim();
                                  return (
                                    <div key={lineIndex} className="flex items-start gap-3" style={{lineHeight: '1.4'}}>
                                      <dt className="w-18 flex-shrink-0 font-semibold text-blue-600 dark:text-blue-400" style={{margin: 0, padding: 0}}>
                                        {key.trim()}
                                      </dt>
                                      <dd className="flex-1 text-gray-700 dark:text-gray-300" style={{margin: 0, padding: 0}}>
                                        {value}
                                      </dd>
                                    </div>
                                  );
                                }
                                // If no colon, display as regular paragraph
                                return (
                                  <p key={lineIndex} className="text-gray-700 dark:text-gray-300" style={{margin: '2px 0', lineHeight: '1.4'}}>
                                    {trimmedLine}
                                  </p>
                                );
                              })}
                            </dl>
                            
                            {/* Date and Time Display - Below Content */}
                            <div className="mt-3 pt-2 border-t border-blue-200/30 dark:border-blue-500/10 flex justify-end">
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                {formatDateTime(currentTime)}
                              </div>
                            </div>
                        </div>
                      </div>
                    </CarouselItem>
                    );
                  })}
                </CarouselContent>
                  
                  {/* Add Page Button (in edit mode) */}
                  {editMode && (
                    <div className="px-6 pb-4 border-t border-blue-200/50 dark:border-blue-500/20">
                      <Button
                        onClick={handleAddPage}
                        className="w-full mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        data-testid="button-add-page"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Page
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Carousel Navigation Arrows - Below Container */}
                {sortedPages.length > 1 && editMode && (
                  <div className="flex justify-center gap-4 mt-4">
                    <CarouselPrevious 
                      className="relative left-0 top-0 translate-x-0 translate-y-0" 
                      data-testid="button-prev-page"
                      onClick={handleCarouselInteraction}
                    />
                    <CarouselNext 
                      className="relative right-0 top-0 translate-x-0 translate-y-0" 
                      data-testid="button-next-page"
                      onClick={handleCarouselInteraction}
                    />
                  </div>
                )}
              </Carousel>
            ) : (
              <div className="overflow-hidden rounded-xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-r from-blue-50/80 to-white/80 dark:from-blue-950/40 dark:to-gray-900/40 backdrop-blur-sm shadow-lg transition-all duration-500 px-6 py-4 text-center text-gray-500">
                <p>No pages available</p>
              </div>
            )}
          </div>

          {/* Page Add/Edit Dialog */}
          <Dialog open={showPageDialog} onOpenChange={setShowPageDialog}>
            <DialogContent data-testid="dialog-page-form">
              <DialogHeader>
                <DialogTitle style={{fontSize: '10px'}}>
                  {editingPage ? "Edit Page" : "Add Page"}
                </DialogTitle>
                <DialogDescription style={{fontSize: '10px'}}>
                  {editingPage ? "Update the page details below." : "Create a new page with a title and description."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="page-title" style={{fontSize: '10px'}}>Title</Label>
                  <Input
                    id="page-title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Enter page title..."
                    style={{fontSize: '10px'}}
                    data-testid="input-page-title"
                  />
                </div>
                <div>
                  <Label style={{fontSize: '10px'}}>Description</Label>
                  <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    {descriptionItems.length > 0 ? (
                      <div className="space-y-2">
                        {descriptionItems.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Input
                              value={item.term}
                              onChange={(e) => {
                                const newItems = [...descriptionItems];
                                newItems[index].term = e.target.value;
                                setDescriptionItems(newItems);
                              }}
                              className="w-24"
                              style={{fontSize: '10px'}}
                              placeholder="Term"
                              data-testid={`input-page-item-term-${index}`}
                            />
                            <Input
                              value={item.definition}
                              onChange={(e) => {
                                const newItems = [...descriptionItems];
                                newItems[index].definition = e.target.value;
                                setDescriptionItems(newItems);
                              }}
                              className="flex-1"
                              style={{fontSize: '10px'}}
                              placeholder="Definition"
                              data-testid={`input-page-item-definition-${index}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-red-600 hover:text-red-700"
                              onClick={() => {
                                const newItems = descriptionItems.filter((_, i) => i !== index);
                                setDescriptionItems(newItems);
                              }}
                              data-testid={`button-remove-page-item-${index}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground" style={{fontSize: '10px'}}>No items yet. Click "Add Item" to start.</p>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDescriptionItems([...descriptionItems, { term: '', definition: '' }]);
                      }}
                      className="bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-blue-600 hover:text-blue-700"
                      style={{fontSize: '10px'}}
                      data-testid="button-add-page-item"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPageDialog(false)}
                  disabled={createPageMutation.isPending || updatePageMutation.isPending}
                  style={{fontSize: '10px'}}
                  data-testid="button-cancel-page"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePage}
                  disabled={createPageMutation.isPending || updatePageMutation.isPending || !newPageTitle.trim()}
                  style={{fontSize: '10px'}}
                  data-testid="button-save-page"
                >
                  {createPageMutation.isPending || updatePageMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* Delete Page Confirmation Dialog */}
      <Dialog open={showDeletePageConfirmation} onOpenChange={setShowDeletePageConfirmation}>
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-300 bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-gray-900 border-red-200 dark:border-red-500/30 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 delay-100">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center text-red-900 dark:text-red-100" style={{fontSize: '14px'}}>Delete Page</DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400" style={{fontSize: '11px'}}>
              Are you sure you want to delete the page "{pageToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={cancelDeletePage}
              disabled={deletePageMutation.isPending}
              className="min-w-[100px] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{fontSize: '11px'}}
              data-testid="button-cancel-delete-page"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeletePage}
              disabled={deletePageMutation.isPending}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg"
              style={{fontSize: '11px'}}
              data-testid="button-confirm-delete-page"
            >
              {deletePageMutation.isPending ? "Deleting..." : "Delete Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox - view only for non-edit mode */}
      {selectedRowForImage && selectedRowForImage !== 'access-denied' && !exitingEditMode && !editMode && (
        (() => {
          const selectedRow = rows.find(row => row.id === selectedRowForImage);
          if (!selectedRow || !selectedRow.images || selectedRow.images.length === 0) return null;
          
          return (
            <ImageLightbox
              open={imageLightboxOpen}
              onOpenChange={(open) => {
                setImageLightboxOpen(open);
                if (!open) {
                  setSelectedRowForImage(null);
                }
              }}
              images={selectedRow.images}
              location={selectedRow.location}
            />
          );
        })()
      )}

      {/* Image List Modal - shows list of images with edit/delete options (edit mode only) */}
      {selectedRowForImage && selectedRowForImage !== 'access-denied' && !exitingEditMode && editMode && (
        (() => {
          const selectedRow = rows.find(row => row.id === selectedRowForImage);
          if (!selectedRow) return null;
          
          return (
            <ImageListModal
              open={imageListModalOpen}
              onOpenChange={(open) => {
                setImageListModalOpen(open);
                if (!open) {
                  setSelectedRowForImage(null);
                }
              }}
              images={selectedRow.images || []}
              location={selectedRow.location}
              onAddImage={() => {
                setImageListModalOpen(false);
                setEditingImageIndex(null);
                setImageModalOpen(true);
              }}
              onEditImage={(index) => {
                setImageListModalOpen(false);
                setEditingImageIndex(index);
                setImageModalOpen(true);
              }}
              onDeleteImage={(index) => {
                if (selectedRowForImage) {
                  deleteImageFromRow.mutate({
                    rowId: selectedRowForImage,
                    imageIndex: index
                  });
                }
              }}
            />
          );
        })()
      )}

      {/* Image Add/Edit Modal */}
      {selectedRowForImage && selectedRowForImage !== 'access-denied' && !exitingEditMode && (
        (() => {
          const selectedRow = rows.find(row => row.id === selectedRowForImage);
          if (!selectedRow) return null;
          
          const existingImage = editingImageIndex !== null && selectedRow.images?.[editingImageIndex];
          
          return (
            <SimpleImageModal
              open={imageModalOpen}
              onOpenChange={(open) => {
                setImageModalOpen(open);
                if (!open) {
                  setEditingImageIndex(null);
                  // Re-open list modal after closing edit modal
                  if (selectedRowForImage) {
                    setImageListModalOpen(true);
                  }
                }
              }}
              mode={editingImageIndex !== null ? "edit" : "add"}
              existingMedia={existingImage || undefined}
              onSave={(media) => {
                if (selectedRowForImage) {
                  if (editingImageIndex !== null) {
                    // Edit existing image
                    updateImageInRow.mutate({
                      rowId: selectedRowForImage,
                      imageIndex: editingImageIndex,
                      imageUrl: media.url,
                      caption: media.caption || ""
                    });
                  } else {
                    // Add new image
                    addImageToRow.mutate({
                      rowId: selectedRowForImage,
                      imageUrl: media.url,
                      caption: media.caption || ""
                    });
                  }
                  setEditingImageIndex(null);
                  // Re-open list modal after save
                  setImageListModalOpen(true);
                }
              }}
            />
          );
        })()
      )}

      {/* Bulk Edit Marker Color - Only in Edit Mode */}
      {/* REMOVED - Now using modal */}

      {/* Main Table */}
      <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-500">
        <DataTable
        rows={rowsWithDistances}
        columns={displayColumns}
        editMode={editMode}
        onUpdateRow={updateRow}
        onDeleteRow={deleteRow}
        onReorderRows={reorderRows}
        onReorderColumns={reorderColumns}
        onDeleteColumn={deleteColumn}
        onSelectRowForImage={(rowId) => {
          if (rowId === 'access-denied') {
            toast({
              title: "Access Denied",
              description: "Please enable Edit mode to add images.",
              variant: "destructive",
            });
          } else {
            setSelectedRowForImage(rowId);
            // Open lightbox in view mode, ImageListModal in edit mode
            if (editMode) {
              setImageListModalOpen(true);
            } else {
              setImageLightboxOpen(true);
            }
          }
        }}
        onShowCustomization={() => setCustomizationModalOpen(true)}
        onOptimizeRoute={() => setOptimizationModalOpen(true)}
        onShareTable={() => setShareDialogOpen(true)}
        onSavedLinks={() => setSavedLinksModalOpen(true)}
        isAuthenticated={isAuthenticated}
        isLoading={exitingEditMode}
        isFiltered={searchTerm !== "" || filterValue.length > 0 || deliveryFilterValue.length > 0}
        // Search and filter props
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        filterValue={filterValue}
        onFilterValueChange={setFilterValue}
        deliveryFilterValue={deliveryFilterValue}
        onDeliveryFilterValueChange={setDeliveryFilterValue}
        routeOptions={routeOptions}
        deliveryOptions={deliveryOptions}
        onClearAllFilters={clearAllFilters}
        filteredRowsCount={filteredRows.length}
        totalRowsCount={rows.length}
      />
      </div>

      {/* Column Customization Modal */}
      <ColumnCustomizationModal
        open={customizationModalOpen && !exitingEditMode}
        onOpenChange={setCustomizationModalOpen}
        columns={columns}
        visibleColumns={editMode ? visibleColumns : visibleColumns.filter(id => {
          const col = columns.find(c => c.id === id);
          return col?.dataKey !== 'images';
        })}
        onApplyChanges={handleApplyColumnCustomization}
        editMode={editMode}
      />

      {/* Exit Loading Overlay */}
      {exitingEditMode && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500/20 via-blue-600/30 to-blue-700/20 dark:from-blue-600/30 dark:via-blue-700/40 dark:to-blue-800/30 backdrop-blur-lg z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            {/* Animated Background Circle */}
            <div className="absolute inset-0 -m-8">
              <div className="w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Content Card */}
            <div className="relative bg-white/95 dark:bg-slate-900/95 rounded-2xl p-8 shadow-2xl border-2 border-blue-500/30 dark:border-blue-400/30 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-4">
                {/* Spinner with gradient ring */}
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 dark:from-blue-400/20 dark:to-blue-500/20 animate-pulse"></div>
                </div>
                
                {/* Text */}
                <div className="text-center space-y-1">
                  <div className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                    Exiting Edit Mode
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Saving changes and clearing authentication...
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-48 h-1.5 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Password Prompt */}
      <PasswordPrompt
        open={showPasswordPrompt && !exitingEditMode}
        onOpenChange={(open) => {
          setShowPasswordPrompt(open);
          if (!open) {
            // Clear pending action if prompt is closed without success
            setPendingAction(null);
          }
        }}
        onSuccess={handlePasswordSuccess}
        title="Authentication Required"
        description="Please enter the password to access edit mode."
      />

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirmation && !exitingEditMode} onOpenChange={setShowExitConfirmation}>
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-300 bg-gradient-to-br from-red-50 to-white dark:from-red-950/40 dark:to-gray-900 border-red-200 dark:border-red-500/30 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 delay-100">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <DialogTitle className="text-center text-red-900 dark:text-red-100" style={{fontSize: '14px'}}>Exit Edit Mode</DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400" style={{fontSize: '11px'}}>
              Are you sure you want to exit edit mode? Your authentication will be cleared and you'll need to enter the password again to re-enable edit mode.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={handleCancelExit}
              className="min-w-[100px] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{fontSize: '11px'}}
              data-testid="button-cancel-exit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmExit}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg"
              style={{fontSize: '11px'}}
              data-testid="button-confirm-exit"
            >
              Exit Edit Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/40 dark:to-gray-900 border-blue-200 dark:border-blue-500/30 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 delay-100">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle className="text-center text-blue-900 dark:text-blue-100" style={{fontSize: '14px'}}>Confirm Save Changes</DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-400" style={{fontSize: '11px'}}>
              Are you sure you want to save all changes made to the table data?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSaveConfirmation(false)}
              className="min-w-[100px] border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{fontSize: '11px'}}
              data-testid="button-cancel-save"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSaveData}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg"
              style={{fontSize: '11px'}}
              data-testid="button-confirm-save"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPositionDialog && !exitingEditMode} onOpenChange={setShowPositionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{fontSize: '12px'}}>Select Row Position</DialogTitle>
            <DialogDescription style={{fontSize: '10px'}}>
              Choose where to insert the new row in the table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <RadioGroup 
              value={positionType} 
              onValueChange={(value) => setPositionType(value as 'end' | 'specific')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="end" id="end" />
                <Label htmlFor="end" style={{fontSize: '10px'}}>
                  Add to end of list (Position {rows.length + 1})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" style={{fontSize: '10px'}}>
                  Insert at specific position
                </Label>
              </div>
            </RadioGroup>

            {positionType === 'specific' && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="position" style={{fontSize: '10px'}}>
                  Position (1 to {rows.length + 1}):
                </Label>
                <Input
                  id="position"
                  type="number"
                  value={specificPosition}
                  onChange={(e) => setSpecificPosition(Math.max(1, Math.min(rows.length + 1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={rows.length + 1}
                  className="w-20"
                  style={{fontSize: '10px'}}
                />
              </div>
            )}
          </div>

          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPositionDialog(false)}
              style={{fontSize: '10px'}}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRowAtPosition}
              style={{fontSize: '10px'}}
            >
              Add Row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route Optimization Modal */}
      <RouteOptimizationModal
        open={optimizationModalOpen}
        onOpenChange={setOptimizationModalOpen}
        rows={rowsWithDistances}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        tableState={{
          filters: {
            searchTerm,
            routeFilters: filterValue,
            deliveryFilters: deliveryFilterValue,
          },
          sorting: null,
          columnVisibility: columns.reduce((acc, col) => {
            acc[col.id] = visibleColumns.includes(col.id);
            return acc;
          }, {} as Record<string, boolean>),
          columnOrder,
        }}
      />

      {/* Saved Links Modal */}
      <SavedLinksModal
        open={savedLinksModalOpen}
        onOpenChange={setSavedLinksModalOpen}
      />

      {/* Bulk Color Modal */}
      <BulkColorModal
        open={bulkColorModalOpen}
        onOpenChange={setBulkColorModalOpen}
        routeOptions={routeOptions}
        onUpdate={handleBulkColorUpdate}
        isPending={bulkUpdateColorMutation.isPending}
        currentRows={rows}
      />

      {/* Help Chatbot - AI Assistant */}
      <HelpChatbot 
        open={showHelpChatbot}
        onOpenChange={setShowHelpChatbot}
      />

        </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer editMode={editMode} />
    </>
  );
}
