declare module '@point-of-sale/receipt-printer-encoder' {
  class ReceiptPrinterEncoder {
    initialize(): ReceiptPrinterEncoder
    text(text: string): ReceiptPrinterEncoder
    newline(): ReceiptPrinterEncoder
    cut(): ReceiptPrinterEncoder
    encode(): Uint8Array
  }
  export default ReceiptPrinterEncoder
}
