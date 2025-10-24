import { useEffect } from 'react';
import AllRoutes from './routes/AllRoutes'
import { PlayerProvider } from './context/playerContext'
import SQLTerminal from './components/SQLTerminal'
import { useSQLDebug } from './context/useSQLDebug'
import { apiService } from './services/apiServices'

function App() {
  const { addSQLDebugInfo } = useSQLDebug();

  // Set up the SQL debug callback for the API service globally
  useEffect(() => {
    apiService.setSQLDebugCallback(addSQLDebugInfo);
  }, [addSQLDebugInfo]);

  return (
    <PlayerProvider>
      <AllRoutes />
      {/* Global SQL Terminal - visible on all pages */}
      <SQLTerminal />
    </PlayerProvider>
  )
}

export default App
