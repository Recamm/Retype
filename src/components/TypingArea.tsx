import { useEffect, useRef, useState } from 'react'
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
  const caretRef = useRef<HTMLSpanElement>(null)
  const [draft, setDraft] = useState(session.input)
  const actual = characters(session.input)
  const expected = characters(settings.mode === 'zen' ? session.input + ' ' : session.target)
  const currentWord = session.input.split(' ').length - 1
  const startWord = Math.max(0, Math.floor((currentWord - 8) / 24) * 24)
  const allWords = expected.join('').split(' ')
  const startOffset = characters(
    allWords.slice(0, startWord).join(' ') + (startWord ? ' ' : ''),
  ).length
  const visible = characters(allWords.slice(startWord, startWord + 64).join(' '))

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    caretRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [session.input])

  return (
    <div
      className="typing-surface"
      style={{ '--typing-size': `${settings.fontSize}px` } as React.CSSProperties}
    >
      <p className="sr-only" id="typing-reference" data-testid="reference">
        {session.target}
      </p>
      <div className="typing-viewport" aria-hidden="true">
        <div className="typing-copy">
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
