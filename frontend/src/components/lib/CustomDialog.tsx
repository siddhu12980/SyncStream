interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CustomDialog({ isOpen, onClose, children }: CustomDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

interface CustomDialogHeaderProps {
  children: React.ReactNode;
}

export function CustomDialogHeader({ children }: CustomDialogHeaderProps) {
  return <div className="mb-4">{children}</div>;
}

interface CustomDialogTitleProps {
  children: React.ReactNode;
}

export function CustomDialogTitle({ children }: CustomDialogTitleProps) {
  return <h2 className="text-2xl font-semibold text-white">{children}</h2>;
}

interface CustomDialogDescriptionProps {
  children: React.ReactNode;
}

export function CustomDialogDescription({ children }: CustomDialogDescriptionProps) {
  return <p className="mt-2 text-gray-400">{children}</p>;
}

interface CustomDialogFooterProps {
  children: React.ReactNode;
}

export function CustomDialogFooter({ children }: CustomDialogFooterProps) {
  return <div className="mt-6 flex justify-end gap-4">{children}</div>;
} 