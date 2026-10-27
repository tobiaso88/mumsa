import { startScan } from './scanner'

function fakeCamera() {
  const track = { stop: vi.fn() }
  const stream = { getTracks: () => [track] } as unknown as MediaStream
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(() => Promise.resolve(stream)) },
  })
  return track
}

function fakeVideo(play: () => Promise<void>) {
  return { play, srcObject: null, readyState: 0 } as unknown as HTMLVideoElement
}

beforeEach(() => {
  // Konstruktorn behövs bara för att skapa detektorn, inte för att läsa koder i de här testerna
  const Detector = Object.assign(
    function () {
      return { detect: () => Promise.resolve([]) }
    },
    { getSupportedFormats: () => Promise.resolve(['ean_13']) },
  )
  vi.stubGlobal('BarcodeDetector', Detector)
})
afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'mediaDevices')
})

it('stänger av kameran om videon inte går att starta', async () => {
  const track = fakeCamera()
  const video = fakeVideo(() => Promise.reject(new DOMException('Elementet togs bort', 'AbortError')))

  await expect(startScan(video, () => {})).rejects.toThrow('Elementet togs bort')
  expect(track.stop).toHaveBeenCalled()
  expect(video.srcObject).toBeNull()
})

it('stänger av kameran när skanningen stoppas', async () => {
  const track = fakeCamera()
  const video = fakeVideo(() => Promise.resolve())

  const stop = await startScan(video, () => {})
  expect(track.stop).not.toHaveBeenCalled()
  stop()
  expect(track.stop).toHaveBeenCalled()
  expect(video.srcObject).toBeNull()
})
