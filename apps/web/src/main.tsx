import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { setToken } from './lib/api'
import { loadCatalog } from './lib/catalog'
import { initRemoteFlags } from './lib/remoteFlags'
import { restoreToken } from './lib/tokenFile'
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

// Kill-switch'ler arka planda: acilis bunu beklemez, ozellikler kullanilirken okur.
void initRemoteFlags()

// Katalog once yerine otursun: ekran acildiktan sonra degisirse listeler eski kalir.
// Basarisizlik acilisi durdurmaz - `loadCatalog` zaten gomulu kopyaya duser.
// Token da ilk istekten once: kaldir-kur sonrasi kalici dosyadan geri gelir.
void Promise.allSettled([loadCatalog(), restoreToken()]).finally(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
