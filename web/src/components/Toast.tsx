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
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      // Barra de progresso
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      // Timer para remover toast
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
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
    
    let positionStyles = "";
    if (!isVisible && !isLeaving) {
      positionStyles = "translate-x-full opacity-0 scale-95";
    } else if (isLeaving) {
      positionStyles = "translate-x-full opacity-0 scale-95";
    } else {
      positionStyles = "translate-x-0 opacity-100 scale-100";
    }

    return `${baseStyles} ${positionStyles}`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          containerClass: "bg-white border-l-4 border-green-500 shadow-lg",
          iconColor: "#10b981",
          progressColor: "bg-green-500"
        };
      case 'info':
        return {
          containerClass: "bg-white border-l-4 border-blue-500 shadow-lg",
          iconColor: "#3b82f6",
          progressColor: "bg-blue-500"
        };
      case 'warning':
        return {
          containerClass: "bg-white border-l-4 border-yellow-500 shadow-lg",
          iconColor: "#f59e0b",
          progressColor: "bg-yellow-500"
        };
      case 'error':
        return {
          containerClass: "bg-white border-l-4 border-red-500 shadow-lg",
          iconColor: "#ef4444",
          progressColor: "bg-red-500"
        };
      default:
        return {
          containerClass: "bg-white border-l-4 border-gray-500 shadow-lg",
          iconColor: "#6b7280",
          progressColor: "bg-gray-500"
        };
    }
  };

  const getIcon = () => {
    if (toast.icon) return toast.icon;

    const typeStyles = getTypeStyles();
    const iconClass = "w-6 h-6";
    
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle className={iconClass} color={typeStyles.iconColor} />;
      case 'info':
        return <FaInfoCircle className={iconClass} color={typeStyles.iconColor} />;
      case 'warning':
        return <FaExclamationTriangle className={iconClass} color={typeStyles.iconColor} />;
      case 'error':
        return <FaTimesCircle className={iconClass} color={typeStyles.iconColor} />;
      default:
        return <FaInfoCircle className={iconClass} color={typeStyles.iconColor} />;
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className={`${getStyles()} max-w-sm w-full pointer-events-auto relative overflow-hidden`}>
      <div className={`${typeStyles.containerClass} rounded-lg`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 leading-5">
                {toast.title}
              </p>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleRemove}
                className="rounded-md inline-flex text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 p-1"
                aria-label="Fechar notificação"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {/* Barra de progresso */}
        {toast.duration && toast.duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full ${typeStyles.progressColor} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
