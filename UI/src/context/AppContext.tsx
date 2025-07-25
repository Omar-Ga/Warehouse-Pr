import { createContext, useContext, useState, ReactNode } from 'react';
import { Item } from '../types'; // Import the main Item type

type AppContextType = {
  activePage: string;
  setActivePage: (page: string) => void;
  // Barcode scanner state and actions
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  scannerMessage: string;
  isScannerError: boolean;
  handleBarcodeScan: (barcode: string) => void;
  
  // Modal state for adjusting quantity after scan
  scannedItem: Item | null;
  isAdjustModalOpen: boolean;
  closeAdjustModal: (andReopenScanner?: boolean) => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

type AppProviderProps = {
    children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
    const [activePage, setActivePage] = useState('dashboard');

    // State for barcode scanner
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerMessage, setScannerMessage] = useState('جاري قراءة الباركود...');
    const [isScannerError, setIsScannerError] = useState(false);
    
    // State for adjust quantity modal
    const [scannedItem, setScannedItem] = useState<Item | null>(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

    const openScanner = () => {
        setScannerMessage('جاري قراءة الباركود...');
        setIsScannerError(false);
        setIsScannerOpen(true);
    };
    
    const closeScanner = () => setIsScannerOpen(false);

    const handleBarcodeScan = async (barcode: string) => {
        try {
            const response = await fetch(`/api/items/by-barcode/${barcode}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('لم يتم العثور على صنف مطابق');
                }
                throw new Error('حدث خطأ أثناء البحث عن الصنف');
            }
            const item: Item = await response.json();
            setScannedItem(item);
            setIsAdjustModalOpen(true); // Open adjust modal with the item
            closeScanner(); // Close the scanner overlay
        } catch (error: any) {
            setScannerMessage(error.message || 'خطأ غير متوقع');
            setIsScannerError(true);
            // Reset after a delay
            setTimeout(() => {
                setScannerMessage('جاري قراءة الباركود...');
                setIsScannerError(false);
            }, 3000);
        }
    };

    const closeAdjustModal = (andReopenScanner = false) => {
        setIsAdjustModalOpen(false);
        setScannedItem(null);
        if (andReopenScanner) {
            openScanner(); // Re-open scanner for continuous workflow
        }
    };

    const value = {
        activePage,
        setActivePage,
        isScannerOpen,
        openScanner,
        closeScanner,
        scannerMessage,
        isScannerError,
        handleBarcodeScan,
        scannedItem,
        isAdjustModalOpen,
        closeAdjustModal
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};