import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Button, Divider, IconButton, List, Paper, Slide, Stack, TextField, Typography } from '@mui/material'
import type { MutableRefObject } from 'react'

import { formatMoney } from '../../../shared/utils/formatters'
import type { CartLine } from '../types'
import { formatIntegerForInput } from '../utils'
import SwipeToDeleteRow from './SwipeToDeleteRow'

export default function PosCartPanel({
  cartCount,
  cartLines,
  cartItemsRef,
  isEditingTotal,
  discountDigits,
  discountedTotal,
  isPlacingOrder,
  onClearCart,
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
  onClearCart: () => void
  onSetQty: (productId: number, qty: number) => void
  onToggleEditTotal: () => void
  onDiscountDigitsChange: (value: string) => void
  onPlaceOrder: () => void
}) {
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
        <Slide
          in={isEditingTotal}
          direction="up"
          container={cartItemsRef.current}
          mountOnEnter
          unmountOnExit
          timeout={180}
        >
          <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 5 }}>
            <Paper
              variant="outlined"
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: '0 14px 30px rgba(0,0,0,0.08)',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Typography sx={{ fontWeight: 1000, fontSize: 18, lineHeight: 1.1, textAlign: 'center' }}>
                {formatIntegerForInput(discountDigits) || '0'}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11, mt: 0.5, textAlign: 'center' }}>
                Chegirmali summa
              </Typography>
              <TextField
                value={discountDigits}
                onChange={(e) => onDiscountDigitsChange(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
                inputMode="numeric"
                fullWidth
                size="small"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Box>
        </Slide>
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
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography sx={{ fontWeight: 1000, fontSize: 17 }}>Jami</Typography>
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
        </Stack>
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
          disabled={cartCount === 0 || isPlacingOrder}
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
