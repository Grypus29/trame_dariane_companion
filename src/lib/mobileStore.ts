import type {
  IdeaLinkKind,
  IdeaStatus,
  IdeaType,
  ManuscriptNode,
  MobileIdea,
  MobileIdeaLink,
  MobileState,
  NarrativeElement,
  PairingState,
  SyncAction,
  SyncEntity,
  SyncOperation,
} from '../types'

const STORAGE_KEY = 'trame-dariane-mobile-state-v1'

const now = new Date().toISOString()

const DESKTOP_IDEA_TYPES: IdeaType[] = ['scene', 'fragment', 'motif', 'revelation']
const DESKTOP_STATUSES: IdeaStatus[] = ['idea', 'draft', 'written', 'reviewed']
const DESKTOP_LINK_KINDS: IdeaLinkKind[] = ['causal', 'echo', 'motif', 'resonance', 'tension']
const SYNC_ENTITIES: SyncEntity[] = ['idea', 'dedaleLink', 'manuscriptNode', 'element']
const SYNC_ACTIONS: SyncAction[] = ['upsert', 'delete', 'move']

function createDeviceId() {
  if ('randomUUID' in crypto) {
    return `device-${crypto.randomUUID()}`
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const initialPairing: PairingState = {
  paired: false,
  pairingId: null,
  deviceId: createDeviceId(),
  desktopInstanceId: null,
  desktopBaseUrl: null,
  projectId: null,
  projectName: null,
  pairedAt: null,
  lastSyncAt: null,
  token: null,
  serverRevision: null,
}

export const initialState: MobileState = {
  version: 1,
  pairing: initialPairing,
  pendingOperations: [],
  projects: [{ id: 'roman-julie', name: 'Premier livre' }],
  ideas: [
    {
      id: 'idea-opening',
      projectId: 'roman-julie',
      type: 'scene',
      status: 'draft',
      title: 'Ouverture sur le chapiteau vide',
      content:
        "Une scene courte, presque silencieuse. Le personnage principal entre seule dans le chapiteau avant l'aube.",
      tags: ['ouverture', 'ambiance'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'idea-motif',
      projectId: 'roman-julie',
      type: 'motif',
      status: 'idea',
      title: 'La peur de tomber',
      content:
        'Noter le motif sans savoir encore ou il ira : chute physique, chute symbolique, confiance donnee aux autres.',
      tags: ['motif'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'idea-draft-1',
      projectId: 'roman-julie',
      type: 'fragment',
      status: 'draft',
      title: 'Brouillon dicte',
      content:
        "Je veux pouvoir dicter ici une scene brute depuis le telephone, puis la reprendre plus tard sur l'ordinateur.",
      tags: [],
      createdAt: now,
      updatedAt: now,
    },
  ],
  dedaleLinks: [
    {
      id: 'link-opening-motif',
      fromIdeaId: 'idea-opening',
      toIdeaId: 'idea-motif',
      kind: 'echo',
      note: 'Le vertige physique répond au motif de la chute.',
      createdAt: now,
      updatedAt: now,
    },
  ],
  manuscriptNodes: [
    {
      id: 'chapter-1',
      projectId: 'roman-julie',
      parentId: null,
      kind: 'chapter',
      title: 'Chapitre 1',
      ideaId: null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'block-draft-1',
      projectId: 'roman-julie',
      parentId: 'chapter-1',
      kind: 'block',
      title: '',
      ideaId: 'idea-draft-1',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    },
  ],
  elements: [
    {
      id: 'element-main',
      projectId: 'roman-julie',
      kind: 'personnage',
      name: 'Mila',
      description: 'Voltigeuse. Elle sait faire confiance au corps, moins aux mots.',
      traits: '',
      updatedAt: now,
    },
    {
      id: 'element-place',
      projectId: 'roman-julie',
      kind: 'lieu',
      name: 'Le chapiteau',
      description: 'Lieu refuge, lieu de vertige, lieu de memoire.',
      traits: '',
      updatedAt: now,
    },
  ],
}

function normalizeIdeaType(value: unknown): IdeaType {
  if (typeof value === 'string' && DESKTOP_IDEA_TYPES.includes(value as IdeaType)) {
    return value as IdeaType
  }

  if (value === 'theme') return 'motif'
  return 'fragment'
}

function normalizeStatus(value: unknown): IdeaStatus {
  if (typeof value === 'string' && DESKTOP_STATUSES.includes(value as IdeaStatus)) {
    return value as IdeaStatus
  }

  return 'idea'
}

function normalizeLinkKind(value: unknown): IdeaLinkKind {
  if (typeof value === 'string' && DESKTOP_LINK_KINDS.includes(value as IdeaLinkKind)) {
    return value as IdeaLinkKind
  }

  return 'echo'
}

function normalizeIdea(value: Partial<MobileIdea> & { notes?: string }, index: number): MobileIdea {
  const date = typeof value.updatedAt === 'string' ? value.updatedAt : now

  return {
    id: typeof value.id === 'string' ? value.id : `idea-import-${index}`,
    projectId: typeof value.projectId === 'string' || value.projectId === null ? value.projectId : 'roman-julie',
    type: normalizeIdeaType(value.type),
    status: normalizeStatus(value.status),
    title: typeof value.title === 'string' && value.title.trim() ? value.title : 'Idee sans titre',
    content: typeof value.content === 'string' ? value.content : '',
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : date,
    updatedAt: date,
  }
}

function normalizeElement(value: Partial<NarrativeElement> & { notes?: string }, index: number): NarrativeElement {
  const kind = value.kind === 'personnage' || value.kind === 'lieu' || value.kind === 'objet' || value.kind === 'theme' || value.kind === 'concept'
    ? value.kind
    : 'concept'

  return {
    id: typeof value.id === 'string' ? value.id : `element-import-${index}`,
    projectId: typeof value.projectId === 'string' || value.projectId === null ? value.projectId : 'roman-julie',
    kind,
    name: typeof value.name === 'string' && value.name.trim() ? value.name : 'Element sans nom',
    description: typeof value.description === 'string' ? value.description : value.notes ?? '',
    traits: typeof value.traits === 'string' ? value.traits : '',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

function normalizeNode(value: Partial<ManuscriptNode>, index: number): ManuscriptNode | null {
  if (value.kind !== 'chapter' && value.kind !== 'subchapter' && value.kind !== 'block') {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : `node-import-${index}`,
    projectId: typeof value.projectId === 'string' ? value.projectId : 'roman-julie',
    parentId: typeof value.parentId === 'string' || value.parentId === null ? value.parentId : null,
    kind: value.kind,
    title: typeof value.title === 'string' ? value.title : '',
    ideaId: typeof value.ideaId === 'string' || value.ideaId === null ? value.ideaId : null,
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : index,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  }
}

function normalizeLink(value: Partial<MobileIdeaLink>, index: number): MobileIdeaLink | null {
  if (typeof value.fromIdeaId !== 'string' || typeof value.toIdeaId !== 'string') {
    return null
  }

  const date = typeof value.updatedAt === 'string' ? value.updatedAt : now

  return {
    id: typeof value.id === 'string' ? value.id : `link-import-${index}`,
    fromIdeaId: value.fromIdeaId,
    toIdeaId: value.toIdeaId,
    kind: normalizeLinkKind(value.kind),
    note: typeof value.note === 'string' ? value.note : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : date,
    updatedAt: date,
  }
}

function normalizePairing(value: Partial<PairingState> | undefined): PairingState {
  return {
    paired: value?.paired === true,
    pairingId: typeof value?.pairingId === 'string' ? value.pairingId : null,
    deviceId: typeof value?.deviceId === 'string' ? value.deviceId : initialPairing.deviceId,
    desktopInstanceId: typeof value?.desktopInstanceId === 'string' ? value.desktopInstanceId : null,
    desktopBaseUrl: typeof value?.desktopBaseUrl === 'string' ? value.desktopBaseUrl : null,
    projectId: typeof value?.projectId === 'string' ? value.projectId : null,
    projectName: typeof value?.projectName === 'string' ? value.projectName : null,
    pairedAt: typeof value?.pairedAt === 'string' ? value.pairedAt : null,
    lastSyncAt: typeof value?.lastSyncAt === 'string' ? value.lastSyncAt : null,
    token: typeof value?.token === 'string' ? value.token : null,
    serverRevision: typeof value?.serverRevision === 'number' ? value.serverRevision : null,
  }
}

function normalizeOperation(value: Partial<SyncOperation>, index: number): SyncOperation | null {
  if (
    typeof value.entity !== 'string'
    || !SYNC_ENTITIES.includes(value.entity as SyncEntity)
    || typeof value.action !== 'string'
    || !SYNC_ACTIONS.includes(value.action as SyncAction)
    || typeof value.entityId !== 'string'
  ) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : `operation-import-${index}`,
    entity: value.entity as SyncEntity,
    action: value.action as SyncAction,
    entityId: value.entityId,
    payload: value.payload ?? null,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
  }
}

function normalizeState(parsed: Partial<MobileState> & { texts?: Array<{ id?: string; projectId?: string | null; title?: string; content?: string; updatedAt?: string }> }): MobileState {
  const projects = Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : initialState.projects
  const ideas = Array.isArray(parsed.ideas) ? parsed.ideas.map(normalizeIdea) : initialState.ideas

  if (Array.isArray(parsed.texts)) {
    for (const text of parsed.texts) {
      if (typeof text.id !== 'string' || ideas.some((idea) => idea.id === text.id)) continue
      ideas.push(
        normalizeIdea(
          {
            id: text.id,
            projectId: text.projectId ?? 'roman-julie',
            type: 'fragment',
            status: 'draft',
            title: text.title ?? 'Fragment',
            content: text.content ?? '',
            tags: [],
            updatedAt: text.updatedAt,
          },
          ideas.length,
        ),
      )
    }
  }

  const manuscriptNodes = Array.isArray(parsed.manuscriptNodes)
    ? parsed.manuscriptNodes.map(normalizeNode).filter((node): node is ManuscriptNode => node !== null)
    : initialState.manuscriptNodes

  return {
    version: 1,
    pairing: normalizePairing(parsed.pairing),
    pendingOperations: Array.isArray(parsed.pendingOperations)
      ? parsed.pendingOperations.map(normalizeOperation).filter((operation): operation is SyncOperation => operation !== null)
      : [],
    projects,
    ideas,
    dedaleLinks: Array.isArray(parsed.dedaleLinks)
      ? parsed.dedaleLinks.map(normalizeLink).filter((link): link is MobileIdeaLink => link !== null)
      : [],
    manuscriptNodes,
    elements: Array.isArray(parsed.elements) ? parsed.elements.map(normalizeElement) : initialState.elements,
  }
}

export function loadMobileState(): MobileState {
  const rawState = window.localStorage.getItem(STORAGE_KEY)

  if (!rawState) {
    return initialState
  }

  try {
    const parsed = JSON.parse(rawState) as Partial<MobileState>

    if (parsed.version !== 1) {
      return initialState
    }

    return normalizeState(parsed)
  } catch {
    return initialState
  }
}

export function saveMobileState(state: MobileState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function parseImportedState(rawState: string): MobileState {
  const parsed = JSON.parse(rawState) as Partial<MobileState>

  if (parsed.version !== 1) {
    throw new Error("Le fichier n'est pas un export mobile compatible.")
  }

  return normalizeState(parsed)
}
