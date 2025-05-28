import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from 'react-icons/fa';

export interface ToastData {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };
  const getStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    const typeStyles = {
      success: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400 shadow-green-100",
      info: "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-400 shadow-blue-100", 
      warning: "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400 shadow-yellow-100",
      error: "bg-gradient-to-r from-red-50 to-rose-50 border-red-400 shadow-red-100"
    };

    let positionStyles = "";
    if (!isVisible && !isLeaving) {
      positionStyles = "translate-x-full opacity-0 scale-95";
    } else if (isLeaving) {
      positionStyles = "translate-x-full opacity-0 scale-95";
    } else {
      positionStyles = "translate-x-0 opacity-100 scale-100";
    }

    return `${baseStyles} ${typeStyles[toast.type]} ${positionStyles}`;
  };  const getIcon = () => {
    if (toast.icon) return toast.icon;

    const iconProps = { size: 22 };
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle {...iconProps} className="text-green-500" />;
      case 'info':
        return <FaInfoCircle {...iconProps} className="text-blue-500" />;
      case 'warning':
        return <FaExclamationTriangle {...iconProps} className="text-yellow-500" />;
      case 'error':
        return <FaTimesCircle {...iconProps} className="text-red-500" />;
      default:
        return <FaInfoCircle {...iconProps} className="text-blue-500" />;
    }
  };
  return (
    <div className={`${getStyles()} min-w-80 max-w-96 w-full bg-white shadow-xl rounded-lg border-l-4 mb-3 pointer-events-auto`}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{toast.title}</p>
            <p className="mt-1 text-sm text-gray-600 leading-snug break-words">{toast.message}</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleRemove}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
