export type Sample = { seconds: number; wpm: number; raw: number; accuracy: number }

export type Session = {
  target: string
  input: string
  startedAt: number | null
  endedAt: number | null
  attempts: number
  correctAttempts: number
  mistakes: Record<string, number>
  missedWords: string[]
  samples: Sample[]
}

export const characters = (text: string): string[] =>
  Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text.normalize('NFC')),
    (part) => part.segment,
  )

export function createSession(target: string): Session {
  return {
    target: target.normalize('NFC'),
    input: '',
    startedAt: null,
    endedAt: null,
    attempts: 0,
    correctAttempts: 0,
    mistakes: {},
    missedWords: [],
    samples: [],
  }
}

export function updateInput(session: Session, value: string, now: number): Session {
  if (session.endedAt !== null) return session
  const input = value.normalize('NFC').slice(0, 10000)
  const previous = characters(session.input)
  const next = characters(input)
  const expected = characters(session.target)
  let prefix = 0
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix])
    prefix++
  let suffix = 0
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous[previous.length - suffix - 1] === next[next.length - suffix - 1]
  )
    suffix++
  const inserted = next.slice(prefix, next.length - suffix)
  if (!inserted.length) return { ...session, input }
  const mistakes = { ...session.mistakes }
  const missedWords = new Set(session.missedWords)
  let correctAttempts = session.correctAttempts
  inserted.forEach((character, offset) => {
    const index = prefix + offset
    if (character === expected[index]) correctAttempts++
    else {
      const expectedKey = expected[index] === ' ' ? 'space' : (expected[index] ?? 'extra')
      mistakes[expectedKey] = (mistakes[expectedKey] ?? 0) + 1
      const before = expected.slice(0, index).join('').split(/\s/).at(-1) ?? ''
      const after = expected.slice(index).join('').split(/\s/)[0] ?? ''
      const word = (before + after).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      if (word) missedWords.add(word)
    }
  })
  return {
    ...session,
    input,
    startedAt: session.startedAt ?? now,
    attempts: session.attempts + inserted.length,
    correctAttempts,
    mistakes,
    missedWords: [...missedWords],
  }
}

export function getMetrics(session: Session, now: number) {
  const seconds =
    session.startedAt === null
      ? 0
      : Math.max(0, ((session.endedAt ?? now) - session.startedAt) / 1000)
  const expected = characters(session.target)
  const actual = characters(session.input)
  const correct = actual.filter((character, index) => character === expected[index]).length
  const extra = Math.max(0, actual.length - expected.length)
  const accuracy = session.attempts
    ? Math.round((session.correctAttempts / session.attempts) * 100)
    : 100
  const speeds = session.samples.map((sample) => sample.wpm)
  const mean = speeds.reduce((sum, speed) => sum + speed, 0) / (speeds.length || 1)
  const deviation = Math.sqrt(
    speeds.reduce((sum, speed) => sum + (speed - mean) ** 2, 0) / (speeds.length || 1),
  )
  return {
    seconds,
    wpm: seconds ? Math.round(correct / 5 / (seconds / 60)) : 0,
    raw: seconds ? Math.round(session.attempts / 5 / (seconds / 60)) : 0,
    accuracy,
    correct,
    incorrect: actual.length - correct - extra,
    extra,
    attempts: session.attempts,
    errors: session.attempts - session.correctAttempts,
    consistency:
      speeds.length > 1 && mean ? Math.max(0, Math.round((1 - deviation / mean) * 100)) : 100,
  }
}

export function finishSession(session: Session, now: number): Session {
  if (session.endedAt !== null) return session
  const ended = { ...session, endedAt: now }
  const metrics = getMetrics(ended, now)
  return {
    ...ended,
    samples: [
      ...ended.samples,
      { seconds: metrics.seconds, wpm: metrics.wpm, raw: metrics.raw, accuracy: metrics.accuracy },
    ],
  }
}

export function tickSession(session: Session, now: number, limitSeconds?: number): Session {
  if (session.startedAt === null || session.endedAt !== null) return session
  const deadline = limitSeconds ? session.startedAt + limitSeconds * 1000 : Infinity
  if (now >= deadline) return finishSession(session, deadline)
  const metrics = getMetrics(session, now)
  if (metrics.seconds < (session.samples.at(-1)?.seconds ?? 0) + 1) return session
  return {
    ...session,
    samples: [
      ...session.samples,
      { seconds: metrics.seconds, wpm: metrics.wpm, raw: metrics.raw, accuracy: metrics.accuracy },
    ],
  }
}
