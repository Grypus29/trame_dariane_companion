import { normalizeMobileState } from './mobileStore'
import type { MobileState, PairingState, Project, SyncOperation } from '../types'

type PairClaimResponse = {
  pairingId: string
  desktopInstanceId: string
  project: Project
  serverRevision: number
  state: Partial<MobileState>
}

type SyncStateResponse = {
  serverRevision: number
  state: Partial<MobileState>
}

type SyncPushResponse = SyncStateResponse & {
  acceptedOperationIds: string[]
}

function buildHeaders(pairing: PairingState) {
  if (!pairing.token) {
    throw new Error("Aucun token d'appairage.")
  }

  return {
    Authorization: `Bearer ${pairing.token}`,
    'X-Device-Id': pairing.deviceId,
  }
}

function parsePairingUrl(rawUrl: string) {
  let url: URL

  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new Error("L'URL d'appairage est invalide.")
  }

  // Accepte aussi le format QR complet : http://<ip>:5173/?pair=<url-encodée>
  const pairParam = url.searchParams.get('pair')
  if (pairParam) {
    try {
      url = new URL(pairParam)
    } catch {
      throw new Error("L'URL embarquée dans le paramètre 'pair' est invalide.")
    }
  }

  const token = url.searchParams.get('token')

  if (!token) {
    throw new Error("L'URL d'appairage ne contient pas de token.")
  }

  return { url, token, desktopBaseUrl: url.origin }
}

export async function claimPairing(rawUrl: string, deviceId: string) {
  const { url, token, desktopBaseUrl } = parsePairingUrl(rawUrl)
  url.searchParams.set('deviceId', deviceId)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Appairage refusé (${response.status}).`)
  }

  const payload = await response.json() as PairClaimResponse
  const state = normalizeMobileState(payload.state)
  const now = new Date().toISOString()
  const pairing: PairingState = {
    paired: true,
    pairingId: payload.pairingId,
    deviceId,
    desktopInstanceId: payload.desktopInstanceId,
    desktopBaseUrl,
    projectId: payload.project.id,
    projectName: payload.project.name,
    pairedAt: now,
    lastSyncAt: now,
    token,
    serverRevision: payload.serverRevision,
  }

  return { state, pairing }
}

export async function fetchSyncState(pairing: PairingState) {
  if (!pairing.desktopBaseUrl) {
    throw new Error("Aucune adresse desktop enregistrée.")
  }

  const response = await fetch(`${pairing.desktopBaseUrl}/sync/state`, {
    headers: buildHeaders(pairing),
  })

  if (!response.ok) {
    throw new Error(`Lecture de l'état impossible (${response.status}).`)
  }

  const payload = await response.json() as SyncStateResponse

  return {
    state: normalizeMobileState(payload.state),
    serverRevision: payload.serverRevision,
  }
}

export async function pushSyncOperations(pairing: PairingState, operations: SyncOperation[]) {
  if (!pairing.desktopBaseUrl) {
    throw new Error("Aucune adresse desktop enregistrée.")
  }

  const response = await fetch(`${pairing.desktopBaseUrl}/sync/push`, {
    method: 'POST',
    headers: {
      ...buildHeaders(pairing),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      baseRevision: pairing.serverRevision,
      operations,
    }),
  })

  if (!response.ok) {
    throw new Error(`Synchronisation impossible (${response.status}).`)
  }

  const payload = await response.json() as SyncPushResponse

  return {
    acceptedOperationIds: payload.acceptedOperationIds,
    state: normalizeMobileState(payload.state),
    serverRevision: payload.serverRevision,
  }
}
