'use client';

interface ToastProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

const typeStyles: Record<string, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const iconPaths: Record<string, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  info: 'M13 16h-1v-4h-1m1-4h.01',
};

export function Toast({ type = 'info', message, onClose }: ToastProps) {
  const colors = typeStyles[type] || typeStyles.info;
  const path = iconPaths[type] || iconPaths.info;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${colors}`}>
      <div className="mt-0.5">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
        </svg>
      </div>
      <div className="flex-1 text-sm whitespace-pre-line">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm font-medium text-current hover:opacity-70 transition-opacity"
          aria-label="Đóng thông báo"
        >
          ×
        </button>
      )}
    </div>
  );
}


