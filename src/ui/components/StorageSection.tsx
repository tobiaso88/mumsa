import { usePersistentStorage } from '../hooks/usePersistentStorage'
import { ListGroup } from './ListGroup'

function Switch({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="switch" className="switch" aria-checked={checked} aria-label={label} onClick={onToggle} disabled={checked}>
      <span className="switch-knob" />
    </button>
  )
}

export function StorageSection() {
  const { persisted, request } = usePersistentStorage()
  // Beständig lagring går inte att stänga av igen, så brytaren låses när den är på
  const trailing =
    typeof persisted === 'boolean' ? <Switch checked={persisted} onToggle={() => void request()} label="Beständig lagring" /> : undefined
  return (
    <ListGroup
      title="Din data"
      rows={[{ label: 'Beständig lagring', icon: 'lock', value: persisted === null ? 'Stöds inte' : undefined, trailing }]}
      footer={
        <p>
          Allt sparas bara i den här webbläsaren, utan konto eller synk.{' '}
          {persisted === true ? 'Lagringen är beständig och rensas inte automatiskt. ' : ''}
          Rensar du webbplatsdata försvinner loggen, så exportera en kopia då och då.
        </p>
      }
    />
  )
}
