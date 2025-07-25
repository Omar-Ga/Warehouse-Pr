import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface ActionMenuOption {
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  isDanger?: boolean;
}

interface ActionMenuPortalProps {
  anchorRef: React.RefObject<HTMLElement>;
  options: ActionMenuOption[];
  onClose: () => void;
}

export const ActionMenuPortal: React.FC<ActionMenuPortalProps> = ({ anchorRef, options, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + (rect.width / 2),
      });
    } else {
      setPosition(null);
    }
  }, [anchorRef]);

  useEffect(() => {
    if (!position) return;

    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose, anchorRef, position]);

  const portalRoot = document.getElementById('portal-root') || document.body;

  if (!position) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        minWidth: 180,
      }}
      className="bg-base-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 border border-base-300"
      dir="rtl"
    >
      {options.map((opt, idx) => (
        <button
          key={idx}
          className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
            opt.isDanger 
              ? 'text-error hover:bg-error/10' 
              : 'hover:bg-base-200'
          } disabled:text-base-content/40 disabled:cursor-not-allowed`}
          onClick={(e) => {
            if (!opt.disabled) {
              opt.onClick(e);
              onClose();
            }
          }}
          disabled={opt.disabled}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>,
    portalRoot
  );
}; 