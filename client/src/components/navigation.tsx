import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Moon, Sun, DoorOpen, Save, ListChecks, Bookmark, BookOpen, Link2, Table2, Rows, Plus, Layout, Palette, RouteIcon, Receipt, Sparkles, ZoomIn } from "lucide-react";
import { useLocation } from "wouter";

interface NavigationProps {
  editMode?: boolean;
  onEditModeRequest?: () => void;
  onShowCustomization?: () => void;
  onAddRow?: () => void;
  onSaveData?: () => void;
  onGenerateTng?: () => void;
  onAddColumn?: (columnData: { name: string; dataKey: string; type: string; options?: string[] }) => Promise<void>;
  onOptimizeRoute?: () => void;
  onCalculateTolls?: () => void;
  onSaveLayout?: () => void;
  onSavedLinks?: () => void;
  onShowHelp?: () => void;
  onBulkColorEdit?: () => void;
  onShowZoom?: () => void;
  isAuthenticated?: boolean;
  theme?: string;
  onSetTheme?: (theme: 'dark' | 'light') => void;
}

export function Navigation({ editMode, onEditModeRequest, onShowCustomization, onAddRow, onSaveData, onGenerateTng, onAddColumn, onOptimizeRoute, onCalculateTolls, onSaveLayout, onSavedLinks, onShowHelp, onBulkColorEdit, onShowZoom, isAuthenticated, theme, onSetTheme }: NavigationProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

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

  return (
    <>
      {/* Content fade overlay - hides content when scrolling near nav */}
      <div className="fixed top-0 left-0 right-0 h-24 z-40 pointer-events-none bg-gradient-to-b from-background via-background/80 to-transparent" />
      
      <nav ref={menuRef} className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="container mx-auto px-2 md:px-4">
        <div className="flex h-16 items-center justify-between text-[12px]">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 group cursor-pointer">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                <img 
                  src="/assets/Logofm.png" 
                  alt="Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-tight">
                <span className="font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent leading-none tracking-tight transition-all" style={{ fontSize: '13px', letterSpacing: '-0.02em' }}>
                  {editMode ? "Edit Mode" : "Route Manager"}
                </span>
                <span className="text-gray-500 dark:text-gray-400 leading-none font-medium" style={{ fontSize: '10px', letterSpacing: '-0.01em' }}>
                  Data Management
                </span>
              </div>
            </div>
          </div>

          {/* Navigation - Single Menu Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/50 shadow-md hover:shadow-lg hover:border-gray-300/70 dark:hover:border-gray-600/60 hover:bg-white dark:hover:bg-gray-900 h-10 px-4 rounded-[14px] transition-all duration-300 ease-out hover:scale-105 active:scale-95 group"
            data-testid="button-main-menu"
            title="Menu"
          >
            <LayoutGrid className="w-4 h-4 text-gray-700 dark:text-gray-200 transition-transform duration-200 group-hover:scale-110" />
            <span className="hidden md:inline ml-2 text-xs font-semibold text-gray-700 dark:text-gray-200">Menu</span>
          </Button>
        </div>
        </div>

        {/* Dropdown Menu */}
        <div className={`absolute top-full right-6 mt-3 w-56 bg-white dark:bg-black/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl p-2 shadow-xl max-h-[500px] overflow-y-auto transition-all duration-300 ease-out ${
          menuOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}>
          {/* Theme Switcher */}
          <div className="px-4 py-2">
            <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
              <button
                onClick={() => onSetTheme?.('dark')}
                className={`flex-1 p-2 rounded-lg transition-all duration-200 ease-out flex items-center justify-center gap-2 hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-black/20 dark:bg-white/20 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
                <span className="text-xs">Dark</span>
              </button>
              <button
                onClick={() => onSetTheme?.('light')}
                className={`flex-1 p-2 rounded-lg transition-all duration-200 ease-out flex items-center justify-center gap-2 hover:scale-105 active:scale-95 ${theme === 'light' ? 'bg-black/20 dark:bg-white/20 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
                <span className="text-xs">Light</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

          {/* Primary Actions */}
          {editMode ? (
            <>
              <button
                onClick={() => { onSaveData?.(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-green-600 dark:text-green-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <div className="h-px bg-black/10 dark:bg-white/10 my-1" />
              <button
                onClick={() => { onEditModeRequest?.(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <DoorOpen className="w-4 h-4" />
                Exit Edit Mode
              </button>
            </>
          ) : (
            <button
              onClick={() => { onEditModeRequest?.(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm font-medium flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
            >
              <DoorOpen className="w-4 h-4" />
              Enter Edit Mode
            </button>
          )}

          <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

          {/* Navigation Links */}
          <button
            onClick={() => { navigate('/custom-tables'); setMenuOpen(false); }}
            className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ListChecks className="w-4 h-4" />
            All Custom Tables
          </button>

          <button
            onClick={() => { onSavedLinks?.(); setMenuOpen(false); }}
            className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bookmark className="w-4 h-4" />
            Saved Links
          </button>

          {/* Edit Actions */}
          {editMode && (
            <>
              <div className="h-px bg-black/10 dark:bg-white/10 my-1" />
              
              <button
                onClick={() => { onAddRow?.(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Rows className="w-4 h-4" />
                Add Row
              </button>

              {onAddColumn && (
                <button
                  onClick={() => {
                    const addColumnButton = document.querySelector('[data-testid="button-add-column"]') as HTMLButtonElement;
                    if (addColumnButton) addColumnButton.click();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Add Column
                </button>
              )}

              <button
                onClick={() => { onShowCustomization?.(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Layout className="w-4 h-4" />
                Customize Columns
              </button>

              <button
                onClick={() => { onBulkColorEdit?.(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Palette className="w-4 h-4" />
                Bulk Color Edit
              </button>

              {onOptimizeRoute && (
                <button
                  onClick={() => { onOptimizeRoute(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RouteIcon className="w-4 h-4" />
                  Optimize Route
                </button>
              )}

              {onCalculateTolls && (
                <button
                  onClick={() => { onCalculateTolls(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Receipt className="w-4 h-4" />
                  Calculate Tolls
                </button>
              )}

              {onGenerateTng && (
                <button
                  onClick={() => { onGenerateTng(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate TNG
                </button>
              )}

              {onSaveLayout && (
                <button
                  onClick={() => { onSaveLayout(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Layout className="w-4 h-4" />
                  Save Layout
                </button>
              )}
            </>
          )}

          <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

          <button
            onClick={() => { onShowZoom?.(); setMenuOpen(false); }}
            className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ZoomIn className="w-4 h-4" />
            Zoom Control
          </button>

          <button
            onClick={() => { onShowHelp?.(); setMenuOpen(false); }}
            className="w-full text-left px-4 py-3 text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200 ease-out text-sm flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="w-4 h-4" />
            Help
          </button>
        </div>
      </nav>
    </>
  );
}
