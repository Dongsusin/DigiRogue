import { initializeApp, getApps } from 'firebase/app'
import { getAuth, browserSessionPersistence, setPersistence } from 'firebase/auth'
import defaults from './firebaseConfig.json' with { type: 'json' }
const env = import.meta.env ?? {}
const config = Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key,
  env['VITE_FIREBASE_' + key.replace(/[A-Z]/g, letter => '_' + letter).toUpperCase()] || value]))
export const firebaseApp = getApps().find(app => app.name === 'digilog') ?? initializeApp(config, 'digilog')
export const firebaseAuth = getAuth(firebaseApp)
export const authPersistenceReady = setPersistence(firebaseAuth, browserSessionPersistence)
