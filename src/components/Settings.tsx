import { useRef, useState } from 'react'
import { Download, Upload, Trash2, RefreshCw, ShieldCheck } from 'lucide-react'
import {
  downloadBackup,
  parseBackup,
  type LocalData,
  type Settings as Preferences,
} from '../lib/storage'

export default function Settings({
  data,
  onChange,
  onImport,
  onClear,
  onReset,
  storageBlocked,
}: {
  data: LocalData
  onChange(patch: Partial<Preferences>): void
  onImport(data: LocalData): void
  onClear(): void
  onReset(): void
  storageBlocked: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const settings = data.settings
  async function importFile(file?: File) {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      if (file.size > 5_000_000) throw new Error('size')
      onImport(parseBackup(await file.text()))
    } catch {
      setError('Copia no valida. Usa un archivo JSON de Retype de hasta 5 MB.')
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  return (
    <section className="settings-view" aria-labelledby="settings-title">
      <div className="section-heading">
        <h1 id="settings-title">Ajustes</h1>
        <span className="local-label">
          <ShieldCheck size={15} /> Solo en este navegador
        </span>
      </div>
      <section className="settings-section">
        <div className="settings-section-title">
          <h2>Apariencia</h2>
        </div>
        <div className="settings-grid">
          <label>
            Tema
            <select
              aria-label="Tema"
              value={settings.theme}
              onChange={(event) => onChange({ theme: event.target.value as Preferences['theme'] })}
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="system">Sistema</option>
            </select>
          </label>
          <label>
            Tama&ntilde;o del texto
            <select
              aria-label="Tamano del texto"
              value={settings.fontSize}
              onChange={(event) =>
                onChange({ fontSize: Number(event.target.value) as Preferences['fontSize'] })
              }
            >
              {[22, 26, 30, 34].map((size) => (
                <option key={size} value={size}>
                  {size} px
                </option>
              ))}
            </select>
          </label>
          <label>
            Cursor
            <select
              aria-label="Cursor"
              value={settings.caret}
              onChange={(event) => onChange({ caret: event.target.value as Preferences['caret'] })}
            >
              <option value="line">L&iacute;nea</option>
              <option value="block">Bloque</option>
              <option value="underline">Subrayado</option>
            </select>
          </label>
        </div>
        <div className="type-preview" style={{ fontSize: settings.fontSize }}>
          <span className="preview-accent">
            abc
            <span className={`caret caret-${settings.caret}`} />
          </span>{' '}
          def
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <h2>Preferencias de pr&aacute;ctica</h2>
        </div>
        <div className="settings-grid">
          <label>
            Idioma
            <select
              value={settings.language}
              onChange={(event) =>
                onChange({ language: event.target.value as Preferences['language'] })
              }
            >
              <option value="es">Espa&ntilde;ol</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            Tiempo predeterminado
            <select
              value={settings.duration}
              onChange={(event) =>
                onChange({ duration: Number(event.target.value) as Preferences['duration'] })
              }
            >
              {[15, 30, 60, 120].map((duration) => (
                <option key={duration} value={duration}>
                  {duration} segundos
                </option>
              ))}
            </select>
          </label>
          <label>
            Palabras predeterminadas
            <select
              value={settings.wordCount}
              onChange={(event) =>
                onChange({ wordCount: Number(event.target.value) as Preferences['wordCount'] })
              }
            >
              {[10, 25, 50, 100].map((count) => (
                <option key={count} value={count}>
                  {count} palabras
                </option>
              ))}
            </select>
          </label>
          <label>
            Espa&ntilde;ol
            <span className="modifiers">
              <input
                type="checkbox"
                aria-label="Espa&ntilde;ol sin tildes ni &ntilde;"
                checked={settings.plainSpanish}
                disabled={settings.language !== 'es'}
                onChange={(event) => onChange({ plainSpanish: event.target.checked })}
              />
              Sin tildes ni &ntilde;
            </span>
          </label>
          <label>
            Tecla de reinicio
            <select
              aria-label="Tecla de reinicio"
              value={settings.restartKey}
              onChange={(event) =>
                onChange({ restartKey: event.target.value as Preferences['restartKey'] })
              }
            >
              <option value="off">Desactivado</option>
              <option value="Tab">Tab</option>
              <option value="Escape">Escape</option>
              <option value="Enter">Enter</option>
              <option value="F2">F2</option>
            </select>
          </label>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <h2>Tus datos</h2>
        </div>
        <div className="data-settings">
          <div>
            <strong>{data.history.length} sesiones guardadas</strong>
            <p>
              Historial local de hasta 500 sesiones. Los textos personalizados no se guardan. Borrar
              los datos del navegador elimina el progreso.
            </p>
          </div>
          <div className="data-actions">
            <button className="button secondary" onClick={() => downloadBackup(data)}>
              <Download size={16} /> Exportar copia
            </button>
            <button
              className="button secondary"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> {loading ? 'Leyendo...' : 'Importar copia'}
            </button>
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept=".json,application/json"
              aria-label="Archivo de copia de seguridad"
              onChange={(event) => void importFile(event.currentTarget.files?.[0])}
            />
          </div>
        </div>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
      <section className="settings-section danger-section">
        <div className="settings-section-title">
          <h2>Restablecer</h2>
        </div>
        <div className="reset-actions">
          <button
            className="button secondary danger-text"
            onClick={onClear}
            disabled={!data.history.length}
          >
            <Trash2 size={16} /> Borrar historial
          </button>
          <button className="button secondary" onClick={onReset}>
            <RefreshCw size={16} />{' '}
            {storageBlocked ? 'Recuperar almacenamiento' : 'Restablecer preferencias'}
          </button>
        </div>
      </section>
    </section>
  )
}
