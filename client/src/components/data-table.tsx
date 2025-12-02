import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnHeader } from "./column-header";
import { EditableCell } from "./editable-cell";
import { ImagePreview } from "./image-preview";
import { ImageIconButton } from "./image-icon-button";
import { InfoModal } from "./info-modal";
import { SlidingDescription } from "./sliding-description";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  PlusCircle,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Infinity,
  FileText,
  Search,
  Filter,
  X,
  MapPin,
  Route,
  Share2,
  Power,
  Bookmark,
  ImageIcon,
  ImageOff,
  Slash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SkeletonLoader,
  LoadingOverlay,
  InlineLoading,
} from "./skeleton-loader";
import { TableRow as TableRowType, TableColumn } from "@shared/schema";
import { UseMutationResult } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

// Simple mobile-friendly tooltip component
interface MobileTooltipProps {
  content: string;
  children: React.ReactNode;
  showBelow?: boolean;
}

function MobileTooltip({ content, children, showBelow = false }: MobileTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device supports touch
    const checkIsMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleClick = () => {
    if (isMobile) {
      setIsVisible(!isVisible);
      // Auto-hide after 3 seconds on mobile
      setTimeout(() => setIsVisible(false), 3000);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsVisible(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${isMobile ? 'cursor-pointer' : 'cursor-help'}`}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          className={`absolute left-0 z-[100] pointer-events-none ${showBelow ? 'top-full mt-2' : 'bottom-full mb-2'}`}
        >
          <div className="px-3 py-2 text-xs bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl whitespace-nowrap border border-gray-700">
            {content}
          </div>
          <div className={`absolute left-4 w-0 h-0 border-4 border-transparent ${showBelow ? 'bottom-full border-b-gray-900 dark:border-b-gray-800' : 'top-full border-t-gray-900 dark:border-t-gray-800'}`} />
        </div>
      )}
    </div>
  );
}

interface DataTableProps {
  rows: TableRowType[];
  columns: TableColumn[];
  editMode: boolean;
  isSharedView?: boolean; // Flag to indicate if this is a shared table view
  hideShareButton?: boolean; // Hide share button in shared view
  disablePagination?: boolean; // Disable pagination and show all rows
  onUpdateRow: UseMutationResult<
    any,
    Error,
    { id: string; updates: Partial<any> },
    unknown
  >;
  onDeleteRow: UseMutationResult<void, Error, string, unknown>;
  onReorderRows: UseMutationResult<TableRowType[], Error, string[], unknown>;
  onReorderColumns: UseMutationResult<TableColumn[], Error, string[], unknown>;
  onDeleteColumn: UseMutationResult<void, Error, string, unknown>;
  onSelectRowForImage: (rowId: string) => void;
  onShowCustomization?: () => void;
  onOptimizeRoute?: () => void;
  onShareTable?: () => void;
  onSavedLinks?: () => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  isFiltered?: boolean;
  // Search and filter props
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
  filterValue?: string[];
  onFilterValueChange?: (filters: string[]) => void;
  deliveryFilterValue?: string[];
  onDeliveryFilterValueChange?: (filters: string[]) => void;
  routeOptions?: string[];
  deliveryOptions?: string[];
  onClearAllFilters?: () => void;
  filteredRowsCount?: number;
  totalRowsCount?: number;
  customToolbarContent?: React.ReactNode;
}

export function DataTable({
  rows,
  columns,
  editMode,
  isSharedView = false,
  hideShareButton = false,
  disablePagination = false,
  onUpdateRow,
  onDeleteRow,
  onReorderRows,
  onReorderColumns,
  onDeleteColumn,
  onSelectRowForImage,
  onShowCustomization,
  onOptimizeRoute,
  onShareTable,
  onSavedLinks,
  isAuthenticated = false,
  isLoading = false,
  isFiltered = false,
  // Search and filter props
  searchTerm = '',
  onSearchTermChange,
  filterValue = [],
  onFilterValueChange,
  deliveryFilterValue = [],
  onDeliveryFilterValueChange,
  routeOptions = [],
  deliveryOptions = [],
  onClearAllFilters,
  filteredRowsCount = 0,
  totalRowsCount = 0,
  customToolbarContent,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRowForDelete, setSelectedRowForDelete] = useState<
    string | null
  >(null);
  const [sortState, setSortState] = useState<{column: string; direction: 'asc' | 'desc'} | null>(null);
  const { toast } = useToast();

  // Filter columns to hide "info" column when not in edit mode
  const visibleColumns = editMode ? columns : columns.filter(col => col.dataKey !== 'info');

  // Reset to page 1 when rows change (due to filtering)
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [rows.length]);

  // Use rows as provided (already filtered by parent with distances calculated)
  
  // Helper function to determine schedule status
  const getScheduleStatus = (row: TableRowType) => {
    // Main page (not shared view, not custom table): only check if active/inactive
    if (!isSharedView) {
      if (row.active === false) {
        return 'inactive'; // Red/dimmed - power off
      } else {
        return 'on-schedule'; // Always bright/visible on main page
      }
    }
    
    // Shared view & custom table: apply full schedule logic
    const currentDate = new Date().getDate(); // Get date (1-31)
    const currentDay = new Date().getDay(); // Get day (0-6)
    const isOddDate = currentDate % 2 === 1; // Odd dates = Alt 1, Even dates = Alt 2
    
    if (row.active === false || row.deliveryAlt === "inactive") {
      return 'inactive'; // Red - don't show if power off
    } else if (
      (row.deliveryAlt === "alt1" && !isOddDate) || // Alt 1 on even date
      (row.deliveryAlt === "alt2" && isOddDate)     // Alt 2 on odd date
    ) {
      return 'off-schedule'; // Yellow - alt not matching today
    } else if (
      row.delivery === "Weekday" && 
      (currentDay === 5 || currentDay === 6) // Friday or Saturday
    ) {
      return 'off-schedule'; // Yellow - weekday delivery on weekend
    } else if (row.delivery === "Daily") {
      return 'on-schedule'; // Daily = always on schedule
    } else {
      return 'on-schedule'; // Green
    }
  };

  // Apply sorting based on sortState
  const sortedRows = sortState ? (() => {
    const sorted = [...rows].sort((a, b) => {
      // Multi-tier sorting ONLY for shared view or edit mode: on-schedule > off-schedule > inactive
      if (isSharedView || editMode) {
        const statusA = getScheduleStatus(a);
        const statusB = getScheduleStatus(b);
        
        const statusOrder = { 'on-schedule': 0, 'off-schedule': 1, 'inactive': 2 };
        if (statusOrder[statusA] !== statusOrder[statusB]) {
          return statusOrder[statusA] - statusOrder[statusB];
        }
      } else {
        // Regular view mode: only put inactive rows at bottom
        const activeA = a.active !== false;
        const activeB = b.active !== false;
        if (activeA !== activeB) {
          return activeA ? -1 : 1;
        }
      }
      
      const direction = sortState.direction === 'asc' ? 1 : -1;
      
      switch (sortState.column) {
        case 'code': {
          const codeA = a.code || "";
          const codeB = b.code || "";
          const numA = parseInt(codeA) || 0;
          const numB = parseInt(codeB) || 0;
          return (numA - numB) * direction;
        }
        case 'route': {
          const routeA = a.route || "";
          const routeB = b.route || "";
          return routeA.localeCompare(routeB) * direction;
        }
        case 'location': {
          const locationA = a.location || "";
          const locationB = b.location || "";
          return locationA.localeCompare(locationB) * direction;
        }
        case 'delivery': {
          const deliveryA = a.delivery || "";
          const deliveryB = b.delivery || "";
          return deliveryA.localeCompare(deliveryB) * direction;
        }
        case 'kilometer': {
          const kmA = parseFloat((a as any).kilometer) || 0;
          const kmB = parseFloat((b as any).kilometer) || 0;
          return (kmA - kmB) * direction;
        }
        case 'order': {
          const noA = a.no || 0;
          const noB = b.no || 0;
          return (noA - noB) * direction;
        }
        default:
          return 0;
      }
    });
    
    // Keep QL Kitchen at top if it exists and is active
    const qlKitchenIndex = sorted.findIndex(row => row.location === "QL Kitchen" && row.active !== false);
    if (qlKitchenIndex > 0) {
      const qlKitchenRow = sorted.splice(qlKitchenIndex, 1)[0];
      sorted.unshift(qlKitchenRow);
    }
    
    return sorted;
  })() : (() => {
    // Without sorting: use tier-based sorting ONLY for shared view or edit mode
    if (isSharedView || editMode) {
      const onScheduleRows = rows.filter(row => getScheduleStatus(row) === 'on-schedule');
      const offScheduleRows = rows.filter(row => getScheduleStatus(row) === 'off-schedule');
      const inactiveRows = rows.filter(row => getScheduleStatus(row) === 'inactive');
      
      // For shared view: DON'T show inactive rows (power off)
      if (isSharedView) {
        return [...onScheduleRows, ...offScheduleRows];
      }
      
      return [...onScheduleRows, ...offScheduleRows, ...inactiveRows];
    } else {
      // Regular view mode: only put inactive rows at bottom
      const activeRows = rows.filter(row => row.active !== false);
      const inactiveRows = rows.filter(row => row.active === false);
      return [...activeRows, ...inactiveRows];
    }
  })();

  // Calculate pagination
  const totalRows = sortedRows.length;
  const totalPages = disablePagination ? 1 : Math.ceil(totalRows / pageSize);
  const startIndex = disablePagination ? 0 : (currentPage - 1) * pageSize;
  const endIndex = disablePagination ? totalRows : startIndex + pageSize;
  const paginatedRows = disablePagination ? sortedRows : sortedRows.slice(startIndex, endIndex);

  // Reset to first page when page size changes
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  // Handle page navigation
  const goToPage = (page: number) => {
    if (page === currentPage) return;
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "column") {
      const newColumnOrder = Array.from(columns);
      const [reorderedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedColumn);

      const columnIds = newColumnOrder.map((col) => col.id);
      onReorderColumns.mutate(columnIds);
    } else if (type === "row") {
      const newRowOrder = Array.from(rows);
      const [reorderedRow] = newRowOrder.splice(source.index, 1);
      newRowOrder.splice(destination.index, 0, reorderedRow);

      const rowIds = newRowOrder.map((row) => row.id);
      onReorderRows.mutate(rowIds);
    }
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US").format(num || 0);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      currencyDisplay: "symbol",
    })
      .format(num || 0)
      .replace("MYR", "RM");
  };

  const getCellValue = (
    row: TableRowType,
    column: TableColumn,
    rowIndex?: number,
  ) => {
    switch (column.dataKey) {
      case "id":
        return row.id.slice(0, 8).toUpperCase();
      case "no":
        // Show infinity icon for QL Kitchen row
        if (row.location === "QL Kitchen") {
          return "∞";
        }
        // Display sequential numbers (1, 2, 3...) based on position in table
        // This shows sequential numbers even if code has gaps
        if (rowIndex !== undefined) {
          const hasQLKitchenAtTop = paginatedRows[0]?.location === "QL Kitchen";
          return hasQLKitchenAtTop ? rowIndex : rowIndex + 1;
        }
        return row.no || 0;
      case "route":
        return row.route || "";
      case "code":
        return row.code || "";
      case "location":
        return row.location || "";
      case "delivery":
        return row.delivery || "";
      case "alt1":
        return (row as any).alt1 || "";
      case "alt2":
        return (row as any).alt2 || "";
      case "info":
        return row.info || "";
      case "tngSite":
        return row.tngSite || "";
      case "tngRoute":
        // Handle currency formatting for TnG column
        if (column.type === "currency") {
          const value = parseFloat(row.tngRoute || "0") || 0;
          return formatCurrency(value);
        }
        return row.tngRoute || "";
      case "destination":
        // Handle currency formatting for Destination column
        if (column.type === "currency") {
          const value = parseFloat(row.destination || "0") || 0;
          return formatCurrency(value);
        }
        return row.destination || "";
      case "images":
        const images = row.images || [];
        // Convert string arrays to ImageWithCaption format
        return images.map((img: any) =>
          typeof img === "string" ? { url: img, caption: "" } : img,
        );
      case "kilometer":
        // Use the kilometer value already calculated by parent component
        const kmValue = (row as any).kilometer;
        if (kmValue === "—" || kmValue === undefined || kmValue === null) {
          return "—";
        }
        if (typeof kmValue === "number") {
          if (kmValue === 0) {
            return "0.00 km";
          }
          return `${kmValue.toFixed(2)} km`;
        }
        return "—";
      default:
        // Handle dynamic columns - return empty value for new columns
        return (row as any)[column.dataKey] || "";
    }
  };

  const getDeliveryBadgeColor = (delivery: string) => {
    const colors: Record<string, string> = {
      "Same Day": "bg-transparent text-white",
      "Next Day": "bg-transparent text-white",
      "2-3 Days": "bg-transparent text-white",
      "3-5 Days": "bg-transparent text-white",
      Daily: "bg-transparent text-white",
      Weekday: "bg-transparent text-white",
      "Alternate 1": "bg-transparent text-white",
      "Alternate 2": "bg-transparent text-white",
    };
    return colors[delivery] || "bg-transparent text-white";
  };

  // Calculate totals based on currently visible filtered/searched data
  // The 'rows' prop already contains only the filtered data from the parent component
  const calculateColumnSum = (dataKey: string, columnType: string) => {
    if (dataKey === "no") {
      return rows.reduce((sum, row) => sum + (row.no || 0), 0);
    }
    if (dataKey === "kilometer") {
      // Get last visible row that has valid coordinates (excluding QL Kitchen)
      const validRows = rows.filter(row => 
        row.location !== "QL Kitchen" && 
        row.latitude && 
        row.longitude &&
        Number.isFinite(parseFloat(row.latitude)) && 
        Number.isFinite(parseFloat(row.longitude))
      );
      
      if (validRows.length === 0) return 0;
      
      const lastRow = validRows[validRows.length - 1];
      const lastKm = (lastRow as any).kilometer;
      
      // If no valid kilometer data, return 0
      if (typeof lastKm !== "number" || !Number.isFinite(lastKm)) return 0;
      
      // Find QL Kitchen coordinates for return trip calculation
      const allRowsWithQL = [...rows];
      const qlKitchen = allRowsWithQL.find(row => row.location === "QL Kitchen");
      
      if (!qlKitchen || !qlKitchen.latitude || !qlKitchen.longitude) {
        // No QL Kitchen, just return the last kilometer value
        return lastKm;
      }
      
      const qlLat = parseFloat(qlKitchen.latitude);
      const qlLng = parseFloat(qlKitchen.longitude);
      
      if (!Number.isFinite(qlLat) || !Number.isFinite(qlLng)) {
        return lastKm;
      }
      
      // Calculate return distance from last location to QL Kitchen
      const lastLat = parseFloat(lastRow.latitude || "0");
      const lastLng = parseFloat(lastRow.longitude || "0");
      
      // Haversine formula for return distance
      const R = 6371; // Earth's radius in km
      const dLat = (qlLat - lastLat) * (Math.PI / 180);
      const dLon = (qlLng - lastLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lastLat * (Math.PI / 180)) *
          Math.cos(qlLat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const returnDistance = R * c;
      
      // Total = last kilometer value + return to QL Kitchen
      return lastKm + returnDistance;
    }
    if (columnType === "currency" && dataKey === "tngRoute") {
      return rows.reduce((sum, row) => {
        const value = parseFloat(row.tngRoute || "0") || 0;
        return sum + value;
      }, 0);
    }
    if (columnType === "currency" && dataKey === "destination") {
      return rows.reduce((sum, row) => {
        const value = parseFloat(row.destination || "0") || 0;
        return sum + value;
      }, 0);
    }
    if (columnType === "currency" && dataKey === "tollPrice") {
      return rows.reduce((sum, row) => {
        const value = parseFloat(row.tollPrice || "0") || 0;
        return sum + value;
      }, 0);
    }
    return 0;
  };

  const handleSortByCode = (direction: 'asc' | 'desc') => {
    // Sort rows by code column
    const sortedRows = [...rows].sort((a, b) => {
      const codeA = a.code || "";
      const codeB = b.code || "";

      // Handle numeric codes by parsing them
      const numA = parseInt(codeA) || 0;
      const numB = parseInt(codeB) || 0;

      // If both are numbers, sort numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      // Otherwise sort alphabetically
      return direction === 'asc' ? codeA.localeCompare(codeB) : codeB.localeCompare(codeA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortBySortOrder = (direction: 'asc' | 'desc') => {
    // Sort rows by no field
    const sortedRows = [...rows].sort((a, b) => {
      const noA = a.no || 0;
      const noB = b.no || 0;
      return direction === 'asc' ? noA - noB : noB - noA;
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByDelivery = (direction: 'asc' | 'desc') => {
    // Sort rows by delivery column (A-Z or Z-A)
    const sortedRows = [...rows].sort((a, b) => {
      const deliveryA = a.delivery || "";
      const deliveryB = b.delivery || "";
      return direction === 'asc' ? deliveryA.localeCompare(deliveryB) : deliveryB.localeCompare(deliveryA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByLocation = (direction: 'asc' | 'desc') => {
    // Sort rows by location column (A-Z or Z-A)
    const sortedRows = [...rows].sort((a, b) => {
      const locationA = a.location || "";
      const locationB = b.location || "";
      return direction === 'asc' ? locationA.localeCompare(locationB) : locationB.localeCompare(locationA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByRoute = (direction: 'asc' | 'desc') => {
    // Sort rows by route column (A-Z or Z-A)
    const sortedRows = [...rows].sort((a, b) => {
      const routeA = a.route || "";
      const routeB = b.route || "";
      return direction === 'asc' ? routeA.localeCompare(routeB) : routeB.localeCompare(routeA);
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortByKilometer = (direction: 'asc' | 'desc') => {
    // Sort rows by kilometer column (0-9 or 9-0)
    const sortedRows = [...rows].sort((a, b) => {
      const kmA = parseFloat((a as any).kilometer) || 0;
      const kmB = parseFloat((b as any).kilometer) || 0;
      return direction === 'asc' ? kmA - kmB : kmB - kmA;
    });

    // Reorder rows using the mutation
    const sortedRowIds = sortedRows.map((row) => row.id);
    onReorderRows.mutate(sortedRowIds);
  };

  const handleSortToggle = (column: string) => {
    // Cycle through: null → asc → desc → null
    let newDirection: 'asc' | 'desc' | null = null;
    
    if (!sortState || sortState.column !== column) {
      // First click: set to ascending
      newDirection = 'asc';
    } else if (sortState.direction === 'asc') {
      // Second click: set to descending
      newDirection = 'desc';
    } else {
      // Third click: clear sort
      newDirection = null;
    }
    
    if (newDirection === null) {
      setSortState(null);
      // No need to reorder, just clear the state
      return;
    }
    
    setSortState({ column, direction: newDirection });
    
    // Apply the sort
    switch (column) {
      case "route":
        handleSortByRoute(newDirection);
        break;
      case "code":
        handleSortByCode(newDirection);
        break;
      case "delivery":
        handleSortByDelivery(newDirection);
        break;
      case "location":
        handleSortByLocation(newDirection);
        break;
      case "kilometer":
        handleSortByKilometer(newDirection);
        break;
      case "order":
        handleSortBySortOrder(newDirection);
        break;
      default:
        break;
    }
  };

  const handleDeleteClick = (rowId: string) => {
    setSelectedRowForDelete(rowId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRowForDelete) {
      onDeleteRow.mutate(selectedRowForDelete);
      setDeleteConfirmOpen(false);
      setSelectedRowForDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedRowForDelete(null);
  };

  // Filter toggle functions
  const toggleRouteFilter = (route: string) => {
    if (!onFilterValueChange) return;
    
    const newFilters = filterValue.includes(route)
      ? filterValue.filter(f => f !== route)
      : [...filterValue, route];
    onFilterValueChange(newFilters);
  };

  const toggleDeliveryFilter = (delivery: string) => {
    if (!onDeliveryFilterValueChange) return;
    
    const newFilters = deliveryFilterValue.includes(delivery)
      ? deliveryFilterValue.filter(f => f !== delivery)
      : [...deliveryFilterValue, delivery];
    onDeliveryFilterValueChange(newFilters);
  };

  return (
    <div
      className="border-2 border-slate-300 dark:border-blue-500/30 shadow-2xl table-container my-10 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-blue-950/40 dark:to-gray-900/40 backdrop-blur-sm"
      data-testid="data-table"
    >
      {/* Single Row: Filter/Sort/Search + Action Buttons */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-blue-200 dark:border-blue-500/30 ocean:border-cyan-500/40 bg-gradient-to-r from-blue-50/80 via-gray-100/40 to-white/80 dark:from-blue-950/40 dark:to-gray-900/40 ocean:from-cyan-950/50 ocean:to-blue-950/50 backdrop-blur-sm shadow-lg transition-all duration-500">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Custom Toolbar Content */}
          {customToolbarContent && (
            <div className="mr-4 border-r border-slate-300 dark:border-blue-500/20 pr-4">
              {customToolbarContent}
            </div>
          )}
          
          {/* Sort Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="h-8 w-8 p-0 pagination-button rounded-lg"
                data-testid="sort-trigger"
              >
                {sortState ? (
                  sortState.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                ) : (
                  <ArrowUpDown className="w-4 h-4 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
              <div className="p-3 btn-glass rounded-lg">
                <h4 className="font-medium text-sm mb-3 pb-2 border-b border-border/20 flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  Sort By
                </h4>
                <div className="space-y-1.5 text-sm">
                  <Button
                    variant={sortState?.column === 'route' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'route' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('route')}
                    data-testid="button-sort-route"
                  >
                    <span>Route</span>
                    {sortState?.column === 'route' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'route' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'code' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'code' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('code')}
                    data-testid="button-sort-code"
                  >
                    <span>Code</span>
                    {sortState?.column === 'code' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'code' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'location' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'location' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('location')}
                    data-testid="button-sort-location"
                  >
                    <span>Location</span>
                    {sortState?.column === 'location' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'location' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'delivery' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'delivery' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('delivery')}
                    data-testid="button-sort-delivery"
                  >
                    <span>Delivery</span>
                    {sortState?.column === 'delivery' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'delivery' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  <Button
                    variant={sortState?.column === 'kilometer' ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-between text-xs ${
                      sortState?.column === 'kilometer' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                    }`}
                    onClick={() => handleSortToggle('kilometer')}
                    data-testid="button-sort-kilometer"
                  >
                    <span>Kilometer</span>
                    {sortState?.column === 'kilometer' && (
                      sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                    {sortState?.column !== 'kilometer' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                  </Button>
                  {isFiltered && (
                    <Button
                      variant={sortState?.column === 'order' ? 'default' : 'ghost'}
                      size="sm"
                      className={`w-full justify-between text-xs ${
                        sortState?.column === 'order' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                      }`}
                      onClick={() => handleSortToggle('order')}
                      data-testid="button-sort-order"
                    >
                      <span>No</span>
                      {sortState?.column === 'order' && (
                        sortState.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                      {sortState?.column !== 'order' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Combined Filter Section */}
          <div className="w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-8 w-8 p-0 pagination-button rounded-lg relative" 
                  data-testid="combined-filter-trigger"
                >
                  <Filter className="w-4 h-4" />
                  {(filterValue.length > 0 || deliveryFilterValue.length > 0) && (
                    <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-500 dark:bg-red-400 rounded-full w-2.5 h-2.5 border-2 border-white dark:border-gray-900 z-50"></span>
                  )}
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <div className="p-3 btn-glass rounded-lg">
                {/* Routes Section - Hidden in shared view */}
                {!isSharedView && (
                  <>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-accent" />
                          Routes ({filterValue.length} selected)
                        </h4>
                        {filterValue.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => onFilterValueChange?.([])} className="h-auto p-1 text-xs">
                            <X className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                        {routeOptions.filter(route => route !== "WH").map(route => (
                          <div key={route} className="flex items-center space-x-2">
                            <Checkbox
                              id={`route-${route}`}
                              checked={filterValue.includes(route)}
                              onCheckedChange={() => toggleRouteFilter(route)}
                            />
                            <Label htmlFor={`route-${route}`} className="text-xs cursor-pointer">
                              📍 {route}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Separator */}
                    <div className="border-t border-border/20 my-2"></div>
                  </>
                )}
                
                {/* Trips Section (Delivery Filter) */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Filter className="w-3 h-3 text-orange-500" />
                      Hide Deliveries ({deliveryFilterValue.length} hidden)
                    </h4>
                    {deliveryFilterValue.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => onDeliveryFilterValueChange?.([])} className="h-auto p-1 text-xs">
                        <X className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                    {deliveryOptions.map(delivery => (
                      <div key={delivery} className="flex items-center space-x-2">
                        <Checkbox
                          id={`delivery-${delivery}`}
                          checked={deliveryFilterValue.includes(delivery)}
                          onCheckedChange={() => toggleDeliveryFilter(delivery)}
                        />
                        <Label htmlFor={`delivery-${delivery}`} className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-xs cursor-pointer font-medium">
                          🚫 {delivery}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>
        
        {/* Middle: Search Input */}
        <div className="flex-1 max-w-[30%] lg:max-w-md ml-4 flex items-center gap-2">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange?.(e.target.value)}
              className="pl-7 pr-7 h-8 bg-transparent text-foreground placeholder:text-muted-foreground border-2 border-primary/20 hover:border-primary/30 hover:bg-primary/5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:border-primary/40 focus-visible:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 transition-colors text-sm"
              data-testid="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchTermChange?.('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 w-5 h-5 rounded-full hover:bg-muted/50 transition-colors flex items-center justify-center"
                data-testid="clear-search"
                aria-label="Clear search"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
        
        {/* Right Side: Action Buttons */}
        {!isSharedView && (
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {onShowCustomization && (
              <Button
                onClick={onShowCustomization}
                variant="outline"
                size="sm"
                className="h-8 px-3 pagination-button rounded-lg text-xs"
                title="Customize Columns"
                data-testid="button-customize-columns"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="hidden sm:inline ml-1.5">Customize</span>
              </Button>
            )}
            {onOptimizeRoute && (
              <Button
                onClick={onOptimizeRoute}
                variant="outline"
                size="sm"
                className="h-8 px-3 pagination-button rounded-lg text-xs"
                title="Route Optimization"
                data-testid="button-optimize-route"
              >
                <Route className="w-3.5 h-3.5" />
                <span className="hidden sm:inline ml-1.5">Optimize</span>
              </Button>
            )}
            {onShareTable && !hideShareButton && (
              <Button
                onClick={onShareTable}
                variant="outline"
                size="sm"
                className="h-8 px-3 pagination-button rounded-lg text-xs"
                title="Share Table"
                data-testid="button-share-table"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline ml-1.5">Share</span>
              </Button>
            )}
          </div>
        )}
      </div>
      {/* Active Filters Display */}
      {(searchTerm || filterValue.length > 0 || deliveryFilterValue.length > 0) && (
        <div className="px-6 py-2 border-b border-border/20 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 dark:from-blue-500/5 dark:via-transparent dark:to-blue-500/5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-muted-foreground font-medium text-xs">Active:</span>
            {searchTerm && (
              <div className="flex items-center gap-0.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs">
                <Search className="w-2.5 h-2.5" />
                <span>"{searchTerm}"</span>
                <button onClick={() => onSearchTermChange?.('')} className="ml-0.5 p-0.5 hover:text-primary/70 flex items-center justify-center rounded-full hover:bg-primary/10" aria-label="Remove text filter">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            {filterValue.map(route => {
              const routeUpper = route.toUpperCase();
              const isKL = routeUpper.includes('KL');
              const isSL = routeUpper.includes('SL');
              
              return (
                <button 
                  key={route}
                  onClick={() => toggleRouteFilter(route)}
                  className="flex items-center gap-1 px-2 py-1 bg-transparent hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 rounded-full transition-all cursor-pointer active:scale-95"
                  aria-label={`Remove route filter: ${route}`}
                >
                  {isKL ? (
                    <img src="/assets/kl-flag.png" alt="KL" className="w-4 h-3 object-contain" />
                  ) : isSL ? (
                    <img src="/assets/selangor-flag.png" alt="Selangor" className="w-4 h-3 object-contain" />
                  ) : (
                    <Filter className="w-2.5 h-2.5" />
                  )}
                  <span className="text-[8px] font-semibold text-gray-400 dark:text-gray-500">{route}</span>
                </button>
              );
            })}
            {deliveryFilterValue.map(delivery => (
              <button 
                key={delivery}
                onClick={() => toggleDeliveryFilter(delivery)}
                className="flex items-center gap-1 px-2 py-1 bg-transparent hover:bg-green-500/10 border border-transparent hover:border-green-500/20 rounded-full transition-all cursor-pointer active:scale-95"
                aria-label={`Remove delivery filter: ${delivery}`}
              >
                <Filter className="w-2.5 h-2.5" />
                <span className="text-[8px] font-semibold text-green-700 dark:text-green-300">{delivery}</span>
              </button>
            ))}
            {/* Clear All button */}
            <button 
              onClick={onClearAllFilters}
              className="flex items-center gap-1 px-2 py-1 bg-transparent hover:bg-red-500/10 border border-transparent hover:border-transparent rounded-full transition-all cursor-pointer active:scale-95"
              data-testid="clear-all-filters"
              aria-label="Clear all filters"
            >
              <X className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
              <span className="text-[8px] font-semibold text-red-600 dark:text-red-400">Clear All</span>
            </button>
            <div className="ml-auto text-muted-foreground text-xs">
              {filteredRowsCount} of {totalRowsCount} results
            </div>
          </div>
        </div>
      )}
      <div className="w-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="border border-slate-300 dark:border-blue-500/20 rounded-lg overflow-hidden flex flex-col">
            {/* Scrollable Container for Header, Body, Footer */}
            <div className="overflow-x-auto overflow-y-auto max-h-[700px]">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 z-20 [&_tr]:border-b [&_tr]:border-slate-300 dark:[&_tr]:border-blue-500/20 shadow-lg bg-gradient-to-b from-slate-200 to-slate-100 dark:from-blue-900/30 dark:to-blue-950/20">
              <Droppable
                droppableId="columns"
                direction="horizontal"
                type="column"
              >
                {(provided) => (
                  <TableRow
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="border-0"
                  >
                    {visibleColumns.map((column, index) => (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                      >
                        {(provided) => (
                          <TableHead
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="px-4 py-2 text-center table-header-footer-12px font-semibold tracking-wide sticky top-0 whitespace-nowrap border-transparent text-slate-700 dark:text-blue-100"
                            style={{
                              textAlign: "center",
                              textDecoration: "normal",
                              fontSize: "10px",
                              ...(column.dataKey === "location" && {
                                minWidth: `${120 + 15}px`,
                              }),
                            }}
                            colSpan={column.dataKey === "location" ? 3 : 1}
                            data-testid={`column-header-${column.dataKey}`}
                          >
                            <ColumnHeader
                              column={column}
                              dragHandleProps={provided.dragHandleProps}
                              onDelete={() => onDeleteColumn.mutate(column.id)}
                              isAuthenticated={isAuthenticated}
                              editMode={editMode}
                            />
                          </TableHead>
                        )}
                      </Draggable>
                    ))}
                    <TableHead
                      className="p-0 py-2 text-center table-header-footer-12px font-semibold tracking-wide sticky top-0 whitespace-nowrap border-transparent"
                      style={{
                        textAlign: "center",
                        textDecoration: "normal",
                        fontSize: "10px",
                        width: "140px",
                        minWidth: "140px",
                        maxWidth: "140px"
                      }}
                    >
                      <span className="bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                        Actions
                      </span>
                    </TableHead>
                    {provided.placeholder}
                  </TableRow>
                )}
              </Droppable>
            </TableHeader>
            
            {/* Table Body */}
            <Droppable droppableId="rows" type="row">
              {(provided) => (
                <TableBody
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="pt-2 motion-layer zoom-in"
                  key={`page-${currentPage}`}
                >
                  {isLoading
                    ? Array.from({ length: Math.min(pageSize, 5) }).map(
                        (_, index) => (
                          <tr
                            key={`skeleton-${index}`}
                            className={`skeleton-row border-b border-gray-200/20 dark:border-white/5 shadow-md dark:shadow-none ${
                              index % 2 === 0 
                                ? 'bg-white/80 dark:bg-gray-900/50' 
                                : 'bg-blue-50/50 dark:bg-blue-900/20'
                            } transition-opacity duration-200`}
                          >
                            {/* Actions column */}
                            <td className="p-3 w-12">
                              <div className="flex gap-1 justify-center opacity-30">
                                <div className="skeleton w-6 h-6 rounded-md bg-gradient-to-r from-gray-500/20 to-slate-500/20 animate-pulse" />
                                <div className="skeleton w-6 h-6 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" style={{animationDelay: "0.1s"}} />
                                <div className="skeleton w-6 h-6 rounded-md bg-gradient-to-r from-green-500/20 to-blue-500/20 animate-pulse" style={{animationDelay: "0.2s"}} />
                                <div className="skeleton w-6 h-6 rounded-md bg-gradient-to-r from-yellow-500/20 to-green-500/20 animate-pulse" style={{animationDelay: "0.3s"}} />
                              </div>
                            </td>

                            {/* Dynamic columns - cleaner skeleton */}
                            {visibleColumns.map((column) => (
                              <td
                                key={column.id}
                                className="p-3"
                                colSpan={column.dataKey === "location" ? 3 : 1}
                              >
                                {column.dataKey === "images" ? (
                                  <div className="skeleton w-12 h-8 rounded mx-auto bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
                                ) : column.dataKey === "delivery" ? (
                                  <div className="skeleton w-16 h-6 rounded-full mx-auto bg-gradient-to-r from-green-400/20 to-blue-400/20 animate-pulse" />
                                ) : column.dataKey === "location" ? (
                                  <div className="skeleton w-32 h-4 mx-auto bg-gradient-to-r from-yellow-400/20 to-green-400/20 animate-pulse" />
                                ) : (
                                  <div className="skeleton w-20 h-4 mx-auto bg-gradient-to-r from-cyan-400/20 to-blue-400/20 animate-pulse" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ),
                      )
                    : paginatedRows.map((row, index) => (
                        <Draggable
                          key={row.id}
                          draggableId={row.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group ${
                                (() => {
                                  // Main page (NOT shared view): only dim if power off (inactive)
                                  if (!isSharedView) {
                                    if (row.active === false) {
                                      return "bg-slate-300 dark:bg-gray-700/60 opacity-50";
                                    } else {
                                      return "bg-white dark:bg-blue-900/10";
                                    }
                                  }
                                  
                                  // Shared view & custom table: apply schedule-based styling
                                  const status = getScheduleStatus(row);
                                  if (status === 'inactive') {
                                    return "bg-slate-300 dark:bg-gray-700/60 opacity-50";
                                  } else if (status === 'off-schedule') {
                                    return "bg-white dark:bg-blue-900/10 opacity-60";
                                  } else {
                                    return "bg-white dark:bg-blue-900/10";
                                  }
                                })()
                              } hover:bg-slate-50 hover:shadow-md dark:hover:bg-blue-800/20 dark:hover:shadow-[0_2px_12px_rgba(59,130,246,0.25)] transition-all duration-300 hover:-translate-y-0.5 border-b border-slate-200 dark:border-blue-700/20 ${
                                snapshot.isDragging ? "drag-elevate" : ""
                              }`}
                              data-testid={`table-row-${row.id}`}
                            >
                              {visibleColumns.map((column) => (
                                <TableCell
                                  key={column.id}
                                  className="p-4 align-middle [&:has([role=checkbox])]:pr-0 px-4 py-2 table-cell-10px text-center text-[9px] text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap"
                                  style={{
                                    minWidth: "100px",
                                    ...(column.dataKey === "location" && {
                                      minWidth: `${120 + 15}px`,
                                      fontSize: "10px",
                                    }),
                                    ...(column.dataKey === "delivery" && {
                                      minWidth: "110px",
                                      fontSize: "10px",
                                      fontWeight: "normal",
                                    }),
                                    ...(column.dataKey === "id" && {
                                      minWidth: "120px",
                                    }),
                                    ...(column.dataKey === "code" && {
                                      minWidth: "100px",
                                    }),
                                    ...(column.dataKey === "route" && {
                                      minWidth: "90px",
                                    }),
                                    ...(column.dataKey === "no" && {
                                      minWidth: "70px",
                                    }),
                                    ...(column.dataKey === "kilometer" && {
                                      minWidth: "80px",
                                    }),
                                    ...(column.dataKey === "tollPrice" && {
                                      minWidth: "90px",
                                    }),
                                    ...(column.dataKey === "tngRoute" && {
                                      minWidth: "90px",
                                    }),
                                    ...(column.dataKey === "images" && {
                                      minWidth: "120px",
                                    }),
                                    ...(column.type === "currency" && !column.dataKey.match(/tollPrice|tngRoute/) && {
                                      minWidth: "100px",
                                    }),
                                  }}
                                  colSpan={
                                    column.dataKey === "location" ? 3 : 1
                                  }
                                  data-testid={`cell-${row.id}-${column.dataKey}`}
                                >
                                  {column.dataKey === "images" ? (
                                    <ImageIconButton
                                      images={row.images}
                                      rowId={row.id}
                                    />
                                  ) : column.dataKey === "info" ? (
                                    row.info && row.info.trim() ? (
                                      <InfoModal
                                        info={row.info}
                                        rowId={row.id}
                                        code={row.code}
                                        route={row.route}
                                        location={row.location}
                                        latitude={row.latitude ? String(row.latitude) : undefined}
                                        longitude={row.longitude ? String(row.longitude) : undefined}
                                        qrCode={row.qrCode || undefined}
                                        no={row.no}
                                        markerColor={row.markerColor || undefined}
                                        images={row.images || []}
                                        onUpdateRow={(updates) =>
                                          onUpdateRow.mutate({
                                            id: row.id,
                                            updates,
                                          })
                                        }
                                        onOpenImageModal={() => onSelectRowForImage(row.id)}
                                        editMode={false}
                                        allRows={rows}
                                        iconType="info"
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )
                                  ) : column.dataKey === "delivery" ? (
                                    editMode && column.isEditable === "true" ? (
                                      <EditableCell
                                        value={getCellValue(row, column, index)}
                                        type="select"
                                        options={deliveryOptions}
                                        dataKey={column.dataKey}
                                        onSave={(value) =>
                                          onUpdateRow.mutate({
                                            id: row.id,
                                            updates: {
                                              [column.dataKey]: value,
                                            },
                                          })
                                        }
                                      />
                                    ) : (
                                      <span className="text-[9px] text-black dark:text-slate-400 font-medium">
                                        {getCellValue(row, column, index) || '—'}
                                      </span>
                                    )
                                  ) : column.dataKey === "id" ? (
                                    <span className="font-mono text-black dark:text-slate-400" style={{ fontSize: '10px' }}>
                                      {getCellValue(row, column, index)}
                                    </span>
                                  ) : column.dataKey === "no" && editMode && row.location !== "QL Kitchen" ? (
                                    <EditableCell
                                      value={String(row.no || 0)}
                                      type="number"
                                      dataKey={column.dataKey}
                                      onSave={(value) =>
                                        onUpdateRow.mutate({
                                          id: row.id,
                                          updates: { no: parseInt(value) || 0 },
                                        })
                                      }
                                    />
                                  ) : editMode &&
                                    column.isEditable === "true" ? (
                                    <EditableCell
                                      value={getCellValue(row, column, index)}
                                      type={column.type}
                                      options={column.options || undefined}
                                      dataKey={column.dataKey}
                                      onSave={(value) =>
                                        onUpdateRow.mutate({
                                          id: row.id,
                                          updates: { [column.dataKey]: value },
                                        })
                                      }
                                    />
                                  ) : (
                                    <span className="text-[9px] text-black dark:text-slate-400 font-medium">
                                      {column.dataKey === "kilometer" ? (
                                        <MobileTooltip
                                          content={(() => {
                                            if (row.location === "QL Kitchen") {
                                              return "Starting Point";
                                            }
                                            const segmentDistance = (row as any).segmentDistance;
                                            if (segmentDistance && typeof segmentDistance === "number" && segmentDistance > 0) {
                                              return `${segmentDistance.toFixed(2)} km`;
                                            }
                                            return "Starting point";
                                          })()}
                                          showBelow={index === 0 && index !== paginatedRows.length - 1}
                                        >
                                          <span className="cursor-help">
                                            {getCellValue(row, column, index)}
                                          </span>
                                        </MobileTooltip>
                                      ) : (
                                        getCellValue(row, column, index)
                                      )}
                                    </span>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell
                                className="p-0 text-sm text-center text-foreground"
                                style={{ textAlign: "center", width: "140px", minWidth: "140px", maxWidth: "140px" }}
                              >
                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {editMode ? (
                                      <>
                                        {/* Manage Image button - edit mode only */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className={`bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 ${
                                            onUpdateRow.isPending &&
                                            onUpdateRow.variables?.id === row.id
                                              ? "opacity-50"
                                              : ""
                                          }`}
                                          onClick={() => onSelectRowForImage(row.id)}
                                          disabled={
                                            onUpdateRow.isPending &&
                                            onUpdateRow.variables?.id === row.id
                                          }
                                          data-testid={`button-add-image-${row.id}`}
                                          title="Manage images"
                                        >
                                          <PlusCircle className="w-4 h-4" />
                                        </Button>
                                        {/* Edit Modal button - edit mode only */}
                                        <InfoModal
                                          info={row.info || ""}
                                          rowId={row.id}
                                          code={row.code}
                                          route={row.route}
                                          location={row.location}
                                          latitude={row.latitude ? String(row.latitude) : undefined}
                                          longitude={row.longitude ? String(row.longitude) : undefined}
                                          qrCode={row.qrCode || undefined}
                                          no={row.no}
                                          markerColor={row.markerColor || undefined}
                                          images={row.images || []}
                                          onUpdateRow={(updates) =>
                                            onUpdateRow.mutate({
                                              id: row.id,
                                              updates,
                                            })
                                          }
                                          onOpenImageModal={() => onSelectRowForImage(row.id)}
                                          editMode={editMode}
                                          allRows={rows}
                                          iconType="filetext"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        {/* Image Lightbox button - non-edit mode only (including shared view) */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className={`bg-transparent border-transparent hover:bg-transparent hover:border-transparent ${
                                            row.images && row.images.length > 0
                                              ? "text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                                              : "text-gray-400 dark:text-gray-600"
                                          }`}
                                          onClick={() => {
                                            if (row.images && row.images.length > 0) {
                                              onSelectRowForImage(row.id);
                                            }
                                          }}
                                          disabled={!row.images || row.images.length === 0}
                                          data-testid={`button-image-lightbox-${row.id}`}
                                        >
                                          {row.images && row.images.length > 0 ? (
                                            <ImageIcon className="w-4 h-4" />
                                          ) : (
                                            <ImageOff className="w-4 h-4" />
                                          )}
                                        </Button>
                                        {/* Info button - normal mode only */}
                                        <InfoModal
                                          info={row.info || ""}
                                          rowId={row.id}
                                          code={row.code}
                                          route={row.route}
                                          location={row.location}
                                          latitude={row.latitude ? String(row.latitude) : undefined}
                                          longitude={row.longitude ? String(row.longitude) : undefined}
                                          qrCode={row.qrCode || undefined}
                                          no={row.no}
                                          markerColor={row.markerColor || undefined}
                                          images={row.images || []}
                                          onUpdateRow={(updates) =>
                                            onUpdateRow.mutate({
                                              id: row.id,
                                              updates,
                                            })
                                          }
                                          onOpenImageModal={() => onSelectRowForImage(row.id)}
                                          editMode={editMode}
                                          allRows={rows}
                                          iconType="info"
                                        />
                                      </>
                                    )}
                                    {!isSharedView && (
                                      <div
                                        {...provided.dragHandleProps}
                                        className={`p-2 rounded ${
                                          snapshot.isDragging ? "cursor-grabbing" : editMode ? "cursor-grab" : "cursor-default"
                                        } text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all`}
                                        title={editMode ? "Drag to reorder" : ""}
                                        data-testid={`drag-handle-${row.id}`}
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                    )}
                                    {editMode && (
                                      /* Delete button - edit mode only */
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-blue-400 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 ${
                                          onDeleteRow.isPending &&
                                          onDeleteRow.variables === row.id
                                            ? "mutation-loading"
                                            : ""
                                        }`}
                                        onClick={() => handleDeleteClick(row.id)}
                                        disabled={
                                          onDeleteRow.isPending &&
                                          onDeleteRow.variables === row.id
                                        }
                                        data-testid={`button-delete-row-${row.id}`}
                                        title="Delete row"
                                      >
                                        {onDeleteRow.isPending &&
                                        onDeleteRow.variables === row.id ? (
                                          <InlineLoading type="particles" />
                                        ) : (
                                          <Trash className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    {editMode ? (
                                      <Select
                                        value={row.deliveryAlt || "normal"}
                                        onValueChange={(value) => {
                                          const nextActive = value !== "inactive";
                                          onUpdateRow.mutate({
                                            id: row.id,
                                            updates: { deliveryAlt: value, active: nextActive },
                                          });
                                        }}
                                        disabled={
                                          onUpdateRow.isPending &&
                                          onUpdateRow.variables?.id === row.id
                                        }
                                      >
                                        <SelectTrigger 
                                          className={`h-8 w-8 text-xs border-transparent bg-transparent p-0 ${
                                            (() => {
                                              // Apply 3-color styling ONLY for shared view or edit mode
                                              if (isSharedView || editMode) {
                                                const status = getScheduleStatus(row);
                                                
                                                if (status === 'inactive') {
                                                  // Red for inactive
                                                  return "text-red-500 dark:text-red-400";
                                                } else if (status === 'off-schedule') {
                                                  // Yellow for off-schedule (with opacity)
                                                  return "opacity-60 text-yellow-500 dark:text-yellow-400";
                                                } else {
                                                  // Green for on-schedule
                                                  return "text-green-500 dark:text-green-400";
                                                }
                                              } else {
                                                // Regular view mode: 3-color system (green, yellow, red)
                                                if (row.deliveryAlt === "inactive") {
                                                  return "text-red-500 dark:text-red-400";
                                                } else if (row.deliveryAlt === "alt1" || row.deliveryAlt === "alt2") {
                                                  return "text-yellow-500 dark:text-yellow-400";
                                                } else {
                                                  return "text-green-500 dark:text-green-400";
                                                }
                                              }
                                            })()
                                          }`}
                                          data-testid={`select-delivery-alt-${row.id}`}
                                        >
                                          <SelectValue>
                                            {(() => {
                                              const status = getScheduleStatus(row);
                                              if (status === 'inactive') {
                                                return <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">✗</div>;
                                              } else if (status === 'off-schedule') {
                                                return <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold opacity-60">✗</div>;
                                              } else {
                                                return <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>;
                                              }
                                            })()}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="normal">
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                                              <span className="text-green-600 dark:text-green-400 text-xs font-medium">Daily</span>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="alt1">
                                            <div className="flex items-center gap-2">
                                              {(() => {
                                                const now = new Date();
                                                const baseDate = new Date('2025-12-02');
                                                const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                                const daysSinceBase = Math.floor((currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
                                                const isAlt1Day = daysSinceBase % 2 === 1;
                                                return (
                                                  <div className={`w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold ${!isAlt1Day ? 'opacity-60' : ''}`}>
                                                    {isAlt1Day ? '✓' : '✗'}
                                                  </div>
                                                );
                                              })()}
                                              <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">Alt 1 (Even)</span>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="alt2">
                                            <div className="flex items-center gap-2">
                                              {(() => {
                                                const now = new Date();
                                                const baseDate = new Date('2025-12-02');
                                                const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                                const daysSinceBase = Math.floor((currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
                                                const isAlt2Day = daysSinceBase % 2 === 0;
                                                return (
                                                  <div className={`w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold ${!isAlt2Day ? 'opacity-60' : ''}`}>
                                                    {isAlt2Day ? '✓' : '✗'}
                                                  </div>
                                                );
                                              })()}
                                              <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">Alt 2 (Odd)</span>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="inactive">
                                            <div className="flex items-center gap-2">
                                              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">✗</div>
                                              <span className="text-red-500 dark:text-red-400 text-xs font-medium">Off</span>
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`border-transparent bg-transparent hover:bg-transparent cursor-not-allowed ${
                                          (() => {
                                            // Apply 3-color styling ONLY for shared view or edit mode
                                            if (isSharedView || editMode) {
                                              const status = getScheduleStatus(row);
                                              
                                              if (status === 'inactive') {
                                                // Red for inactive - NO opacity reduction
                                                return "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300";
                                              } else if (status === 'off-schedule') {
                                                // Yellow for off-schedule (with opacity for disabled look)
                                                return "opacity-40 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500";
                                              } else {
                                                // Green for on-schedule - slight opacity
                                                return "opacity-60 text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-500";
                                              }
                                            } else {
                                              // Regular view mode: 3-color system (green, yellow, red)
                                              if (row.deliveryAlt === "inactive") {
                                                return "text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300";
                                              } else if (row.deliveryAlt === "alt1" || row.deliveryAlt === "alt2") {
                                                return "opacity-60 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-500";
                                              } else {
                                                return "opacity-60 text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-500";
                                              }
                                            }
                                          })()
                                        }`}
                                        disabled={true}
                                        data-testid={`button-toggle-active-${row.id}`}
                                      >
                                        <Power className="w-4 h-4" />
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                  {provided.placeholder}
                </TableBody>
              )}
            </Droppable>
            
            {/* Table Footer */}
            <tfoot className="sticky bottom-0 z-20 shadow-lg bg-gradient-to-t from-slate-200 to-slate-100 dark:from-blue-900/30 dark:to-blue-950/20">
              <TableRow className="border-t border-slate-300 dark:border-blue-500/20">
                {visibleColumns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    className="px-4 py-2 text-center table-header-footer-12px font-semibold tracking-wide sticky bottom-0 whitespace-nowrap"
                    style={{
                      textAlign: "center",
                      fontSize: "10px",
                    }}
                    colSpan={column.dataKey === "location" ? 3 : 1}
                  >
                    {index === 0 ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent" style={{fontSize: '11px'}}>Totals</span>
                    ) : column.dataKey === "no" ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">—</span>
                    ) : column.dataKey === "kilometer" ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {(() => {
                          const total = calculateColumnSum("kilometer", column.type);
                          return total > 0 ? `${total.toFixed(2)} km` : "—";
                        })()}
                      </span>
                    ) : column.dataKey === "tngRoute" &&
                      column.type === "currency" ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {formatCurrency(
                          calculateColumnSum("tngRoute", column.type),
                        )}
                      </span>
                    ) : column.dataKey === "tollPrice" &&
                      column.type === "currency" ? (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        {formatCurrency(
                          calculateColumnSum("tollPrice", column.type),
                        )}
                      </span>
                    ) : (
                      <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">—</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="p-0 text-center table-header-footer-12px font-semibold tracking-wide sticky bottom-0 whitespace-nowrap" style={{ textAlign: "center", fontSize: '10px', width: "140px", minWidth: "140px", maxWidth: "140px" }}>
                  <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">—</span>
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
          </div>
          </div>

          {/* Pagination Controls */}
          {!disablePagination && (
            <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 border-t border-blue-200 dark:border-blue-500/30 ocean:border-cyan-500/40 bg-gradient-to-r from-blue-50/80 via-gray-100/40 to-white/80 dark:from-blue-950/40 dark:to-gray-900/40 ocean:from-cyan-950/50 ocean:to-blue-950/50 backdrop-blur-sm shadow-lg transition-all duration-500">
              
              <div className="flex items-center justify-between gap-1 w-full">
                {/* Left: Entries per page selector with showing text */}
                <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-5 w-5 p-0 text-[8px] pagination-button rounded-lg [&>svg]:hidden flex items-center justify-center">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="999999">
                        <div className="flex items-center gap-1">
                          <Infinity className="w-3 h-3" />
                          <span>All</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="whitespace-nowrap">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRowsCount)} of {filteredRowsCount} items in {totalPages} pages
                  </span>
                </div>

                {/* Center: Page numbers */}
                <div className="flex items-center gap-1">
                {/* Show First button only when total pages > 5 and not showing page 1 */}
                {totalPages > 5 && currentPage > 3 && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => goToPage(1)}
                    className="pagination-button h-5 w-5 p-0"
                    data-testid="button-first-page"
                  >
                    <ChevronsLeft className="h-2 w-2" />
                  </Button>
                )}

                <div className="flex items-center gap-1">
                  {(() => {
                    // Max 5 buttons untuk page numbers
                    const maxButtons = 5;
                    
                    // Jika total pages <= 5, show all pages (no arrows)
                    if (totalPages <= maxButtons) {
                      const pages = [];
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                      
                      return pages.map((pageNum) => {
                        const isCurrentPage = pageNum === currentPage;
                        return (
                          <Button
                            key={pageNum}
                            variant="outline"
                            size="xs"
                            onClick={() => goToPage(pageNum)}
                            className={`pagination-button page-number min-w-[20px] h-5 text-[8px] ${
                              isCurrentPage ? "active" : ""
                            }`}
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      });
                    }
                    
                    // For more than 5 pages, calculate sliding window
                    let startPage, endPage;
                    
                    if (currentPage <= 3) {
                      // Near start: show 1 2 3 4 + arrow last
                      startPage = 1;
                      endPage = 4;
                    } else if (currentPage >= totalPages - 2) {
                      // Near end: show arrow first + last 4 pages
                      startPage = totalPages - 3;
                      endPage = totalPages;
                    } else {
                      // Middle: show arrow first + 2 3 4 + arrow last
                      startPage = currentPage - 1;
                      endPage = currentPage + 1;
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    return pages.map((pageNum) => {
                      const isCurrentPage = pageNum === currentPage;

                      return (
                        <Button
                          key={pageNum}
                          variant="outline"
                          size="xs"
                          onClick={() => goToPage(pageNum)}
                          className={`pagination-button page-number min-w-[24px] h-6 text-[9px] ${
                            isCurrentPage ? "active" : ""
                          }`}
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    });
                  })()}
                </div>

                {/* Show Last button only when total pages > 5 and not showing last page */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => goToPage(totalPages)}
                    className="pagination-button h-5 w-5 p-0"
                    data-testid="button-last-page"
                  >
                    <ChevronsRight className="h-2 w-2" />
                  </Button>
                )}
                </div>
              </div>
            </div>
          )}
        </DragDropContext>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] transition-smooth-fast">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this row? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
