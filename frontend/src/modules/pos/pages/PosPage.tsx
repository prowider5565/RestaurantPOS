import { useEffect } from 'react'

import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import { Box, IconButton, Tooltip } from '@mui/material'

import { clearAccessToken } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import PosCartPanel from '../components/PosCartPanel'
import PosCategoryStrip from '../components/PosCategoryStrip'
import PosFoodDialogs from '../components/PosFoodDialogs'
import PosProductsGrid from '../components/PosProductsGrid'
import PosTableDialog from '../components/PosTableDialog'
import { usePosCart } from '../hooks/usePosCart'
import { usePosCatalog } from '../hooks/usePosCatalog'
import { usePosFoodDialogs } from '../hooks/usePosFoodDialogs'
import { usePosOrderTables } from '../hooks/usePosOrderTables'
import { usePosPageState } from '../hooks/usePosPageState'
import { usePosTotals } from '../hooks/usePosTotals'

export default function PosPage({
  active,
  onNavigate,
  showUsers,
}: {
  active: NavItemId
  onNavigate: (next: NavItemId | 'settings') => void
  showUsers?: boolean
}) {
  const cart = usePosCart()
  const totals = usePosTotals(cart.cartLines, cart.cartCount)
  const tables = usePosOrderTables()
  const page = usePosPageState({
    cartLines: cart.cartLines,
    clearCart: cart.clearCart,
    discountedSubtotal: totals.discountedSubtotal,
    includeWaiterFee: totals.includeWaiterFee,
    orderTables: tables.orderTables,
    selectedOrderTableId: tables.selectedOrderTableId,
    subtotalInt: totals.subtotalInt,
  })
  const catalog = usePosCatalog(page.search)
  const foodDialogs = usePosFoodDialogs({
    selectedCategoryId: catalog.selectedCategoryId,
    setApiCategories: catalog.setApiCategories,
    setMenuProducts: catalog.setMenuProducts,
  })

  useEffect(() => {
    const handler = () => foodDialogs.openCreateFood()
    window.addEventListener('pos:createFood', handler)
    return () => window.removeEventListener('pos:createFood', handler)
  }, [foodDialogs])

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
          onAdd={foodDialogs.openCreateFood}
          rightActions={
            <Tooltip title="Chiqish" placement="bottom">
              <IconButton
                aria-label="Chiqish"
                onClick={() => clearAccessToken()}
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
          searchValue={page.search}
          onSearchChange={page.setSearch}
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
                categories={catalog.menuCategories}
                selectedCategoryId={catalog.selectedCategoryId}
                onSelect={catalog.setSelectedCategoryId}
              />

              <Box
                sx={{
                  minHeight: 0,
                  flex: 1,
                  overflow: 'hidden',
                  '@media (min-width:900px) and (max-width:1199.95px) and (max-height:768px)': {
                    maxHeight: 560,
                  },
                }}
              >
                <PosProductsGrid
                  visibleProducts={catalog.visibleProducts}
                  onAddToCart={cart.addToCart}
                  onBeginLongPress={page.beginLongPress}
                  onCancelLongPress={page.cancelLongPress}
                  longPressFiredRef={page.longPressFiredRef}
                />
              </Box>
            </Box>

            <PosCartPanel
              cartCount={cart.cartCount}
              cartLines={cart.cartLines}
              cartItemsRef={cart.cartItemsRef}
              isEditingTotal={totals.isEditingTotal}
              discountDigits={totals.discountDigits}
              waitressWage={totals.waitressWage}
              discountedTotal={totals.discountedTotal}
              includeWaiterFee={totals.includeWaiterFee}
              isPlacingOrder={page.isPlacingOrder}
              orderTables={tables.orderTables}
              selectedOrderTableId={tables.selectedOrderTableId}
              onClearCart={cart.clearCart}
              onSelectOrderTable={tables.setSelectedOrderTableId}
              onOpenCreateTable={tables.openCreateTable}
              onSetQty={cart.setQty}
              onToggleEditTotal={totals.toggleEditTotal}
              onDiscountDigitsChange={totals.setDiscountDigits}
              onIncludeWaiterFeeChange={totals.setIncludeWaiterFee}
              onPlaceOrder={page.placeOrder}
            />
          </Box>
        </Box>

        <PosFoodDialogs
          menuCategories={catalog.menuCategories}
          createOpen={foodDialogs.createOpen}
          newFood={foodDialogs.newFood}
          newFoodPreviewUrl={foodDialogs.newFoodPreviewUrl}
          onCloseCreateFood={foodDialogs.closeCreateFood}
          onCreateFood={foodDialogs.createFood}
          onNewFoodChange={foodDialogs.setNewFood}
          onPickImage={foodDialogs.onPickImage}
          onOpenCreateCategory={foodDialogs.openCreateCategory}
          createCategoryOpen={foodDialogs.createCategoryOpen}
          newCategoryName={foodDialogs.newCategoryName}
          onNewCategoryNameChange={foodDialogs.setNewCategoryName}
          onCloseCreateCategory={foodDialogs.closeCreateCategory}
          onCreateCategory={foodDialogs.createCategory}
          editOpen={foodDialogs.editOpen}
          editFood={foodDialogs.editFood}
          editFoodPreviewUrl={foodDialogs.editFoodPreviewUrl}
          onCloseEditFood={foodDialogs.closeEditFood}
          onUpdateFood={foodDialogs.updateFood}
          onEditFoodChange={foodDialogs.setEditFood}
          onPickEditImage={foodDialogs.onPickEditImage}
          productMenu={page.productMenu}
          onCloseProductMenu={() => page.setProductMenu(null)}
          onEditFromMenu={foodDialogs.openEditFood}
        />

        <PosTableDialog
          open={tables.createTableOpen}
          value={tables.newOrderTable}
          onClose={tables.closeCreateTable}
          onChange={tables.setNewOrderTable}
          onSubmit={tables.createOrderTable}
        />
      </Box>
    </Box>
  )
}
