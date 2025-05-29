import React from 'react';

interface InputProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  maxLength?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  maxLength,
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-purple-200 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          w-full px-4 py-2 bg-purple-900/70 border rounded-md 
          text-white placeholder-purple-400
          focus:outline-none focus:ring-2 focus:ring-purple-500
          ${error ? 'border-red-500' : 'border-purple-700'}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;