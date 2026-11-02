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

  it('offers Spanish references without accents or enye on an English keyboard', () => {
    const settings = { ...defaultData().settings, mode: 'custom' as const, plainSpanish: true }
    expect(
      createText(
        settings,
        [],
        '\u00c1rbol, ni\u00f1o, ping\u00fcino: \u00c1\u00c9\u00cd\u00d3\u00da \u00d1.',
      ).text,
    ).toBe('Arbol, nino, pinguino: AEIOU N.')
    const training = createText({ ...settings, mode: 'words' }, ['ni\u00f1o', 'caf\u00e9']).text
    expect(training.split(' ').every((word) => ['nino', 'cafe'].includes(word))).toBe(true)
    expect(createText({ ...settings, mode: 'quote' }).text).not.toMatch(
      /[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc]/i,
    )
  })

  it('preserves standard Spanish and English when the option does not apply', () => {
    const settings = { ...defaultData().settings, mode: 'custom' as const }
    expect(createText(settings, [], 'ni\u00f1o caf\u00e9').text).toBe('ni\u00f1o caf\u00e9')
    expect(
      createText({ ...settings, language: 'en', plainSpanish: true }, [], 'ni\u00f1o caf\u00e9')
        .text,
    ).toBe('ni\u00f1o caf\u00e9')
  })
})
