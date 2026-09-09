import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  maxFiles: number;
  onFilesChange: (files: File[]) => void;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ maxFiles, onFilesChange, required = false }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const processNewFiles = useCallback((incomingFiles: File[]) => {
    if (files.length + incomingFiles.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }
    const updatedFiles = [...files, ...incomingFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    setError('');
  }, [files, maxFiles, onFilesChange]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processNewFiles(Array.from(event.target.files));
    }
  }, [processNewFiles]);

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processNewFiles(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  }, [processNewFiles]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-center w-full">
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
          ${isDragging ? 'bg-indigo-50 border-indigo-400' : 'border-gray-300 hover:bg-gray-100 hover:border-gray-400'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V6a4 4 0 014-4h5l4 4v10a4 4 0 01-4 4H7z"></path></svg>
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*" required={required && files.length === 0} />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative border rounded-lg p-2">
              <p className="text-xs text-gray-600 truncate">{file.name}</p>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
