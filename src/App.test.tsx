import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './lib/storage'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
})

describe('practice experience', () => {
  it('shows a usable test with no invented history', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: 'Texto de la prueba' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiempo' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('0 / 5')).toBeInTheDocument()
  })

  it('completes a word test and saves only a result summary', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Palabras' }))
    fireEvent.click(screen.getByRole('button', { name: '10' }))
    const reference = screen.getByTestId('reference').textContent!
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto de la prueba' }), {
      target: { value: reference.slice(0, 1) },
    })
    await new Promise((resolve) => setTimeout(resolve, 20))
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto de la prueba' }), {
      target: { value: reference },
    })
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(saved.history).toHaveLength(1)
    expect(saved.history[0].accuracy).toBe(100)
    expect(saved.history[0]).not.toHaveProperty('target')
    expect(saved.history[0]).not.toHaveProperty('input')
    expect(
      await screen.findByRole('button', { name: 'Nuevo intento' }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })

  it('persists language preferences between visits', () => {
    render(<App />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Idioma de la prueba' }), {
      target: { value: 'en' },
    })
    cleanup()
    render(<App />)
    expect(screen.getByRole('combobox', { name: 'Idioma de la prueba' })).toHaveValue('en')
  })
})
