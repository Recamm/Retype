import { lazy, Suspense, useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import {
  Keyboard,
  ChartNoAxesColumnIncreasing,
  SlidersHorizontal,
  Moon,
  Sun,
  ArrowUpRight,
  RotateCcw,
  Clock3,
  AlignLeft,
  Quote,
  Leaf,
  FileText,
  Hash,
  AtSign,
  Target,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  Square,
} from 'lucide-react'
import {
  characters,
  createSession,
  finishSession,
  getMetrics,
  tickSession,
  updateInput,
  type Session,
} from './lib/engine'
import { createText, modeLabels } from './lib/content'
import {
  defaultData,
  downloadBackup,
  makeResult,
  mergeHistory,
  readData,
  writeData,
  type LocalData,
  type Result,
  type Settings as Preferences,
} from './lib/storage'
import TypingArea from './components/TypingArea'
import KeyboardMap from './components/KeyboardMap'
import Dialog from './components/Dialog'

const Results = lazy(() => import('./components/Results'))
const Progress = lazy(() => import('./components/Progress'))
const Settings = lazy(() => import('./components/Settings'))
type View = 'practice' | 'progress' | 'settings'
type Run = { id: string; session: Session; source?: string; trainingWords: string[] }
type Modal = {
  title: string
  content: ReactNode
  label: string
  destructive?: boolean
  action(): void
}
const modeIcons = { time: Clock3, words: AlignLeft, quote: Quote, zen: Leaf, custom: FileText }
const getView = (): View =>
  ['progress', 'settings'].includes(location.hash.slice(1))
    ? (location.hash.slice(1) as View)
    : 'practice'

export default function App() {
  const [loaded] = useState(readData)
  const [data, setData] = useState(loaded.data)
  const [warning, setWarning] = useState(loaded.warning)
  const [storageBlocked, setStorageBlocked] = useState(Boolean(loaded.warning))
  const [view, setView] = useState<View>(getView)
  const [customText, setCustomText] = useState('')
  const [customOpen, setCustomOpen] = useState(loaded.data.settings.mode === 'custom')
  const [focused, setFocused] = useState(true)
  const [modal, setModal] = useState<Modal | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [run, setRun] = useState<Run>(() => {
    const content = createText(loaded.data.settings)
    return {
      id: crypto.randomUUID(),
      session: createSession(content.text),
      source: content.source,
      trainingWords: [],
    }
  })
  const runRef = useRef(run)
  const settings = data.settings
  const running = run.session.startedAt !== null && run.session.endedAt === null
  const [now, setNow] = useState(0)
  const metrics = getMetrics(run.session, now)
  const today = new Date().toDateString()
  const todaySessions = data.history.filter((item) => new Date(item.date).toDateString() === today)
  const todayAverage = todaySessions.length
    ? Math.round(todaySessions.reduce((sum, item) => sum + item.wpm, 0) / todaySessions.length)
    : null

  function updateRun(next: Run) {
    runRef.current = next
    setRun(next)
  }
  function commit(next: LocalData, force = false) {
    setData(next)
    if (storageBlocked && !force) return
    const error = writeData(next)
    setWarning(error)
    setStorageBlocked(Boolean(error))
  }
  function start(preferences = settings, trainingWords: string[] = [], custom = customText) {
    const content = createText(preferences, trainingWords, custom)
    updateRun({
      id: crypto.randomUUID(),
      session: createSession(content.text),
      source: content.source,
      trainingWords,
    })
    setResult(null)
    setNow(0)
    setFocused(true)
  }
  function changeSettings(patch: Partial<Preferences>) {
    const next = { ...data, settings: { ...settings, ...patch } }
    commit(next)
    if (
      Object.keys(patch).some((key) =>
        [
          'mode',
          'language',
          'duration',
          'wordCount',
          'punctuation',
          'numbers',
          'plainSpanish',
        ].includes(key),
      )
    )
      start(next.settings)
    if (patch.mode) setCustomOpen(patch.mode === 'custom')
  }
  function navigate(next: View) {
    if (running) return
    location.hash = next
    setView(next)
  }
  function complete(session: Session) {
    const ended = finishSession(session, performance.now())
    updateRun({ ...runRef.current, session: ended })
    if (!ended.attempts) return
    const summary = makeResult(ended, settings, runRef.current.trainingWords.length > 0)
    setResult(summary)
    commit({ ...data, history: mergeHistory(data.history, [summary]) })
  }
  function handleInput(value: string) {
    const timestamp = performance.now()
    const current = tickSession(
      runRef.current.session,
      timestamp,
      settings.mode === 'time' ? settings.duration : undefined,
    )
    if (current.endedAt !== null) {
      if (runRef.current.session.endedAt === null) complete(current)
      return
    }
    const reference =
      settings.mode === 'zen' ? { ...current, target: value.normalize('NFC') } : current
    let next = updateInput(reference, value, timestamp)
    setNow(timestamp)
    if (
      settings.mode === 'time' &&
      next.input.length > next.target.length - 30 &&
      next.target.length < 8000
    )
      next = {
        ...next,
        target: next.target + ' ' + createText(settings, runRef.current.trainingWords).text,
      }
    if (
      settings.mode !== 'time' &&
      settings.mode !== 'zen' &&
      next.target &&
      characters(next.input).length >= characters(next.target).length
    )
      complete(next)
    else if (next.input.length >= 10000) complete(next)
    else updateRun({ ...runRef.current, session: next })
  }
  const heartbeat = useEffectEvent(() => {
    const timestamp = performance.now()
    const current = runRef.current
    if (current.session.startedAt === null || current.session.endedAt !== null) return
    const next = tickSession(
      current.session,
      timestamp,
      settings.mode === 'time' ? settings.duration : undefined,
    )
    setNow(timestamp)
    if (next.endedAt !== null) complete(next)
    else if (next !== current.session) updateRun({ ...current, session: next })
  })
  const restartShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (
      view !== 'practice' ||
      modal ||
      customOpen ||
      settings.restartKey === 'off' ||
      event.key !== settings.restartKey ||
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey
    )
      return
    const target = event.target instanceof Element ? event.target : null
    const control = target?.closest(
      'input, textarea, select, button, a, summary, [contenteditable], dialog',
    )
    if (control && !control.matches('.typing-input')) return
    event.preventDefault()
    start(settings, runRef.current.trainingWords)
  })
  useEffect(() => {
    window.addEventListener('keydown', restartShortcut)
    return () => window.removeEventListener('keydown', restartShortcut)
  }, [])
  useEffect(() => {
    const timer = setInterval(heartbeat, 100)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const onHash = () => setView(getView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme =
        settings.theme === 'system' ? (media?.matches ? 'dark' : 'light') : settings.theme
    }
    apply()
    media?.addEventListener('change', apply)
    return () => media?.removeEventListener('change', apply)
  }, [settings.theme])

  function train(words: string[]) {
    const preferences: Preferences = {
      ...settings,
      mode: 'words',
      wordCount: 25,
      punctuation: false,
      numbers: false,
    }
    commit({ ...data, settings: preferences })
    start(preferences, words)
    setCustomOpen(false)
    setView('practice')
    location.hash = 'practice'
  }
  function requestImport(backup: LocalData) {
    setModal({
      title: 'Importar copia de seguridad',
      content: (
        <p>
          Se combinar&aacute;n {backup.history.length} sesiones con tu historial, sin duplicados.
          Las preferencias de la copia sustituir&aacute;n a las actuales.
        </p>
      ),
      label: 'Importar y combinar',
      action: () => {
        const next = { ...backup, history: mergeHistory(data.history, backup.history) }
        commit(next, true)
        start(next.settings)
        setCustomOpen(next.settings.mode === 'custom')
        setModal(null)
      },
    })
  }
  function requestClear() {
    setModal({
      title: 'Borrar historial',
      content: (
        <p>
          Se eliminar&aacute;n las {data.history.length} sesiones guardadas. Esta acci&oacute;n no
          se puede deshacer. Las preferencias se conservar&aacute;n.
        </p>
      ),
      label: 'Borrar sesiones',
      destructive: true,
      action: () => {
        commit({ ...data, history: [] }, true)
        start()
        setModal(null)
      },
    })
  }
  function requestReset() {
    setModal({
      title: storageBlocked ? 'Recuperar almacenamiento' : 'Restablecer preferencias',
      content: (
        <p>
          Se guardar&aacute;n las preferencias predeterminadas y el historial disponible en esta
          sesi&oacute;n. Cualquier dato local ilegible ser&aacute; sustituido. Exporta una copia
          antes de continuar.
        </p>
      ),
      label: 'Restablecer',
      action: () => {
        const next = { ...data, settings: defaultData().settings }
        commit(next, true)
        start(next.settings)
        setCustomOpen(false)
        setModal(null)
      },
    })
  }
  const generated = settings.mode === 'time' || settings.mode === 'words'
  const timeLeft = Math.max(0, Math.ceil(settings.duration - metrics.seconds))

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Saltar al contenido
      </a>
      <header className="app-header">
        <button
          className="brand"
          onClick={() => navigate('practice')}
          disabled={running}
          aria-label="Retype, practica"
        >
          <span className="brand-mark">
            <Keyboard size={22} strokeWidth={1.6} />
          </span>
          retype<span className="brand-period">.</span>
        </button>
        <nav aria-label="Navegacion principal">
          {(
            [
              { id: 'practice', name: 'Practica', icon: Keyboard },
              { id: 'progress', name: 'Progreso', icon: ChartNoAxesColumnIncreasing },
              { id: 'settings', name: 'Ajustes', icon: SlidersHorizontal },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={`nav-button ${view === item.id ? 'active' : ''}`}
              aria-label={item.name}
              title={item.name}
              aria-current={view === item.id ? 'page' : undefined}
              disabled={running}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={16} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="header-end">
          <span className="version-tag mono">BETA / 01</span>
          <button
            className="icon-button"
            onClick={() =>
              changeSettings({
                theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark',
              })
            }
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {warning ? (
          <div className="storage-warning" role="alert">
            <ShieldCheck size={20} />
            <p>{warning}</p>
            <button
              className="icon-button"
              aria-label="Cerrar aviso"
              onClick={() => setWarning(null)}
            >
              <X size={17} />
            </button>
          </div>
        ) : null}
        <Suspense
          fallback={
            <div className="view-loading" role="status">
              Cargando...
            </div>
          }
        >
          {view === 'progress' ? (
            <Progress
              history={data.history}
              onPractice={() => {
                start()
                navigate('practice')
              }}
              onTrain={train}
            />
          ) : view === 'settings' ? (
            <Settings
              data={data}
              onChange={changeSettings}
              onImport={requestImport}
              onClear={requestClear}
              onReset={requestReset}
              storageBlocked={storageBlocked}
            />
          ) : result ? (
            <Results
              result={result}
              history={data.history}
              onRestart={() => start()}
              onTrain={train}
              onProgress={() => navigate('progress')}
            />
          ) : (
            <section className="practice-view reveal" aria-labelledby="practice-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">01 / PR&Aacute;CTICA</p>
                  <h1 id="practice-title">Tu propio ritmo.</h1>
                </div>
                <div className="session-state">
                  <span className={`status-dot ${running ? 'live' : ''}`} />
                  <span>{running ? (focused ? 'En marcha' : 'Tiempo activo') : 'Todo listo'}</span>
                </div>
              </div>
              <div className="test-toolbar">
                <div className="mode-controls" role="group" aria-label="Modo de practica">
                  {(Object.keys(modeLabels) as Preferences['mode'][]).map((mode) => {
                    const Icon = modeIcons[mode]
                    return (
                      <button
                        key={mode}
                        className={`mode-button ${settings.mode === mode ? 'selected' : ''}`}
                        aria-pressed={settings.mode === mode}
                        disabled={running}
                        onClick={() => changeSettings({ mode })}
                      >
                        <Icon size={15} />
                        <span>{modeLabels[mode]}</span>
                      </button>
                    )
                  })}
                </div>
                {generated ? (
                  <div
                    className="length-controls"
                    role="group"
                    aria-label={settings.mode === 'time' ? 'Duracion' : 'Cantidad de palabras'}
                  >
                    {(settings.mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map(
                      (length) => (
                        <button
                          key={length}
                          className={
                            length ===
                            (settings.mode === 'time' ? settings.duration : settings.wordCount)
                              ? 'selected'
                              : ''
                          }
                          aria-pressed={
                            length ===
                            (settings.mode === 'time' ? settings.duration : settings.wordCount)
                          }
                          disabled={running}
                          onClick={() =>
                            changeSettings(
                              settings.mode === 'time'
                                ? { duration: length as Preferences['duration'] }
                                : { wordCount: length as Preferences['wordCount'] },
                            )
                          }
                        >
                          {length}
                        </button>
                      ),
                    )}
                    <span className="unit-label">{settings.mode === 'time' ? 's' : 'p'}</span>
                  </div>
                ) : settings.mode === 'custom' ? (
                  <button
                    className="text-button"
                    disabled={running}
                    onClick={() => setCustomOpen(!customOpen)}
                  >
                    <FileText size={15} /> Editar texto
                  </button>
                ) : (
                  <span className="unit-label">
                    {settings.mode === 'zen' ? 'sin limite' : run.source}
                  </span>
                )}
              </div>
              <div className="test-options">
                <label className="language-select">
                  <select
                    aria-label="Idioma de la prueba"
                    disabled={running}
                    value={
                      settings.language === 'es' && settings.plainSpanish
                        ? 'es-plain'
                        : settings.language
                    }
                    onChange={(event) => {
                      const language = event.target.value
                      changeSettings(
                        language === 'es-plain'
                          ? { language: 'es', plainSpanish: true }
                          : { language: language as Preferences['language'], plainSpanish: false },
                      )
                    }}
                  >
                    <option value="es">ES / Espa&ntilde;ol</option>
                    <option value="es-plain">ES / sin tildes ni &ntilde;</option>
                    <option value="en">EN / English</option>
                  </select>
                </label>
                <div className="modifiers">
                  {generated ? (
                    <>
                      <label className={settings.punctuation ? 'enabled' : ''}>
                        <input
                          type="checkbox"
                          checked={settings.punctuation}
                          disabled={running}
                          onChange={(event) =>
                            changeSettings({ punctuation: event.target.checked })
                          }
                        />
                        <AtSign size={15} /> signos
                      </label>
                      <label className={settings.numbers ? 'enabled' : ''}>
                        <input
                          type="checkbox"
                          checked={settings.numbers}
                          disabled={running}
                          onChange={(event) => changeSettings({ numbers: event.target.checked })}
                        />
                        <Hash size={15} /> n&uacute;meros
                      </label>
                    </>
                  ) : null}
                  {run.trainingWords.length ? (
                    <span className="training-label">
                      <Target size={14} /> enfoque personal{' '}
                      <button
                        className="icon-button"
                        aria-label="Salir de practica personalizada"
                        disabled={running}
                        onClick={() => start()}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ) : null}
                </div>
              </div>
              {customOpen ? (
                <div className="custom-editor">
                  <label htmlFor="custom-text">Texto personalizado</label>
                  <textarea
                    id="custom-text"
                    maxLength={5000}
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    rows={5}
                  />
                  <div>
                    <span className="mono muted-copy">{customText.length} / 5000</span>
                    <button
                      className="button primary"
                      disabled={!customText.trim()}
                      onClick={() => {
                        start(settings, [], customText)
                        setCustomOpen(false)
                      }}
                    >
                      <Check size={16} /> Aplicar texto
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="live-stats">
                    <div className="time-stat">
                      <span className="mono">
                        {settings.mode === 'time'
                          ? timeLeft
                          : settings.mode === 'words'
                            ? `${Math.min(settings.wordCount, Math.max(0, run.session.input.split(' ').length - 1))}/${settings.wordCount}`
                            : `${Math.floor(metrics.seconds)}s`}
                      </span>
                      <span>
                        {settings.mode === 'time'
                          ? 'segundos'
                          : settings.mode === 'words'
                            ? 'palabras'
                            : 'transcurridos'}
                      </span>
                    </div>
                    <div className="live-stat-pair">
                      <span>
                        <strong>{metrics.wpm}</strong> wpm
                      </span>
                      <span>
                        <strong>{running ? metrics.accuracy : '-'}</strong>
                        {running ? '%' : ''} precisi&oacute;n
                      </span>
                    </div>
                  </div>
                  <TypingArea
                    key={run.id}
                    session={run.session}
                    settings={settings}
                    onInput={handleInput}
                    onFocusChange={setFocused}
                  />
                  <div className="test-bottom">
                    <span className="mono test-caption">
                      {run.trainingWords.length
                        ? 'PRACTICA DE ENFOQUE'
                        : settings.mode === 'zen'
                          ? 'SIN PRISA. SIN LIMITE.'
                          : settings.mode === 'quote'
                            ? 'RETYPE ORIGINAL'
                            : 'UNA PALABRA A LA VEZ.'}
                    </span>
                    <div className="test-actions">
                      {settings.mode === 'zen' && running ? (
                        <button className="button secondary" onClick={() => complete(run.session)}>
                          <Square size={14} /> Finalizar
                        </button>
                      ) : null}
                      <button
                        className="icon-button restart-button"
                        onClick={() => start(settings, run.trainingWords)}
                        aria-label="Reiniciar prueba"
                        title="Reiniciar prueba"
                      >
                        <RotateCcw size={20} />
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div className="practice-bottom">
                <div className="daily-focus">
                  <p className="eyebrow">HOY, A TU RITMO</p>
                  <div className="daily-top">
                    <h2>Un peque&ntilde;o h&aacute;bito.</h2>
                    <span className="mono">{Math.min(todaySessions.length, 5)} / 5</span>
                  </div>
                  <div
                    className="daily-progress"
                    role="progressbar"
                    aria-label="Objetivo diario de cinco sesiones"
                    aria-valuenow={Math.min(todaySessions.length, 5)}
                    aria-valuemin={0}
                    aria-valuemax={5}
                  >
                    <span style={{ width: `${Math.min(todaySessions.length / 5, 1) * 100}%` }} />
                  </div>
                  <div className="daily-details">
                    <span>{todaySessions.length} sesiones hoy</span>
                    <span>{todayAverage === null ? '-' : todayAverage} wpm de media</span>
                  </div>
                  <button
                    className="text-button"
                    disabled={running}
                    onClick={() => navigate('progress')}
                  >
                    Tu progreso <ArrowRight size={15} />
                  </button>
                </div>
                <div className="keyboard-preview">
                  <KeyboardMap
                    active={run.session.input.at(-1)}
                    compact
                    englishLayout={settings.language === 'en' || settings.plainSpanish}
                  />
                  <span className="mono">
                    QWERTY / {settings.language === 'en' || settings.plainSpanish ? 'EN' : 'ES'}
                  </span>
                </div>
              </div>
            </section>
          )}
        </Suspense>
      </main>
      <footer className="app-footer">
        <span className="footer-wordmark">
          retype<span>.</span>
        </span>
        <span className="footer-note">
          {storageBlocked ? 'Solo esta sesion' : 'Sin cuentas. Sin ruido.'}
        </span>
        <div>
          <button
            className="text-button"
            onClick={() =>
              setModal({
                title: 'Tus datos, bajo tu control',
                content: (
                  <p>
                    Retype guarda preferencias y res&uacute;menes en este navegador, sin una base de
                    datos remota. No guarda los textos personalizados ni env&iacute;a tus
                    pulsaciones. Las copias JSON contienen tu historial y preferencias.
                  </p>
                ),
                label: 'Exportar mis datos',
                action: () => {
                  downloadBackup(data)
                  setModal(null)
                },
              })
            }
          >
            <ShieldCheck size={14} /> Privacidad <ArrowUpRight size={12} />
          </button>
          <span className="mono">v0.1</span>
        </div>
      </footer>
      {modal ? (
        <Dialog
          title={modal.title}
          actionLabel={modal.label}
          destructive={modal.destructive}
          onClose={() => setModal(null)}
          action={modal.action}
        >
          {modal.content}
        </Dialog>
      ) : null}
    </div>
  )
}
