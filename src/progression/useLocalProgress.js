import { useContext } from 'react'
import { LocalProgressContext } from './LocalProgressContext.js'

export function useLocalProgress() {
  const progress = useContext(LocalProgressContext)
  if (!progress) throw new Error('The game requires a local progress provider')
  return progress
}
