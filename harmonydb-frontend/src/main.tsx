import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/authContext.tsx'
import { SQLDebugProvider } from './context/sqlDebugContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SQLDebugProvider>
        <App />
      </SQLDebugProvider>
    </AuthProvider>
  </StrictMode>,
)