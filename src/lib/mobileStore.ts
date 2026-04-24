import type { MobileState } from '../types'

const STORAGE_KEY = 'trame-dariane-mobile-state-v1'

const now = new Date().toISOString()

export const initialState: MobileState = {
  version: 1,
  projects: [
    { id: 'roman-julie', name: 'Premier livre' },
    { id: 'inbox', name: 'Boite libre' },
  ],
  ideas: [
    {
      id: 'idea-opening',
      projectId: 'roman-julie',
      type: 'scene',
      title: 'Ouverture sur le chapiteau vide',
      content:
        "Une scene courte, presque silencieuse. Le personnage principal entre seule dans le chapiteau avant l'aube.",
      tags: ['ouverture', 'ambiance'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'idea-motif',
      projectId: null,
      type: 'theme',
      title: 'La peur de tomber',
      content:
        'Noter le motif sans savoir encore ou il ira : chute physique, chute symbolique, confiance donnee aux autres.',
      tags: ['motif'],
      createdAt: now,
      updatedAt: now,
    },
  ],
  texts: [
    {
      id: 'text-draft-1',
      projectId: 'roman-julie',
      title: 'Brouillon dicte',
      content:
        "Je veux pouvoir dicter ici une scene brute depuis le telephone, puis la reprendre plus tard sur l'ordinateur.",
      updatedAt: now,
    },
  ],
  elements: [
    {
      id: 'element-main',
      projectId: 'roman-julie',
      kind: 'personnage',
      name: 'Mila',
      notes: 'Voltigeuse. Elle sait faire confiance au corps, moins aux mots.',
      updatedAt: now,
    },
    {
      id: 'element-place',
      projectId: 'roman-julie',
      kind: 'lieu',
      name: 'Le chapiteau',
      notes: 'Lieu refuge, lieu de vertige, lieu de memoire.',
      updatedAt: now,
    },
  ],
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

    return {
      version: 1,
      projects: Array.isArray(parsed.projects) ? parsed.projects : initialState.projects,
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : initialState.ideas,
      texts: Array.isArray(parsed.texts) ? parsed.texts : initialState.texts,
      elements: Array.isArray(parsed.elements) ? parsed.elements : initialState.elements,
    }
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

  return {
    version: 1,
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
    texts: Array.isArray(parsed.texts) ? parsed.texts : [],
    elements: Array.isArray(parsed.elements) ? parsed.elements : [],
  }
}
