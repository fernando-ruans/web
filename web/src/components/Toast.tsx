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
      success: "bg-green-50 border-green-200 text-green-800",
      info: "bg-blue-50 border-blue-200 text-blue-800", 
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800"
    };

    let positionStyles = "";
    if (!isVisible && !isLeaving) {
      positionStyles = "translate-x-full opacity-0";
    } else if (isLeaving) {
      positionStyles = "translate-x-full opacity-0";
    } else {
      positionStyles = "translate-x-0 opacity-100";
    }

    return `${baseStyles} ${typeStyles[toast.type]} ${positionStyles}`;
  };
  const getIcon = () => {
    if (toast.icon) return toast.icon;

    const iconProps = { size: 20 };
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle {...iconProps} color="#059669" />;
      case 'info':
        return <FaInfoCircle {...iconProps} color="#2563eb" />;
      case 'warning':
        return <FaExclamationTriangle {...iconProps} color="#d97706" />;
      case 'error':
        return <FaTimesCircle {...iconProps} color="#dc2626" />;
      default:
        return <FaInfoCircle {...iconProps} />;
    }
  };

  return (
    <div className={`${getStyles()} max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 mb-4 pointer-events-auto`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{toast.title}</p>
            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleRemove}
              className="rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
