import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  borderColor?: string;
  titleColor?: string;
  children: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  borderColor = 'border-slate-600',
  titleColor = 'text-slate-300',
  children,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`modal-title-${title.replace(/\s+/g, '-')}`}
    >
      <div
        className={`bg-slate-900 border ${borderColor} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id={`modal-title-${title.replace(/\s+/g, '-')}`}
            className={`text-lg font-bold ${titleColor}`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
