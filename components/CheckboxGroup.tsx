
import React from 'react';
import { Snowflake } from 'lucide-react';

interface CheckboxGroupProps {
  options: string[];
  selectedValue: string | string[];
  onChange: (value: string) => void;
  name: string;
  columns?: 1 | 2 | 3 | 4;
  type?: 'radio' | 'checkbox';
  required?: boolean;
  disabledOptions?: string[];
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  selectedValue,
  onChange,
  name,
  columns = 3,
  type = 'radio',
  required = false,
  disabledOptions = []
}) => {
  const isSelected = (option: string) => {
    return Array.isArray(selectedValue) ? selectedValue.includes(option) : selectedValue === option;
  };

  const isDisabled = (option: string) => {
    return disabledOptions.includes(option);
  };

  const isWinterOption = (option: string) => {
    return ['Beanies', 'Fleece Jackets', 'Winter Jackets'].includes(option);
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-3`}>
      {options.map((option) => (
        <div key={option}>
          <input
            type={type}
            id={`${name}-${option}`}
            name={name}
            value={option}
            checked={isSelected(option)}
            onChange={() => !isDisabled(option) && onChange(option)}
            required={required}
            disabled={isDisabled(option)}
            className="sr-only peer"
          />
          <label
            htmlFor={`${name}-${option}`}
            className={`flex items-center justify-center gap-2 w-full text-center px-4 py-3 border rounded-lg transition-all duration-200 ease-in-out text-sm font-medium
            ${isSelected(option)
                ? 'bg-black border-black text-white shadow-md cursor-pointer'
                : isDisabled(option)
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
            }`}
          >
            {isWinterOption(option) && (
              <Snowflake 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isSelected(option) 
                    ? 'text-sky-300' 
                    : isDisabled(option) 
                      ? 'text-gray-400' 
                      : 'text-sky-500'
                }`}
                aria-hidden="true"
              />
            )}
            <span>{option}</span>
          </label>
        </div>
      ))}
    </div>
  );
};
