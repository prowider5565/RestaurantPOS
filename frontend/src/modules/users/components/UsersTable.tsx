import { Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Pagination } from '@mui/material'

import type { ApiUser } from '../types'

export default function UsersTable({
  loading,
  error,
  rows,
  page,
  pages,
  onRetry,
  onPageChange,
  onEdit,
  onToggleActive,
}: {
  loading: boolean
  error: string | null
  rows: ApiUser[]
  page: number
  pages: number
  onRetry: () => void
  onPageChange: (page: number) => void
  onEdit: (user: ApiUser) => void
  onToggleActive: (user: ApiUser) => void
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6, flex: 1 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
        <Stack gap={1}>
          <Typography sx={{ fontWeight: 900 }}>Foydalanuvchilar yuklanmadi</Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
          <Button onClick={onRetry} variant="contained" color="primary" size="large">
            Qayta urinish
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 1,
          overflow: 'auto',
          width: '100%',
          maxHeight: { xs: 'calc(100dvh - 260px)', sm: 'calc(100dvh - 240px)', md: 'calc(100dvh - 280px)', lg: 'calc(100dvh - 240px)' },
          '@media (min-width:900px) and (max-width:1199.95px) and (max-height:768px)': {
            maxHeight: 560,
          },
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            '& .MuiTableCell-root': {
              fontSize: '0.9em',
              py: 1.1,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 900 }}>Foydalanuvchi</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Lavozim</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Holat</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">
                Amallar
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ fontWeight: 1000 }}>{user.username}</TableCell>
                <TableCell>{user.position ?? '-'}</TableCell>
                <TableCell>
                  {user.is_admin ? <Chip label="Admin" color="warning" size="small" /> : <Chip label="Foydalanuvchi" size="small" />}
                </TableCell>
                <TableCell>
                  {user.is_active === false ? <Chip label="Faol emas" color="error" size="small" /> : <Chip label="Faol" color="success" size="small" />}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" gap={1} justifyContent="flex-end">
                    <Button variant="outlined" size="small" sx={{ minWidth: 120 }} onClick={() => onEdit(user)}>
                      Tahrirlash
                    </Button>
                    <Button
                      variant="contained"
                      color={user.is_active === false ? 'success' : 'error'}
                      size="small"
                      sx={{ minWidth: 140 }}
                      onClick={() => onToggleActive(user)}
                    >
                      {user.is_active === false ? 'Faollashtirish' : 'Faolsizlantirish'}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pages > 1 ? (
        <Stack direction="row" justifyContent="flex-end">
          <Pagination
            color="primary"
            size="large"
            page={page}
            count={pages}
            onChange={(_, next) => onPageChange(next)}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '1.4em',
                minWidth: 45,
                height: 45,
              },
            }}
          />
        </Stack>
      ) : null}
    </>
  )
}
