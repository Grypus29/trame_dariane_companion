export type MobileTab = 'capture' | 'inbox' | 'texts' | 'elements' | 'exchange'

export type IdeaType = 'scene' | 'character' | 'place' | 'object' | 'theme' | 'note'

export type Project = {
  id: string
  name: string
}

export type MobileIdea = {
  id: string
  projectId: string | null
  type: IdeaType
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type MobileText = {
  id: string
  projectId: string | null
  title: string
  content: string
  updatedAt: string
}

export type NarrativeElement = {
  id: string
  projectId: string | null
  kind: 'personnage' | 'lieu' | 'objet' | 'theme' | 'concept'
  name: string
  notes: string
  updatedAt: string
}

export type MobileState = {
  version: 1
  projects: Project[]
  ideas: MobileIdea[]
  texts: MobileText[]
  elements: NarrativeElement[]
}
