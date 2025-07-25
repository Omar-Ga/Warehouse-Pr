import { Package, Edit } from 'lucide-react';

type ItemCardProps = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  onEdit: () => void;
  onQuantityAdjust: () => void;
};

export const ItemCard = ({ id, name, quantity, unit, onEdit, onQuantityAdjust }: ItemCardProps) => {
  return (
    <div className="card hover:shadow-lg cursor-pointer" onClick={onQuantityAdjust}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-primary-100 text-primary-600 mr-4">
            <Package size={24} />
          </div>
          <div>
            <h3 className="font-medium text-lg">{name}</h3>
            <div className="text-sm text-gray-500">#{id}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button 
            className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit size={18} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-end">
        <div>
          <span className="text-2xl font-bold">{quantity}</span>
          <span className="text-gray-500 mr-1">{unit}</span>
        </div>
        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
          آخر تحديث: ١٠ يونيو ٢٠٢٤
        </div>
      </div>
    </div>
  );
};