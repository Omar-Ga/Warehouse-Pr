import { Edit, Trash } from 'lucide-react';

interface Item {
  id: number | string;
  name: string;
}

interface ManagementItemCardProps<T extends Item> {
  item: T;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

export const ManagementItemCard = <T extends Item>({ item, onEdit, onDelete }: ManagementItemCardProps<T>) => {
  return (
    <div key={item.id} className="card flex justify-between items-center hover:shadow-lg transition-shadow duration-150 ease-in-out">
      <span className="text-lg px-3 py-2">{item.name}</span>
      <div className="flex space-x-1 space-x-reverse mr-2">
        <button 
          className="p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-full hover:bg-primary-100" 
          title="تعديل" 
          onClick={() => onEdit(item)}
        >
          <Edit size={18} />
        </button>
        <button 
          className="p-2 text-gray-500 hover:text-error-600 transition-colors rounded-full hover:bg-error-100" 
          title="حذف" 
          onClick={() => onDelete(item)}
        >
          <Trash size={18} />
        </button>
      </div>
    </div>
  );
}; 