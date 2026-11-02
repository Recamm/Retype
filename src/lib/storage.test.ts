import { describe, expect, it } from 'vitest'
import { defaultData, parseBackup, readData, writeData, mergeHistory, makeResult } from './storage'
import { createSession, finishSession, updateInput } from './engine'

describe('local data and backups', () => {
  it('loads defaults without storing fabricated results', () => {
    const loaded = readData({ getItem: () => null, setItem: () => {} })
    expect(loaded.data.history).toEqual([])
    expect(loaded.data.settings.language).toBe('es')
  })

  it('round trips a versioned backup', () => {
    const data = defaultData()
    expect(parseBackup(JSON.stringify(data))).toEqual(data)
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
