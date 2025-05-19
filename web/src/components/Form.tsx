import React from 'react';

interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

const Form: React.FC<FormProps> = ({ onSubmit, children, className = '' }) => (
  <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
    {children}
  </form>
);

export default Form;
