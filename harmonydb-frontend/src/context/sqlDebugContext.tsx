import React, { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { SQLQuery, SQLDebugInfo, SQLDebugContextType } from './sqlDebugTypes';

const SQLDebugContext = createContext<SQLDebugContextType | undefined>(undefined);

interface SQLDebugProviderProps {
  children: ReactNode;
}

export const SQLDebugProvider: React.FC<SQLDebugProviderProps> = ({ children }) => {
  const [sqlQueries, setSqlQueries] = useState<SQLQuery[]>([]);
  const [debugInfo, setDebugInfo] = useState<SQLDebugInfo | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const addSQLDebugInfo = (newDebugInfo: SQLDebugInfo) => {
    setDebugInfo(newDebugInfo);
    setSqlQueries(newDebugInfo.queries);
  };

  const clearQueries = () => {
    setSqlQueries([]);
    setDebugInfo(null);
  };

  const toggleTerminal = () => {
    setIsTerminalOpen(!isTerminalOpen);
  };

  const value: SQLDebugContextType = {
    sqlQueries,
    debugInfo,
    addSQLDebugInfo,
    clearQueries,
    isTerminalOpen,
    toggleTerminal,
  };

  return (
    <SQLDebugContext.Provider value={value}>
      {children}
    </SQLDebugContext.Provider>
  );
};

export { SQLDebugContext };