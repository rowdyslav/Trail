import { useEffect, useRef, useState, useEffectEvent, type RefObject } from 'react'

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'unsupported' | 'denied' | 'error'

interface UseQrScannerOptions {
  enabled: boolean
  onDetected: (value: string) => void
}

interface UseQrScannerResult {
  videoRef: RefObject<HTMLVideoElement | null>
  status: ScannerStatus
  error: string | null
}

const SCAN_INTERVAL_MS = 300

export function useQrScanner({ enabled, onDetected }: UseQrScannerOptions): UseQrScannerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const handleDetected = useEffectEvent(onDetected)

  const stopScanner = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    detectorRef.current = null
  }

  useEffect(() => {
    if (!enabled) {
      stopScanner()
      setStatus('idle')
      setError(null)
      return
    }

    if (!('BarcodeDetector' in window)) {
      setStatus('unsupported')
      setError('Этот браузер не поддерживает распознавание QR через BarcodeDetector.')
      return
    }

    let isCancelled = false

    const startScanner = async () => {
      try {
        setStatus('starting')
        setError(null)

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        })

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        detectorRef.current = detector
        streamRef.current = stream

        const videoElement = videoRef.current

        if (!videoElement) {
          throw new Error('Не удалось инициализировать видеоэлемент для камеры.')
        }

        videoElement.srcObject = stream
        videoElement.setAttribute('playsinline', 'true')

        await videoElement.play()

        if (isCancelled) {
          return
        }

        setStatus('scanning')

        const queueScan = () => {
          timeoutRef.current = window.setTimeout(() => {
            void scanFrame()
          }, SCAN_INTERVAL_MS)
        }

        const scanFrame = async () => {
          const currentDetector = detectorRef.current
          const currentVideo = videoRef.current

          if (!currentDetector || !currentVideo || currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            queueScan()
            return
          }

          try {
            const barcodes = await currentDetector.detect(currentVideo)
            const qrCode = barcodes.find((barcode) => barcode.rawValue)

            if (qrCode?.rawValue) {
              handleDetected(qrCode.rawValue)
              return
            }
          } catch {
            setStatus('error')
            setError('Не удалось распознать QR-код. Попробуйте снова.')
            return
          }

          queueScan()
        }

        queueScan()
      } catch (scanError) {
        const nextError =
          scanError instanceof DOMException && scanError.name === 'NotAllowedError'
            ? 'Доступ к камере запрещён. Разрешите камеру в браузере и попробуйте снова.'
            : 'Не удалось открыть камеру. Проверьте доступ и попробуйте снова.'

        setStatus(
          scanError instanceof DOMException && scanError.name === 'NotAllowedError' ? 'denied' : 'error',
        )
        setError(nextError)
      }
    }

    void startScanner()

    return () => {
      isCancelled = true
      stopScanner()
    }
  }, [enabled])

  return {
    videoRef,
    status,
    error,
  }
}
