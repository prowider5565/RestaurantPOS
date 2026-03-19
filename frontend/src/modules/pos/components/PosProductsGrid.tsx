import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import { Box, Card, CardActionArea, Paper, Stack, Typography } from '@mui/material'
import { memo, type MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'

import { formatMoney } from '../../../shared/utils/formatters'
import type { UiProduct } from '../types'

const CARD_HEIGHT = 100
const MOBILE_GAP = 16
const DESKTOP_GAP = 10
const OVERSCAN_ROWS = 2

function getColumnCount(width: number) {
  if (width >= 900) return 4
  if (width >= 600) return 2
  return 1
}

const ProductCard = memo(function ProductCard({
  product,
  width,
  onAddToCart,
  onBeginLongPress,
  onCancelLongPress,
  longPressFiredRef,
}: {
  product: UiProduct
  width?: number
  onAddToCart: (product: UiProduct) => void
  onBeginLongPress: (product: UiProduct, left: number, top: number) => void
  onCancelLongPress: () => void
  longPressFiredRef: MutableRefObject<boolean>
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        width: width ?? '100%',
        height: CARD_HEIGHT,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
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
        sx={{ height: '100%', position: 'relative' }}
      >
        <Box
          component="img"
          src={product.imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          sx={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
          }}
        />

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
      </CardActionArea>
    </Card>
  )
})

function PosProductsGrid({
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateSize = () => {
      setContainerWidth(node.clientWidth)
      setContainerHeight(node.clientHeight)
    }

    updateSize()

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const columnCount = getColumnCount(containerWidth)
  const gap = columnCount === 4 ? DESKTOP_GAP : MOBILE_GAP
  const itemWidth = containerWidth > 0 ? (containerWidth - gap * (columnCount - 1)) / columnCount : 0
  const rowStride = CARD_HEIGHT + gap
  const totalRows = Math.ceil(visibleProducts.length / columnCount)
  const totalHeight = totalRows > 0 ? totalRows * rowStride - gap : 0
  const startRow = Math.max(0, Math.floor(scrollTop / rowStride) - OVERSCAN_ROWS)
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowStride) + OVERSCAN_ROWS)

  const virtualItems = useMemo(() => {
    const items: Array<{ product: UiProduct; top: number; left: number }> = []

    for (let row = startRow; row < endRow; row += 1) {
      for (let column = 0; column < columnCount; column += 1) {
        const index = row * columnCount + column
        const product = visibleProducts[index]
        if (!product) continue

        items.push({
          product,
          top: row * rowStride,
          left: column * (itemWidth + gap),
        })
      }
    }

    return items
  }, [columnCount, endRow, gap, itemWidth, rowStride, startRow, visibleProducts])

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

  if (containerWidth <= 0 || containerHeight <= 0) {
    return (
      <Box
        ref={containerRef}
        sx={{
          minHeight: 0,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: { xs: 0, md: 0.5 },
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
          gap: { xs: 2, md: 1.25 },
        }}
      >
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onBeginLongPress={onBeginLongPress}
            onCancelLongPress={onCancelLongPress}
            longPressFiredRef={longPressFiredRef}
          />
        ))}
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      sx={{
        position: 'relative',
        minHeight: 0,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        pr: { xs: 0, md: 0.5 },
      }}
    >
      <Box sx={{ position: 'relative', height: totalHeight }}>
        {virtualItems.map((item) => (
          <Box
            key={item.product.id}
            sx={{
              position: 'absolute',
              top: item.top,
              left: item.left,
            }}
          >
            <ProductCard
              product={item.product}
              width={itemWidth}
              onAddToCart={onAddToCart}
              onBeginLongPress={onBeginLongPress}
              onCancelLongPress={onCancelLongPress}
              longPressFiredRef={longPressFiredRef}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default memo(PosProductsGrid)
