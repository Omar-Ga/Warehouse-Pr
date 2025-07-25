import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  isPrimaryActionDisabled?: boolean;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
};

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  footer,
  primaryActionText,
  onPrimaryAction,
  isPrimaryActionDisabled,
  secondaryActionText,
  onSecondaryAction
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const hasFooter = footer || primaryActionText || secondaryActionText;

  const content = (
    <div className="modal-backdrop animate-fade-in">
      <div 
        ref={modalRef}
        className={`modal animate-scale-in ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="text-xl font-semibold m-0">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
        {hasFooter && (
          <div className="modal-footer">
            {footer}
            {secondaryActionText && (
              <button type="button" className="btn btn-outline" onClick={onSecondaryAction || onClose}>
                {secondaryActionText}
              </button>
            )}
            {primaryActionText && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onPrimaryAction}
                disabled={isPrimaryActionDisabled}
              >
                {primaryActionText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.getElementById('modal-root') || document.body);
};