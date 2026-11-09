import { canShareExport, exportFileName, readJsonFile, shareExport } from '../../../src/data/backup/backupFile'
import { exportAll } from '../../../src/data/backup/backup'
import type { MumsaDb } from '../../../src/data/db/db'
import type { ExportData } from '../../../src/domain/backup/exportFormat'
import { createTestDb } from '../../helpers/testDb'

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

describe('delning av export', () => {
  let db: MumsaDb
  let data: ExportData

  beforeEach(async () => {
    db = createTestDb()
    data = await exportAll(db, new Date(2026, 9, 23))
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    await db.delete()
  })

  function stubNavigator(nav: Partial<Navigator>) {
    vi.stubGlobal('navigator', nav)
  }

  it('kan dela när webbläsaren stöder filer', () => {
    stubNavigator({ share: vi.fn(), canShare: () => true })
    expect(canShareExport()).toBe(true)
  })

  it('kan inte dela utan stöd för att dela filer', () => {
    stubNavigator({})
    expect(canShareExport()).toBe(false)
    stubNavigator({ share: vi.fn(), canShare: () => false })
    expect(canShareExport()).toBe(false)
  })

  it('delar exporten som en JSON-fil med datumet i namnet', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share, canShare: () => true })

    expect(await shareExport(data, new Date(2026, 9, 23))).toBe('shared')

    const shared = share.mock.calls[0]![0] as { files: File[] }
    expect(shared.files).toHaveLength(1)
    expect(shared.files[0]!.name).toBe('mumsa-backup-2026-10-23.json')
    expect(JSON.parse(await shared.files[0]!.text())).toMatchObject({ app: 'mumsa' })
  })

  it('räknar ett stängt delningsfönster som avbrutet och inte som fel', async () => {
    stubNavigator({ share: vi.fn().mockRejectedValue(new DOMException('', 'AbortError')), canShare: () => true })
    expect(await shareExport(data)).toBe('cancelled')
  })

  it('kastar vidare andra fel', async () => {
    stubNavigator({ share: vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError')), canShare: () => true })
    await expect(shareExport(data)).rejects.toThrow()
  })
})
