import { CustomDialog, CustomDialogDescription, CustomDialogFooter, CustomDialogHeader, CustomDialogTitle } from "./CustomDialog";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

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

interface ModelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

export const Model = ({ isOpen, onClose, onConfirm, children }: ModelProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
      >
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
