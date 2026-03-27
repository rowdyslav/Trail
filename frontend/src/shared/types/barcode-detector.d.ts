interface DetectedBarcode {
  rawValue?: string
}

interface BarcodeDetectorOptions {
  formats?: string[]
}

interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>
}

interface BarcodeDetectorConstructor {
  new (options?: BarcodeDetectorOptions): BarcodeDetector
}

interface Window {
  BarcodeDetector: BarcodeDetectorConstructor
}
