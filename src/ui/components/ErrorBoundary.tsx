import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }

/** Fångar fel när data läses, så att användaren får ett besked i stället för en tom skärm. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="screen stack" role="alert">
        <h1>Något gick fel</h1>
        <p>Datan kunde inte läsas från webbläsarens lagring. Det hjälper ofta att ladda om sidan.</p>
        <button type="button" className="button-primary" onClick={() => window.location.reload()}>
          Ladda om
        </button>
      </main>
    )
  }
}
