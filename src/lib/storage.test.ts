import { describe, expect, it } from 'vitest'
import {
  defaultData,
  parseBackup,
  readData,
  writeData,
  mergeHistory,
  makeResult,
  recordKey,
} from './storage'
import { createSession, finishSession, updateInput } from './engine'

describe('local data and backups', () => {
  it('loads defaults without storing fabricated results', () => {
    const loaded = readData({ getItem: () => null, setItem: () => {} })
    expect(loaded.data.history).toEqual([])
    expect(loaded.data.settings.language).toBe('es')
    expect(loaded.data.settings.theme).toBe('system')
  })

  it('round trips a versioned backup', () => {
    const data = defaultData()
    data.settings.plainSpanish = true
    data.settings.restartKey = 'Tab'
    expect(parseBackup(JSON.stringify(data))).toEqual(data)
  })

  it('reads older version-one settings and results without losing history', () => {
    const data = defaultData()
    const session = finishSession(updateInput(createSession('hola'), 'hola', 1000), 6000)
    const result = makeResult(session, data.settings)
    const legacySettings: Partial<typeof data.settings> = { ...data.settings }
    const legacyResult: Partial<typeof result> = { ...result }
    delete legacySettings.plainSpanish
    delete legacySettings.restartKey
    delete legacyResult.plainSpanish
    const backup = JSON.stringify({ ...data, settings: legacySettings, history: [legacyResult] })
    const expected = { ...data, history: [result] }
    expect(parseBackup(backup)).toEqual(expected)
    expect(readData({ getItem: () => backup, setItem: () => {} }).data).toEqual(expected)
  })

  it('keeps plain Spanish records separate without changing English records', () => {
    const settings = defaultData().settings
    const session = finishSession(updateInput(createSession('hola'), 'hola', 1000), 6000)
    const standard = makeResult(session, settings)
    const plain = makeResult(session, { ...settings, plainSpanish: true })
    expect(standard.plainSpanish).toBe(false)
    expect(plain.plainSpanish).toBe(true)
    expect(recordKey(plain)).not.toBe(recordKey(standard))
    expect(recordKey({ ...plain, language: 'en' })).toBe(recordKey({ ...standard, language: 'en' }))
    expect(
      makeResult(session, { ...settings, language: 'en', plainSpanish: true }).plainSpanish,
    ).toBe(false)
  })

  it('rejects invalid versions, oversized files and invalid settings', () => {
    expect(() => parseBackup('{"version":99}')).toThrow()
    expect(() => parseBackup('x'.repeat(5_000_001))).toThrow()
    const data = defaultData()
    expect(() =>
      parseBackup(JSON.stringify({ ...data, settings: { ...data.settings, duration: -1 } })),
    ).toThrow()
  })

  it('reports corrupted storage without silently overwriting it', () => {
    let writes = 0
    const loaded = readData({
      getItem: () => '{broken',
      setItem: () => {
        writes++
      },
    })
    expect(loaded.warning).toBeTruthy()
    expect(writes).toBe(0)
  })

  it('reports denied writes and remains usable in memory', () => {
    const blocked = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(readData(blocked).warning).toBeTruthy()
    expect(writeData(defaultData(), blocked)).toBeTruthy()
  })

  it('merges empty histories without fabricated data', () => {
    expect(mergeHistory([], [])).toEqual([])
  })

  it('does not persist fragments of private custom text', () => {
    const session = finishSession(updateInput(createSession('private-secret'), 'x', 1000), 6000)
    const result = makeResult(session, { ...defaultData().settings, mode: 'custom' })
    expect(result.missedWords).toEqual([])
    expect(JSON.stringify(result)).not.toContain('private-secret')
    expect(result.errors).toBe(1)
  })

  it('deduplicates and bounds imported history', () => {
    const session = finishSession(updateInput(createSession('hola'), 'hola', 1000), 6000)
    const result = makeResult(session, defaultData().settings)
    expect(mergeHistory([result], [result])).toHaveLength(1)
    const many = Array.from({ length: 510 }, () => ({ ...result, id: crypto.randomUUID() }))
    expect(mergeHistory(many, [])).toHaveLength(500)
  })
})
