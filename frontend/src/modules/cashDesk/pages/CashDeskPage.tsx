import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import SettingsIcon from '@mui/icons-material/Settings'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
    AppBar,
    Box,
    Button,
    Card,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Toolbar,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { API_URL } from '../../../config/env'
import { getAuthHeaders, logout } from '../../../shared/auth'
import { useAuth } from '../../../shared/authContext'

type ApiUser = {
    id: number
    username: string
    position?: string | null
}

type ApiCashDeskTransaction = {
    id: number
    amount: number
    transaction_type: 'in' | 'out'
    user_id: number
    user: ApiUser
    created_at: string
}

type ApiDeleteOut = {
    message: string
}

type ApiPage<T> = { items: T[]; total: number; page: number; size: number; pages: number }

type CashDeskSummary = {
    current_amount: number
    total_order_income: number
    total_misc_income: number
    total_expense: number
}

function toYmd(d: Date) {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

export default function CashDeskPage() {
    const { me } = useAuth()
    const isAdmin = me?.is_admin === true || me?.is_admin === 1

    const [summary, setSummary] = useState<CashDeskSummary | null>(null)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryError, setSummaryError] = useState<string | null>(null)

    const [txPage, setTxPage] = useState<ApiPage<ApiCashDeskTransaction> | null>(null)

    const [preset, setPreset] = useState<'daily' | 'weekly' | 'monthly' | null>(null)
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [createAmount, setCreateAmount] = useState<string>('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [size] = useState(10)
    const [reloadKey, setReloadKey] = useState(0)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ApiCashDeskTransaction | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    function formatMoney(value: number) {
        return `${new Intl.NumberFormat('uz-UZ').format(Math.round(value))} so'm`
    }

    function applyPreset(next: 'daily' | 'weekly' | 'monthly' | null) {
        setPreset(next)
        if (!next) return
        const end = new Date()
        const start = new Date()
        if (next === 'daily') start.setDate(end.getDate())
        if (next === 'weekly') start.setDate(end.getDate() - 6)
        if (next === 'monthly') start.setDate(end.getDate() - 29)
        setFromDate(toYmd(start))
        setToDate(toYmd(end))
        setPage(1)
    }

    function exportSnapshot() {
        // Backend-driven export will be wired here.
    }

    useEffect(() => {
        let cancelled = false

        async function loadSummary() {
            setSummaryLoading(true)
            setSummaryError(null)
            try {
                const res = await fetch(`${API_URL}/cash-desk/summary`)
                if (!res.ok) {
                    const msg = (await res.json().catch(() => null)) as { detail?: string } | null
                    throw new Error(msg?.detail || `Hisobotni yuklab bo'lmadi (${res.status})`)
                }
                const data = (await res.json()) as CashDeskSummary
                if (cancelled) return
                setSummary(data)
            } catch (e) {
                if (cancelled) return
                setSummary(null)
                setSummaryError(e instanceof Error ? e.message : "Hisobotni yuklab bo'lmadi")
            } finally {
                if (!cancelled) setSummaryLoading(false)
            }
        }

        loadSummary()
        return () => {
            cancelled = true
        }
    }, [reloadKey])

    useEffect(() => {
        let cancelled = false

        async function loadTransactions() {
            try {
                const params = new URLSearchParams()
                params.set('page', String(page))
                params.set('size', String(size))
                if (fromDate) params.set('from_date', fromDate)
                if (toDate) params.set('to_date', toDate)
                const res = await fetch(`${API_URL}/cash-desk/transactions?${params.toString()}`, {
                    headers: getAuthHeaders(),
                })
                if (!res.ok) {
                    const msg = (await res.json().catch(() => null)) as { detail?: string } | null
                    throw new Error(msg?.detail || `Tranzaksiyalarni yuklab bo'lmadi (${res.status})`)
                }
                const data = (await res.json()) as ApiPage<ApiCashDeskTransaction>
                if (cancelled) return
                setTxPage(data)
                if (data.pages && page > data.pages) setPage(data.pages)
            } catch (e) {
                if (cancelled) return
                setTxPage(null)
            }
        }

        loadTransactions()
        return () => {
            cancelled = true
        }
    }, [fromDate, page, reloadKey, size, toDate])

    const createAmountInt = useMemo(() => {
        const n = Number(createAmount)
        if (!Number.isFinite(n)) return null
        const i = Math.floor(n)
        if (i <= 0) return null
        return i
    }, [createAmount])

    async function createTransaction(transaction_type: 'in' | 'out') {
        if (creating) return
        if (!createAmountInt) return
        setCreating(true)
        setCreateError(null)
        try {
            const res = await fetch(`${API_URL}/cash-desk/transactions`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: createAmountInt, transaction_type }),
            })
            if (!res.ok) {
                const msg = (await res.json().catch(() => null)) as { detail?: string } | null
                throw new Error(msg?.detail || `Tranzaksiyani yaratib bo'lmadi (${res.status})`)
            }
            await res.json().catch(() => null)
            setCreateAmount('')
            setPage(1)
            setReloadKey((v) => v + 1)
        } catch (e) {
            setCreateError(e instanceof Error ? e.message : "Tranzaksiyani yaratib bo'lmadi")
        } finally {
            setCreating(false)
        }
    }

    function requestDeleteTransactionRow(tx: ApiCashDeskTransaction) {
        if (!isAdmin) return
        setDeleteError(null)
        setDeleteTarget(tx)
        setDeleteOpen(true)
    }

    function closeDelete() {
        if (deleting) return
        setDeleteOpen(false)
    }

    async function confirmDelete() {
        if (!deleteTarget || deleting) return
        setDeleting(true)
        setDeleteError(null)
        try {
            const res = await fetch(`${API_URL}/cash-desk/transactions/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            })
            if (!res.ok) {
                const msg = (await res.json().catch(() => null)) as { detail?: string } | null
                throw new Error(msg?.detail || `Tranzaksiyani o'chirib bo'lmadi (${res.status})`)
            }
            await res.json().catch(() => null as ApiDeleteOut | null)
            setDeleteOpen(false)
            setReloadKey((v) => v + 1)
        } catch (e) {
            setDeleteError(e instanceof Error ? e.message : "Tranzaksiyani o'chirib bo'lmadi")
        } finally {
            setDeleting(false)
        }
    }

    const pages = txPage?.pages ?? 1
    const pagedTransactions = txPage?.items ?? []
    const safeSummary: CashDeskSummary = summary ?? {
        current_amount: 0,
        total_order_income: 0,
        total_misc_income: 0,
        total_expense: 0,
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                <Toolbar sx={{ gap: 2 }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 220 }}>
                        <RestaurantMenuIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            Parhez Plyus
                        </Typography>
                    </Stack>

                    <Box sx={{ flex: 1 }} />

                    <Stack direction="row" alignItems="center" gap={1}>
                        <Tooltip title="Sozlamalar" placement="bottom">
                            <IconButton
                                aria-label="Sozlamalar"
                                onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: 'settings' }))}
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Chiqish" placement="bottom">
                            <IconButton
                                aria-label="Chiqish"
                                onClick={() => logout()}
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        borderColor: 'error.main',
                                        color: 'error.main',
                                        bgcolor: 'rgba(211, 47, 47, 0.06)',
                                    },
                                }}
                            >
                                <LogoutIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    p: 2,
                    pb: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    flex: 1,
                    height: { xs: 'calc(100dvh - 56px)', sm: 'calc(100dvh - 64px)' },
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: '1fr 570px' },
                        gap: 2,
                        alignItems: { xs: 'start', lg: 'stretch' },
                        flex: 1,
                        minHeight: 0,
                        overflow: { xs: 'visible', lg: 'hidden' },
                    }}
                >
                    {/* Table on the left */}
                    <Box
                        sx={{
                            minHeight: 0,
                            height: { lg: '100%' },
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                                <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={exportSnapshot}>
                                    Hisobotni eksport qilish
                                </Button>
                            </Stack>

                            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
                                <ToggleButtonGroup
                                    exclusive
                                    value={preset}
                                    onChange={(_, next) => applyPreset(next)}
                                    size="small"
                                    aria-label="Sana oraliqlari"
                                >
                                    <ToggleButton value="daily">Kunlik</ToggleButton>
                                    <ToggleButton value="weekly">Haftalik</ToggleButton>
                                    <ToggleButton value="monthly">Oylik</ToggleButton>
                                </ToggleButtonGroup>

                                <TextField
                                    size="small"
                                    type="date"
                                    label="Boshlanish"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setPreset(null)
                                        setFromDate(e.target.value)
                                        setPage(1)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Tugash"
                                    value={toDate}
                                    onChange={(e) => {
                                        setPreset(null)
                                        setToDate(e.target.value)
                                        setPage(1)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </Stack>

                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ borderRadius: 3, flex: 1, minHeight: 0, overflow: 'auto' }}
                        >
                            <Table
                                size="small"
                                stickyHeader
                                sx={{
                                    '& .MuiTableCell-root': {
                                        fontSize: '1.3em',
                                        py: 1.1,
                                    },
                                }}
                            >
	                                <TableHead>
	                                    <TableRow sx={{ bgcolor: 'background.default' }}>
	                                        <TableCell sx={{ fontWeight: 900 }}>Foydalanuvchi</TableCell>
	                                        <TableCell align="right" sx={{ fontWeight: 900 }}>
	                                            Miqdor
	                                        </TableCell>
	                                        <TableCell sx={{ fontWeight: 900 }}>Turi</TableCell>
	                                        <TableCell sx={{ fontWeight: 900 }}>Sana</TableCell>
	                                        {isAdmin ? (
	                                            <TableCell align="right" sx={{ fontWeight: 900 }}>
	                                                Amallar
	                                            </TableCell>
	                                        ) : null}
	                                    </TableRow>
	                                </TableHead>
                                <TableBody>
                                    {pagedTransactions.map((transaction) => (
                                        <TableRow key={transaction.id} hover>
                                            <TableCell>{transaction.user?.username ?? '-'}</TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: transaction.transaction_type === 'in' ? 'success.main' : 'error.main',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {(transaction.transaction_type === 'in' ? '+' : '-') +
                                                    new Intl.NumberFormat('uz-UZ').format(transaction.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        bgcolor: transaction.transaction_type === 'in' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                                        color: transaction.transaction_type === 'in' ? 'success.main' : 'error.main',
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {transaction.transaction_type === 'in' ? 'KIRIM' : 'CHIQIM'}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const dt = new Date(transaction.created_at)
                                                    if (Number.isNaN(dt.getTime())) return transaction.created_at
                                                    return dt.toLocaleString('uz-UZ', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                })()}
                                            </TableCell>
	                                            {isAdmin ? (
	                                                <TableCell align="right">
	                                                    <Tooltip title="O'chirish" placement="top">
	                                                        <IconButton
	                                                            aria-label="O'chirish"
	                                                            onClick={() => requestDeleteTransactionRow(transaction)}
	                                                            sx={{
	                                                                color: 'error.main',
	                                                                border: '1px solid',
	                                                                borderColor: 'divider',
	                                                                borderRadius: 2,
	                                                                width: 52,
	                                                                height: 52,
	                                                                '& .MuiSvgIcon-root': { fontSize: 32 },
	                                                            }}
	                                                        >
	                                                            <DeleteOutlineIcon />
	                                                        </IconButton>
	                                                    </Tooltip>
	                                                </TableCell>
	                                            ) : null}
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
                                    onChange={(_, next) => setPage(next)}
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
                    </Box>

                    {/* Summary card on the right */}
                    <Card
                        variant="outlined"
                        sx={{
                            borderRadius: 3,
                            p: 3,
                            width: '100%',
                            height: { xs: 'fit-content', lg: '100%' },
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <Stack spacing={2}>
                            {/* Current Amount */}
                            <Box sx={{ textAlign: 'center', pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>Joriy summa</Typography>
                                <Typography sx={{ fontWeight: 1000, fontSize: 48, color: 'primary.main' }}>
                                    {new Intl.NumberFormat('uz-UZ').format(Math.round(safeSummary.current_amount))}
                                </Typography>
                                <Typography sx={{ fontWeight: 700, color: 'text.secondary', mt: 1, fontSize: 14 }}>so'm</Typography>
                                {summaryError ? (
                                    <Typography sx={{ mt: 1, fontSize: 12, color: 'error.main' }}>{summaryError}</Typography>
                                ) : summaryLoading ? (
                                    <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>Yuklanmoqda...</Typography>
                                ) : null}
                            </Box>

                            {/* Income and Expenses */}
                            <Box
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    p: 1.5,
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="stretch"
                                    divider={<Divider orientation="vertical" flexItem />}
                                    sx={{ mb: 1.5 }}
                                >
                                    <Box sx={{ flex: 1, pr: 2, textAlign: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                                            Buyurtmalardan jami daromad
                                        </Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                                            +{formatMoney(safeSummary.total_order_income)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, pl: 2, textAlign: 'center' }}>
                                        <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                                            Boshqa jami daromad
                                        </Typography>
                                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'success.main' }}>
                                            +{formatMoney(safeSummary.total_misc_income)}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 1.5 }} />

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: 14 }}>
                                        Jami xarajatlar
                                    </Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: 20, color: 'error.main' }}>
                                        -{formatMoney(safeSummary.total_expense)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>

                        <Paper
                            variant="outlined"
                            sx={{
                                mt: 2,
                                borderRadius: 2,
                                p: 1.5,
                                textAlign: 'center',
                            }}
                        >
                            <Typography sx={{ fontWeight: 1000, fontSize: 24, lineHeight: 1.1 }}>
                                {createAmount ? new Intl.NumberFormat('uz-UZ').format(Number(createAmount)) : '0'}
                            </Typography>
                            <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, mt: 0.5 }}>Miqdor</Typography>
                        </Paper>

                        <TextField
                            label="Summani kiriting"
                            value={createAmount}
                            onChange={(e) => setCreateAmount(e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18))}
                            inputMode="numeric"
                            fullWidth
                        />

                        <Box
                            sx={{
                                mt: 'auto',
                                pt: 2,
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr' },
                                gap: 1,
                            }}
                        >
                            <Button
                                color="success"
                                variant="contained"
                                onClick={() => createTransaction('in')}
                                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                                fullWidth
                                disabled={creating || !createAmountInt}
                            >
                                + Daromad qo'shish
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={() => createTransaction('out')}
                                sx={{ py: 2.2, borderRadius: 2, fontSize: 18 }}
                                fullWidth
                                disabled={creating || !createAmountInt}
                            >
                                - Xarajat qo'shish
                            </Button>
                        </Box>

                        {createError ? (
                            <Paper variant="outlined" sx={{ borderRadius: 2, mt: 1.5, p: 1.25, borderColor: 'error.main', bgcolor: 'rgba(211, 47, 47, 0.06)' }}>
                                <Typography sx={{ fontWeight: 900, color: 'error.main', fontSize: 13 }}>{createError}</Typography>
                            </Paper>
                        ) : null}
                    </Card>
                </Box>
            </Box>

            {isAdmin ? (
                <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
                    <DialogTitle sx={{ fontWeight: 1000 }}>Tranzaksiyani o'chirish</DialogTitle>
                    <DialogContent sx={{ pt: 1 }}>
                        <Stack gap={1.5} sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {deleteTarget ? `#${deleteTarget.id} tranzaksiyasini o'chirasizmi?` : 'Ushbu tranzaksiyani o‘chirasizmi?'}
                            </Typography>
                            {deleteTarget ? (
                                <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
                                    <Stack direction="row" justifyContent="space-between" gap={2}>
                                        <Typography sx={{ fontWeight: 900 }}>Miqdor</Typography>
                                        <Typography sx={{ fontWeight: 1000 }}>
                                            {(deleteTarget.transaction_type === 'in' ? '+' : '-') +
                                                new Intl.NumberFormat('uz-UZ').format(deleteTarget.amount)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            ) : null}
                            {deleteError ? (
                                <Typography sx={{ fontWeight: 900, color: 'error.main', fontSize: 13 }}>{deleteError}</Typography>
                            ) : null}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1 }}>
                        <Button variant="outlined" onClick={closeDelete} disabled={deleting}>
                            Bekor qilish
                        </Button>
                        <Button color="error" variant="contained" onClick={confirmDelete} disabled={!deleteTarget || deleting}>
                            {deleting ? "O'chirilmoqda…" : "O'chirish"}
                        </Button>
                    </DialogActions>
                </Dialog>
            ) : null}
        </Box>
    )
}
