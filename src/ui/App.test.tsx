import { render, screen } from '@testing-library/react'
import { App } from './App'

test('visar appens namn', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Mumsa' })).toBeInTheDocument()
})
