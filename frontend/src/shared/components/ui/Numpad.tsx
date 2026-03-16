import { Box, Button } from '@mui/material'

export default function Numpad({
  onDigit,
  onClear,
  onBackspace,
}: {
  onDigit: (digit: string) => void
  onClear: () => void
  onBackspace: () => void
}) {
  return (
    <Box
      sx={{
        pt: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
      }}
    >
      <Button variant="outlined" onClick={() => onDigit('1')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        1
      </Button>
      <Button variant="outlined" onClick={() => onDigit('2')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        2
      </Button>
      <Button variant="outlined" onClick={() => onDigit('3')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        3
      </Button>
      <Button variant="outlined" onClick={() => onDigit('4')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        4
      </Button>
      <Button variant="outlined" onClick={() => onDigit('5')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        5
      </Button>
      <Button variant="outlined" onClick={() => onDigit('6')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        6
      </Button>
      <Button variant="outlined" onClick={() => onDigit('7')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        7
      </Button>
      <Button variant="outlined" onClick={() => onDigit('8')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        8
      </Button>
      <Button variant="outlined" onClick={() => onDigit('9')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        9
      </Button>
      <Button variant="outlined" onClick={onClear} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        C
      </Button>
      <Button variant="outlined" onClick={() => onDigit('0')} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        0
      </Button>
      <Button variant="outlined" onClick={onBackspace} sx={{ py: 1.4, borderRadius: 2, fontSize: 18 }}>
        Del
      </Button>
    </Box>
  )
}

