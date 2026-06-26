import { Box } from '@mui/material'

import { logout } from '../../../shared/auth'
import Navbar, { type NavItemId } from '../../../shared/components/Navbar'
import PosCartPanel from '../components/PosCartPanel'
import PosCategoryStrip from '../components/PosCategoryStrip'
import PosCashbackDialog from '../components/PosCashbackDialog'
import PosFoodDialogs from '../components/PosFoodDialogs'
import PosProductsGrid from '../components/PosProductsGrid'
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
          onSettings={() => onNavigate('settings')}
          onLogout={() => logout()}
          searchValue={pos.search}
          onSearchChange={pos.setSearch}
          searchPlaceholder="Mahsulot qidirish..."
        />

        <Box
          sx={{
            pt: 0,
            pb: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <PosCategoryStrip
            categories={pos.menuCategories}
            selectedCategoryId={pos.selectedCategoryId}
            onSelect={pos.setSelectedCategoryId}
          />

          <Box
            sx={{
              pl: 2,
              pr: { xs: 2, md: 0 },
              pt: 1,
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
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
              isDebt={pos.isDebt}
              debtPaidAmountDigits={pos.debtPaidAmountDigits}
              paymentType={pos.paymentType}
              isPlacingOrder={pos.isPlacingOrder}
              onClearCart={pos.clearCart}
              onSetQty={pos.setQty}
              onToggleEditTotal={pos.toggleEditTotal}
              onDiscountDigitsChange={pos.setDiscountDigits}
              onIsDebtChange={pos.setIsDebt}
              onDebtPaidAmountDigitsChange={pos.setDebtPaidAmountDigits}
              onPaymentTypeChange={pos.setPaymentType}
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

        <PosCashbackDialog
          open={pos.cashbackOpen}
          totalAmount={pos.cashbackTotalAmount}
          paidAmount={pos.cashbackPaidAmount}
          cashback={pos.cashbackAmount}
          onAddMoney={pos.addCashbackMoney}
          onReset={pos.resetCashbackMoney}
          onClose={pos.closeCashbackDialog}
        />
      </Box>
    </Box>
  )
}
