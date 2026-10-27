import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'a', label: 'Alfa' },
  { value: 'b', label: 'Beta' },
] as const

function Group({ label }: { label: string }) {
  const [value, setValue] = useState<'a' | 'b'>('a')
  return <SegmentedControl label={label} options={OPTIONS} value={value} onChange={setValue} />
}

it('låter två grupper på samma sida väljas var för sig', async () => {
  const user = userEvent.setup()
  render(
    <>
      <Group label="Första" />
      <Group label="Andra" />
    </>,
  )
  const first = screen.getByRole('radiogroup', { name: 'Första' })
  const second = screen.getByRole('radiogroup', { name: 'Andra' })

  await user.click(within(second).getByLabelText('Beta'))

  expect(within(first).getByLabelText('Alfa')).toBeChecked()
  expect(within(second).getByLabelText('Beta')).toBeChecked()
})

it('visar inget som valt när värdet är tomt', () => {
  render(<SegmentedControl label="Grupp" options={OPTIONS} value="" onChange={() => {}} />)
  expect(screen.getByLabelText('Alfa')).not.toBeChecked()
  expect(screen.getByLabelText('Beta')).not.toBeChecked()
})
