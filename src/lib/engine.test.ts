import { describe, expect, it } from 'vitest'
import { createSession, finishSession, getMetrics, tickSession, updateInput } from './engine'

describe('typing engine', () => {
  it('starts on the first insertion, not focus or backspace', () => {
    const ready = createSession('hola mundo')
    expect(updateInput(ready, '', 1000).startedAt).toBeNull()
    expect(updateInput(ready, 'h', 2000).startedAt).toBe(2000)
  })

  it('normalizes accented characters and measures five-character words', () => {
    const session = updateInput(createSession('árbol niño'), 'a\u0301rbol niño', 1000)
    const result = getMetrics(finishSession(session, 61000), 61000)
    expect(session.input).toBe('árbol niño')
    expect(result.wpm).toBe(2)
    expect(result.accuracy).toBe(100)
  })

  it('retains mistakes in accuracy after correction', () => {
    let session = updateInput(createSession('hola'), 'x', 1000)
    session = updateInput(session, '', 2000)
    session = updateInput(session, 'hola', 3000)
    const result = getMetrics(finishSession(session, 61000), 61000)
    expect(result.accuracy).toBe(80)
    expect(result.correct).toBe(4)
    expect(session.mistakes.h).toBe(1)
    expect(session.missedWords).toContain('hola')
  })

  it('uses the deadline after a background tab or delayed timer', () => {
    const session = updateInput(createSession('hola mundo'), 'hola', 1000)
    const finished = tickSession(session, 99000, 15)
    expect(finished.endedAt).toBe(16000)
    expect(getMetrics(finished, 99000).seconds).toBe(15)
    expect(updateInput(finished, 'hola mundo', 100000)).toBe(finished)
  })

  it('produces finite empty metrics and freezes finished sessions', () => {
    expect(getMetrics(createSession('hola'), 0)).toMatchObject({ wpm: 0, raw: 0, accuracy: 100 })
    const ended = finishSession(updateInput(createSession('hola'), 'hola', 0), 5000)
    expect(getMetrics(ended, 20000)).toEqual(getMetrics(ended, 5000))
  })
})
