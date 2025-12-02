import React, { useEffect, useState, useMemo } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { useTableData } from "@/hooks/use-table-data";
import { LoadingOverlay } from "@/components/skeleton-loader";
import { Footer } from "@/components/footer";
import { Database } from "lucide-react";
import { calculateDistance } from "@/utils/distance";
import type { CustomTable, TableColumn, TableRow } from "@shared/schema";

export default function CustomTableView() {
  const [, params] = useRoute("/custom/:shareId");
  const shareId = params?.shareId;

  const { 
    columns, 
    isLoading,
  } = useTableData();

  // Fetch custom table details
  const { data: customTable, isLoading: isLoadingTable, error } = useQuery<CustomTable>({
    queryKey: [`/api/custom-tables/share/${shareId}`],
    enabled: !!shareId,
  });

  // Fetch custom table rows
  const { data: rows = [], isLoading: isLoadingRows } = useQuery<TableRow[]>({
    queryKey: [`/api/custom-tables/${customTable?.id}/rows`],
    enabled: !!customTable?.id,
  });

  // Local state for interactive features (delivery filter ONLY - route filter hidden but still applied)
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryFilters, setDeliveryFilters] = useState<string[]>([]);
  const [routeFilters, setRouteFilters] = useState<string[]>([]);
  const [selectedRowForImage, setSelectedRowForImage] = useState<string | null>(null);

  // Apply filters and column visibility
  const { filteredRows, displayColumns, deliveryOptions } = useMemo(() => {
    if (rows.length === 0 || columns.length === 0) {
      return { 
        filteredRows: rows, 
        displayColumns: columns,
        deliveryOptions: []
      };
    }

    // Get unique delivery types
    const deliveries = Array.from(new Set(rows.map(row => row.delivery).filter(Boolean))) as string[];

    // Filter rows (clone to avoid mutating query cache)
    let filtered = [...rows];
    
    // Apply delivery alternate day-based filtering
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const dayOfMonth = now.getDate(); // 1-31
    
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday=5, Saturday=6
    const isAlt1Day = dayOfMonth % 2 === 1 && !isWeekend; // Odd days (1,3,5,7...) excluding weekend
    const isAlt2Day = dayOfMonth % 2 === 0 && !isWeekend; // Even days (2,4,6,8...) excluding weekend
    
    // Sort based on delivery alternate and current day
    filtered = filtered.sort((a, b) => {
      const aAlt = a.deliveryAlt || "daily";
      const bAlt = b.deliveryAlt || "daily";
      
      // Inactive always at bottom
      if (aAlt === "inactive" && bAlt !== "inactive") return 1;
      if (aAlt !== "inactive" && bAlt === "inactive") return -1;
      
      // Daily always at top (delivers every day including weekends)
      if (aAlt === "daily" && bAlt !== "daily") return -1;
      if (aAlt !== "daily" && bAlt === "daily") return 1;
      
      // On weekends, alt1 and alt2 are off (show dimmed), daily still delivers
      if (isWeekend) {
        return 0; // Alt1 and Alt2 same priority on weekend (both off)
      }
      
      // Priority based on day
      if (isAlt1Day) {
        // Alt1 at top, alt2 at bottom
        if (aAlt === "alt1" && bAlt === "alt2") return -1;
        if (aAlt === "alt2" && bAlt === "alt1") return 1;
      } else if (isAlt2Day) {
        // Alt2 at top, alt1 at bottom
        if (aAlt === "alt2" && bAlt === "alt1") return -1;
        if (aAlt === "alt1" && bAlt === "alt2") return 1;
      }
      
      return 0;
    });
    
    // Apply route filters
    if (routeFilters.length > 0) {
      filtered = filtered.filter(row => routeFilters.includes(row.route));
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply delivery filters (hide selected types)
    if (deliveryFilters.length > 0) {
      filtered = filtered.filter(row => !deliveryFilters.includes(row.delivery));
    }

    // Use all columns as visible, but hide latitude, longitude, tollPrice, and images (not in edit mode)
    const visibleCols = columns.filter(col => 
      col.dataKey !== 'latitude' && col.dataKey !== 'longitude' && col.dataKey !== 'tollPrice' && col.dataKey !== 'images'
    );

    return { 
      filteredRows: filtered, 
      displayColumns: visibleCols,
      deliveryOptions: deliveries
    };
  }, [rows, columns, searchTerm, deliveryFilters, routeFilters]);

  // Calculate distances for kilometer column
  const rowsWithDistances = useMemo(() => {
    // Find QL Kitchen coordinates from full rows collection
    const qlKitchenRow = rows.find(row => row.location === "QL Kitchen");
    
    if (!qlKitchenRow || !qlKitchenRow.latitude || !qlKitchenRow.longitude) {
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    const qlLat = parseFloat(qlKitchenRow.latitude);
    const qlLng = parseFloat(qlKitchenRow.longitude);

    if (!Number.isFinite(qlLat) || !Number.isFinite(qlLng)) {
      return filteredRows.map(row => ({ ...row, kilometer: "—", segmentDistance: 0 }));
    }

    // Check if any filters are active
    const hasActiveFilters = searchTerm !== "" || routeFilters.length > 0 || deliveryFilters.length > 0;

    if (!hasActiveFilters) {
      // NO FILTERS: Calculate direct distance from QL Kitchen to each route
      return filteredRows.map((row) => {
        if (row.location === "QL Kitchen") {
          return { ...row, kilometer: 0, segmentDistance: 0 };
        }

        if (!row.latitude || !row.longitude) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const currentLat = parseFloat(row.latitude);
        const currentLng = parseFloat(row.longitude);

        if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const directDistance = calculateDistance(qlLat, qlLng, currentLat, currentLng);
        return { ...row, kilometer: directDistance, segmentDistance: directDistance };
      });
    } else {
      // FILTERS ACTIVE: Calculate cumulative distance
      let cumulativeDistance = 0;
      let previousLat = qlLat;
      let previousLng = qlLng;

      return filteredRows.map((row) => {
        if (row.location === "QL Kitchen") {
          cumulativeDistance = 0;
          previousLat = qlLat;
          previousLng = qlLng;
          return { ...row, kilometer: 0, segmentDistance: 0 };
        }

        if (!row.latitude || !row.longitude) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const currentLat = parseFloat(row.latitude);
        const currentLng = parseFloat(row.longitude);

        if (!Number.isFinite(currentLat) || !Number.isFinite(currentLng)) {
          return { ...row, kilometer: "—", segmentDistance: 0 };
        }

        const segmentDistance = calculateDistance(previousLat, previousLng, currentLat, currentLng);
        cumulativeDistance += segmentDistance;

        previousLat = currentLat;
        previousLng = currentLng;

        return { ...row, kilometer: cumulativeDistance, segmentDistance };
      });
    }
  }, [rows, filteredRows, searchTerm, routeFilters, deliveryFilters]);

  // Create read-only mutations (they work but don't persist)
  const readOnlyUpdateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<any> }) => {
      console.log("Read-only mode: Changes not saved", data);
      return data;
    },
  });

  const readOnlyDeleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      console.log("Read-only mode: Delete not allowed", id);
    },
  });

  const readOnlyReorderRowsMutation = useMutation<TableRow[], Error, string[]>({
    mutationFn: async (rowIds: string[]) => {
      const reordered = rowIds
        .map(id => rows.find(r => r.id === id))
        .filter((r): r is TableRow => r !== undefined);
      return reordered;
    },
  });

  const readOnlyReorderColumnsMutation = useMutation<TableColumn[], Error, string[]>({
    mutationFn: async (columnIds: string[]) => {
      const reordered = columnIds
        .map(id => columns.find(c => c.id === id))
        .filter((c): c is TableColumn => c !== undefined);
      return reordered;
    },
  });

  const readOnlyDeleteColumnMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      console.log("Read-only mode: Column delete not allowed", id);
    },
  });

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setDeliveryFilters([]);
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
  if (isLoading || isLoadingTable || isLoadingRows || !minLoadingComplete) {
    return (
      <div className="min-h-screen relative">
        {isIntroLoading ? (
          <LoadingOverlay message="Loading Custom Table..." type="ripple" />
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

  if (error || !customTable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            <Database className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Custom Table Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The custom table you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b-2 border-blue-500/50 dark:border-blue-400/50 bg-gradient-to-r from-blue-500/10 via-blue-600/10 to-blue-700/10 dark:from-blue-500/20 dark:via-blue-600/20 dark:to-blue-700/20 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg shadow-blue-500/20">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between text-[12px]">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                  <img 
                    src="/assets/Logofm.png" 
                    alt="Logo" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="font-bold text-slate-600 dark:text-slate-300 text-[12px]">
                  {customTable.name}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Custom Table View
            </div>
          </div>
        </div>
      </nav>

      <main className="fixed inset-0 bg-gray-50 dark:bg-[#0a0a0a] pt-[56px] pb-24 overflow-y-auto">
        <div className="w-full flex justify-center mt-[5%]">
        <div className="max-w-7xl w-full px-4 py-8">
          {/* Data Table with all interactive features enabled */}
          <DataTable
            rows={rowsWithDistances}
            columns={displayColumns}
            editMode={false}
            isSharedView={true}
            hideShareButton={true}
            disablePagination={true}
            onUpdateRow={readOnlyUpdateMutation as any}
            onDeleteRow={readOnlyDeleteMutation as any}
            onReorderRows={readOnlyReorderRowsMutation as any}
            onReorderColumns={readOnlyReorderColumnsMutation as any}
            onDeleteColumn={readOnlyDeleteColumnMutation as any}
            onSelectRowForImage={setSelectedRowForImage}
            onShowCustomization={() => {}}
            onOptimizeRoute={() => {}}
            isAuthenticated={false}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filterValue={[]}
            onFilterValueChange={() => {}}
            deliveryFilterValue={deliveryFilters}
            onDeliveryFilterValueChange={setDeliveryFilters}
            routeOptions={[]}
            deliveryOptions={deliveryOptions}
            onClearAllFilters={handleClearAllFilters}
            filteredRowsCount={rowsWithDistances.length}
            totalRowsCount={rows.length}
          />
        </div>
        </div>
      </main>

      <Footer editMode={false} />
    </>
  );
}
