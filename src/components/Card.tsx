import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`rounded-2xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden bg-white border border-orange-100 p-0 m-0 ${className}`}
    onClick={onClick}
    style={{padding: 0, margin: 0}}
  >
    {children}
  </div>
);

export default Card;
