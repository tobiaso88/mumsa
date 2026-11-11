import { Component, type ReactNode } from 'react'
import { ErrorScreen } from './ErrorScreen'

type Props = { children: ReactNode }

/**
 * Fångar fel i renderingen, till exempel när data inte går att läsa, så att
 * användaren får ett besked och kan spara sin data i stället för att se en tom skärm.
 * Måste ligga inom DbProvider, eftersom felskärmen kan exportera datan.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    return this.state.failed ? <ErrorScreen /> : this.props.children
  }
}
