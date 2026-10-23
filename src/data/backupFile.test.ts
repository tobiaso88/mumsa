import { exportFileName, readJsonFile } from './backupFile'

it('namnger exportfilen med lokalt datum', () => {
  expect(exportFileName(new Date(2026, 9, 23, 23, 59))).toBe('mumsa-backup-2026-10-23.json')
})

it('läser JSON från en fil och ger null för ogiltig JSON', async () => {
  expect(await readJsonFile(new File(['{"app":"mumsa"}'], 'a.json'))).toEqual({ app: 'mumsa' })
  expect(await readJsonFile(new File(['inte json'], 'b.json'))).toBeNull()
})
