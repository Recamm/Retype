import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Session } from '../lib/engine'
import { characters } from '../lib/engine'
import type { Settings } from '../lib/storage'

export default function TypingArea({
  session,
  settings,
  onInput,
  onFocusChange,
}: {
  session: Session
  settings: Settings
  onInput(value: string): void
  onFocusChange(focused: boolean): void
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const [draft, setDraft] = useState(session.input)
  const actual = characters(session.input)
  const expected = characters(settings.mode === 'zen' ? session.input + ' ' : session.target)
  const startOffset = Math.max(0, Math.floor((actual.length - 128) / 256) * 256)
  const visible = expected.slice(startOffset, startOffset + 1024)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const copy = copyRef.current
    const caret = caretRef.current
    if (!viewport || !copy || !caret) return
    const lineHeight = parseFloat(getComputedStyle(copy).lineHeight)
    const letter = caret.closest('.letter') ?? caret
    const line = Math.round(
      (letter.getBoundingClientRect().top - copy.getBoundingClientRect().top) / lineHeight,
    )
    viewport.scrollTop = Math.max(0, (line - 1) * lineHeight)
  }, [session.input, settings.fontSize, startOffset])

  return (
    <div
      className="typing-surface"
      style={{ '--typing-size': `${settings.fontSize}px` } as React.CSSProperties}
    >
      <p className="sr-only" id="typing-reference" data-testid="reference">
        {session.target}
      </p>
      <div ref={viewportRef} className="typing-viewport" aria-hidden="true">
        <div ref={copyRef} className="typing-copy">
          {visible.map((character, offset) => {
            const index = startOffset + offset
            const typed = actual[index]
            return (
              <span
                key={index}
                className={`letter ${typed === undefined ? '' : typed === character ? 'correct' : 'incorrect'}`}
              >
                {index === actual.length ? (
                  <span ref={caretRef} className={`caret caret-${settings.caret}`} />
                ) : null}
                {character}
              </span>
            )
          })}
          {actual.length === expected.length && settings.mode !== 'zen' ? (
            <span ref={caretRef} className={`caret caret-${settings.caret}`} />
          ) : null}
        </div>
      </div>
      <textarea
        ref={inputRef}
        aria-label="Texto de la prueba"
        aria-describedby="typing-reference"
        className="typing-input"
        value={draft}
        maxLength={10000}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        wrap="off"
        onChange={(event) => {
          const value = event.currentTarget.value
          setDraft(value)
          if (!(event.nativeEvent as InputEvent).isComposing) onInput(value)
        }}
        onCompositionEnd={(event) => {
          const value = event.currentTarget.value.normalize('NFC')
          setDraft(value)
          onInput(value)
        }}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
      />
    </div>
  )
}
