export interface SQLQuery {
  sql: string;
  time: string;
  formatted_sql: string;
}

export interface SQLDebugInfo {
  count: number;
  total_time: string;
  queries: SQLQuery[];
}

export interface SQLDebugContextType {
  sqlQueries: SQLQuery[];
  debugInfo: SQLDebugInfo | null;
  addSQLDebugInfo: (debugInfo: SQLDebugInfo) => void;
  clearQueries: () => void;
  isTerminalOpen: boolean;
  toggleTerminal: () => void;
}