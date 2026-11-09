/** Formaten som används på livsmedelsförpackningar. */
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
const SCAN_INTERVAL_MS = 200
const CAMERA: MediaStreamConstraints = {
  video: { facingMode: { ideal: 'environment' } },
  audio: false,
}

/** BarcodeDetector saknas i TypeScripts DOM-typer. */
type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>
}
type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorLike
  getSupportedFormats(): Promise<string[]>
}

export type StopScan = () => void

export function isCameraAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

async function nativeDetector(): Promise<BarcodeDetectorLike | null> {
  const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
  if (!Detector) return null
  const supported = await Detector.getSupportedFormats()
  const formats = FORMATS.filter((f) => supported.includes(f))
  return formats.length > 0 ? new Detector({ formats }) : null
}

function stopCamera(stream: MediaStream, video: HTMLVideoElement): void {
  stream.getTracks().forEach((t) => t.stop())
  video.srcObject = null
}

async function scanNative(video: HTMLVideoElement, detector: BarcodeDetectorLike, onCode: (code: string) => void): Promise<StopScan> {
  const stream = await navigator.mediaDevices.getUserMedia(CAMERA)
  try {
    video.srcObject = stream
    await video.play()
  } catch (error) {
    // Till exempel om video-elementet tas bort medan kameran startar. Annars lyser kameran kvar.
    stopCamera(stream, video)
    throw error
  }
  let stopped = false
  const timer = setInterval(async () => {
    if (stopped || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
    const [first] = await detector.detect(video).catch(() => [])
    if (first && !stopped) onCode(first.rawValue)
  }, SCAN_INTERVAL_MS)
  return () => {
    stopped = true
    clearInterval(timer)
    stopCamera(stream, video)
  }
}

async function scanZxing(video: HTMLVideoElement, onCode: (code: string) => void): Promise<StopScan> {
  // Laddas bara i webbläsare som saknar BarcodeDetector, till exempel Safari
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  const controls = await reader.decodeFromConstraints(CAMERA, video, (result) => {
    if (result) onCode(result.getText())
  })
  return () => controls.stop()
}

/**
 * Startar kameran och anropar onCode för varje avläst streckkod.
 * Returnerar en funktion som stänger av kameran.
 */
export async function startScan(video: HTMLVideoElement, onCode: (code: string) => void): Promise<StopScan> {
  if (!isCameraAvailable()) throw new Error('Kameran är inte tillgänglig i den här webbläsaren.')
  const detector = await nativeDetector()
  return detector ? scanNative(video, detector, onCode) : scanZxing(video, onCode)
}
