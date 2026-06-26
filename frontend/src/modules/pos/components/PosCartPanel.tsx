import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import RemoveIcon from '@mui/icons-material/Remove'
import { Box, Button, ButtonBase, Divider, IconButton, List, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import type { MutableRefObject } from 'react'

import { formatMoney } from '../../../shared/utils/formatters'
import type { CartLine, PaymentType } from '../types'
import { DEFAULT_PRODUCT_IMAGE_SRC } from '../utils'
import SwipeToDeleteRow from './SwipeToDeleteRow'

function BarSwitch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Stack spacing={0.45} sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 900, fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <ButtonBase
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        sx={{
          position: 'relative',
          width: '100%',
          height: 42,
          borderRadius: 1,
          border: '1px solid',
          borderColor: checked ? 'primary.main' : 'divider',
          bgcolor: checked ? 'rgba(249, 115, 22, 0.08)' : 'background.paper',
          overflow: 'hidden',
          transition: 'border-color 140ms ease, background-color 140ms ease',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: checked ? 'calc(50% + 2px)' : 4,
            width: 'calc(50% - 6px)',
            borderRadius: 0.75,
            bgcolor: checked ? 'primary.main' : 'action.selected',
            transition: 'left 160ms ease, background-color 140ms ease',
          }}
        />
        <Stack direction="row" sx={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
          <Box
            sx={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 1000,
              fontSize: 12,
              color: checked ? 'text.secondary' : 'text.primary',
            }}
          >
            OFF
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 1000,
              fontSize: 12,
              color: checked ? 'common.white' : 'text.secondary',
            }}
          >
            ON
          </Box>
        </Stack>
      </ButtonBase>
    </Stack>
  )
}

export default function PosCartPanel({
  cartCount,
  cartLines,
  cartItemsRef,
  isEditingTotal,
  discountDigits,
  discountedTotal,
  isDebt,
  debtPaidAmountDigits,
  paymentType,
  isPlacingOrder,
  onClearCart,
  onSetQty,
  onToggleEditTotal,
  onDiscountDigitsChange,
  onIsDebtChange,
  onDebtPaidAmountDigitsChange,
  onPaymentTypeChange,
  onPlaceOrder,
}: {
  cartCount: number
  cartLines: CartLine[]
  cartItemsRef: MutableRefObject<HTMLDivElement | null>
  isEditingTotal: boolean
  discountDigits: string
  discountedTotal: number
  isDebt: boolean
  debtPaidAmountDigits: string
  paymentType: PaymentType
  isPlacingOrder: boolean
  onClearCart: () => void
  onSetQty: (productId: number, qty: number) => void
  onToggleEditTotal: () => void
  onDiscountDigitsChange: (value: string) => void
  onIsDebtChange: (value: boolean) => void
  onDebtPaidAmountDigitsChange: (value: string) => void
  onPaymentTypeChange: (value: PaymentType) => void
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
                    onError={(e) => {
                      if (e.currentTarget.src.endsWith(DEFAULT_PRODUCT_IMAGE_SRC)) return
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE_SRC
                    }}
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
        <Tabs
          value={paymentType}
          onChange={(_, value: PaymentType) => onPaymentTypeChange(value)}
          variant="fullWidth"
          sx={{
            mb: 0.75,
            minHeight: 40,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            '& .MuiTabs-indicator': {
              height: '100%',
              borderRadius: 1.5,
              bgcolor: 'rgba(249, 115, 22, 0.14)',
            },
            '& .MuiTab-root': {
              minHeight: 40,
              fontWeight: 900,
              textTransform: 'none',
            },
          }}
        >
          <Tab value="Karta" label="Karta" />
          <Tab value="Naqd" label="Naqd" />
        </Tabs>

        <Stack direction="row" gap={1} sx={{ mb: isDebt ? 1 : 0.5 }}>
          <BarSwitch label="Nasiya" checked={isDebt} onChange={onIsDebtChange} />
        </Stack>

        {isDebt ? (
          <TextField
            label="To'langan summa"
            value={debtPaidAmountDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            onChange={(e) => onDebtPaidAmountDigitsChange(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
            inputMode="numeric"
            fullWidth
            size="small"
            sx={{ mb: 1 }}
          />
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
