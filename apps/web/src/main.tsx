import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { setToken } from './lib/api'
import './index.css'

// The launcher hands the phone a ?token=... link so the token never has to be typed in.
const fromUrl = new URLSearchParams(location.search).get('token')
if (fromUrl) {
  setToken(fromUrl)
  history.replaceState(null, '', location.pathname)
}

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
