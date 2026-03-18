import { API_URL } from '../../config/env'
import type { ReceiptOrderData } from './types'
import { centerText, wrapText } from './utils'

export async function generateReceipt(orderData: ReceiptOrderData): Promise<string> {
  const tableWidth = 48
  const idWidth = 3
  const nameWidth = 20
  const qtyWidth = 4
  const priceWidth = 8
  const subtotalWidth = 7

  const programName = (localStorage.getItem('programName') || 'Restoran Cheki').trim() || 'Restoran Cheki'

  let requisites: any = null
  try {
    const res = await fetch(`${API_URL}/cheque/requisites`)
    if (res.ok) requisites = await res.json()
  } catch {}

  const lines: string[] = []

  function buildRow(cols: string[]) {
    return (
      '|' +
      cols[0].padEnd(idWidth) + '|' +
      cols[1].padEnd(nameWidth) + '|' +
      cols[2].padEnd(qtyWidth) + '|' +
      cols[3].padEnd(priceWidth) + '|' +
      cols[4].padEnd(subtotalWidth) +
      '|'
    )
  }

  function formatNumberPlain(n: number) {
    return String(Math.round(n))
  }

  function separator() {
    return '-'.repeat(tableWidth)
  }

  function safeLine(text: string) {
    return text.length > tableWidth ? text.slice(0, tableWidth) : text.padEnd(tableWidth)
  }

  function pushRight(label: string, value: string) {
    if (!value) return
    const combined = `${label} ${value}`
    if (combined.length <= tableWidth) {
      lines.push(label.padEnd(tableWidth - value.length) + value)
    } else {
      const wrapped = wrapText(combined, tableWidth)
      for (const line of wrapped) lines.push(line)
    }
  }

  const today = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  lines.push(safeLine('Sana: '.padEnd(tableWidth - today.length) + today))
  lines.push(safeLine('Ism: '.padEnd(tableWidth - orderData.user.username.length) + orderData.user.username))
  lines.push(safeLine('Lavozimi: '.padEnd(tableWidth - (orderData.user.position || '-').length) + (orderData.user.position || '-')))
  lines.push('')
  lines.push(separator())
  lines.push('|' + centerText(programName, tableWidth - 2) + '|')
  lines.push(separator())

  const dt = new Date(orderData.created_at)
  if (!Number.isNaN(dt.getTime())) {
    const dateStr = dt.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    lines.push('|' + centerText(dateStr, tableWidth - 2) + '|')
    lines.push(separator())
  }

  lines.push(buildRow(['ID', 'Nomi', 'Soni', 'Narx', 'Jami']))
  lines.push(separator())

  let totalAmount = 0
  for (const item of orderData.items) {
    const nameLines = wrapText(item.product.name, nameWidth)
    const qty = String(item.quantity)
    const price = formatNumberPlain(item.product.price)
    const subtotal = formatNumberPlain(item.quantity * item.product.price)

    totalAmount += item.quantity * item.product.price
    lines.push(buildRow([String(item.product.id), nameLines[0], qty, price, subtotal]))

    for (let i = 1; i < nameLines.length; i += 1) {
      lines.push(buildRow(['', nameLines[i], '', '', '']))
    }
  }

  lines.push(separator())

  const originalTotal = Math.round(orderData.total_price ?? totalAmount)
  const discountAmount = Math.max(0, Number(orderData.discount_amount ?? 0) || 0)
  const discountedTotal = Math.max(0, originalTotal - discountAmount)

  lines.push('|' + `Umumiy Summa: ${formatNumberPlain(originalTotal)} so'm`.padEnd(tableWidth - 2) + '|')
  lines.push('|' + `Chegirmali Summa: ${formatNumberPlain(discountedTotal)} so'm`.padEnd(tableWidth - 2) + '|')
  lines.push(separator())

  const req = requisites || {}
  const companyName = req.company_name?.trim() || ''
  const address = req.address?.trim() || ''
  const phone = req.phone_number?.trim() || ''
  const stir = (req.STIR ?? req.stir ?? '').toString().trim()
  const registry = (req.registry_number ?? '').toString().trim()

  if (companyName) {
    for (const line of wrapText(companyName, tableWidth)) {
      lines.push(line.padStart(tableWidth))
    }
  }

  pushRight('STIR:', stir)
  pushRight('Telefon:', phone)
  pushRight('Reestr Raqami:', registry)

  if (address) {
    for (const line of wrapText(address, tableWidth)) {
      lines.push(line)
    }
  }

  lines.push('')
  lines.push('')
  lines.push(centerText('Tashrifingizdan mamnunmiz!', tableWidth))

  return lines.join('\n')
}

export async function printReceipt(receiptContent: string) {
  try {
    const response = await fetch(`${API_URL}/cheque/print?content=${encodeURIComponent(receiptContent)}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('Error printing receipt:', error)
  }
}
