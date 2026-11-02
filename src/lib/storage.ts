import { z } from 'zod'
import { getMetrics, type Session } from './engine'

export const settingsSchema = z
  .object({
    mode: z.enum(['time', 'words', 'quote', 'zen', 'custom']),
    language: z.enum(['es', 'en']),
    duration: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
    wordCount: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
    punctuation: z.boolean(),
    numbers: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
    fontSize: z.union([z.literal(22), z.literal(26), z.literal(30), z.literal(34)]),
    caret: z.enum(['line', 'block', 'underline']),
  })
  .strict()

const metric = z.number().finite().min(0).max(100_000_000)
const percentage = z.number().min(0).max(100)
const sampleSchema = z.object({ seconds: metric, wpm: metric, raw: metric, accuracy: percentage })
export const resultSchema = z
  .object({
    id: z.string().uuid(),
    date: z.string().datetime(),
    mode: settingsSchema.shape.mode,
    language: settingsSchema.shape.language,
    duration: settingsSchema.shape.duration,
    wordCount: settingsSchema.shape.wordCount,
    punctuation: z.boolean(),
    numbers: z.boolean(),
    training: z.boolean(),
    length: z.number().int().min(0).max(10000),
    wpm: metric,
    raw: metric,
    accuracy: percentage,
    consistency: percentage,
    seconds: metric,
    correct: metric,
    incorrect: metric,
    extra: metric,
    attempts: metric,
    errors: metric,
    mistakes: z
      .record(z.string().max(24), z.number().int().min(0).max(100000))
      .refine((value) => Object.keys(value).length <= 100),
    missedWords: z.array(z.string().max(100)).max(100),
    samples: z.array(sampleSchema).max(180),
  })
  .strict()

const dataSchema = z
  .object({
    version: z.literal(1),
    settings: settingsSchema,
    history: z.array(resultSchema).max(500),
  })
  .strict()
export type Settings = z.infer<typeof settingsSchema>
export type Result = z.infer<typeof resultSchema>
export type LocalData = z.infer<typeof dataSchema>
export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export const STORAGE_KEY = 'retype.v1'

export function defaultData(): LocalData {
  return {
    version: 1,
    settings: {
      mode: 'time',
      language: 'es',
      duration: 30,
      wordCount: 25,
      punctuation: false,
      numbers: false,
      theme: 'light',
      fontSize: 30,
      caret: 'line',
    },
    history: [],
  }
}

export function parseBackup(text: string): LocalData {
  if (text.length > 5_000_000) throw new Error('La copia supera el limite de 5 MB.')
  return dataSchema.parse(JSON.parse(text))
}

export function readData(storage?: StorageLike): { data: LocalData; warning: string | null } {
  try {
    const raw = (storage ?? window.localStorage).getItem(STORAGE_KEY)
    return { data: raw ? parseBackup(raw) : defaultData(), warning: null }
  } catch {
    return {
      data: defaultData(),
      warning:
        'No se pudieron leer los datos locales. Los datos existentes no se han sobrescrito; puedes exportar una copia o restablecerlos en Ajustes.',
    }
  }
}

export function writeData(data: LocalData, storage?: StorageLike): string | null {
  try {
    const serialized = JSON.stringify(dataSchema.parse(data))
    if (serialized.length > 5_000_000) throw new Error('quota')
    ;(storage ?? window.localStorage).setItem(STORAGE_KEY, serialized)
    return null
  } catch {
    return 'No se pudo guardar en este navegador. Tu progreso sigue disponible en esta sesion; exporta una copia antes de cerrar.'
  }
}

export function mergeHistory(current: Result[], incoming: Result[]): Result[] {
  return [...new Map([...incoming, ...current].map((result) => [result.id, result])).values()]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 500)
}

export function makeResult(session: Session, settings: Settings, training = false): Result {
  const metrics = getMetrics(session, session.endedAt ?? performance.now())
  const samples =
    session.samples.length <= 180
      ? session.samples
      : Array.from(
          { length: 180 },
          (_, index) => session.samples[Math.round((index * (session.samples.length - 1)) / 179)],
        )
  return resultSchema.parse({
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode: settings.mode,
    language: settings.language,
    duration: settings.duration,
    wordCount: settings.wordCount,
    punctuation: settings.punctuation,
    numbers: settings.numbers,
    training,
    length: session.target.length,
    ...metrics,
    mistakes: session.mistakes,
    missedWords:
      settings.mode === 'custom' || settings.mode === 'zen'
        ? []
        : session.missedWords.slice(0, 100).map((word) => word.slice(0, 100)),
    samples,
  })
}

export function recordKey(
  result: Pick<
    Result,
    | 'mode'
    | 'language'
    | 'duration'
    | 'wordCount'
    | 'length'
    | 'punctuation'
    | 'numbers'
    | 'training'
  >,
): string {
  const length =
    result.mode === 'time'
      ? result.duration
      : result.mode === 'words'
        ? result.wordCount
        : result.length
  return [
    result.mode,
    result.language,
    length,
    result.punctuation,
    result.numbers,
    result.training,
  ].join(':')
}

export function downloadBackup(data: LocalData): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `retype-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
