import { create } from 'zustand';

const useHighlightStore = create((set) => ({
  highlights: [],
  selectedHighlight: null,
  isAddingHighlight: false,

  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (highlight) => set((state) => ({
    highlights: [...state.highlights, highlight]
  })),
  removeHighlight: (id) => set((state) => ({
    highlights: state.highlights.filter(h => h.id !== id)
  })),
  clearHighlights: () => set({ highlights: [] }),

  setSelectedHighlight: (highlight) => set({ selectedHighlight: highlight }),
  clearSelectedHighlight: () => set({ selectedHighlight: null }),

  setAddingHighlight: (isAdding) => set({ isAddingHighlight: isAdding }),

  updateHighlight: (id, updates) => set((state) => ({
    highlights: state.highlights.map(h =>
      h.id === id ? { ...h, ...updates } : h
    )
  }))
}));

export default useHighlightStore;