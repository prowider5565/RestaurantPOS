import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import type { ApiUser, CreateUserForm, EditUserForm, StatusMessage } from '../types'

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggleVisibility,
  error,
  helperText,
}: {
  label: string
  value: string
  visible: boolean
  onChange: (value: string) => void
  onToggleVisibility: () => void
  error?: boolean
  helperText?: string
}) {
  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      helperText={helperText}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
              onClick={onToggleVisibility}
              edge="end"
            >
              {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default function UserDialogs({
  createOpen,
  createSaving,
  createError,
  createForm,
  onCloseCreate,
  onCreateFormChange,
  onCreateUser,
  editOpen,
  editForm,
  saving,
  saveStatus,
  saveDisabled,
  onCloseEdit,
  onEditFormChange,
  onSaveEdit,
  deactivateOpen,
  deactivateUser,
  deactivateNextActive,
  deactivating,
  deactivateStatus,
  onCloseDeactivate,
  onConfirmDeactivate,
}: {
  createOpen: boolean
  createSaving: boolean
  createError: string | null
  createForm: CreateUserForm
  onCloseCreate: () => void
  onCreateFormChange: (updater: (prev: CreateUserForm) => CreateUserForm) => void
  onCreateUser: () => void
  editOpen: boolean
  editForm: EditUserForm
  saving: boolean
  saveStatus: StatusMessage | null
  saveDisabled: boolean
  onCloseEdit: () => void
  onEditFormChange: (updater: (prev: EditUserForm) => EditUserForm) => void
  onSaveEdit: () => void
  deactivateOpen: boolean
  deactivateUser: ApiUser | null
  deactivateNextActive: boolean
  deactivating: boolean
  deactivateStatus: StatusMessage | null
  onCloseDeactivate: () => void
  onConfirmDeactivate: () => void
}) {
  const createPasswordsMismatch =
    Boolean(createForm.confirmPassword) && createForm.password !== createForm.confirmPassword
  const editPasswordsMismatch = Boolean(editForm.confirmPassword) && editForm.password !== editForm.confirmPassword

  return (
    <>
      <Dialog
        open={createOpen}
        onClose={onCloseCreate}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 32px)', sm: '780px' },
            height: { xs: 'calc(100dvh - 32px)', sm: '90dvh' },
            maxHeight: { xs: 'calc(100dvh - 32px)', sm: 920 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 1000 }}>Foydalanuvchi yaratish</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 2 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {createError ? <Alert severity="error">{createError}</Alert> : null}

            <TextField
              label="Foydalanuvchi nomi"
              value={createForm.username}
              onChange={(e) => onCreateFormChange((prev) => ({ ...prev, username: e.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField
                label="Parol"
                type="password"
                value={createForm.password}
                onChange={(e) => onCreateFormChange((prev) => ({ ...prev, password: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Parolni tasdiqlash"
                type="password"
                value={createForm.confirmPassword}
                onChange={(e) => onCreateFormChange((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                error={createPasswordsMismatch}
                helperText={createPasswordsMismatch ? 'Parollar mos emas' : ' '}
                fullWidth
              />
            </Stack>

            <TextField
              label="Lavozim"
              value={createForm.position}
              onChange={(e) => onCreateFormChange((prev) => ({ ...prev, position: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            onClick={onCloseCreate}
            fullWidth
            size="large"
            sx={{
              py: 1.6,
              fontSize: 16,
              fontWeight: 900,
              bgcolor: 'grey.500',
              color: 'white',
              '&:hover': { bgcolor: 'grey.600' },
            }}
            disabled={createSaving}
          >
            Bekor qilish
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={onCreateUser}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={createSaving || !createForm.username.trim() || !createForm.password || !createForm.confirmPassword}
          >
            {createSaving ? 'Yaratilmoqda...' : 'Yaratish'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={onCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 1000 }}>Foydalanuvchini tahrirlash</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {saveStatus ? <Alert severity={saveStatus.kind === 'ok' ? 'success' : 'error'}>{saveStatus.msg}</Alert> : null}

            <TextField
              label="Foydalanuvchi nomi"
              value={editForm.username}
              onChange={(e) => onEditFormChange((prev) => ({ ...prev, username: e.target.value }))}
              fullWidth
            />

            <PasswordField
              label="Yangi parol"
              value={editForm.password}
              visible={editForm.showPassword}
              onChange={(value) => onEditFormChange((prev) => ({ ...prev, password: value }))}
              onToggleVisibility={() => onEditFormChange((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
            />

            <PasswordField
              label="Parolni tasdiqlash"
              value={editForm.confirmPassword}
              visible={editForm.showPasswordConfirm}
              onChange={(value) => onEditFormChange((prev) => ({ ...prev, confirmPassword: value }))}
              onToggleVisibility={() =>
                onEditFormChange((prev) => ({ ...prev, showPasswordConfirm: !prev.showPasswordConfirm }))
              }
              error={editPasswordsMismatch}
              helperText={editPasswordsMismatch ? 'Parollar mos emas' : ' '}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            color="error"
            variant="contained"
            onClick={onCloseEdit}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={saving}
          >
            Bekor qilish
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={onSaveEdit}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={saveDisabled}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateOpen} onClose={onCloseDeactivate} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 1000 }}>
          {deactivateNextActive ? 'Foydalanuvchini faollashtirish' : 'Foydalanuvchini faolsizlantirish'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            {deactivateStatus ? (
              <Alert severity={deactivateStatus.kind === 'ok' ? 'success' : 'error'}>{deactivateStatus.msg}</Alert>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              {deactivateUser
                ? `${deactivateNextActive ? 'Faollashtirish' : 'Faolsizlantirish'} "${deactivateUser.username}"?`
                : 'Ushbu foydalanuvchini yangilaysizmi?'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            color="error"
            variant="contained"
            onClick={onCloseDeactivate}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={deactivating}
          >
            Bekor qilish
          </Button>
          <Button
            color={deactivateNextActive ? 'success' : 'error'}
            variant="contained"
            onClick={onConfirmDeactivate}
            fullWidth
            size="large"
            sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}
            disabled={!deactivateUser || deactivating}
          >
            {deactivating ? 'Saqlanmoqda...' : deactivateNextActive ? 'Faollashtirish' : 'Faolsizlantirish'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
