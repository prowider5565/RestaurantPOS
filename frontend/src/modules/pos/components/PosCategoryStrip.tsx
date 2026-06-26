import { Box, Typography } from '@mui/material'
import type { Category } from '../types'

export default function PosCategoryStrip({
  categories,
  selectedCategoryId,
  onSelect,
}: {
  categories: Category[]
  selectedCategoryId: string
  onSelect: (categoryId: string) => void
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        flex: '0 0 auto',
        scrollbarWidth: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {categories.map((category, idx) => {
        const selected = category.id === selectedCategoryId
        return (
          <Box
            key={category.id}
            onClick={() => onSelect(category.id)}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              py: 1.25,
              bgcolor: selected ? 'rgba(255, 152, 0, 0.12)' : 'transparent',
              borderRight: idx < categories.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              transition: 'background-color 140ms ease',
              '&:hover': {
                bgcolor: selected ? 'rgba(255, 152, 0, 0.18)' : 'action.hover',
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: selected ? 1000 : 800,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {category.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
