import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Reader from './pages/Reader';
import Search from './pages/Search';
import Compare from './pages/Compare';
import './styles/globals.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reader/:paperId" element={<Reader />} />
            <Route path="/search" element={<Search />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;