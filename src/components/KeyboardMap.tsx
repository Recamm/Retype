export default function KeyboardMap({
  mistakes = {},
  active = '',
  compact = false,
  englishLayout = false,
}: {
  mistakes?: Record<string, number>
  active?: string
  compact?: boolean
  englishLayout?: boolean
}) {
  const rows = ['qwertyuiop', englishLayout ? 'asdfghjkl;' : 'asdfghjkl\u00f1', 'zxcvbnm']
  const largest = Math.max(1, ...Object.values(mistakes))
  return (
    <div
      className={`keyboard-map ${compact ? 'compact' : ''}`}
      role="img"
      aria-label="Mapa de errores del teclado"
    >
      {rows.map((row) => (
        <div className="key-row" key={row}>
          {Array.from(row).map((key) => (
            <kbd
              key={key}
              title={`${key}: ${mistakes[key] ?? 0} errores`}
              className={`${mistakes[key] ? 'key-error' : ''} ${active.toLowerCase() === key ? 'key-active' : ''}`}
              style={{ '--error-weight': (mistakes[key] ?? 0) / largest } as React.CSSProperties}
            >
              {key}
            </kbd>
          ))}
        </div>
      ))}
      <div className="key-row">
        <kbd
          className={`space-key ${mistakes.space ? 'key-error' : ''}`}
          title={`${mistakes.space ?? 0} errores de espacio`}
        >
          space
        </kbd>
      </div>
    </div>
  )
}
