import { lazy, Suspense } from 'react'
import { ArrowRight, RotateCcw, Target, Trophy } from 'lucide-react'
import { modeLabels } from '../lib/content'
import { recordKey, type Result } from '../lib/storage'
import KeyboardMap from './KeyboardMap'

const SessionChart = lazy(() => import('./SessionChart'))

export default function Results({
  result,
  history,
  onRestart,
  onTrain,
  onProgress,
}: {
  result: Result
  history: Result[]
  onRestart(): void
  onTrain(words: string[]): void
  onProgress(): void
}) {
  const comparable = history.filter(
    (item) => item.id !== result.id && recordKey(item) === recordKey(result),
  )
  const personalBest =
    comparable.length > 0 && result.wpm > Math.max(...comparable.map((item) => item.wpm))
  return (
    <section className="results" aria-labelledby="results-title">
      <div className="section-heading">
        <h1 id="results-title">Resultados</h1>
        <span className="result-context">
          {modeLabels[result.mode]} / {result.language.toUpperCase()} / {result.seconds.toFixed(1)}{' '}
          s
        </span>
      </div>
      {personalBest ? (
        <div className="record-note">
          <Trophy size={16} /> Nueva marca personal en esta modalidad
        </div>
      ) : null}
      <div className="result-metrics">
        <div className="main-metric">
          <span>palabras / minuto</span>
          <strong>{result.wpm}</strong>
        </div>
        <div>
          <span>precisi&oacute;n</span>
          <strong>
            {result.accuracy}
            <small>%</small>
          </strong>
        </div>
        <div>
          <span>velocidad bruta</span>
          <strong>{result.raw}</strong>
        </div>
        <div>
          <span>consistencia</span>
          <strong>
            {result.consistency}
            <small>%</small>
          </strong>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="chart-loading" role="status">
            Cargando gr&aacute;fico...
          </div>
        }
      >
        <SessionChart samples={result.samples} />
      </Suspense>
      <div className="results-bottom">
        <section className="error-review">
          <h2>Errores</h2>
          {result.missedWords.length ? (
            <div className="word-list">
              {result.missedWords.slice(0, 12).map((word) => (
                <button key={word} onClick={() => onTrain([word])} title={`Practicar ${word}`}>
                  {word}
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          ) : null}
          <div className="character-summary">
            <span>
              <i className="legend-dot teal" /> {result.correct} correctos
            </span>
            <span>
              <i className="legend-dot coral" /> {result.errors} errores
            </span>
            <span>{result.attempts} pulsaciones</span>
          </div>
        </section>
        <KeyboardMap mistakes={result.mistakes} compact />
      </div>
      <div className="result-actions">
        <button className="button primary" onClick={onRestart}>
          <RotateCcw size={17} /> Nuevo intento
        </button>
        {result.missedWords.length ? (
          <button className="button secondary" onClick={() => onTrain(result.missedWords)}>
            <Target size={17} /> Practicar errores
          </button>
        ) : null}
        <button className="text-button" onClick={onProgress}>
          Ver progreso <ArrowRight size={16} />
        </button>
      </div>
    </section>
  )
}
