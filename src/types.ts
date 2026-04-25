export type MobileTab = 'dedale' | 'ecrire' | 'elements' | 'settings'

export type IdeaType = 'scene' | 'fragment' | 'motif' | 'revelation'

export type IdeaStatus = 'idea' | 'draft' | 'written' | 'reviewed'

export type NarrativeElementKind = 'personnage' | 'lieu' | 'objet' | 'theme' | 'concept'

export type ManuscriptNodeKind = 'chapter' | 'subchapter' | 'block'

export type IdeaLinkKind = 'causal' | 'echo' | 'motif' | 'resonance' | 'tension'

export type SyncEntity = 'idea' | 'dedaleLink' | 'manuscriptNode' | 'element'

export type SyncAction = 'upsert' | 'delete' | 'move'

export type Project = {
  id: string
  name: string
}

export type MobileIdea = {
  id: string
  projectId: string | null
  type: IdeaType
  status: IdeaStatus
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type MobileIdeaLink = {
  id: string
  fromIdeaId: string
  toIdeaId: string
  kind: IdeaLinkKind
  note: string
  createdAt: string
  updatedAt: string
}

export type ManuscriptNode = {
  id: string
  projectId: string
  parentId: string | null
  kind: ManuscriptNodeKind
  title: string
  ideaId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type NarrativeElement = {
  id: string
  projectId: string | null
  kind: NarrativeElementKind
  name: string
  description: string
  traits: string
  updatedAt: string
}

export type PairingState = {
  paired: boolean
  pairingId: string | null
  deviceId: string
  desktopInstanceId: string | null
  desktopBaseUrl: string | null
  projectId: string | null
  projectName: string | null
  pairedAt: string | null
  lastSyncAt: string | null
  token: string | null
  serverRevision: number | null
}

export type SyncOperation = {
  id: string
  entity: SyncEntity
  action: SyncAction
  entityId: string
  payload: unknown
  createdAt: string
}

export type MobileState = {
  version: 1
  pairing: PairingState
  pendingOperations: SyncOperation[]
  projects: Project[]
  ideas: MobileIdea[]
  dedaleLinks: MobileIdeaLink[]
  manuscriptNodes: ManuscriptNode[]
  elements: NarrativeElement[]
}
