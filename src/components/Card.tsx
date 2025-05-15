import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export default Card;
