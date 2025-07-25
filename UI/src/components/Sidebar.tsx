import React from 'react';
import { 
  LayoutDashboard, Package, History, Ruler, MapPin, Truck, Settings 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

type SidebarItemProps = {
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, title, isActive, onClick }) => (
  <li className="mb-1">
    <button
      onClick={onClick}
      className={`flex items-center w-full px-6 py-3 text-sm transition-colors duration-200 ${
        isActive
          ? 'bg-primary-500 text-white font-medium'
          : 'text-white hover:bg-primary-600 hover:text-white'
      }`}
    >
      <span className="mr-4">{icon}</span>
      {title}
    </button>
  </li>
);

export const Sidebar = () => {
  const { activePage, setActivePage } = useAppContext();

  return (
    <aside className="w-64 bg-primary-800 text-white flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-primary-700">
        <h1 className="text-2xl font-bold">المخزن</h1>
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col">
        <ul className="space-y-2">
          <SidebarItem title="الرئيسية" icon={<LayoutDashboard size={20} />} isActive={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')} />
          <SidebarItem title="إدارة الأصناف" icon={<Package size={20} />} isActive={activePage === 'Items'} onClick={() => setActivePage('Items')} />
          <SidebarItem title="سجل الحركات" icon={<History size={20} />} isActive={activePage === 'Logs'} onClick={() => setActivePage('Logs')} />
          <SidebarItem title="إدارة الوحدات" icon={<Ruler size={20} />} isActive={activePage === 'Units'} onClick={() => setActivePage('Units')} />
          <SidebarItem title="إدارة الوجهات" icon={<MapPin size={20} />} isActive={activePage === 'Destinations'} onClick={() => setActivePage('Destinations')} />
          <SidebarItem title="إدارة الموردين" icon={<Truck size={20} />} isActive={activePage === 'Providers'} onClick={() => setActivePage('Providers')} />
        </ul>

        <ul className="space-y-2 mt-auto pt-4 border-t border-primary-700">
          <SidebarItem title="الإعدادات" icon={<Settings size={20} />} isActive={activePage === 'Settings'} onClick={() => setActivePage('Settings')} />
        </ul>
      </nav>
    </aside>
  );
};