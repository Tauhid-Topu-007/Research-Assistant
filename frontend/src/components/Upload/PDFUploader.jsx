import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadPaper } from '../../services/api';
import toast from 'react-hot-toast';

function PDFUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');

  const uploadMutation = useMutation({
    mutationFn: (formData) => uploadPaper(formData),
    onSuccess: () => {
      toast.success('Paper uploaded successfully!');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          PDF File *
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

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
          Authors (optional, comma separated)
        </label>
        <input
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Author1, Author2, ..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={uploadMutation.isPending}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {uploadMutation.isPending ? 'Uploading...' : 'Upload Paper'}
      </button>
    </form>
  );
}

export default PDFUploader;