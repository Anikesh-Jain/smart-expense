import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={!loading}>
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 ${
            isDestructive ? 'bg-expense-500/15 text-expense-400' : 'bg-info-500/15 text-info-400'
          }`}
        >
          {isDestructive ? <FiAlertTriangle className="text-2xl" /> : <FiInfo className="text-2xl" />}
        </div>
        <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
        <p className="text-sm text-dark-300 mb-6">{message}</p>
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={loading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
