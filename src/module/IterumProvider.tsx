import { ThemeProvider } from '../context/ThemeContext';
import {
  createLocalStorageAdapter,
  setIterumStorageAdapter,
  type IterumStorageAdapter,
} from '../core/storage/iterumStorage';

export interface IterumProviderProps {
  children: React.ReactNode;
  storage?: IterumStorageAdapter;
}

const defaultStorage = createLocalStorageAdapter();

export function IterumProvider({ children, storage }: IterumProviderProps) {
  setIterumStorageAdapter(storage ?? defaultStorage);

  return <ThemeProvider>{children}</ThemeProvider>;
}
