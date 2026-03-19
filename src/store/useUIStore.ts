import { create } from 'zustand';
import { ViewMode } from '../types';

interface UIState {
  viewMode: ViewMode;
  isFocusMode: boolean;
  toast: {
    isOpen: boolean;
    title: string;
    message: string;
  };
  setViewMode: (mode: ViewMode) => void;
  setIsFocusMode: (isFocusMode: boolean) => void;
  setToast: (toast: { isOpen: boolean; title: string; message: string }) => void;
  closeToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'today',
  isFocusMode: false,
  toast: {
    isOpen: false,
    title: '',
    message: '',
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setIsFocusMode: (isFocusMode) => set({ isFocusMode }),
  setToast: (toast) => set({ toast }),
  closeToast: () => set((state) => ({ toast: { ...state.toast, isOpen: false } })),
}));
