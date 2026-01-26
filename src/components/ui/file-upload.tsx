import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  value?: string[];
  onChange?: (files: string[]) => void;
  onUpload?: (files: File[]) => Promise<string[]>;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 1,
  value = [],
  onChange,
  onUpload,
  className,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) return;
    
    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Validate file count
    if (value.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (onUpload) {
      setUploading(true);
      try {
        const urls = await onUpload(acceptedFiles);
        onChange?.([...value, ...urls]);
      } catch (err) {
        setError('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    } else {
      // For local development or when upload is not needed
      const previews = acceptedFiles.map(file => URL.createObjectURL(file));
      onChange?.([...value, ...previews]);
    }
  }, [value, onChange, onUpload, maxSize, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    maxFiles: maxFiles - value.length,
    disabled: disabled || uploading,
  });

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange?.(newFiles);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-primary hover:bg-primary/5',
            isDragActive && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            uploading && 'pointer-events-none'
          )}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              {uploading ? (
                <span>Uploading...</span>
              ) : isDragActive ? (
                <span>Drop the files here...</span>
              ) : (
                <div>
                  <span className="font-medium">Click to upload</span> or drag and drop
                  <br />
                  <span className="text-xs">
                    Images up to {(maxSize / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* File Previews */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-muted rounded-md"
            >
              <div className="flex-shrink-0">
                {file.startsWith('blob:') ? (
                  <img
                    src={file}
                    alt={`Upload ${index + 1}`}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <FileImage className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {file.startsWith('blob:') ? `Image ${index + 1}` : file.split('/').pop()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.startsWith('blob:') ? 'Local file' : 'Uploaded'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
