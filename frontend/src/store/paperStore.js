import { create } from 'zustand';

const usePaperStore = create((set) => ({
  papers: [],
  currentPaper: null,
  isLoading: false,
  error: null,

  setPapers: (papers) => set({ papers }),
  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  addPaper: (paper) => set((state) => ({
    papers: [...state.papers, paper]
  })),

  removePaper: (id) => set((state) => ({
    papers: state.papers.filter(p => p.id !== id)
  })),

  updatePaper: (id, updates) => set((state) => ({
    papers: state.papers.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
  }))
}));

export default usePaperStore;