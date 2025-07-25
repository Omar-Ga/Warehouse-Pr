import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Destination } from '../types'; // Use the dedicated Destination type
import { ManagementItemCard } from '../components/ManagementItemCard';

type DestinationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destination?: Destination;
  onSave: (destination: { id?: number; name: string }) => Promise<void>;
  initialName?: string;
  isSaving?: boolean;
  apiError?: string | null;
};

const DestinationModal = ({ isOpen, onClose, destination, onSave, initialName, isSaving, apiError }: DestinationModalProps) => {
  const [name, setName] = useState(initialName || destination?.name || '');
  const [error, setError] = useState('');
  
  useEffect(() => {
    setName(initialName || destination?.name || '');
    setError('');
  }, [isOpen, destination, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('اسم الوجهة مطلوب');
      return;
    }
    setError('');
    await onSave({ id: destination?.id, name });
  };
  
  const footer = (
    <>
      <button type="button" className="btn btn-outline ml-2" onClick={onClose} disabled={isSaving}>إلغاء</button>
      <button type="submit" className="btn btn-primary" form="destination-form" disabled={isSaving}>
        {isSaving ? (destination ? 'جاري الحفظ...' : 'جاري الإضافة...') : (destination ? 'حفظ التغييرات' : 'إضافة وجهة')}
      </button>
    </>
  );
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={destination ? 'تعديل وجهة' : 'إضافة وجهة جديدة'} footer={footer}>
      <form id="destination-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">اسم الوجهة <span className="text-error-500">*</span></label>
          <input
            type="text"
            id="name"
            className={`input ${(error || apiError) ? 'border-error-500' : ''}`}
            value={name}
            onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setError(''); }}
            placeholder="أدخل اسم الوجهة"
            disabled={isSaving}
          />
          {error && <p className="form-error">{error}</p>}
          {apiError && <p className="form-error">{apiError}</p>}
        </div>
      </form>
    </Modal>
  );
};

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  destination: Destination | null;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
};

const DeleteConfirmModal = ({ isOpen, onClose, destination, onConfirm, isDeleting }: DeleteConfirmModalProps) => {
  if (!destination) return null;
  
  const footer = (
    <>
      <button type="button" className="btn btn-outline ml-2" onClick={onClose} disabled={isDeleting}>إلغاء</button>
      <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={isDeleting}>
        {isDeleting ? 'جاري الحذف...' : 'حذف'}
      </button>
    </>
  );
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تأكيد الحذف" footer={footer} size="sm">
      <p className="mb-4">هل أنت متأكد من رغبتك في حذف الوجهة "{destination.name}"؟</p>
      <div className="bg-error-50 border border-error-200 rounded p-3">
        <p className="text-error-700 text-sm">ملاحظة: لا يمكن حذف الوجهة إذا كانت مستخدمة في أي سجل حركة.</p>
      </div>
    </Modal>
  );
};

export const DestinationManagement = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingDestination, setCurrentEditingDestination] = useState<Destination | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState<Destination | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalApiError, setModalApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/destinations'); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch destinations. Status: ${response.status}`);
      }
      const data = await response.json();
      setDestinations(data.map((d: any) => ({ id: Number(d.id), name: d.name })));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "فشل في تحميل الوجهات");
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);
  
  const handleAddDestination = async (destinationData: { name: string }) => {
    setIsSaving(true);
    setModalApiError(null);
    try {
      const response = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add destination. Status: ${response.status}`);
      }
      await fetchDestinations();
      setIsAddModalOpen(false); 
    } catch (err: any) {
      console.error("Failed to add destination:", err);
      setModalApiError(err.message || "فشل في إضافة الوجهة. قد يكون الاسم مستخدماً.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const openEditModal = (destination: Destination) => {
    setCurrentEditingDestination(destination);
    setModalApiError(null);
    setIsEditModalOpen(true);
  };
  
  const handleEditDestination = async (destinationData: { id?: number; name: string }) => {
    if (destinationData.id === undefined) return;
    setIsSaving(true);
    setModalApiError(null);
    try {
      const response = await fetch(`/api/destinations/${destinationData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: destinationData.name }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update destination. Status: ${response.status}`);
      }
      await fetchDestinations();
      setIsEditModalOpen(false);
      setCurrentEditingDestination(null);
    } catch (err: any) {
      console.error("Failed to update destination:", err);
      setModalApiError(err.message || "فشل في تعديل الوجهة. قد يكون الاسم مستخدماً.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const openDeleteModal = (destination: Destination) => {
    setDestinationToDelete(destination);
    setModalApiError(null);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteDestination = async () => {
    if (!destinationToDelete) return;
    setIsDeleting(true);
    setModalApiError(null);
    try {
      const response = await fetch(`/api/destinations/${destinationToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete destination. Status: ${response.status}`);
      }
      await fetchDestinations();
      setIsDeleteModalOpen(false);
      setDestinationToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete destination:", err);
      setModalApiError(err.message || "فشل في حذف الوجهة. تأكد أنها ليست قيد الاستخدام.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">جاري تحميل الوجهات...</div>;
  }

  if (error && destinations.length === 0) {
    return <div className="text-center p-8 text-error-500">خطأ: {error} <button onClick={fetchDestinations} className="btn btn-sm btn-link">حاول مرة أخرى</button></div>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold m-0">إدارة الوجهات</h1>
        <button className="btn btn-primary flex items-center" onClick={() => { setModalApiError(null); setIsAddModalOpen(true); }}>
          <Plus size={18} className="ml-2" />
          إضافة وجهة جديدة
        </button>
      </div>
      
      {error && destinations.length > 0 && (
         <div className="bg-error-100 border border-error-400 text-error-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
            <button onClick={fetchDestinations} className="ml-4 text-sm underline">حاول مرة أخرى</button>
            </div>
      )}

      {destinations.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">لا توجد وجهات بعد</h3>
          <p className="text-gray-500 mb-4">أضف الوجهات التي يتم إرسال الأصناف إليها</p>
          <button className="btn btn-primary" onClick={() => { setModalApiError(null); setIsAddModalOpen(true); }}>
            إضافة وجهة جديدة
          </button>
        </div>
      )}

      {destinations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {destinations.map(destination => (
              <ManagementItemCard 
                key={destination.id}
                item={destination}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
              />
            ))}
        </div>
      )}
      
      <DestinationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddDestination} isSaving={isSaving} apiError={modalApiError} />
      
      {currentEditingDestination && (
          <DestinationModal
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setCurrentEditingDestination(null); }}
            destination={currentEditingDestination}
            initialName={currentEditingDestination.name}
            onSave={handleEditDestination}
            isSaving={isSaving}
            apiError={modalApiError}
          />
      )}
          
      {destinationToDelete && (
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => { setIsDeleteModalOpen(false); setDestinationToDelete(null); }}
            destination={destinationToDelete}
            onConfirm={handleDeleteDestination}
            isDeleting={isDeleting}
          />
      )}
    </div>
  );
}; 