
import React from 'react';

interface FormSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  step: number;
  required?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, step, required }) => (
  <div className="pt-6 border-t border-gray-200">
    <label className="block text-lg font-semibold text-gray-700 mb-4">
      <span className="text-gray-600 font-bold">{step}.</span> {title}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);
