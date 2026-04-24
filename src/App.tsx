import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadMobileState, parseImportedState, saveMobileState } from './lib/mobileStore'
import type { IdeaType, MobileIdea, MobileState, MobileTab, MobileText } from './types'

const tabs: Array<{ id: MobileTab; label: string; icon: string }> = [
  { id: 'capture', label: 'Noter', icon: '+' },
  { id: 'inbox', label: 'Idees', icon: '≡' },
  { id: 'texts', label: 'Textes', icon: '¶' },
  { id: 'elements', label: 'Elements', icon: '◇' },
  { id: 'exchange', label: 'Echange', icon: '⇅' },
]

const ideaTypes: Array<{ id: IdeaType; label: string }> = [
  { id: 'scene', label: 'Scene' },
  { id: 'character', label: 'Personnage' },
  { id: 'place', label: 'Lieu' },
  { id: 'object', label: 'Objet' },
  { id: 'theme', label: 'Theme' },
  { id: 'note', label: 'Note' },
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
    return 'Boite libre'
  }

  return state.projects.find((project) => project.id === projectId)?.name ?? 'Projet inconnu'
}

function App() {
  const [state, setState] = useState<MobileState>(() => loadMobileState())
  const [activeTab, setActiveTab] = useState<MobileTab>('capture')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState<string>('roman-julie')
  const [type, setType] = useState<IdeaType>('note')
  const [tags, setTags] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTextId, setSelectedTextId] = useState(state.texts[0]?.id ?? '')
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

  const selectedText = state.texts.find((text) => text.id === selectedTextId) ?? state.texts[0]

  function addIdea() {
    const safeTitle = title.trim()
    const safeContent = content.trim()

    if (!safeTitle && !safeContent) {
      return
    }

    const date = new Date().toISOString()
    const idea: MobileIdea = {
      id: createId('idea'),
      projectId: projectId === 'free' ? null : projectId,
      type,
      title: safeTitle || 'Idee sans titre',
      content: safeContent,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: date,
      updatedAt: date,
    }

    setState((current) => ({
      ...current,
      ideas: [idea, ...current.ideas],
    }))
    setTitle('')
    setContent('')
    setTags('')
    setType('note')
    setActiveTab('inbox')
  }

  function updateText(textId: string, nextContent: string) {
    setState((current) => ({
      ...current,
      texts: current.texts.map((text) =>
        text.id === textId ? { ...text, content: nextContent, updatedAt: new Date().toISOString() } : text,
      ),
    }))
  }

  function addText() {
    const date = new Date().toISOString()
    const text: MobileText = {
      id: createId('text'),
      projectId: projectId === 'free' ? null : projectId,
      title: 'Nouveau fragment',
      content: '',
      updatedAt: date,
    }

    setState((current) => ({
      ...current,
      texts: [text, ...current.texts],
    }))
    setSelectedTextId(text.id)
    setActiveTab('texts')
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
      setSelectedTextId(nextState.texts[0]?.id ?? '')
      setImportMessage('Import termine.')
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Import impossible.')
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Compagnon mobile</p>
          <h1>Trame d'Ariane</h1>
        </div>
        <button className="header-action" type="button" onClick={addText}>
          Dicter
        </button>
      </header>

      <section className="status-strip" aria-label="Resume local">
        <span>{state.ideas.length} idees</span>
        <span>{state.texts.length} textes</span>
        <span>{state.elements.length} elements</span>
      </section>

      {activeTab === 'capture' && (
        <section className="screen capture-screen" aria-labelledby="capture-title">
          <div className="screen-title">
            <p className="eyebrow">Capture rapide</p>
            <h2 id="capture-title">Noter avant d'oublier</h2>
          </div>

          <label>
            Titre
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Une scene dans le train" />
          </label>

          <label>
            Idee ou fragment
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Le clavier vocal du telephone peut servir ici pour dicter un passage brut."
              rows={8}
            />
          </label>

          <div className="form-grid">
            <label>
              Projet
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
                <option value="free">Boite libre</option>
              </select>
            </label>

            <label>
              Type
              <select value={type} onChange={(event) => setType(event.target.value as IdeaType)}>
                {ideaTypes.map((ideaType) => (
                  <option key={ideaType.id} value={ideaType.id}>
                    {ideaType.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Tags
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="separes par des virgules" />
          </label>

          <button className="primary-action" type="button" onClick={addIdea}>
            Envoyer vers la boite d'idees
          </button>
        </section>
      )}

      {activeTab === 'inbox' && (
        <section className="screen" aria-labelledby="inbox-title">
          <div className="screen-title">
            <p className="eyebrow">Dedale en liste</p>
            <h2 id="inbox-title">Idees capturees</h2>
          </div>

          <label>
            Recherche
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mot, tag, scene..." />
          </label>

          <div className="idea-list">
            {filteredIdeas.map((idea) => (
              <article className="idea-card" key={idea.id}>
                <div>
                  <p className="idea-meta">
                    {getProjectName(state, idea.projectId)} · {ideaTypes.find((item) => item.id === idea.type)?.label}
                  </p>
                  <h3>{idea.title}</h3>
                  <p>{idea.content || 'Aucun contenu pour le moment.'}</p>
                </div>
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

      {activeTab === 'texts' && selectedText && (
        <section className="screen writing-screen" aria-labelledby="texts-title">
          <div className="screen-title">
            <p className="eyebrow">Redaction legere</p>
            <h2 id="texts-title">{selectedText.title}</h2>
          </div>

          <div className="text-switcher" role="tablist" aria-label="Fragments">
            {state.texts.map((text) => (
              <button
                aria-selected={text.id === selectedText.id}
                className={text.id === selectedText.id ? 'active' : ''}
                key={text.id}
                onClick={() => setSelectedTextId(text.id)}
                role="tab"
                type="button"
              >
                {text.title}
              </button>
            ))}
          </div>

          <label>
            Fragment
            <textarea
              className="writing-pad"
              value={selectedText.content}
              onChange={(event) => updateText(selectedText.id, event.target.value)}
              rows={14}
            />
          </label>

          <p className="writing-stats">{countWords(selectedText.content)} mots · sauvegarde locale automatique</p>
        </section>
      )}

      {activeTab === 'elements' && (
        <section className="screen" aria-labelledby="elements-title">
          <div className="screen-title">
            <p className="eyebrow">Memoire du recit</p>
            <h2 id="elements-title">Elements narratifs</h2>
          </div>

          <div className="element-list">
            {state.elements.map((element) => (
              <article className="element-card" key={element.id}>
                <p className="idea-meta">{element.kind}</p>
                <h3>{element.name}</h3>
                <p>{element.notes}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'exchange' && (
        <section className="screen" aria-labelledby="exchange-title">
          <div className="screen-title">
            <p className="eyebrow">Passerelle desktop</p>
            <h2 id="exchange-title">Exporter ou importer</h2>
          </div>

          <div className="exchange-panel">
            <p>
              Pour le prototype, le telephone garde ses donnees localement. Le JSON servira plus tard de contrat avec
              l'application desktop.
            </p>
            <button className="primary-action" type="button" onClick={exportState}>
              Exporter le carnet
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
