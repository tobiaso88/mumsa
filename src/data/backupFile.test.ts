import { exportFileName, readJsonFile } from './backupFile'

it('namnger exportfilen med lokalt datum', () => {
  expect(exportFileName(new Date(2026, 9, 23, 23, 59))).toBe('mumsa-backup-2026-10-23.json')
})

it('läser JSON från en fil och skiljer ogiltig JSON från värdet null', async () => {
  expect(await readJsonFile(new File(['{"app":"mumsa"}'], 'a.json'))).toEqual({ ok: true, json: { app: 'mumsa' } })
  expect(await readJsonFile(new File(['null'], 'b.json'))).toEqual({ ok: true, json: null })
  expect(await readJsonFile(new File(['inte json'], 'c.json'))).toEqual({ ok: false, reason: 'invalid' })
})

it('läser inte filer som är större än gränsen', async () => {
  expect(await readJsonFile(new File(['{"app":"mumsa"}'], 'a.json'), 5)).toEqual({ ok: false, reason: 'tooLarge' })
})
