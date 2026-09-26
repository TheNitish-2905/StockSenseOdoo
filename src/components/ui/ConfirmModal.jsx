import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
            variant === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-sky-100 text-sky-600'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {variant === 'danger' ? 'warning' : 'help'}
          </span>
        </div>
        <p className="text-sm text-slate-600 pt-1.5">{message}</p>
      </div>
    </Modal>
  );
}
