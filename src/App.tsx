import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadMobileState, parseImportedState, saveMobileState } from './lib/mobileStore'
import type {
  IdeaStatus,
  IdeaType,
  ManuscriptNode,
  MobileIdea,
  MobileState,
  MobileTab,
  NarrativeElement,
  NarrativeElementKind,
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

function sortByOrder<T extends { sortOrder: number; id: string }>(items: T[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
}

function App() {
  const [state, setState] = useState<MobileState>(() => loadMobileState())
  const [activeTab, setActiveTab] = useState<MobileTab>('dedale')
  const [query, setQuery] = useState('')
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null)
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
  const [editingElementId, setEditingElementId] = useState<string | null>(null)
  const [elementKind, setElementKind] = useState<NarrativeElementKind>('personnage')
  const [elementName, setElementName] = useState('')
  const [elementDescription, setElementDescription] = useState('')
  const [elementTraits, setElementTraits] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    saveMobileState(state)
  }, [state])

  const filteredIdeas = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()

    if (!needle) {
      return state.ideas
    }

    return state.ideas.filter((idea) => {
      const haystack = `${idea.title} ${idea.content} ${idea.tags.join(' ')}`.toLocaleLowerCase()
      return haystack.includes(needle)
    })
  }, [query, state.ideas])

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
  const sectionOptions = state.manuscriptNodes.filter((node) => node.kind !== 'block')

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
      setState((current) => ({
        ...current,
        ideas: current.ideas.map((idea) =>
          idea.id === editingIdeaId
            ? { ...idea, title: title || 'Idée sans titre', content, type: ideaType, status: ideaStatus, tags, updatedAt: date }
            : idea,
        ),
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
      }))
      setBlockIdeaId(idea.id)
    }

    resetIdeaForm()
  }

  function updateIdeaContent(ideaId: string, nextContent: string) {
    setState((current) => ({
      ...current,
      ideas: current.ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, content: nextContent, status: idea.status === 'idea' ? 'draft' : idea.status, updatedAt: new Date().toISOString() } : idea,
      ),
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
    }))
    setSelectedParentId(node.id)
    setSectionTitle('')
  }

  function addBlock() {
    if (!blockIdeaId) {
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
    }))
    setSelectedBlockId(node.id)
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

      return { ...current, manuscriptNodes: next }
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
      }))
    }

    resetElementForm()
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trame-mobile-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
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
                {state.ideas.map((idea) => (
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
            {state.elements.map((element) => (
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
            <p>
              Cette zone garde l'export/import JSON du prototype. Elle pourra accueillir plus tard un appairage avec
              l'ordinateur, par exemple via QR code.
            </p>
            <button className="primary-action" type="button" onClick={exportState}>
              Exporter le JSON
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
    </main>
  )
}

export default App
