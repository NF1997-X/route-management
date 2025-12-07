import { 
  Edit2, 
  Settings, 
  Link2,
  Table2,
  ListChecks,
  Bookmark,
  Sun,
  Moon,
  BookOpen,
  Rows,
  Plus,
  Save,
  Route as RouteIcon,
  Receipt,
  Layout,
  Palette,
  Sparkles,
  DoorOpen,
  Waves
} from "lucide-react";
import { useLocation } from "wouter";

interface SlideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  theme?: string;
  onSetTheme?: (theme: 'dark' | 'light' | 'ocean') => void;
}

export function SlideMenu({
  open,
  onOpenChange,
  editMode,
  onEditModeRequest,
  onShowCustomization,
  onAddRow,
  onSaveData,
  onGenerateTng,
  onAddColumn,
  onOptimizeRoute,
  onCalculateTolls,
  onSaveLayout,
  onSavedLinks,
  onShowHelp,
  onBulkColorEdit,
  theme,
  onSetTheme,
}: SlideMenuProps) {
  const [, navigate] = useLocation();

  const handleItemClick = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-all duration-300 ease-out animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Menu Panel - iPhone Paste Style */}
      <div className="fixed top-[72px] right-3 z-[110] w-[280px] transition-all duration-300 ease-out animate-in slide-in-from-right-2 zoom-in-95">
        <div className="bg-gray-200/95 dark:bg-gray-900/95 ocean:bg-blue-950/95 backdrop-blur-xl rounded-[16px] shadow-md border border-black/5 dark:border-white/10 ocean:border-cyan-500/20 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto py-1">
            {/* Primary Actions */}
            {editMode ? (
              <>
                <button
                  onClick={() => handleItemClick(onSaveData!)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-green-600 dark:text-green-400 font-medium text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3" />
                <button
                  onClick={() => handleItemClick(onEditModeRequest!)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <DoorOpen className="w-5 h-5" />
                  <span>Exit Edit Mode</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleItemClick(onEditModeRequest!)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
              >
                <Edit2 className="w-5 h-5" />
                <span>Enter Edit Mode</span>
              </button>
            )}
            
            <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3" />

            {/* VM Route Actions */}
            {editMode && (
              <>
                <button
                  onClick={() => handleItemClick(() => navigate('/share/tzqe9a'))}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Link2 className="w-5 h-5" />
                  <span>Share Link</span>
                </button>
                <button
                  onClick={() => handleItemClick(() => navigate('/custom/8m2v27'))}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Table2 className="w-5 h-5" />
                  <span>Custom Page</span>
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3" />
              </>
            )}

            <button
              onClick={() => handleItemClick(() => navigate('/custom-tables'))}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <ListChecks className="w-5 h-5" />
              <span>All Custom Tables</span>
            </button>

            <button
              onClick={() => handleItemClick(onSavedLinks!)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <Bookmark className="w-5 h-5" />
              <span>Saved Links</span>
            </button>

            {/* Edit Actions */}
            {editMode && (
              <>
                <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3" />
                
                <button
                  onClick={() => handleItemClick(onAddRow!)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Rows className="w-5 h-5" />
                  <span>Add Row</span>
                </button>

                {onAddColumn && (
                  <button
                    onClick={() => {
                      const addColumnButton = document.querySelector('[data-testid="button-add-column"]') as HTMLButtonElement;
                      if (addColumnButton) addColumnButton.click();
                      onOpenChange(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Column</span>
                  </button>
                )}

                <button
                  onClick={() => handleItemClick(onShowCustomization!)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Layout className="w-5 h-5" />
                  <span>Customize Columns</span>
                </button>

                <button
                  onClick={() => handleItemClick(onBulkColorEdit!)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Palette className="w-5 h-5" />
                  <span>Bulk Color Edit</span>
                </button>

                {onOptimizeRoute && (
                  <button
                    onClick={() => handleItemClick(onOptimizeRoute)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <RouteIcon className="w-5 h-5" />
                    <span>Optimize Route</span>
                  </button>
                )}

                {onCalculateTolls && (
                  <button
                    onClick={() => handleItemClick(onCalculateTolls)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Receipt className="w-5 h-5" />
                    <span>Calculate Tolls</span>
                  </button>
                )}

                {onGenerateTng && (
                  <button
                    onClick={() => handleItemClick(onGenerateTng)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Generate TNG</span>
                  </button>
                )}

                {onSaveLayout && (
                  <button
                    onClick={() => handleItemClick(onSaveLayout)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Layout className="w-5 h-5" />
                    <span>Save Layout</span>
                  </button>
                )}

                {onShowHelp && (
                  <button
                    onClick={() => handleItemClick(onShowHelp)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Help</span>
                  </button>
                )}
              </>
            )}

            {/* Settings */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3" />

            {/* Theme Switcher */}
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Theme</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleItemClick(() => onSetTheme?.('dark'))}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                    theme === 'dark' 
                      ? 'bg-gray-900 dark:bg-gray-800 ring-2 ring-blue-500' 
                      : 'bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Moon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">Dark</span>
                </button>
                
                <button
                  onClick={() => handleItemClick(() => onSetTheme?.('light'))}
                  className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                    theme === 'light' 
                      ? 'bg-white ring-2 ring-blue-500' 
                      : 'bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Sun className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">Light</span>
                </button>
                
                {/* Ocean theme - only show in edit mode */}
                {editMode && (
                  <button
                    onClick={() => handleItemClick(() => onSetTheme?.('ocean'))}
                    className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                      theme === 'ocean' 
                        ? 'bg-blue-900/30 ring-2 ring-blue-500' 
                        : 'bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Waves className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200">Ocean</span>
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700 mx-3 mt-2" />

            <button
              onClick={() => handleItemClick(() => navigate('/help'))}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-normal text-[15px] active:bg-gray-200 dark:active:bg-gray-700 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen className="w-5 h-5" />
              <span>User Guide</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
