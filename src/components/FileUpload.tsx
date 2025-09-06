import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file only",
        variant: "destructive",
      });
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileUpload(file);
      toast({
        title: "File uploaded successfully",
        description: "Processing your PDF...",
      });
    }
  }, [onFileUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
          id="file-upload"
        />
        
        <motion.div
          animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
          </motion.div>
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Upload Your PDF
            </h3>
            <p className="text-muted-foreground">
              Drag and drop your PDF here, or{' '}
              <label htmlFor="file-upload" className="text-primary hover:text-primary/80 cursor-pointer font-medium underline">
                browse files
              </label>
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-2 text-sm text-muted-foreground"
          >
            <FileText className="w-4 h-4" />
            <span>PDF files only</span>
          </motion.div>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </motion.div>
      )}

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <div className="inline-flex items-center space-x-2 text-primary">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Processing your PDF...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FileUpload;