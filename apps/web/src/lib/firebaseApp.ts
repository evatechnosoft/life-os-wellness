import { initializeApp, type FirebaseApp } from 'firebase/app'

/**
 * Asagidaki degerler gizli degil (istemci yapilandirmasi, her tarayiciya gider); yetki
 * App Check'te. Proje: evaitec-wellness (deancjx@gmail.com).
 */
const FIREBASE = {
  apiKey: 'AIzaSyAa696xxcTeg2jumZR0Zs0Qyr4MHEwHwsY',
  authDomain: 'evaitec-wellness.firebaseapp.com',
  projectId: 'evaitec-wellness',
  appId: '1:515567574867:web:6496b7019e3a7e8b260ba6',
}

/** Tek Firebase uygulamasi: AI Logic ve Remote Config ayni ornegi paylasir. */
export function firebaseApp(): FirebaseApp {
  return initializeApp(FIREBASE) // ayni yapilandirmayla tekrar cagri mevcut ornegi dondurur
}
