import CreditCardIcon from '@mui/icons-material/CreditCard'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, DialogContent, Divider, IconButton, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { API_URL } from '../../../config/env'
import { DEFAULT_PRODUCT_IMAGE_SRC } from '../../../shared/utils/images'
import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiOrderDetail } from '../types'
import { formatCreated, getOrderTotals, toOrderHistoryImageSrc } from '../utils'

export default function OrderDetailsDialog({
  open,
  orderId,
  onClose,
}: {
  open: boolean
  orderId: number | null
  onClose: () => void
}) {
  const [order, setOrder] = useState<ApiOrderDetail | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadOrder() {
      if (!open || !orderId) return
      setOrder(null)

      const response = await fetch(`${API_URL}/orders/${orderId}`)
      if (!response.ok) return
      const data = (await response.json()) as ApiOrderDetail
      if (!cancelled) setOrder(data)
    }

    loadOrder()
    return () => {
      cancelled = true
    }
  }, [open, orderId])

  if (!open) return null

  const totals = order ? getOrderTotals(order) : { total: 0, discountAmount: 0, discountedTotal: 0 }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Typography sx={{ fontWeight: 1000 }}>{order ? `Buyurtma #${order.id}` : 'Buyurtma'}</Typography>
        <IconButton onClick={onClose} aria-label="Yopish">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {order ? (
          <Stack sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Sana:</Typography>
              <Typography variant="body2">{formatCreated(order.created_at)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">To'lov turi:</Typography>
              {order.payment_type === 'Naqd' ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="body2">Naqd</Typography>
                  <LocalAtmIcon fontSize="small" color="action" />
                </Stack>
              ) : order.payment_type === 'Karta' ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="body2">Karta</Typography>
                  <CreditCardIcon fontSize="small" color="action" />
                </Stack>
              ) : (
                <Typography variant="body2">{order.payment_type ?? '-'}</Typography>
              )}
            </Stack>
          </Stack>
        ) : null}

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack spacing={0.25}>
            {totals.discountAmount > 0 ? (
              <Typography variant="body2" color="error" sx={{ fontWeight: 700 }}>
                Chegirma: -{formatMoney(totals.discountAmount)}
              </Typography>
            ) : null}
          </Stack>
          <Stack direction="row" alignItems="center" gap={1}>
            {totals.discountAmount > 0 ? (
              <>
                <Typography sx={{ fontWeight: 900, textDecoration: 'line-through', color: 'text.secondary' }}>
                  {formatMoney(totals.total)}
                </Typography>
                <Typography sx={{ fontWeight: 1000 }}>{formatMoney(totals.discountedTotal)}</Typography>
              </>
            ) : (
              <Typography sx={{ fontWeight: 1000 }}>Jami: {formatMoney(totals.discountedTotal)}</Typography>
            )}
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 2 }}>
          <List dense disablePadding>
            {(order?.items ?? []).map((item) => {
              const lineTotal = item.product.price * item.quantity
              return (
                <ListItem key={`${order?.id ?? 'o'}-${item.product.id}`} divider sx={{ py: 1.25 }}>
                  <Box
                    component="img"
                    src={toOrderHistoryImageSrc(item.product.image_path ?? null)}
                    alt={item.product.name}
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith(DEFAULT_PRODUCT_IMAGE_SRC)) return
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE_SRC
                    }}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: 'divider',
                      objectFit: 'cover',
                      bgcolor: 'background.paper',
                      mr: 1.5,
                      flex: '0 0 auto',
                    }}
                  />
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 900 }}>{item.product.name}</Typography>}
                    secondary={`× ${item.quantity} • ${formatMoney(item.product.price)}`}
                  />
                  <Typography sx={{ fontWeight: 1000 }}>{formatMoney(lineTotal)}</Typography>
                </ListItem>
              )
            })}
          </List>
        </Paper>
      </DialogContent>
    </Dialog>
  )
}
