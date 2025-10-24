import AllRoutes from './routes/AllRoutes'
import { PlayerProvider } from './context/playerContext'

function App() {
  return (
    <PlayerProvider>
      <AllRoutes />
    </PlayerProvider>
  )
}

export default App
