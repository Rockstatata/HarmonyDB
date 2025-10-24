import React, { useState } from 'react';
import { Terminal, X, Code, Clock, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useSQLDebug } from '../context/useSQLDebug';

const SQLTerminal: React.FC = () => {
  const { sqlQueries, debugInfo, isTerminalOpen, toggleTerminal, clearQueries } = useSQLDebug();
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null);

  const toggleQueryExpansion = (index: number) => {
    setExpandedQuery(expandedQuery === index ? null : index);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleTerminal}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110 ${
          isTerminalOpen 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={isTerminalOpen ? 'Close SQL Terminal' : 'Open SQL Terminal'}
      >
        {isTerminalOpen ? (
          <X className="text-white" size={24} />
        ) : (
          <Terminal className="text-white" size={24} />
        )}
      </button>

      {/* Terminal Window */}
      {isTerminalOpen && (
        <div className="fixed bottom-20 right-6 w-[800px] h-[500px] bg-gray-900 border border-blue-500 rounded-xl shadow-2xl overflow-hidden z-40 animate-[fadeInUp_0.3s_ease-out]">
          {/* Terminal Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="text-blue-400" size={20} />
              <h3 className="text-blue-400 font-bold text-lg">PostgreSQL Query Monitor</h3>
              {debugInfo && (
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-400 flex items-center">
                    <Code size={16} className="mr-1" />
                    {debugInfo.count} queries
                  </span>
                  <span className="text-yellow-400 flex items-center">
                    <Clock size={16} className="mr-1" />
                    {debugInfo.total_time}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={clearQueries}
              className="text-gray-400 hover:text-white text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Terminal Content */}
          <div className="h-[calc(100%-4rem)] overflow-y-auto p-4 bg-gray-900 font-mono text-sm">
            {sqlQueries.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Database size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No SQL queries captured yet</p>
                <p className="text-sm mt-2">Make any API request to see ALL PostgreSQL queries here</p>
                <p className="text-xs mt-1 text-gray-600">Includes SELECT, INSERT, UPDATE, DELETE, CREATE, etc.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sqlQueries.map((query, index) => (
                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Query Header */}
                    <div 
                      className="bg-gray-800 p-3 cursor-pointer hover:bg-gray-750 transition-colors flex items-center justify-between"
                      onClick={() => toggleQueryExpansion(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-400 font-semibold">Query #{index + 1}</span>
                        <span className="text-green-400 text-xs flex items-center">
                          <Clock size={14} className="mr-1" />
                          {query.time}s
                        </span>
                        {/* Query Type Badge */}
                        <span className={`text-xs px-2 py-1 rounded ${
                          query.sql.trim().toUpperCase().startsWith('SELECT') ? 'bg-blue-600 text-blue-100' :
                          query.sql.trim().toUpperCase().startsWith('INSERT') ? 'bg-green-600 text-green-100' :
                          query.sql.trim().toUpperCase().startsWith('UPDATE') ? 'bg-yellow-600 text-yellow-100' :
                          query.sql.trim().toUpperCase().startsWith('DELETE') ? 'bg-red-600 text-red-100' :
                          'bg-purple-600 text-purple-100'
                        }`}>
                          {query.sql.trim().split(' ')[0].toUpperCase()}
                        </span>
                      </div>
                      {expandedQuery === index ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>

                    {/* Query Content */}
                    <div className="bg-gray-900 p-4">
                      {/* Raw SQL (always visible) */}
                      <div className="mb-3">
                        <div className="text-gray-400 text-xs mb-2 flex items-center">
                          <Code size={14} className="mr-1" />
                          Raw SQL:
                        </div>
                        <div className="bg-black p-3 rounded text-yellow-300 text-xs overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-words">{query.sql}</pre>
                        </div>
                      </div>

                      {/* Formatted SQL (expandable) */}
                      {expandedQuery === index && (
                        <div>
                          <div className="text-gray-400 text-xs mb-2 flex items-center">
                            <Terminal size={14} className="mr-1" />
                            Formatted SQL:
                          </div>
                          <div className="bg-black p-3 rounded text-green-300 text-xs overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-words">{query.formatted_sql}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SQLTerminal;