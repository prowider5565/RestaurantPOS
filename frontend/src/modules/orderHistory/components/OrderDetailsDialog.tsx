import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, DialogContent, Divider, IconButton, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { API_URL } from '../../../config/env'
import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiOrderDetail } from '../types'
import { formatCreated, getOrderTotals, getTableTextColor, toOrderHistoryImageSrc } from '../utils'

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
        <Box>
          <Typography sx={{ fontWeight: 1000 }}>{order ? `Buyurtma #${order.id}` : 'Buyurtma'}</Typography>
          {order ? (
            <Typography variant="body2" color="text.secondary">
              ID {order.id} • {formatCreated(order.created_at)}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} aria-label="Yopish">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          {order?.order_table ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.25,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: order.order_table.table_color,
                color: getTableTextColor(order.order_table.table_color),
                fontWeight: 1000,
              }}
            >
              Stol {order.order_table.table_number}
            </Box>
          ) : (
            <Box />
          )}
          {totals.discountAmount > 0 ? (
            <Stack alignItems="flex-end" spacing={0} sx={{ lineHeight: 1.15 }}>
              <Typography sx={{ fontWeight: 900, textDecoration: 'line-through', color: 'text.secondary' }}>
                {formatMoney(totals.total)}
              </Typography>
              <Typography sx={{ fontWeight: 1000 }}>{formatMoney(totals.discountedTotal)}</Typography>
            </Stack>
          ) : (
            <Typography sx={{ fontWeight: 1000 }}>Jami: {formatMoney(totals.total)}</Typography>
          )}
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
