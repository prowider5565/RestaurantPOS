import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import { Box, Card, CardActionArea, Paper, Stack, Typography } from '@mui/material'
import { type MutableRefObject } from 'react'

import { formatMoney } from '../../../shared/utils/formatters'
import type { UiProduct } from '../types'

export default function PosProductsGrid({
  visibleProducts,
  onAddToCart,
  onBeginLongPress,
  onCancelLongPress,
  longPressFiredRef,
}: {
  visibleProducts: UiProduct[]
  onAddToCart: (product: UiProduct) => void
  onBeginLongPress: (product: UiProduct, left: number, top: number) => void
  onCancelLongPress: () => void
  longPressFiredRef: MutableRefObject<boolean>
}) {
  if (visibleProducts.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          height: { md: '100%' },
          minHeight: { xs: 320, lg: '100%' },
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          color: 'text.secondary',
          p: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={1} alignItems="center">
          <RestaurantMenuIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography sx={{ fontWeight: 1000, color: 'text.primary', fontSize: 20 }}>Hali mahsulot yo'q</Typography>
          <Typography variant="body2">Pastki paneldagi <b>+</b> tugmasi orqali taom va ichimlik qo'shing.</Typography>
        </Stack>
      </Paper>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: 2, md: 1.25 },
      }}
    >
      {visibleProducts.map((product) => (
        <Card key={product.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <CardActionArea
            onClick={(e) => {
              if (longPressFiredRef.current) {
                longPressFiredRef.current = false
                e.preventDefault()
                e.stopPropagation()
                return
              }
              onAddToCart(product)
            }}
            onMouseDown={(e) => onBeginLongPress(product, e.clientX, e.clientY)}
            onMouseUp={onCancelLongPress}
            onMouseLeave={onCancelLongPress}
            onTouchStart={(e) => {
              const touch = e.touches[0]
              if (!touch) return
              onBeginLongPress(product, touch.clientX, touch.clientY)
            }}
            onTouchEnd={onCancelLongPress}
            onTouchCancel={onCancelLongPress}
            onTouchMove={onCancelLongPress}
            sx={{ height: '100%' }}
          >
            <Box
              sx={{
                position: 'relative',
                height: 100,
                backgroundImage: `url("${product.imageSrc}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              role="img"
              aria-label={product.name}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%)',
                }}
              />

              <Box sx={{ position: 'absolute', left: 8, right: 8, bottom: 8, color: 'common.white' }}>
                <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.1 }} noWrap>
                  {product.name}
                </Typography>
                <Typography sx={{ opacity: 0.95, fontWeight: 900, fontSize: 24, lineHeight: 1.05 }}>
                  {formatMoney(product.price)}
                </Typography>
              </Box>
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  )
}
