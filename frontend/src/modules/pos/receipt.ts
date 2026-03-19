import { API_URL } from '../../config/env'
import type { ReceiptOrderData } from './types'

export async function printReceipt(orderData: ReceiptOrderData) {
  try {
    const programName = (localStorage.getItem('programName') || 'Restoran Cheki').trim() || 'Restoran Cheki'

    const response = await fetch(`${API_URL}/cheque/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_data: orderData,
        program_name: programName,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('Error printing receipt:', error)
  }
}
