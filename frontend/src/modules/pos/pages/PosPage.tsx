import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, IconButton, Tooltip } from '@mui/material'

import { logout } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import PosCartPanel from '../components/PosCartPanel'
import PosCategoryStrip from '../components/PosCategoryStrip'
import PosFoodDialogs from '../components/PosFoodDialogs'
import PosProductsGrid from '../components/PosProductsGrid'
import PosTableDialog from '../components/PosTableDialog'
import { usePosPage } from '../hooks/usePosPage'

export default function PosPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const pos = usePosPage()

  return (
    <Box
      sx={{
        height: '100dvh',
        bgcolor: 'background.default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        <Navbar
          active={active}
          onNavigate={onNavigate}
          showUsers={showUsers}
          onAdd={pos.openCreateFood}
          rightActions={
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={() => logout()}
                sx={{
                  width: 36,
                  height: 36,
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
          }
          searchValue={pos.search}
          onSearchChange={pos.setSearch}
          searchPlaceholder="Mahsulot qidirish..."
          settingsAction={
            <Tooltip title="Sozlamalar" placement="bottom">
              <IconButton
                aria-label="Sozlamalar"
                onClick={() => onNavigate('settings')}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          }
        />

        <Box
          sx={{
            pl: 2,
            pr: { xs: 2, md: 0 },
            pt: 0,
            pb: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 276px', lg: 'minmax(0, 1fr) 292px' },
              gap: 2,
              alignItems: 'stretch',
              flex: 1,
              minHeight: 0,
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                minHeight: 0,
                height: '100%',
                overflow: { xs: 'visible', md: 'hidden' },
                pr: { md: 1 },
                pt: 2,
                pb: { xs: 12, md: 0 },
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <PosCategoryStrip
                categories={pos.menuCategories}
                selectedCategoryId={pos.selectedCategoryId}
                onSelect={pos.setSelectedCategoryId}
              />

              <Box sx={{ minHeight: 0, flex: 1, overflow: { xs: 'visible', md: 'auto' } }}>
                <PosProductsGrid
                  visibleProducts={pos.visibleProducts}
                  onAddToCart={pos.addToCart}
                  onBeginLongPress={pos.beginLongPress}
                  onCancelLongPress={pos.cancelLongPress}
                  longPressFiredRef={pos.longPressFiredRef}
                />
              </Box>
            </Box>

            <PosCartPanel
              cartCount={pos.cartCount}
              cartLines={pos.cartLines}
              cartItemsRef={pos.cartItemsRef}
              isEditingTotal={pos.isEditingTotal}
              discountDigits={pos.discountDigits}
              discountedTotal={pos.discountedTotal}
              isPlacingOrder={pos.isPlacingOrder}
              orderTables={pos.orderTables}
              selectedOrderTableId={pos.selectedOrderTableId}
              onClearCart={pos.clearCart}
              onSelectOrderTable={pos.setSelectedOrderTableId}
              onOpenCreateTable={pos.openCreateTable}
              onSetQty={pos.setQty}
              onToggleEditTotal={pos.toggleEditTotal}
              onDiscountDigitsChange={pos.setDiscountDigits}
              onPlaceOrder={pos.placeOrder}
            />
          </Box>
        </Box>

        <PosFoodDialogs
          menuCategories={pos.menuCategories}
          createOpen={pos.createOpen}
          newFood={pos.newFood}
          newFoodPreviewUrl={pos.newFoodPreviewUrl}
          onCloseCreateFood={pos.closeCreateFood}
          onCreateFood={pos.createFood}
          onNewFoodChange={pos.setNewFood}
          onPickImage={pos.onPickImage}
          onOpenCreateCategory={pos.openCreateCategory}
          createCategoryOpen={pos.createCategoryOpen}
          newCategoryName={pos.newCategoryName}
          onNewCategoryNameChange={pos.setNewCategoryName}
          onCloseCreateCategory={pos.closeCreateCategory}
          onCreateCategory={pos.createCategory}
          editOpen={pos.editOpen}
          editFood={pos.editFood}
          editFoodPreviewUrl={pos.editFoodPreviewUrl}
          onCloseEditFood={pos.closeEditFood}
          onUpdateFood={pos.updateFood}
          onEditFoodChange={pos.setEditFood}
          onPickEditImage={pos.onPickEditImage}
          productMenu={pos.productMenu}
          onCloseProductMenu={() => pos.setProductMenu(null)}
          onEditFromMenu={pos.openEditFood}
        />

        <PosTableDialog
          open={pos.createTableOpen}
          value={pos.newOrderTable}
          onClose={pos.closeCreateTable}
          onChange={pos.setNewOrderTable}
          onSubmit={pos.createOrderTable}
        />
      </Box>
    </Box>
  )
}
