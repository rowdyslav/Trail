import { create } from 'zustand'

interface ScanUiState {
  isScanOpen: boolean
  isScanning: boolean
  openScan: () => void
  closeScan: () => void
  setScanning: (value: boolean) => void
}

export const useScanUiStore = create<ScanUiState>((set) => ({
  isScanOpen: false,
  isScanning: false,
  openScan: () => set({ isScanOpen: true }),
  closeScan: () => set({ isScanOpen: false, isScanning: false }),
  setScanning: (value) => set({ isScanning: value }),
}))
