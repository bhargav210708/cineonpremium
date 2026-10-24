declare module 'qrcode-generator' {
  interface QRCode { addData(data: string): void; make(): void; getModuleCount(): number; isDark(row: number, col: number): boolean; createDataURL(cellSize?: number, margin?: number): string; }
  export default function qrcode(typeNumber: number, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'): QRCode;
}
