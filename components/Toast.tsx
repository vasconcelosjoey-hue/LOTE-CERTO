import React, { useEffect } from 'react';
import { CheckCircle } from '@phosphor-icons/react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="bg-medical-dark text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3 border border-white/10">
        <div className="bg-medical-primary rounded-full p-1 text-white">
           <CheckCircle weight="bold" className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};