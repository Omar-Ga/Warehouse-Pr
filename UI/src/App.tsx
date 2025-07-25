import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ItemsManagement } from './pages/ItemsManagement';
import { MovementLog } from './pages/MovementLog';
import { UnitManagement } from './pages/UnitManagement';
import { DestinationManagement } from './pages/DestinationManagement';
import { Settings } from './pages/Settings';
import { ProviderManagement } from './pages/ProviderManagement';
import { useAppContext } from './context/AppContext';
import { BarcodeScannerOverlay } from './components/BarcodeScannerOverlay';
import { AdjustQuantityModal } from './components/AdjustQuantityModal';

function PageComponent({ page }: { page: string }) {
  switch (page.toLowerCase()) {
      case 'dashboard':
        return <Dashboard />;
      case 'items':
        return <ItemsManagement />;
      case 'logs':
        return <MovementLog />;
      case 'units':
        return <UnitManagement />;
      case 'destinations':
        return <DestinationManagement />;
    case 'providers':
      return <ProviderManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
}

export const App = () => {
  const { 
    activePage,
    isScannerOpen, 
    closeScanner, 
    scannerMessage, 
    isScannerError,
    handleBarcodeScan,
    scannedItem,
    isAdjustModalOpen,
    closeAdjustModal
  } = useAppContext();

  return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <PageComponent page={activePage} />
          </main>

        <BarcodeScannerOverlay 
          isOpen={isScannerOpen}
          onClose={closeScanner}
          onScan={handleBarcodeScan}
          message={scannerMessage}
          isError={isScannerError}
        />

        {scannedItem && (
            <AdjustQuantityModal
                isOpen={isAdjustModalOpen}
                onClose={() => closeAdjustModal(true)}
                item={scannedItem}
                onItemAdjusted={() => {
                    // We might want to refresh some data here in the future,
                    // but for now, just closing the modal and reopening the scanner is enough.
                    closeAdjustModal(true); // Reopen scanner on success
                }}
            />
        )}
      </div>
  );
};