import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadPaper } from '../../services/api';
import toast from 'react-hot-toast';

function PDFUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (formData) => uploadPaper(formData),
    onSuccess: (data) => {
      toast.success(`Paper "${data.title}" uploaded successfully!`);
      setFile(null);
      setTitle('');
      setAuthors('');
      onUploadSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload paper');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (authors) formData.append('authors', authors);

    uploadMutation.mutate(formData);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        toast.success(`File selected: ${droppedFile.name}`);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600">
            {file ? (
              <span className="text-green-600 font-semibold">{file.name}</span>
            ) : (
              'Drag and drop a PDF file here, or click to browse'
            )}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Maximum file size: 50MB'}
          </p>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const selectedFile = e.target.files[0];
              if (selectedFile) {
                setFile(selectedFile);
                toast.success(`File selected: ${selectedFile.name}`);
              }
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            Browse Files
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Paper title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Authors (optional)
          </label>
          <input
            type="text"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            placeholder="Author1, Author2, ..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={uploadMutation.isPending || !file}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
      >
        {uploadMutation.isPending ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <span>📤</span>
            <span>Upload Paper</span>
          </>
        )}
      </button>
    </form>
  );
}

export default PDFUploader;
