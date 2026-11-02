import { useState } from 'react'
import { ArrowRight, Keyboard, Target, TrendingUp } from 'lucide-react'
import { modeLabels } from '../lib/content'
import type { Result } from '../lib/storage'
import KeyboardMap from './KeyboardMap'

export default function Progress({
  history,
  onPractice,
  onTrain,
}: {
  history: Result[]
  onPractice(): void
  onTrain(words: string[]): void
}) {
  const [mode, setMode] = useState('all')
  const [language, setLanguage] = useState('all')
  const [page, setPage] = useState(0)
  const filtered = history.filter(
    (result) =>
      (mode === 'all' || result.mode === mode) &&
      (language === 'all' || result.language === language),
  )
  const mistakes: Record<string, number> = {}
  const wordCounts: Record<string, number> = {}
  filtered.slice(0, 30).forEach((result) => {
    Object.entries(result.mistakes).forEach(([key, value]) => {
      mistakes[key] = (mistakes[key] ?? 0) + value
    })
    result.missedWords.forEach((word) => {
      wordCounts[word] = (wordCounts[word] ?? 0) + 1
    })
  })
  const weakWords = Object.entries(wordCounts)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 12)
    .map(([word]) => word)
  const mean = (key: 'wpm' | 'accuracy') =>
    filtered.length
      ? Math.round(filtered.reduce((sum, item) => sum + item[key], 0) / filtered.length)
      : 0
  return (
    <section className="progress-view reveal" aria-labelledby="progress-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / PROGRESO</p>
          <h1 id="progress-title">Cada intento cuenta.</h1>
        </div>
        <div className="filters">
          <select
            aria-label="Filtrar por modo"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value)
              setPage(0)
            }}
          >
            <option value="all">Todos los modos</option>
            {Object.entries(modeLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por idioma"
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value)
              setPage(0)
            }}
          >
            <option value="all">Todos los idiomas</option>
            <option value="es">Espa&ntilde;ol</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      {!history.length ? (
        <div className="empty-state">
          <Keyboard size={48} strokeWidth={1} />
          <h2>Tu historia empieza aqu&iacute;.</h2>
          <p>Todav&iacute;a no hay sesiones guardadas.</p>
          <button className="button primary" onClick={onPractice}>
            Primer intento <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="progress-metrics">
            <div>
              <span>sesiones</span>
              <strong>{filtered.length}</strong>
            </div>
            <div>
              <span>WPM medio</span>
              <strong>{mean('wpm')}</strong>
            </div>
            <div>
              <span>mayor WPM</span>
              <strong>{filtered.length ? Math.max(...filtered.map((item) => item.wpm)) : 0}</strong>
            </div>
            <div>
              <span>precisi&oacute;n media</span>
              <strong>{filtered.length ? `${mean('accuracy')}%` : '-'}</strong>
            </div>
          </div>
          <div className="training-section">
            <div>
              <p className="eyebrow">PR&Aacute;CTICA PERSONALIZADA</p>
              <h2>Tu pr&oacute;ximo enfoque.</h2>
              {weakWords.length ? (
                <>
                  <div className="word-list">
                    {weakWords.map((word) => (
                      <button key={word} onClick={() => onTrain([word])}>
                        {word}
                        <ArrowRight size={13} />
                      </button>
                    ))}
                  </div>
                  <button className="button secondary" onClick={() => onTrain(weakWords)}>
                    <Target size={17} /> Entrenar estas palabras
                  </button>
                </>
              ) : (
                <p className="muted-copy">Sin palabras pendientes en esta selecci&oacute;n.</p>
              )}
            </div>
            <KeyboardMap mistakes={mistakes} compact />
          </div>
          <div className="history-heading">
            <h2>Historial de sesiones</h2>
            <span className="mono muted-copy">{filtered.length} registros</span>
          </div>
          {!filtered.length ? (
            <p className="empty-filter">Sin sesiones para estos filtros.</p>
          ) : (
            <div className="table-scroll">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Modo</th>
                    <th>Idioma</th>
                    <th>WPM</th>
                    <th>Precisi&oacute;n</th>
                    <th>Errores</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(page * 15, page * 15 + 15).map((result) => (
                    <tr key={result.id}>
                      <td>
                        {new Date(result.date).toLocaleString('es', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        {modeLabels[result.mode]}{' '}
                        <span className="muted-copy">
                          {result.mode === 'time'
                            ? `${result.duration}s`
                            : result.mode === 'words'
                              ? `${result.wordCount}p`
                              : `${Math.round(result.seconds)}s`}
                          {result.training ? ' / foco' : ''}
                          {result.punctuation ? ' / signos' : ''}
                          {result.numbers ? ' / numeros' : ''}
                        </span>
                      </td>
                      <td>{result.language.toUpperCase()}</td>
                      <td className="table-score">
                        <TrendingUp size={13} />
                        {result.wpm}
                      </td>
                      <td>{result.accuracy}%</td>
                      <td>{result.errors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 15 ? (
            <div className="pagination">
              <button
                className="button secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span className="mono">
                {page + 1} / {Math.ceil(filtered.length / 15)}
              </span>
              <button
                className="button secondary"
                disabled={(page + 1) * 15 >= filtered.length}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
