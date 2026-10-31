import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'warning' | 'primary' | string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  variant,
  isLoading = false,
}) => {
  const handleDismiss = onClose || onCancel || (() => {});
  const isDanger = isDestructive || variant === 'danger';
  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} maxWidth="max-w-md" showCloseButton={!isLoading}>
      <div className="flex items-start gap-4">
        {isDanger && (
          <div className="p-2.5 rounded-full bg-red-500/10 text-red-400 shrink-0 border border-red-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#fafafa] mb-1.5">{title}</h3>
          <p className="text-sm text-[#a1a1aa] leading-relaxed mb-6">{message}</p>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDismiss}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={isDanger ? 'danger' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
