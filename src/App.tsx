import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadMobileState, parseImportedState, saveMobileState } from './lib/mobileStore'
import { claimPairing, fetchSyncState, pushSyncOperations } from './lib/syncClient'
import type {
  IdeaStatus,
  IdeaType,
  IdeaLinkKind,
  ManuscriptNode,
  MobileIdea,
  MobileState,
  MobileTab,
  NarrativeElement,
  NarrativeElementKind,
  PairingState,
  SyncAction,
  SyncEntity,
  SyncOperation,
} from './types'

const tabs: Array<{ id: MobileTab; label: string; icon: string }> = [
  { id: 'dedale', label: 'Dédale', icon: '◇' },
  { id: 'ecrire', label: 'Écrire', icon: '¶' },
  { id: 'elements', label: 'Éléments', icon: '◆' },
  { id: 'settings', label: 'Paramètres', icon: '⚙' },
]

const ideaTypes: Array<{ id: IdeaType; label: string }> = [
  { id: 'scene', label: 'Scène' },
  { id: 'fragment', label: 'Fragment' },
  { id: 'motif', label: 'Motif' },
  { id: 'revelation', label: 'Révélation' },
]

const statuses: Array<{ id: IdeaStatus; label: string }> = [
  { id: 'idea', label: 'Idée' },
  { id: 'draft', label: 'Brouillon' },
  { id: 'written', label: 'Rédigé' },
  { id: 'reviewed', label: 'Relu' },
]

const elementKinds: Array<{ id: NarrativeElementKind; label: string }> = [
  { id: 'personnage', label: 'Personnage' },
  { id: 'lieu', label: 'Lieu' },
  { id: 'objet', label: 'Objet' },
  { id: 'theme', label: 'Thème' },
  { id: 'concept', label: 'Concept' },
]

const linkKinds: Array<{ id: IdeaLinkKind; label: string }> = [
  { id: 'echo', label: 'Écho' },
  { id: 'causal', label: 'Causal' },
  { id: 'motif', label: 'Motif' },
  { id: 'resonance', label: 'Résonance' },
  { id: 'tension', label: 'Tension' },
]

function createId(prefix: string) {
  if ('randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function getProjectName(state: MobileState, projectId: string | null) {
  if (!projectId) {
    return 'Dédale'
  }

  return state.projects.find((project) => project.id === projectId)?.name ?? 'Projet inconnu'
}

function getIdeaTypeLabel(type: IdeaType) {
  return ideaTypes.find((item) => item.id === type)?.label ?? type
}

function getStatusLabel(status: IdeaStatus) {
  return statuses.find((item) => item.id === status)?.label ?? status
}

function getElementKindLabel(kind: NarrativeElementKind) {
  return elementKinds.find((item) => item.id === kind)?.label ?? kind
}

function getLinkKindLabel(kind: IdeaLinkKind) {
  return linkKinds.find((item) => item.id === kind)?.label ?? kind
}

function sortByOrder<T extends { sortOrder: number; id: string }>(items: T[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
}

function createOperation(entity: SyncEntity, action: SyncAction, entityId: string, payload: unknown): SyncOperation {
  return {
    id: createId('operation'),
    entity,
    action,
    entityId,
    payload,
    createdAt: new Date().toISOString(),
  }
}

function queueOperation(current: MobileState, operation: SyncOperation) {
  return current.pairing.paired ? [...current.pendingOperations, operation] : current.pendingOperations
}

function mergeSyncedState(remoteState: MobileState, pairing: PairingState, pendingOperations: SyncOperation[]) {
  return {
    ...remoteState,
    pairing,
    pendingOperations,
  }
}

function App() {
  const [state, setState] = useState<MobileState>(() => loadMobileState())
  const [activeTab, setActiveTab] = useState<MobileTab>('dedale')
  const [query, setQuery] = useState('')
  const [ideaTypeFilter, setIdeaTypeFilter] = useState<IdeaType | 'all'>('all')
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<IdeaStatus | 'all'>('all')
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
  const [focusIdeaId, setFocusIdeaId] = useState<string | null>(null)
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaContent, setIdeaContent] = useState('')
  const [ideaType, setIdeaType] = useState<IdeaType>('scene')
  const [ideaStatus, setIdeaStatus] = useState<IdeaStatus>('idea')
  const [ideaTags, setIdeaTags] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(state.projects[0]?.id ?? '')
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(state.manuscriptNodes.find((node) => node.kind === 'block')?.id ?? null)
  const [sectionTitle, setSectionTitle] = useState('')
  const [blockIdeaId, setBlockIdeaId] = useState(state.ideas[0]?.id ?? '')
  const [moveTargetParentId, setMoveTargetParentId] = useState<string>('')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [linkKind, setLinkKind] = useState<IdeaLinkKind>('echo')
  const [linkNote, setLinkNote] = useState('')
  const [editingElementId, setEditingElementId] = useState<string | null>(null)
  const [elementQuery, setElementQuery] = useState('')
  const [elementKindFilter, setElementKindFilter] = useState<NarrativeElementKind | 'all'>('all')
  const [elementKind, setElementKind] = useState<NarrativeElementKind>('personnage')
  const [elementName, setElementName] = useState('')
  const [elementDescription, setElementDescription] = useState('')
  const [elementTraits, setElementTraits] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [manualJson, setManualJson] = useState('')
  const [pairingUrl, setPairingUrl] = useState('')
  const [syncMessage, setSyncMessage] = useState('')
  const [syncing, setSyncing] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const autoPairAttemptedRef = useRef(false)

  useEffect(() => {
    saveMobileState(state)
  }, [state])

  useEffect(() => {
    if (autoPairAttemptedRef.current) {
      return
    }

    const embeddedPairingUrl = new URLSearchParams(window.location.search).get('pair')

    if (!embeddedPairingUrl) {
      return
    }

    autoPairAttemptedRef.current = true

    queueMicrotask(() => {
      setActiveTab('settings')
      setPairingUrl(embeddedPairingUrl)
      setSyncing(true)
      setSyncMessage('Appairage en cours...')

      void claimPairing(embeddedPairingUrl, state.pairing.deviceId)
        .then((result) => {
          const nextPairing = {
            ...result.pairing,
            lastSyncAt: new Date().toISOString(),
          }
          setState(mergeSyncedState(result.state, nextPairing, []))
          setSelectedProjectId(result.pairing.projectId ?? result.state.projects[0]?.id ?? '')
          setSelectedBlockId(result.state.manuscriptNodes.find((node) => node.kind === 'block')?.id ?? null)
          setBlockIdeaId(result.state.ideas[0]?.id ?? '')
          setPairingUrl('')
          setSyncMessage('Appairage terminé.')
          window.history.replaceState({}, '', window.location.pathname)
        })
        .catch((error: unknown) => {
          setSyncMessage(error instanceof Error ? error.message : 'Appairage impossible.')
        })
        .finally(() => {
          setSyncing(false)
        })
    })
  }, [state.pairing.deviceId])

  const filteredIdeas = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()

    return state.ideas.filter((idea) => {
      if (ideaTypeFilter !== 'all' && idea.type !== ideaTypeFilter) return false
      if (ideaStatusFilter !== 'all' && idea.status !== ideaStatusFilter) return false
      if (!needle) return true
      const haystack = `${idea.title} ${idea.content} ${idea.tags.join(' ')}`.toLocaleLowerCase()
      return haystack.includes(needle)
    })
  }, [ideaStatusFilter, ideaTypeFilter, query, state.ideas])

  const ideaById = useMemo(() => new Map(state.ideas.map((idea) => [idea.id, idea])), [state.ideas])
  const nodesByParent = useMemo(() => {
    const map = new Map<string | null, ManuscriptNode[]>()
    for (const node of state.manuscriptNodes) {
      const current = map.get(node.parentId) ?? []
      current.push(node)
      map.set(node.parentId, current)
    }

    for (const [parentId, nodes] of map) {
      map.set(parentId, sortByOrder(nodes))
    }

    return map
  }, [state.manuscriptNodes])

  const selectedBlock = selectedBlockId ? state.manuscriptNodes.find((node) => node.id === selectedBlockId && node.kind === 'block') : null
  const selectedBlockIdea = selectedBlock?.ideaId ? ideaById.get(selectedBlock.ideaId) ?? null : null
  const focusIdea = focusIdeaId ? ideaById.get(focusIdeaId) ?? null : null
  const sectionOptions = state.manuscriptNodes.filter((node) => node.kind !== 'block')
  const availableBlockIdeas = state.ideas.filter((idea) => idea.type !== 'motif')
  const currentIdeaLinks = editingIdeaId
    ? state.dedaleLinks.filter((link) => link.fromIdeaId === editingIdeaId || link.toIdeaId === editingIdeaId)
    : []
  const possibleLinkTargets = editingIdeaId
    ? state.ideas.filter((idea) => idea.id !== editingIdeaId)
    : []
  const filteredElements = useMemo(() => {
    const needle = elementQuery.trim().toLocaleLowerCase()

    return state.elements.filter((element) => {
      if (elementKindFilter !== 'all' && element.kind !== elementKindFilter) return false
      if (!needle) return true

      return `${element.name} ${element.description} ${element.traits}`.toLocaleLowerCase().includes(needle)
    })
  }, [elementKindFilter, elementQuery, state.elements])
  const exportedJson = useMemo(() => JSON.stringify(state, null, 2), [state])

  function resetIdeaForm() {
    setEditingIdeaId(null)
    setIdeaTitle('')
    setIdeaContent('')
    setIdeaType('scene')
    setIdeaStatus('idea')
    setIdeaTags('')
  }

  function openIdeaForm(idea: MobileIdea) {
    setEditingIdeaId(idea.id)
    setIdeaTitle(idea.title)
    setIdeaContent(idea.content)
    setIdeaType(idea.type)
    setIdeaStatus(idea.status)
    setIdeaTags(idea.tags.join(', '))
    setLinkTargetId(state.ideas.find((item) => item.id !== idea.id)?.id ?? '')
    setLinkKind('echo')
    setLinkNote('')
    setActiveTab('dedale')
  }

  function saveIdea() {
    const title = ideaTitle.trim()
    const content = ideaContent.trim()

    if (!title && !content) {
      return
    }

    const date = new Date().toISOString()
    const tags = ideaTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (editingIdeaId) {
      const nextIdea: MobileIdea = {
        id: editingIdeaId,
        projectId: selectedProjectId || null,
        type: ideaType,
        status: ideaStatus,
        title: title || 'Idée sans titre',
        content,
        tags,
        createdAt: date,
        updatedAt: date,
      }
      setState((current) => ({
        ...current,
        ideas: current.ideas.map((idea) =>
          idea.id === editingIdeaId
            ? { ...idea, ...nextIdea, createdAt: idea.createdAt }
            : idea,
        ),
        pendingOperations: queueOperation(current, createOperation('idea', 'upsert', editingIdeaId, nextIdea)),
      }))
    } else {
      const idea: MobileIdea = {
        id: createId('idea'),
        projectId: selectedProjectId || null,
        type: ideaType,
        status: ideaStatus,
        title: title || 'Idée sans titre',
        content,
        tags,
        createdAt: date,
        updatedAt: date,
      }

      setState((current) => ({
        ...current,
        ideas: [idea, ...current.ideas],
        pendingOperations: queueOperation(current, createOperation('idea', 'upsert', idea.id, idea)),
      }))
      setBlockIdeaId(idea.id)
    }

    resetIdeaForm()
  }

  function updateIdeaContent(ideaId: string, nextContent: string) {
    const date = new Date().toISOString()
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, content: nextContent, status: idea.status === 'idea' ? 'draft' : idea.status, updatedAt: date } : idea,
      ),
      pendingOperations: queueOperation(current, createOperation('idea', 'upsert', ideaId, { content: nextContent, updatedAt: date })),
    }))
  }

  function updateIdeaFields(ideaId: string, patch: Partial<Pick<MobileIdea, 'title' | 'type' | 'status'>>) {
    const date = new Date().toISOString()
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, ...patch, updatedAt: date } : idea,
      ),
      pendingOperations: queueOperation(current, createOperation('idea', 'upsert', ideaId, { ...patch, updatedAt: date })),
    }))
  }

  function addIdeaLink() {
    if (!editingIdeaId || !linkTargetId || editingIdeaId === linkTargetId) {
      return
    }

    const exists = state.dedaleLinks.some((link) => (
      link.fromIdeaId === editingIdeaId && link.toIdeaId === linkTargetId && link.kind === linkKind
    ))

    if (exists) {
      return
    }

    const date = new Date().toISOString()

    const link = {
      id: createId('link'),
      fromIdeaId: editingIdeaId,
      toIdeaId: linkTargetId,
      kind: linkKind,
      note: linkNote.trim(),
      createdAt: date,
      updatedAt: date,
    }

    setState((current) => ({
      ...current,
      dedaleLinks: [link, ...current.dedaleLinks],
      pendingOperations: queueOperation(current, createOperation('dedaleLink', 'upsert', link.id, link)),
    }))
    setLinkNote('')
  }

  function deleteIdeaLink(linkId: string) {
    setState((current) => ({
      ...current,
      dedaleLinks: current.dedaleLinks.filter((link) => link.id !== linkId),
      pendingOperations: queueOperation(current, createOperation('dedaleLink', 'delete', linkId, null)),
    }))
  }

  function createSection(kind: 'chapter' | 'subchapter') {
    const title = sectionTitle.trim()

    if (!title) {
      return
    }

    const date = new Date().toISOString()
    const parentId = kind === 'chapter' ? null : selectedParentId
    const siblings = nodesByParent.get(parentId) ?? []
    const node: ManuscriptNode = {
      id: createId(kind),
      projectId: selectedProjectId,
      parentId,
      kind,
      title,
      ideaId: null,
      sortOrder: siblings.length,
      createdAt: date,
      updatedAt: date,
    }

    setState((current) => ({
      ...current,
      manuscriptNodes: [...current.manuscriptNodes, node],
      pendingOperations: queueOperation(current, createOperation('manuscriptNode', 'upsert', node.id, node)),
    }))
    setSelectedParentId(node.id)
    setSectionTitle('')
  }

  function addBlock() {
    if (!blockIdeaId) {
      return
    }

    const existingBlock = state.manuscriptNodes.find((node) => node.kind === 'block' && node.ideaId === blockIdeaId)
    if (existingBlock) {
      setSelectedBlockId(existingBlock.id)
      setSelectedParentId(existingBlock.parentId)
      return
    }

    const date = new Date().toISOString()
    const parentId = selectedParentId
    const siblings = nodesByParent.get(parentId) ?? []
    const node: ManuscriptNode = {
      id: createId('block'),
      projectId: selectedProjectId,
      parentId,
      kind: 'block',
      title: '',
      ideaId: blockIdeaId,
      sortOrder: siblings.length,
      createdAt: date,
      updatedAt: date,
    }

    setState((current) => ({
      ...current,
      manuscriptNodes: [...current.manuscriptNodes, node],
      pendingOperations: queueOperation(current, createOperation('manuscriptNode', 'upsert', node.id, node)),
    }))
    setSelectedBlockId(node.id)
  }

  function moveSelectedBlockToParent() {
    if (!selectedBlockId) {
      return
    }

    const nextParentId = moveTargetParentId || null
    const date = new Date().toISOString()

    setState((current) => {
      const siblings = current.manuscriptNodes.filter((node) => node.parentId === nextParentId)
      return {
        ...current,
        manuscriptNodes: current.manuscriptNodes.map((node) =>
          node.id === selectedBlockId
            ? { ...node, parentId: nextParentId, sortOrder: siblings.length, updatedAt: date }
            : node,
        ),
        pendingOperations: queueOperation(
          current,
          createOperation('manuscriptNode', 'move', selectedBlockId, { parentId: nextParentId, sortOrder: siblings.length, updatedAt: date }),
        ),
      }
    })
  }

  function moveNode(nodeId: string, direction: -1 | 1) {
    setState((current) => {
      const node = current.manuscriptNodes.find((item) => item.id === nodeId)
      if (!node) return current

      const siblings = sortByOrder(current.manuscriptNodes.filter((item) => item.parentId === node.parentId))
      const index = siblings.findIndex((item) => item.id === nodeId)
      const targetIndex = index + direction

      if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return current

      const next = current.manuscriptNodes.map((item) => ({ ...item }))
      const left = next.find((item) => item.id === siblings[index].id)
      const right = next.find((item) => item.id === siblings[targetIndex].id)
      if (!left || !right) return current

      const swap = left.sortOrder
      left.sortOrder = right.sortOrder
      right.sortOrder = swap
      left.updatedAt = new Date().toISOString()
      right.updatedAt = left.updatedAt

      return {
        ...current,
        manuscriptNodes: next,
        pendingOperations: queueOperation(current, createOperation('manuscriptNode', 'move', nodeId, { direction, updatedAt: left.updatedAt })),
      }
    })
  }

  function resetElementForm() {
    setEditingElementId(null)
    setElementKind('personnage')
    setElementName('')
    setElementDescription('')
    setElementTraits('')
  }

  function openElementForm(element: NarrativeElement) {
    setEditingElementId(element.id)
    setElementKind(element.kind)
    setElementName(element.name)
    setElementDescription(element.description)
    setElementTraits(element.traits)
  }

  function saveElement() {
    const name = elementName.trim()

    if (!name) {
      return
    }

    const date = new Date().toISOString()

    if (editingElementId) {
      setState((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === editingElementId
            ? { ...element, kind: elementKind, name, description: elementDescription.trim(), traits: elementTraits.trim(), updatedAt: date }
            : element,
        ),
        pendingOperations: queueOperation(
          current,
          createOperation('element', 'upsert', editingElementId, {
            id: editingElementId,
            projectId: selectedProjectId || null,
            kind: elementKind,
            name,
            description: elementDescription.trim(),
            traits: elementTraits.trim(),
            updatedAt: date,
          }),
        ),
      }))
    } else {
      const element: NarrativeElement = {
        id: createId('element'),
        projectId: selectedProjectId || null,
        kind: elementKind,
        name,
        description: elementDescription.trim(),
        traits: elementTraits.trim(),
        updatedAt: date,
      }

      setState((current) => ({
        ...current,
        elements: [element, ...current.elements],
        pendingOperations: queueOperation(current, createOperation('element', 'upsert', element.id, element)),
      }))
    }

    resetElementForm()
  }

  function exportState() {
    const blob = new Blob([exportedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trame-mobile-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function pairWithDesktop() {
    setSyncing(true)
    setSyncMessage('')

    try {
      const result = await claimPairing(pairingUrl, state.pairing.deviceId)
      const nextPairing = {
        ...result.pairing,
        lastSyncAt: new Date().toISOString(),
      }
      const nextState = mergeSyncedState(result.state, nextPairing, [])
      setState(nextState)
      setSelectedProjectId(result.pairing.projectId ?? result.state.projects[0]?.id ?? '')
      setSelectedBlockId(result.state.manuscriptNodes.find((node) => node.kind === 'block')?.id ?? null)
      setBlockIdeaId(result.state.ideas[0]?.id ?? '')
      setPairingUrl('')
      setSyncMessage('Appairage terminé.')
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Appairage impossible.')
    } finally {
      setSyncing(false)
    }
  }

  async function pastePairingUrl() {
    try {
      const value = await navigator.clipboard.readText()
      setPairingUrl(value)
      setSyncMessage('URL collée.')
    } catch {
      setSyncMessage("Impossible de lire le presse-papiers.")
    }
  }

  async function pullDesktopState() {
    setSyncing(true)
    setSyncMessage('')

    try {
      const result = await fetchSyncState(state.pairing)
      const nextPairing = {
        ...state.pairing,
        lastSyncAt: new Date().toISOString(),
        serverRevision: result.serverRevision,
      }
      setState(mergeSyncedState(result.state, nextPairing, state.pendingOperations))
      setSyncMessage('État desktop récupéré.')
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Lecture desktop impossible.')
    } finally {
      setSyncing(false)
    }
  }

  async function pushPendingOperations() {
    if (state.pendingOperations.length === 0) {
      setSyncMessage('Aucune opération en attente.')
      return
    }

    setSyncing(true)
    setSyncMessage('')

    try {
      const result = await pushSyncOperations(state.pairing, state.pendingOperations)
      const acceptedIds = new Set(result.acceptedOperationIds)
      const pendingOperations = state.pendingOperations.filter((operation) => !acceptedIds.has(operation.id))
      const nextPairing = {
        ...state.pairing,
        lastSyncAt: new Date().toISOString(),
        serverRevision: result.serverRevision,
      }
      setState(mergeSyncedState(result.state, nextPairing, pendingOperations))
      setSyncMessage(`${result.acceptedOperationIds.length} opération(s) synchronisée(s).`)
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Synchronisation impossible.')
    } finally {
      setSyncing(false)
    }
  }

  function unpairDesktop() {
    setState((current) => ({
      ...current,
      pairing: {
        ...current.pairing,
        paired: false,
        pairingId: null,
        desktopInstanceId: null,
        desktopBaseUrl: null,
        projectId: null,
        projectName: null,
        pairedAt: null,
        lastSyncAt: null,
        token: null,
        serverRevision: null,
      },
      pendingOperations: [],
    }))
    setSyncMessage('Mobile désappairé.')
  }

  async function copyExportState() {
    try {
      await navigator.clipboard.writeText(exportedJson)
      setImportMessage('JSON copié.')
    } catch {
      setManualJson(exportedJson)
      setImportMessage('Copie directe impossible. Le JSON est affiché ci-dessous.')
    }
  }

  function importManualJson() {
    try {
      const nextState = parseImportedState(manualJson)
      setState(nextState)
      setSelectedProjectId(nextState.projects[0]?.id ?? '')
      setSelectedBlockId(nextState.manuscriptNodes.find((node) => node.kind === 'block')?.id ?? null)
      setBlockIdeaId(nextState.ideas[0]?.id ?? '')
      setImportMessage('Import texte terminé.')
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Import texte impossible.')
    }
  }

  async function importState(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const rawState = await file.text()
      const nextState = parseImportedState(rawState)
      setState(nextState)
      setSelectedProjectId(nextState.projects[0]?.id ?? '')
      setSelectedBlockId(nextState.manuscriptNodes.find((node) => node.kind === 'block')?.id ?? null)
      setBlockIdeaId(nextState.ideas[0]?.id ?? '')
      setImportMessage('Import terminé.')
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Import impossible.')
    }
  }

  function renderNodes(parentId: string | null, level = 0) {
    const nodes = nodesByParent.get(parentId) ?? []

    if (nodes.length === 0 && parentId === null) {
      return <p className="empty-copy">Aucun chapitre pour le moment.</p>
    }

    return (
      <div className="outline-list">
        {nodes.map((node) => {
          const idea = node.ideaId ? ideaById.get(node.ideaId) : null
          const isSection = node.kind !== 'block'
          const label = isSection ? node.title : idea?.title ?? 'Bloc sans idée'

          return (
            <article className={`outline-row level-${Math.min(level, 2)} ${selectedBlockId === node.id ? 'active' : ''}`} key={node.id}>
              <button
                className="outline-main"
                onClick={() => {
                  if (isSection) setSelectedParentId(node.id)
                  else setSelectedBlockId(node.id)
                }}
                type="button"
              >
                <span className="outline-kind">{node.kind === 'chapter' ? 'Chapitre' : node.kind === 'subchapter' ? 'Sous-chapitre' : 'Bloc'}</span>
                <strong>{label}</strong>
                {idea && <span>{getIdeaTypeLabel(idea.type)} · {countWords(idea.content)} mots</span>}
              </button>
              <div className="move-actions">
                <button aria-label={`Monter ${label}`} onClick={() => moveNode(node.id, -1)} type="button">↑</button>
                <button aria-label={`Descendre ${label}`} onClick={() => moveNode(node.id, 1)} type="button">↓</button>
              </div>
              {isSection && renderNodes(node.id, level + 1)}
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Compagnon mobile</p>
          <h1>Trame d'Ariane</h1>
        </div>
        <button
          className="header-action"
          type="button"
          onClick={() => {
            setActiveTab('dedale')
            resetIdeaForm()
          }}
        >
          + Noter
        </button>
      </header>

      <section className="status-strip" aria-label="Résumé local">
        <span>{state.ideas.length} idées</span>
        <span>{state.manuscriptNodes.filter((node) => node.kind === 'block').length} blocs</span>
        <span>{state.elements.length} éléments</span>
      </section>

      {activeTab === 'dedale' && (
        <section className="screen" aria-labelledby="dedale-title">
          <div className="screen-title">
            <p className="eyebrow">Idées libres et réserve</p>
            <h2 id="dedale-title">Dédale</h2>
          </div>

          <div className="form-panel">
            <label>
              Titre
              <input value={ideaTitle} onChange={(event) => setIdeaTitle(event.target.value)} placeholder="Une scène, un détail, une image..." />
            </label>

            <label>
              Contenu
              <textarea
                value={ideaContent}
                onChange={(event) => setIdeaContent(event.target.value)}
                placeholder="La dictée du téléphone peut servir ici pour capturer un brouillon brut."
                rows={7}
              />
            </label>

            <div className="form-grid">
              <label>
                Type
                <select value={ideaType} onChange={(event) => setIdeaType(event.target.value as IdeaType)}>
                  {ideaTypes.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label>
                Statut
                <select value={ideaStatus} onChange={(event) => setIdeaStatus(event.target.value as IdeaStatus)}>
                  {statuses.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Tags
              <input value={ideaTags} onChange={(event) => setIdeaTags(event.target.value)} placeholder="séparés par des virgules" />
            </label>

            <div className="action-row">
              <button className="primary-action" type="button" onClick={saveIdea}>
                {editingIdeaId ? 'Enregistrer' : 'Ajouter'}
              </button>
              {editingIdeaId && (
                <button className="secondary-action" type="button" onClick={resetIdeaForm}>
                  Annuler
                </button>
              )}
            </div>
          </div>

            <label>
              Recherche
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mot, tag, scène..." />
            </label>

          <div className="form-grid compact-grid">
            <label>
              Type
              <select value={ideaTypeFilter} onChange={(event) => setIdeaTypeFilter(event.target.value as IdeaType | 'all')}>
                <option value="all">Tous</option>
                {ideaTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Statut
              <select value={ideaStatusFilter} onChange={(event) => setIdeaStatusFilter(event.target.value as IdeaStatus | 'all')}>
                <option value="all">Tous</option>
                {statuses.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          {editingIdeaId && (
            <div className="link-panel">
              <div className="section-lead">
                <h3>Liens</h3>
                <span>{currentIdeaLinks.length}</span>
              </div>

              <div className="form-grid compact-grid">
                <label>
                  Idée liée
                  <select value={linkTargetId} onChange={(event) => setLinkTargetId(event.target.value)}>
                    {possibleLinkTargets.map((idea) => (
                      <option key={idea.id} value={idea.id}>{idea.title}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Type de lien
                  <select value={linkKind} onChange={(event) => setLinkKind(event.target.value as IdeaLinkKind)}>
                    {linkKinds.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Note du lien
                <input value={linkNote} onChange={(event) => setLinkNote(event.target.value)} placeholder="Ce que ces deux idées se répondent..." />
              </label>

              <button className="secondary-action" type="button" onClick={addIdeaLink} disabled={!linkTargetId}>
                Ajouter le lien
              </button>

              <div className="link-list">
                {currentIdeaLinks.map((link) => {
                  const otherId = link.fromIdeaId === editingIdeaId ? link.toIdeaId : link.fromIdeaId
                  const other = ideaById.get(otherId)

                  return (
                    <article className="link-card" key={link.id}>
                      <div>
                        <p className="idea-meta">{getLinkKindLabel(link.kind)}</p>
                        <strong>{other?.title ?? 'Idée inconnue'}</strong>
                        {link.note && <p>{link.note}</p>}
                      </div>
                      <button aria-label="Supprimer le lien" onClick={() => deleteIdeaLink(link.id)} type="button">×</button>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          <div className="idea-list">
            {filteredIdeas.map((idea) => (
              <article className="idea-card" key={idea.id}>
                <button className="card-button" onClick={() => openIdeaForm(idea)} type="button">
                  <p className="idea-meta">
                    {getProjectName(state, idea.projectId)} · {getIdeaTypeLabel(idea.type)} · {getStatusLabel(idea.status)}
                  </p>
                  <h3>{idea.title}</h3>
                  <p>{idea.content || 'Aucun contenu pour le moment.'}</p>
                </button>
                {idea.tags.length > 0 && (
                  <div className="tag-row">
                    {idea.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
                <div className="card-actions">
                  <button className="secondary-action" onClick={() => setFocusIdeaId(idea.id)} type="button">
                    Écrire
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'ecrire' && (
        <section className="screen writing-screen" aria-labelledby="ecrire-title">
          <div className="screen-title">
            <p className="eyebrow">Plan du livre et texte assemblé</p>
            <h2 id="ecrire-title">Écrire</h2>
          </div>

          <div className="form-panel">
            <label>
              Titre de section
              <input value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder="Chapitre 2, Le départ..." />
            </label>

            <label>
              Parent
              <select value={selectedParentId ?? ''} onChange={(event) => setSelectedParentId(event.target.value || null)}>
                <option value="">Racine du manuscrit</option>
                {sectionOptions.map((node) => (
                  <option key={node.id} value={node.id}>{node.title || 'Sans titre'}</option>
                ))}
              </select>
            </label>

            <div className="action-row">
              <button className="secondary-action" type="button" onClick={() => createSection('chapter')}>
                Créer chapitre
              </button>
              <button className="secondary-action" type="button" onClick={() => createSection('subchapter')} disabled={!selectedParentId}>
                Créer sous-chapitre
              </button>
            </div>

            <label>
              Idée à ajouter comme bloc
              <select value={blockIdeaId} onChange={(event) => setBlockIdeaId(event.target.value)}>
                {availableBlockIdeas.map((idea) => (
                  <option key={idea.id} value={idea.id}>{idea.title}</option>
                ))}
              </select>
            </label>

            <button className="primary-action" type="button" onClick={addBlock} disabled={!blockIdeaId}>
              Ajouter comme bloc
            </button>
          </div>

          <div className="outline-panel">{renderNodes(null)}</div>

          {selectedBlockIdea && (
            <div className="editor-panel">
              <div className="screen-title">
                <p className="eyebrow">{getIdeaTypeLabel(selectedBlockIdea.type)} · {getStatusLabel(selectedBlockIdea.status)}</p>
                <h2>{selectedBlockIdea.title}</h2>
              </div>
              <textarea
                className="writing-pad"
                value={selectedBlockIdea.content}
                onChange={(event) => updateIdeaContent(selectedBlockIdea.id, event.target.value)}
                rows={14}
              />
              <p className="writing-stats">{countWords(selectedBlockIdea.content)} mots · sauvegarde locale automatique</p>

              <button className="primary-action" type="button" onClick={() => setFocusIdeaId(selectedBlockIdea.id)}>
                Ouvrir en rédaction
              </button>

              <div className="move-panel">
                <label>
                  Déplacer le bloc vers
                  <select value={moveTargetParentId} onChange={(event) => setMoveTargetParentId(event.target.value)}>
                    <option value="">Racine du manuscrit</option>
                    {sectionOptions.map((node) => (
                      <option key={node.id} value={node.id}>{node.title || 'Sans titre'}</option>
                    ))}
                  </select>
                </label>
                <button className="secondary-action" type="button" onClick={moveSelectedBlockToParent}>
                  Déplacer
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'elements' && (
        <section className="screen" aria-labelledby="elements-title">
          <div className="screen-title">
            <p className="eyebrow">Personnages, lieux, objets et thèmes</p>
            <h2 id="elements-title">Éléments</h2>
          </div>

          <div className="form-grid compact-grid">
            <label>
              Recherche
              <input value={elementQuery} onChange={(event) => setElementQuery(event.target.value)} placeholder="Nom, description, trait..." />
            </label>

            <label>
              Type
              <select value={elementKindFilter} onChange={(event) => setElementKindFilter(event.target.value as NarrativeElementKind | 'all')}>
                <option value="all">Tous</option>
                {elementKinds.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-panel">
            <div className="form-grid">
              <label>
                Type
                <select value={elementKind} onChange={(event) => setElementKind(event.target.value as NarrativeElementKind)}>
                  {elementKinds.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label>
                Nom
                <input value={elementName} onChange={(event) => setElementName(event.target.value)} placeholder="Mila, le chapiteau..." />
              </label>
            </div>

            <label>
              Description
              <textarea value={elementDescription} onChange={(event) => setElementDescription(event.target.value)} rows={5} />
            </label>

            <label>
              Traits
              <textarea value={elementTraits} onChange={(event) => setElementTraits(event.target.value)} rows={4} />
            </label>

            <div className="action-row">
              <button className="primary-action" type="button" onClick={saveElement}>
                {editingElementId ? 'Enregistrer' : 'Créer élément'}
              </button>
              {editingElementId && (
                <button className="secondary-action" type="button" onClick={resetElementForm}>
                  Annuler
                </button>
              )}
            </div>
          </div>

          <div className="element-list">
            {filteredElements.map((element) => (
              <article className="element-card" key={element.id}>
                <button className="card-button" onClick={() => openElementForm(element)} type="button">
                  <p className="idea-meta">{getElementKindLabel(element.kind)}</p>
                  <h3>{element.name}</h3>
                  <p>{element.description || 'Aucune description pour le moment.'}</p>
                  {element.traits && <p className="element-traits">{element.traits}</p>}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section className="screen" aria-labelledby="settings-title">
          <div className="screen-title">
            <p className="eyebrow">Passerelle desktop</p>
            <h2 id="settings-title">Paramètres</h2>
          </div>

          <div className="exchange-panel">
            <div className="section-lead">
              <h3>Appairage</h3>
              <span>{state.pairing.paired ? 'Appairé' : 'Non appairé'}</span>
            </div>
            <p>
              La V1 cible un appairage avec l'ordinateur sur le Wi-Fi local. Le desktop reste la source de vérité du
              projet.
            </p>
            <div className="settings-grid">
              <span>Appareil</span>
              <strong>{state.pairing.deviceId}</strong>
              <span>Projet</span>
              <strong>{state.pairing.projectName ?? 'Aucun projet appairé'}</strong>
              <span>Opérations en attente</span>
              <strong>{state.pendingOperations.length}</strong>
              <span>Dernière synchro</span>
              <strong>{state.pairing.lastSyncAt ? new Date(state.pairing.lastSyncAt).toLocaleString('fr-FR') : 'Jamais'}</strong>
            </div>

            <label>
              URL du QR desktop
              <input
                value={pairingUrl}
                onChange={(event) => setPairingUrl(event.target.value)}
                placeholder="http://192.168.x.x:48973/pair/claim?token=..."
              />
            </label>

            <button className="secondary-action" type="button" onClick={() => void pastePairingUrl()} disabled={syncing}>
              Coller l'URL
            </button>

            <button className="primary-action" type="button" onClick={() => void pairWithDesktop()} disabled={syncing || !pairingUrl.trim()}>
              Appairer
            </button>

            <div className="action-row">
              <button className="secondary-action" type="button" onClick={() => void pullDesktopState()} disabled={syncing || !state.pairing.paired}>
                Recevoir
              </button>
              <button className="secondary-action" type="button" onClick={() => void pushPendingOperations()} disabled={syncing || !state.pairing.paired}>
                Envoyer
              </button>
            </div>

            <button className="secondary-action danger-action" type="button" onClick={unpairDesktop} disabled={syncing || !state.pairing.paired}>
              Désappairer
            </button>

            {syncMessage && <p className="import-message">{syncMessage}</p>}
          </div>

          <div className="exchange-panel">
            <p>
              Cette zone garde l'export/import JSON du prototype. Elle pourra accueillir plus tard un appairage avec
              l'ordinateur, par exemple via QR code.
            </p>
            <button className="primary-action" type="button" onClick={exportState}>
              Exporter le JSON
            </button>
            <button className="secondary-action" type="button" onClick={() => void copyExportState()}>
              Copier le JSON
            </button>
            <button className="secondary-action" type="button" onClick={() => importInputRef.current?.click()}>
              Importer un JSON
            </button>
            <input
              accept="application/json"
              className="visually-hidden"
              onChange={(event) => void importState(event.target.files?.[0])}
              ref={importInputRef}
              type="file"
            />
            {importMessage && <p className="import-message">{importMessage}</p>}
          </div>

          <div className="exchange-panel">
            <label>
              Import texte
              <textarea
                value={manualJson}
                onChange={(event) => setManualJson(event.target.value)}
                placeholder="Coller ici un export JSON mobile."
                rows={8}
              />
            </label>
            <button className="secondary-action" type="button" onClick={importManualJson} disabled={!manualJson.trim()}>
              Importer le texte
            </button>
          </div>
        </section>
      )}

      <nav className="bottom-nav" aria-label="Navigation mobile">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {focusIdea && (
        <section className="focus-editor" aria-labelledby="focus-title" role="dialog" aria-modal="true">
          <div className="focus-editor-header">
            <div>
              <p className="eyebrow">{getIdeaTypeLabel(focusIdea.type)} · {getStatusLabel(focusIdea.status)}</p>
              <h2 id="focus-title">Rédaction</h2>
            </div>
            <button className="secondary-action" onClick={() => setFocusIdeaId(null)} type="button">
              Fermer
            </button>
          </div>

          <label>
            Titre
            <input
              value={focusIdea.title}
              onChange={(event) => updateIdeaFields(focusIdea.id, { title: event.target.value || 'Idée sans titre' })}
            />
          </label>

          <div className="form-grid compact-grid">
            <label>
              Type
              <select value={focusIdea.type} onChange={(event) => updateIdeaFields(focusIdea.id, { type: event.target.value as IdeaType })}>
                {ideaTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>

            <label>
              Statut
              <select value={focusIdea.status} onChange={(event) => updateIdeaFields(focusIdea.id, { status: event.target.value as IdeaStatus })}>
                {statuses.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="focus-writing-field">
            Texte
            <textarea
              value={focusIdea.content}
              onChange={(event) => updateIdeaContent(focusIdea.id, event.target.value)}
              rows={18}
            />
          </label>

          <p className="writing-stats">{countWords(focusIdea.content)} mots · sauvegarde locale automatique</p>
        </section>
      )}
    </main>
  )
}

export default App
