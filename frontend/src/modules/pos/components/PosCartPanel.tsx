import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Button, Divider, FormControl, IconButton, List, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import type { MutableRefObject } from 'react'

import { formatMoney } from '../../../shared/utils/formatters'
import type { ApiOrderTable, CartLine } from '../types'
import SwipeToDeleteRow from './SwipeToDeleteRow'

function getTableTextColor(color: string) {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return '#1F2937'

  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const brightness = red * 0.299 + green * 0.587 + blue * 0.114
  return brightness > 186 ? '#1F2937' : '#FFFFFF'
}

export default function PosCartPanel({
  cartCount,
  cartLines,
  cartItemsRef,
  isEditingTotal,
  discountDigits,
  discountedTotal,
  isPlacingOrder,
  orderTables,
  selectedOrderTableId,
  onClearCart,
  onSelectOrderTable,
  onOpenCreateTable,
  onSetQty,
  onToggleEditTotal,
  onDiscountDigitsChange,
  onPlaceOrder,
}: {
  cartCount: number
  cartLines: CartLine[]
  cartItemsRef: MutableRefObject<HTMLDivElement | null>
  isEditingTotal: boolean
  discountDigits: string
  discountedTotal: number
  isPlacingOrder: boolean
  orderTables: ApiOrderTable[]
  selectedOrderTableId: string
  onClearCart: () => void
  onSelectOrderTable: (value: string) => void
  onOpenCreateTable: () => void
  onSetQty: (productId: number, qty: number) => void
  onToggleEditTotal: () => void
  onDiscountDigitsChange: (value: string) => void
  onPlaceOrder: () => void
}) {
  const selectedTable = orderTables.find((table) => String(table.id) === selectedOrderTableId) ?? null

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'relative',
        borderRadius: 0,
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        alignSelf: 'stretch',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Savat</Typography>
        <IconButton aria-label="Buyurtmani tozalash" onClick={onClearCart} disabled={cartCount === 0}>
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider sx={{ my: 0.75 }} />

      <Box ref={cartItemsRef} sx={{ flex: 1, minHeight: 0, overflow: 'visible', position: 'relative' }}>
        <List dense disablePadding sx={{ height: '100%', overflow: 'auto' }}>
          {cartLines.length === 0 ? (
            <Box sx={{ py: 4.5, textAlign: 'center', color: 'text.secondary' }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Hali mahsulot yo'q</Typography>
              <Typography variant="body2" sx={{ fontSize: 12 }}>
                Buyurtmaga qo'shish uchun mahsulotni bosing.
              </Typography>
            </Box>
          ) : (
            cartLines.map((line) => (
              <SwipeToDeleteRow key={line.product.id} onDelete={() => onSetQty(line.product.id, 0)}>
                <Box
                  sx={{
                    px: 0,
                    py: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.9,
                  }}
                >
                  <Box
                    component="img"
                    src={line.product.imageSrc}
                    alt={line.product.name}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      objectFit: 'cover',
                      flex: '0 0 auto',
                    }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>
                      {line.product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: 12 }} noWrap>
                      {formatMoney(line.product.price * line.qty)}
                    </Typography>
                  </Box>

                  <Stack direction="row" alignItems="center" gap={0.5} sx={{ flex: '0 0 auto' }}>
                    <IconButton
                      size="small"
                      aria-label="Miqdorni kamaytirish"
                      onClick={() => onSetQty(line.product.id, line.qty - 1)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ width: 18, textAlign: 'center', fontWeight: 800, fontSize: 14 }}>
                      {line.qty}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label="Miqdorni oshirish"
                      onClick={() => onSetQty(line.product.id, line.qty + 1)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        bgcolor: 'action.hover',
                        '&:hover': { bgcolor: 'action.selected' },
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Stack>
                </Box>
              </SwipeToDeleteRow>
            ))
          )}
        </List>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Stack sx={{ mb: 1.5, mt: 'auto' }}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.25 }}>
          <FormControl fullWidth size="small">
            <Select
              displayEmpty
              value={selectedOrderTableId}
              onChange={(e) => onSelectOrderTable(String(e.target.value))}
              renderValue={() =>
                selectedTable ? (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: selectedTable.table_color,
                      color: getTableTextColor(selectedTable.table_color),
                      fontWeight: 900,
                    }}
                  >
                    Stol {selectedTable.table_number}
                  </Box>
                ) : (
                  <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 14 }}>
                    Stol tanlang
                  </Typography>
                )
              }
              sx={{
                '& .MuiSelect-select': {
                  py: 1,
                },
              }}
            >
              {orderTables.map((table) => (
                <MenuItem
                  key={table.id}
                  value={String(table.id)}
                  sx={{
                    bgcolor: table.table_color,
                    color: getTableTextColor(table.table_color),
                    fontWeight: 900,
                    borderRadius: 1,
                    mx: 0.5,
                    my: 0.25,
                  }}
                >
                  Stol {table.table_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Yangi stol qo'shish" placement="top">
            <IconButton
              aria-label="Yangi stol qo'shish"
              onClick={onOpenCreateTable}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                flex: '0 0 auto',
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {!selectedOrderTableId ? (
          <Typography sx={{ mb: 1, color: 'error.main', fontSize: 12, fontWeight: 700 }}>
            Buyurtma uchun stol tanlanishi shart.
          </Typography>
        ) : null}

        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography sx={{ fontWeight: 1000, fontSize: 17 }}>Jami</Typography>
          {isEditingTotal ? (
            <TextField
              value={discountDigits}
              onChange={(e) => onDiscountDigitsChange(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
              onBlur={onToggleEditTotal}
              autoFocus
              inputMode="numeric"
              size="small"
              variant="standard"
              sx={{
                width: 132,
                '& .MuiInputBase-input': {
                  p: 0,
                  textAlign: 'right',
                  fontWeight: 1100,
                  fontSize: 22,
                },
              }}
            />
          ) : (
            <Typography
              onClick={onToggleEditTotal}
              sx={{
                fontWeight: 1100,
                fontSize: 22,
                cursor: cartCount === 0 ? 'default' : 'pointer',
                userSelect: 'none',
                transition: 'color 140ms ease',
                ...(cartCount === 0
                  ? {}
                  : {
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }),
              }}
            >
              {formatMoney(discountedTotal)}
            </Typography>
          )}
        </Stack>
        {isEditingTotal ? (
          <Typography sx={{ mt: 0.5, textAlign: 'right', color: 'text.secondary', fontSize: 11, fontWeight: 700 }}>
            Chegirmali summa
          </Typography>
        ) : null}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr' },
          gap: 0.75,
        }}
      >
        <Button
          color="success"
          variant="contained"
          disabled={cartCount === 0 || isPlacingOrder || !selectedOrderTableId}
          onClick={onPlaceOrder}
          startIcon={<CheckCircleOutlineIcon />}
          sx={{ py: 1.5, borderRadius: 2, fontSize: 14 }}
          fullWidth
        >
          Tayyor
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={cartCount === 0 || isPlacingOrder}
          onClick={onClearCart}
          startIcon={<CloseIcon />}
          sx={{ py: 1.5, borderRadius: 2, fontSize: 14 }}
          fullWidth
        >
          Bekor qilish
        </Button>
      </Box>
    </Paper>
  )
}
