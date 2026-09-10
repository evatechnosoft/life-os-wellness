import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { setApiBase, setToken } from './lib/api'
import './index.css'

// The launcher hands the phone a ?token=... link so the token never has to be typed in.
// An ?api=... rides along when the phone should talk to the LAN instead of the tunnel.
// Both are dropped from the address bar right after they are stored.
const params = new URLSearchParams(location.search)
const tokenFromUrl = params.get('token')
const apiFromUrl = params.get('api')
if (tokenFromUrl) setToken(tokenFromUrl)
if (apiFromUrl) setApiBase(apiFromUrl)
if (tokenFromUrl || apiFromUrl) history.replaceState(null, '', location.pathname)

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
