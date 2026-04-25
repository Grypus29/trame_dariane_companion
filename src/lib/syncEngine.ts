import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSyncState, pushSyncOperations } from './syncClient'
import type { MobileState, PairingState } from '../types'

export type SyncStatus = 'idle' | 'syncing' | 'connected' | 'offline'

type InternalStatus = 'syncing' | 'connected' | 'offline'

const RETRY_MS = 30_000

function updatedPairing(pairing: PairingState, serverRevision: number): PairingState {
  return { ...pairing, lastSyncAt: new Date().toISOString(), serverRevision }
}

export function useSyncEngine(
  state: MobileState,
  setState: React.Dispatch<React.SetStateAction<MobileState>>,
) {
  const [internalStatus, setInternalStatus] = useState<InternalStatus>('offline')
  const syncStatus: SyncStatus = state.pairing.paired ? internalStatus : 'idle'

  const flushing = useRef(false)
  const stateRef = useRef(state)

  // Mise à jour du ref après chaque rendu (pattern stable pour éviter les deps stale)
  useEffect(() => {
    stateRef.current = state
  })

  const flush = useCallback(async () => {
    const current = stateRef.current
    if (!current.pairing.paired || flushing.current) return

    flushing.current = true
    setInternalStatus('syncing')

    try {
      if (current.pendingOperations.length > 0) {
        const result = await pushSyncOperations(current.pairing, current.pendingOperations)
        const accepted = new Set(result.acceptedOperationIds)

        setState((prev) => ({
          ...result.state,
          pairing: updatedPairing(prev.pairing, result.serverRevision),
          pendingOperations: prev.pendingOperations.filter((op) => !accepted.has(op.id)),
        }))
      } else {
        const result = await fetchSyncState(current.pairing)

        setState((prev) => ({
          ...result.state,
          pairing: updatedPairing(prev.pairing, result.serverRevision),
          pendingOperations: prev.pendingOperations,
        }))
      }

      setInternalStatus('connected')
    } catch {
      setInternalStatus('offline')
    } finally {
      flushing.current = false
    }
  }, [setState])

  // Sync initial dès que paired devient true
  useEffect(() => {
    if (!state.pairing.paired) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flush est async, setState est toujours différé (après await)
    void flush()
  }, [state.pairing.paired, flush])

  // Retry toutes les 30s quand appairé
  useEffect(() => {
    if (!state.pairing.paired) return
    const timer = setInterval(() => void flush(), RETRY_MS)
    return () => clearInterval(timer)
  }, [state.pairing.paired, flush])

  // Flush immédiat quand de nouvelles opérations s'accumulent
  const prevCount = useRef(state.pendingOperations.length)
  useEffect(() => {
    const count = state.pendingOperations.length
    if (count > prevCount.current && state.pairing.paired) void flush()
    prevCount.current = count
  }, [state.pendingOperations.length, state.pairing.paired, flush])

  // Réagir aux events réseau natifs
  useEffect(() => {
    const onOnline = () => { if (stateRef.current.pairing.paired) void flush() }
    const onOffline = () => setInternalStatus('offline')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [flush])

  return { syncStatus, manualSync: flush }
}
