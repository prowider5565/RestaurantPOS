import { Box, Paper, Typography } from '@mui/material'
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
        mb: 1.25,
        overflowX: 'auto',
        pb: 0.25,
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        WebkitOverflowScrolling: 'touch',
        flex: '0 0 auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      {categories.map((category) => {
        const selected = category.id === selectedCategoryId
        return (
          <Paper
            key={category.id}
            onClick={() => onSelect(category.id)}
            variant="outlined"
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              flex: '0 0 auto',
              minWidth: 108,
              minHeight: 36,
              px: 1.5,
              py: 0.65,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: selected ? 'primary.main' : 'divider',
              boxShadow: 'none',
              bgcolor: selected ? 'rgba(255, 152, 0, 0.08)' : 'background.paper',
              transition: 'border-color 140ms ease, background-color 140ms ease',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: selected ? 1000 : 800,
                lineHeight: 1.2,
                fontSize: 13,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {category.label}
            </Typography>
          </Paper>
        )
      })}
    </Box>
  )
}
