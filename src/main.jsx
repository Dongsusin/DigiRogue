import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GameViewport from './components/GameViewport.jsx'
import LocalGame from './components/LocalGame.jsx'
import AuthProvider from './auth/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameViewport><AuthProvider><LocalGame /></AuthProvider></GameViewport>
  </StrictMode>,
)
