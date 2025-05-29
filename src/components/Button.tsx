import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
}) => {
  const colorClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-purple-700',
    secondary: 'bg-purple-800 hover:bg-purple-700 text-white border-purple-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-700',
  };
  
  const sizeClasses = {
    small: 'py-1.5 px-3 text-sm',
    medium: 'py-2 px-4',
    large: 'py-3 px-6 text-lg',
  };
  
  return (
    <button
      type={type}
      className={`
        ${colorClasses[color]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-md font-medium shadow-sm transition duration-150
        border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
        inline-flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;