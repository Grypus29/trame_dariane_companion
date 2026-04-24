export type MobileTab = 'dedale' | 'ecrire' | 'elements' | 'settings'

export type IdeaType = 'scene' | 'fragment' | 'motif' | 'revelation'

export type IdeaStatus = 'idea' | 'draft' | 'written' | 'reviewed'

export type NarrativeElementKind = 'personnage' | 'lieu' | 'objet' | 'theme' | 'concept'

export type ManuscriptNodeKind = 'chapter' | 'subchapter' | 'block'

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

export type MobileState = {
  version: 1
  projects: Project[]
  ideas: MobileIdea[]
  manuscriptNodes: ManuscriptNode[]
  elements: NarrativeElement[]
}
