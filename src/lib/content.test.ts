import { describe, expect, it } from 'vitest'
import { createText } from './content'
import { defaultData } from './storage'

describe('practice content', () => {
  it('generates the requested word count', () => {
    const settings = { ...defaultData().settings, mode: 'words' as const, wordCount: 10 as const }
    expect(createText(settings).text.split(' ')).toHaveLength(10)
  })

  it('uses missed words for targeted practice', () => {
    const text = createText(defaultData().settings, ['teclado', 'ritmo']).text
    expect(text.split(' ').every((word) => ['teclado', 'ritmo'].includes(word))).toBe(true)
  })

  it('provides an original quote and normalized custom text', () => {
    const settings = defaultData().settings
    expect(createText({ ...settings, mode: 'quote' }).source).toBe('Retype Original')
    expect(createText({ ...settings, mode: 'custom' }, [], ' hola\n mundo ').text).toBe(
      'hola mundo',
    )
  })
})
