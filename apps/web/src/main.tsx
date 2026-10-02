import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { setToken } from './lib/api'
import { loadCatalog } from './lib/catalog'
import './index.css'

// The launcher hands the phone a ?token=... link so the token never has to be typed in.
// It is dropped from the address bar right after it is stored.
const params = new URLSearchParams(location.search)
const tokenFromUrl = params.get('token')
if (tokenFromUrl) setToken(tokenFromUrl)
// Eski elle sunucu adresi kaydi artik okunmuyor; telefonda kalmasin.
localStorage.removeItem('wellness.api_base')
if (tokenFromUrl) history.replaceState(null, '', location.pathname)

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

// Katalog once yerine otursun: ekran acildiktan sonra degisirse listeler eski kalir.
// Basarisizlik acilisi durdurmaz - `loadCatalog` zaten gomulu kopyaya duser.
void loadCatalog().finally(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
