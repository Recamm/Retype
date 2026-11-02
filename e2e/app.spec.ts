import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function completeWords(page: Page, withError = false) {
  await page.getByRole('button', { name: 'Palabras', exact: true }).click()
  await page.getByRole('button', { name: '10', exact: true }).click()
  const target = (await page.getByTestId('reference').textContent())!
  const input = page.getByRole('textbox', { name: 'Texto de la prueba' })
  if (withError) {
    await input.pressSequentially('!')
    await input.press('Backspace')
  }
  await input.pressSequentially(target)
  await expect(page.getByRole('heading', { name: 'Resultados', exact: true })).toBeVisible()
}

test('practice layout, local fonts and responsive controls', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const response = await page.goto('/')
  if (process.env.PRODUCTION_CHECK) {
    expect(response?.headers()['content-security-policy']).toContain("script-src 'self'")
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  }
  await expect(page.getByRole('textbox', { name: 'Texto de la prueba' })).toBeFocused()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    page.locator('.practice-view .keyboard-map, .daily-focus, .test-caption'),
  ).toHaveCount(0)
  await expect(page.locator('.live-stats')).toBeHidden()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.getByRole('button', { name: 'Tiempo', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.evaluate(() => document.fonts.check('30px "IBM Plex Mono"'))).toBe(true)
  await page.screenshot({
    path: `artifacts/practice-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  const contrast = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.documentElement)
      const luminance = (hex: string) => {
        const values = hex
          .trim()
          .replace('#', '')
          .match(/.{2}/g)!
          .map((value) => parseInt(value, 16) / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
      }
      const background = luminance(style.getPropertyValue('--bg'))
      return ['--muted', '--faint'].map((token) => {
        const foreground = luminance(style.getPropertyValue(token))
        return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05)
      })
    })
  expect(Math.min(...(await contrast()))).toBeGreaterThanOrEqual(4.5)
  await page.getByRole('button', { name: 'Cambiar tema' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(Math.min(...(await contrast()))).toBeGreaterThanOrEqual(4.5)
  await page.mouse.move(0, 0)
  await page.screenshot({
    path: `artifacts/light-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Cambiar tema' }).click()
  const reference = (await page.getByTestId('reference').textContent())!
  await page.getByRole('textbox', { name: 'Texto de la prueba' }).pressSequentially(reference[0])
  await expect(page.locator('.live-stats')).toBeVisible()
  const surface = (await page.locator('.typing-surface').boundingBox())!
  const viewport = page.viewportSize()!
  expect(surface.y).toBeGreaterThan(viewport.height * 0.25)
  expect(surface.y + surface.height).toBeLessThan(viewport.height - 64)
  const lines = await page.locator('.typing-copy').evaluate((element) => {
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight)
    return element.parentElement!.clientHeight / lineHeight
  })
  expect(lines).toBeGreaterThanOrEqual(3)
  expect(lines).toBeLessThan(3.5)
  await page.mouse.move(0, 0)
  await page.screenshot({
    path: `artifacts/typing-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  const compact =
    info.project.name === 'desktop' ? { width: 1280, height: 560 } : { width: 320, height: 740 }
  await page.setViewportSize(compact)
  expect(await page.evaluate(() => innerWidth)).toBe(compact.width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const restart = (await page
    .getByRole('button', { name: 'Reiniciar prueba', exact: true })
    .boundingBox())!
  expect(restart.y + restart.height).toBeLessThan(compact.height)
  await page.screenshot({
    path: `artifacts/compact-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  expect(errors).toEqual([])
})

test('corrected mistakes produce a summary and targeted practice', async ({ page }, info) => {
  await page.goto('/')
  await completeWords(page, true)
  const result = await page.evaluate(
    () => JSON.parse(localStorage.getItem('retype.v1')!).history[0],
  )
  expect(result.errors).toBe(1)
  expect(result.accuracy).toBeLessThan(100)
  expect(result).not.toHaveProperty('target')
  await expect(page.locator('.session-chart svg')).toBeVisible()
  await expect(page.locator('.recharts-line-curve').first()).toHaveAttribute('d', /M.+[LC]/)
  await page.screenshot({
    path: `artifacts/results-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Practicar errores', exact: true }).click()
  const trainingText = (await page.getByTestId('reference').textContent())!
  expect(trainingText.split(' ').every((word) => result.missedWords.includes(word))).toBe(true)
  await page.reload()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('retype.v1')!).history.length),
  ).toBe(1)
  await page.getByRole('button', { name: 'Progreso', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Progreso', exact: true })).toBeVisible()
  await expect(page.locator('.history-table tbody tr')).toHaveCount(1)
  await page.getByRole('combobox', { name: 'Filtrar por idioma' }).selectOption('en')
  await expect(page.getByText('Sin sesiones para estos filtros.')).toBeVisible()
  await page.getByRole('combobox', { name: 'Filtrar por idioma' }).selectOption('es')
  await expect(page.locator('.history-table tbody tr')).toHaveCount(1)
  await page.screenshot({
    path: `artifacts/progress-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
})

test('navigation and skip link keep the current view accessible', async ({ page }, info) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible()
  await expect(page.locator('.type-preview .caret')).toBeVisible()
  await page.locator('.skip-link').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await expect(page.locator('main')).toHaveCSS('outline-style', 'solid')
  await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible()
  await page.screenshot({
    path: `artifacts/settings-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('combobox', { name: 'Tema', exact: true }).selectOption('system')
  await page.getByRole('combobox', { name: 'Tamano del texto' }).selectOption('34')
  await page.getByRole('combobox', { name: 'Cursor', exact: true }).selectOption('underline')
  await page.reload()
  const preferences = await page.evaluate(
    () => JSON.parse(localStorage.getItem('retype.v1')!).settings,
  )
  expect(preferences.fontSize).toBe(34)
  expect(preferences.caret).toBe('underline')
})

test('deadline is exact even when the timer advances abruptly', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: '15', exact: true }).click()
  await page.getByRole('textbox', { name: 'Texto de la prueba' }).pressSequentially('a')
  await page.clock.runFor(16000)
  await expect(page.getByRole('heading', { name: 'Resultados', exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('retype.v1')!).history[0].seconds),
  ).toBe(15)
})

test('custom text and zen support accented characters', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Personalizado', exact: true }).click()
  await page.getByRole('textbox', { name: 'Texto personalizado' }).fill('ni\u00f1o a\u0301rbol')
  await page.getByRole('button', { name: 'Aplicar texto' }).click()
  await page
    .getByRole('textbox', { name: 'Texto de la prueba' })
    .pressSequentially('ni\u00f1o \u00e1rbol')
  await expect(page.getByRole('heading', { name: 'Resultados', exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('retype.v1')!).history[0].accuracy),
  ).toBe(100)
  await page.getByRole('button', { name: 'Nuevo intento' }).click()
  await page.getByRole('button', { name: 'Zen', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Texto de la prueba' })
    .pressSequentially('una palabra a la vez')
  await page.getByRole('button', { name: 'Finalizar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Resultados', exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('retype.v1')!).history[0].mode),
  ).toBe('zen')
})

test('backups download, merge without duplicates and deletion asks confirmation', async ({
  page,
}, info) => {
  await page.goto('/')
  await completeWords(page)
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar copia', exact: true }).click()
  const download = await downloadPromise
  const path = info.outputPath('backup.json')
  await download.saveAs(path)
  const backup = JSON.parse(await readFile(path, 'utf8'))
  expect(backup.history).toHaveLength(1)
  await page.getByLabel('Archivo de copia de seguridad').setInputFiles(path)
  await page.getByRole('button', { name: 'Importar y combinar', exact: true }).click()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('retype.v1')!).history.length),
  ).toBe(1)
  await page.getByRole('button', { name: 'Borrar historial', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Borrar historial', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Borrar historial', exact: true }).click()
  await page.getByRole('button', { name: 'Borrar sesiones', exact: true }).click()
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('retype.v1')!).history.length),
  ).toBe(0)
})

test('English keyboard Spanish persists and accepts unaccented typing', async ({ page }, info) => {
  await page.goto('/')
  await page
    .getByRole('combobox', { name: 'Idioma de la prueba' })
    .selectOption('es-plain', { timeout: 3000 })
  await page.getByRole('button', { name: 'Personalizado', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Texto personalizado' })
    .fill('ni\u00f1o \u00e1rbol ping\u00fcino')
  await page.getByRole('button', { name: 'Aplicar texto' }).click()
  await expect(page.getByTestId('reference')).toHaveText('nino arbol pinguino')
  await page
    .getByRole('textbox', { name: 'Texto de la prueba' })
    .pressSequentially('nino arbol pinguino')
  await expect(page.getByRole('heading', { name: 'Resultados', exact: true })).toBeVisible()
  const result = await page.evaluate(
    () => JSON.parse(localStorage.getItem('retype.v1')!).history[0],
  )
  expect(result.accuracy).toBe(100)
  expect(result.plainSpanish).toBe(true)
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click()
  await expect(
    page.getByRole('checkbox', { name: 'Espa\u00f1ol sin tildes ni \u00f1', exact: true }),
  ).toBeChecked()
  await page.reload()
  await expect(
    page.getByRole('checkbox', { name: 'Espa\u00f1ol sin tildes ni \u00f1', exact: true }),
  ).toBeChecked()
  await page.screenshot({
    path: `artifacts/keyboard-settings-${info.project.name}.png`,
    fullPage: true,
    animations: 'disabled',
  })
})

test('restart shortcuts reset attempts without breaking forms or dialogs', async ({ page }) => {
  await page.goto('/')
  for (const key of ['Tab', 'Escape', 'Enter', 'F2']) {
    await page.getByRole('button', { name: 'Ajustes', exact: true }).click()
    const shortcut = page.getByRole('combobox', { name: 'Tecla de reinicio', exact: true })
    await expect(shortcut).toBeVisible({ timeout: 3000 })
    await shortcut.selectOption(key)
    await page.reload()
    await expect(shortcut).toHaveValue(key)
    await page.getByRole('button', { name: 'Practica', exact: true }).click()
    let input = page.getByRole('textbox', { name: 'Texto de la prueba' })
    await input.pressSequentially('x')
    await input.dispatchEvent('keydown', { key, repeat: true })
    await expect(input).toHaveValue('x')
    await page.keyboard.press(key)
    input = page.getByRole('textbox', { name: 'Texto de la prueba' })
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    await completeWords(page)
    await page.keyboard.press(key)
    await expect(page.getByRole('textbox', { name: 'Texto de la prueba' })).toHaveValue('')
  }
  await page.getByRole('button', { name: 'Personalizado', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Texto personalizado' })
  await editor.fill('texto del editor')
  await page.keyboard.press('F2')
  await expect(editor).toHaveValue('texto del editor')
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Tecla de reinicio', exact: true })
    .selectOption('Escape')
  await page.getByRole('button', { name: 'Practica', exact: true }).click()
  await page.getByRole('button', { name: 'Privacidad', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Texto personalizado' })).toHaveValue(
    'texto del editor',
  )
})

test('invalid backup and unavailable storage fail without data loss', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Palabras', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('No se pudo guardar')
  await page.getByRole('button', { name: 'Ajustes', exact: true }).click()
  await page.getByLabel('Archivo de copia de seguridad').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":99}'),
  })
  await expect(page.getByText('Copia no valida.', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('retype.v1'))).toBeNull()
})
