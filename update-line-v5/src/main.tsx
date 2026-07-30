import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'

// Applique le thème choisi avant le premier rendu, pour éviter un flash du thème par défaut.
const savedTheme = localStorage.getItem('update-line-theme')
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
