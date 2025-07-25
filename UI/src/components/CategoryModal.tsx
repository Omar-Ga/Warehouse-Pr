import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Category } from '../types';

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  categoryToEdit?: Category | null;
  parentId?: number | null; 
};

export const CategoryModal = ({ isOpen, onClose, onSave, categoryToEdit, parentId }: CategoryModalProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!categoryToEdit;
  const title = isEditing 
    ? `تعديل القسم: ${categoryToEdit.name}` 
    : parentId 
      ? 'إضافة قسم فرعي جديد' 
      : 'إضافة قسم رئيسي جديد';

  useEffect(() => {
    if (isOpen) {
      if (isEditing && categoryToEdit) {
        setName(categoryToEdit.name);
      } else {
        setName('');
      }
      setError(null);
    }
  }, [isOpen, isEditing, categoryToEdit]);

  const validate = () => {
    if (!name.trim()) {
      setError('اسم القسم مطلوب');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const url = isEditing ? `/api/categories/${categoryToEdit?.id}` : '/api/categories';
    const method = isEditing ? 'PUT' : 'POST';
    
    const body: { name: string; parent_id?: number | null } = { name: name.trim() };
    if (!isEditing) {
      body.parent_id = parentId;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'فشل حفظ القسم');
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-outline ml-2" onClick={onClose}>
        إلغاء
      </button>
      <button type="submit" className="btn btn-primary" form="category-form">
        {isEditing ? 'حفظ التعديلات' : 'حفظ'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <form id="category-form" onSubmit={handleSubmit}>
        {error && <p className="text-error mb-4">{error}</p>}
        <div className="form-group">
          <label htmlFor="category-name" className="form-label">
            اسم القسم <span className="text-error">*</span>
          </label>
          <input
            type="text"
            id="category-name"
            className={`input ${error ? 'border-error' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أدخل اسم القسم"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}; 