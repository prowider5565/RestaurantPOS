import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Box } from '@mui/material'
import { type ReactNode, useRef, useState } from 'react'

export default function SwipeToDeleteRow({
  children,
  onDelete,
}: {
  children: ReactNode
  onDelete: () => void
}) {
  const [translateX, setTranslateX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)
  const lastXRef = useRef(0)
  const hasMovedRef = useRef(false)

  const threshold = 110
  const clamp = (v: number) => Math.max(-160, Math.min(160, v))
  const progress = Math.min(1, Math.abs(translateX) / threshold)
  const leftActive = translateX > 0
  const rightActive = translateX < 0

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest('button, [role="button"], input, textarea, select, a')) return

    startXRef.current = e.clientX
    lastXRef.current = e.clientX
    hasMovedRef.current = false
    setDragging(true)
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    const dx = e.clientX - startXRef.current
    const step = e.clientX - lastXRef.current
    lastXRef.current = e.clientX
    if (!hasMovedRef.current && Math.abs(dx) > 8) hasMovedRef.current = true
    if (hasMovedRef.current && Math.abs(step) > 0) e.preventDefault()
    setTranslateX(clamp(dx))
  }

  function finish() {
    const shouldDelete = Math.abs(translateX) >= threshold
    setDragging(false)
    setTranslateX(0)
    if (shouldDelete) onDelete()
    window.setTimeout(() => {
      hasMovedRef.current = false
    }, 0)
  }

  return (
    <Box sx={{ position: 'relative', borderRadius: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'error.main',
          opacity: translateX === 0 ? 0 : 1,
          transition: 'opacity 180ms ease',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pointerEvents: 'none',
          color: 'common.white',
        }}
      >
        <Box
          sx={{
            opacity: leftActive ? progress : 0,
            transform: `scale(${0.85 + progress * 0.25})`,
            transition: dragging ? 'none' : 'opacity 180ms ease, transform 180ms ease',
          }}
        >
          <DeleteOutlineIcon />
        </Box>
        <Box
          sx={{
            opacity: rightActive ? progress : 0,
            transform: `scale(${0.85 + progress * 0.25})`,
            transition: dragging ? 'none' : 'opacity 180ms ease, transform 180ms ease',
          }}
        >
          <DeleteOutlineIcon />
        </Box>
      </Box>
      <Box
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={() => {
          setDragging(false)
          setTranslateX(0)
        }}
        onClickCapture={(e) => {
          if (!hasMovedRef.current) return
          e.preventDefault()
          e.stopPropagation()
        }}
        sx={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 180ms ease',
          touchAction: 'pan-y',
          bgcolor: 'background.paper',
          borderRadius: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
