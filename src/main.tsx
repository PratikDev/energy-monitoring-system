import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import './index.css'
import App from './App.tsx'
import { MissingConfiguration } from '@/features/dashboard/components/MissingConfiguration'
import { convexClient } from '@/lib/convex'

const app = convexClient ? (
  <ConvexProvider client={convexClient}>
    <App />
  </ConvexProvider>
) : (
  <MissingConfiguration />
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {app}
  </StrictMode>,
)
