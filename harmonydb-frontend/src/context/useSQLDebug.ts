import { useContext } from 'react';
import { SQLDebugContext } from './sqlDebugContext';
import type { SQLDebugContextType } from './sqlDebugTypes';

export const useSQLDebug = (): SQLDebugContextType => {
  const context = useContext(SQLDebugContext);
  if (!context) {
    throw new Error('useSQLDebug must be used within a SQLDebugProvider');
  }
  return context;
};