import { Box } from '@mui/material'

import { logout } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import UserDialogs from '../components/UserDialogs'
import UsersTable from '../components/UsersTable'
import { useUsersPage } from '../hooks/useUsersPage'

export default function UsersPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const users = useUsersPage()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        active={active}
        onNavigate={onNavigate}
        showUsers={showUsers}
        onAdd={users.openCreate}
        onSettings={() => onNavigate('settings')}
        onLogout={() => logout()}
        searchValue={users.search}
        onSearchChange={users.setSearch}
        searchPlaceholder="Foydalanuvchi qidirish..."
      />

      <Box
        sx={{
          p: 2,
          pb: { xs: 12, md: 2, lg: 12 },
          height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflow: 'hidden',
        }}
      >
        <UsersTable
          loading={users.loading}
          error={users.error}
          rows={users.pagedRows}
          page={users.page}
          pages={users.pages}
          onRetry={users.load}
          onPageChange={users.setPage}
          onEdit={users.openEdit}
          onToggleActive={users.openDeactivate}
        />
      </Box>

      <UserDialogs
        createOpen={users.createOpen}
        createSaving={users.createSaving}
        createError={users.createError}
        createForm={users.createForm}
        onCloseCreate={users.closeCreate}
        onCreateFormChange={users.setCreateForm}
        onCreateUser={users.createUser}
        editOpen={users.editOpen}
        editForm={users.editForm}
        saving={users.saving}
        saveStatus={users.saveStatus}
        saveDisabled={users.saveDisabled}
        onCloseEdit={users.closeEdit}
        onEditFormChange={users.setEditForm}
        onSaveEdit={users.saveEdit}
        deactivateOpen={users.deactivateOpen}
        deactivateUser={users.deactivateUser}
        deactivateNextActive={users.deactivateNextActive}
        deactivating={users.deactivating}
        deactivateStatus={users.deactivateStatus}
        onCloseDeactivate={users.closeDeactivate}
        onConfirmDeactivate={users.confirmDeactivate}
      />
    </Box>
  )
}
