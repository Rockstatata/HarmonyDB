import React, { useState } from 'react';
import { Terminal, X, Code, Clock, Database, ChevronDown, ChevronUp, Filter, TrendingUp } from 'lucide-react';
import { useSQLDebug } from '../context/useSQLDebug';

// SQL Query classifier
const classifyQuery = (sql: string): { type: string; color: string; icon: string; concepts: string[] } => {
  const upperSQL = sql.trim().toUpperCase();
  const concepts: string[] = [];
  
  // Detect SQL concepts
  if (upperSQL.includes('JOIN')) {
    if (upperSQL.includes('LEFT')) concepts.push('LEFT JOIN');
    else if (upperSQL.includes('RIGHT')) concepts.push('RIGHT JOIN');
    else if (upperSQL.includes('INNER')) concepts.push('INNER JOIN');
    else if (upperSQL.includes('FULL')) concepts.push('FULL JOIN');
    else if (upperSQL.includes('CROSS')) concepts.push('CROSS JOIN');
    else concepts.push('JOIN');
  }
  if (upperSQL.includes('GROUP BY')) concepts.push('GROUP BY');
  if (upperSQL.includes('HAVING')) concepts.push('HAVING');
  if (upperSQL.includes('ORDER BY')) concepts.push('ORDER BY');
  if (upperSQL.includes('DISTINCT')) concepts.push('DISTINCT');
  if (upperSQL.includes('COUNT(')) concepts.push('COUNT');
  if (upperSQL.includes('SUM(')) concepts.push('SUM');
  if (upperSQL.includes('AVG(')) concepts.push('AVG');
  if (upperSQL.includes('MIN(')) concepts.push('MIN');
  if (upperSQL.includes('MAX(')) concepts.push('MAX');
  if (upperSQL.includes('WHERE')) concepts.push('WHERE');
  if (upperSQL.includes('BETWEEN')) concepts.push('BETWEEN');
  if (upperSQL.includes('IN (')) concepts.push('IN');
  if (upperSQL.includes('LIKE')) concepts.push('LIKE');
  if (upperSQL.includes('CASE WHEN')) concepts.push('CASE WHEN');
  if (upperSQL.includes('SUBQUERY') || upperSQL.match(/\(\s*SELECT/)) concepts.push('Subquery');
  if (upperSQL.includes('WITH') && upperSQL.includes('AS (')) concepts.push('CTE');
  if (upperSQL.includes('UNION')) concepts.push('UNION');
  if (upperSQL.includes('INTERSECT')) concepts.push('INTERSECT');
  if (upperSQL.includes('EXCEPT')) concepts.push('EXCEPT');
  
  // Determine query type
  if (upperSQL.startsWith('SELECT')) {
    return { type: 'SELECT', color: 'bg-blue-600 text-blue-100', icon: '🔍', concepts };
  } else if (upperSQL.startsWith('INSERT')) {
    return { type: 'INSERT', color: 'bg-green-600 text-green-100', icon: '➕', concepts };
  } else if (upperSQL.startsWith('UPDATE')) {
    return { type: 'UPDATE', color: 'bg-yellow-600 text-yellow-100', icon: '✏️', concepts };
  } else if (upperSQL.startsWith('DELETE')) {
    return { type: 'DELETE', color: 'bg-red-600 text-red-100', icon: '🗑️', concepts };
  } else if (upperSQL.startsWith('CREATE')) {
    return { type: 'CREATE', color: 'bg-purple-600 text-purple-100', icon: '🔨', concepts };
  } else if (upperSQL.startsWith('ALTER')) {
    return { type: 'ALTER', color: 'bg-orange-600 text-orange-100', icon: '🔧', concepts };
  } else if (upperSQL.startsWith('DROP')) {
    return { type: 'DROP', color: 'bg-red-700 text-red-100', icon: '💥', concepts };
  }
  return { type: 'OTHER', color: 'bg-gray-600 text-gray-100', icon: '📝', concepts };
};

const SQLTerminal: React.FC = () => {
  const { sqlQueries, debugInfo, isTerminalOpen, toggleTerminal, clearQueries } = useSQLDebug();
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const toggleQueryExpansion = (index: number) => {
    setExpandedQuery(expandedQuery === index ? null : index);
  };

  // Filter queries by type
  const filteredQueries = filterType === 'all' 
    ? sqlQueries 
    : sqlQueries.filter(q => {
        const classification = classifyQuery(q.sql);
        return classification.type === filterType;
      });

  // Get query stats
  const queryStats = {
    total: sqlQueries.length,
    select: sqlQueries.filter(q => classifyQuery(q.sql).type === 'SELECT').length,
    insert: sqlQueries.filter(q => classifyQuery(q.sql).type === 'INSERT').length,
    update: sqlQueries.filter(q => classifyQuery(q.sql).type === 'UPDATE').length,
    delete: sqlQueries.filter(q => classifyQuery(q.sql).type === 'DELETE').length,
    ddl: sqlQueries.filter(q => ['CREATE', 'ALTER', 'DROP'].includes(classifyQuery(q.sql).type)).length,
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleTerminal}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110 ${
          isTerminalOpen 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-primary hover:bg-primary/90'
        }`}
        title={isTerminalOpen ? 'Close SQL Terminal' : 'Open SQL Terminal'}
      >
        {isTerminalOpen ? (
          <X className="text-white" size={24} />
        ) : (
          <Terminal className="text-white" size={24} />
        )}
        {sqlQueries.length > 0 && !isTerminalOpen && (
          <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {sqlQueries.length}
          </span>
        )}
      </button>

      {/* Terminal Window */}
      {isTerminalOpen && (
        <div className="fixed bottom-20 right-6 w-[900px] h-[600px] bg-gray-900 border border-primary/50 rounded-xl shadow-2xl overflow-hidden z-40 animate-[fadeInUp_0.3s_ease-out]">
          {/* Terminal Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Database className="text-primary" size={20} />
                <h3 className="text-primary font-bold text-lg">SQL Query Monitor</h3>
              </div>
              <button
                onClick={clearQueries}
                className="text-gray-400 hover:text-white text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
            
            {/* Stats Row */}
            {debugInfo && (
              <div className="flex items-center space-x-4 text-xs mb-3">
                <span className="text-primary flex items-center bg-primary/10 px-2 py-1 rounded">
                  <Code size={14} className="mr-1" />
                  {debugInfo.count} queries
                </span>
                <span className="text-yellow-400 flex items-center bg-yellow-400/10 px-2 py-1 rounded">
                  <Clock size={14} className="mr-1" />
                  {debugInfo.total_time}
                </span>
                <span className="text-blue-400 flex items-center bg-blue-400/10 px-2 py-1 rounded">
                  🔍 {queryStats.select} SELECT
                </span>
                <span className="text-green-400 flex items-center bg-green-400/10 px-2 py-1 rounded">
                  ➕ {queryStats.insert} INSERT
                </span>
                <span className="text-yellow-300 flex items-center bg-yellow-300/10 px-2 py-1 rounded">
                  ✏️ {queryStats.update} UPDATE
                </span>
                <span className="text-red-400 flex items-center bg-red-400/10 px-2 py-1 rounded">
                  🗑️ {queryStats.delete} DELETE
                </span>
              </div>
            )}
            
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-gray-400" />
              <button
                onClick={() => setFilterType('all')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  filterType === 'all' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({queryStats.total})
              </button>
              <button
                onClick={() => setFilterType('SELECT')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  filterType === 'SELECT' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                SELECT ({queryStats.select})
              </button>
              <button
                onClick={() => setFilterType('INSERT')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  filterType === 'INSERT' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                INSERT ({queryStats.insert})
              </button>
              <button
                onClick={() => setFilterType('UPDATE')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  filterType === 'UPDATE' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                UPDATE ({queryStats.update})
              </button>
              <button
                onClick={() => setFilterType('DELETE')}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  filterType === 'DELETE' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                DELETE ({queryStats.delete})
              </button>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="h-[calc(100%-9rem)] overflow-y-auto p-4 bg-gray-900 font-mono text-sm">
            {filteredQueries.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Database size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {filterType === 'all' ? 'No SQL queries captured yet' : `No ${filterType} queries found`}
                </p>
                <p className="text-sm mt-2">Make API requests to see ALL PostgreSQL queries here</p>
                <p className="text-xs mt-1 text-gray-600">Includes SELECT, INSERT, UPDATE, DELETE, CREATE, etc.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueries.map((query) => {
                  const classification = classifyQuery(query.sql);
                  const actualIndex = sqlQueries.indexOf(query);
                  
                  return (
                    <div key={actualIndex} className="border border-gray-700 rounded-lg overflow-hidden">
                      {/* Query Header */}
                      <div 
                        className="bg-gray-800 p-3 cursor-pointer hover:bg-gray-750 transition-colors flex items-center justify-between"
                        onClick={() => toggleQueryExpansion(actualIndex)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-blue-400 font-semibold whitespace-nowrap">
                            #{actualIndex + 1}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${classification.color} font-semibold whitespace-nowrap`}>
                            {classification.icon} {classification.type}
                          </span>
                          <span className="text-primary text-xs flex items-center whitespace-nowrap">
                            <Clock size={12} className="mr-1" />
                            {query.time}s
                          </span>
                          {/* SQL Concepts */}
                          {classification.concepts.length > 0 && (
                            <div className="flex items-center space-x-1 overflow-x-auto">
                              {classification.concepts.slice(0, 4).map((concept, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent whitespace-nowrap">
                                  {concept}
                                </span>
                              ))}
                              {classification.concepts.length > 4 && (
                                <span className="text-xs text-gray-400">+{classification.concepts.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {expandedQuery === actualIndex ? (
                          <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                        )}
                      </div>

                      {/* Query Content */}
                      <div className="bg-gray-900 p-4">
                        {/* Raw SQL (always visible but compact) */}
                        <div className="mb-3">
                          <div className="text-gray-400 text-xs mb-2 flex items-center">
                            <Code size={14} className="mr-1" />
                            SQL Query:
                          </div>
                          <div className="bg-black p-3 rounded text-yellow-300 text-xs overflow-x-auto max-h-24">
                            <pre className="whitespace-pre-wrap break-words">{query.sql}</pre>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedQuery === actualIndex && (
                          <>
                            {/* All SQL Concepts */}
                            {classification.concepts.length > 0 && (
                              <div className="mb-3">
                                <div className="text-gray-400 text-xs mb-2 flex items-center">
                                  <TrendingUp size={14} className="mr-1" />
                                  SQL Concepts Detected:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {classification.concepts.map((concept, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded bg-accent/20 text-accent">
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Formatted SQL */}
                            <div>
                              <div className="text-gray-400 text-xs mb-2 flex items-center">
                                <Terminal size={14} className="mr-1" />
                                Formatted SQL:
                              </div>
                              <div className="bg-background border border-accent/20 p-3 rounded text-primary text-xs overflow-x-auto max-h-96">
                                <pre className="whitespace-pre-wrap break-words">{query.formatted_sql}</pre>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SQLTerminal;