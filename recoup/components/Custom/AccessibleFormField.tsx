import React from 'react';

interface AccessibleFormFieldProps {
    id: string;
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    helpText?: string;
    type?: string;
    ariaDescribedBy?: string;
    className?: string;
}

export default function AccessibleFormField({
    id,
    label,
    value,
    onChange,
    error,
    required = false,
    helpText,
    type = 'text',
    ariaDescribedBy,
    className = '',
}: AccessibleFormFieldProps) {
    return (
        <div className={`mb-4 ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={ariaDescribedBy || (error ? `${id}-error` : helpText ? `${id}-help` : undefined)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                placeholder={label}
            />
            {helpText && !error && (
                <span id={`${id}-help`} className="block mt-1 text-xs text-gray-600">{helpText}</span>
            )}
            {error && (
                <span id={`${id}-error`} role="alert" className="block mt-1 text-sm text-red-600">{error}</span>
            )}
        </div>
    );
}
