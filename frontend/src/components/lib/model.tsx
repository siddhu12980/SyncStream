import { CustomDialog, CustomDialogDescription, CustomDialogFooter, CustomDialogHeader, CustomDialogTitle } from "./CustomDialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'default'
}: ConfirmDialogProps) {
  return (
    <CustomDialog isOpen={isOpen} onClose={onClose}>
      <CustomDialogHeader>
        <CustomDialogTitle>{title}</CustomDialogTitle>
        <CustomDialogDescription>{description}</CustomDialogDescription>
      </CustomDialogHeader>
      
      <CustomDialogFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-white ${
            variant === 'danger' 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {confirmText}
        </button>
      </CustomDialogFooter>
    </CustomDialog>
  );
}


