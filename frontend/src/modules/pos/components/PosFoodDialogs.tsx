import AddIcon from '@mui/icons-material/Add'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'

import type { Category, EditFoodForm, NewFoodForm, UiProduct } from '../types'
import { formatIntegerForInput } from '../utils'

type ProductMenuState = {
  product: UiProduct
  left: number
  top: number
} | null

function FoodDialog({
  open,
  title,
  food,
  categories,
  previewUrl,
  onClose,
  onSubmit,
  onFoodChange,
  onPickImage,
  onOpenCreateCategory,
  submitLabel,
  showCreateCategory,
}: {
  open: boolean
  title: string
  food: NewFoodForm | EditFoodForm
  categories: Category[]
  previewUrl: string
  onClose: () => void
  onSubmit: () => void
  onFoodChange: (updater: (prev: NewFoodForm | EditFoodForm) => NewFoodForm | EditFoodForm) => void
  onPickImage: (file: File | null) => void
  onOpenCreateCategory?: () => void
  submitLabel: string
  showCreateCategory?: boolean
}) {
  const measureLabelId = `${title}-measure-label`
  const categoryLabelId = `${title}-category-label`
  const [isDragActive, setIsDragActive] = useState(false)
  const uploadAreaRef = useRef<HTMLDivElement | null>(null)

  function handleDroppedFile(file: File | null) {
    setIsDragActive(false)
    onPickImage(file)
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.items)
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile()

    if (!file) return

    event.preventDefault()
    handleDroppedFile(file)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      <DialogTitle sx={{ fontWeight: 1000 }}>{title}</DialogTitle>
      <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 2 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Stack gap={2} sx={{ mt: 1 }}>
            <TextField
              label="Nomi"
              value={food.name}
              onChange={(e) => onFoodChange((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField
                label="Narxi"
                value={formatIntegerForInput(food.priceDigits)}
                onChange={(e) =>
                  onFoodChange((prev) => ({
                    ...prev,
                    priceDigits: e.target.value.replaceAll(/[^\d]/g, '').slice(0, 18),
                  }))
                }
                inputMode="numeric"
                sx={{ flex: 1 }}
              />

              <FormControl sx={{ flex: 1 }}>
                <InputLabel id={measureLabelId}>O'lchov</InputLabel>
                <Select
                  labelId={measureLabelId}
                  label="O'lchov"
                  value={food.measure}
                  onChange={(e) =>
                    onFoodChange((prev) => ({
                      ...prev,
                      measure: e.target.value as NewFoodForm['measure'],
                    }))
                  }
                >
                  <MenuItem value="unit">Dona</MenuItem>
                  <MenuItem value="gram">Gram</MenuItem>
                  <MenuItem value="portion">Porsiya</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" gap={1} sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id={categoryLabelId}>Kategoriya</InputLabel>
                  <Select
                    labelId={categoryLabelId}
                    label="Kategoriya"
                    value={food.categoryId}
                    onChange={(e) => onFoodChange((prev) => ({ ...prev, categoryId: String(e.target.value) }))}
                  >
                    {categories
                      .filter((category) => category.id !== 'all')
                      .map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {showCreateCategory ? (
                  <Tooltip title="Kategoriya qo'shish" placement="top">
                    <IconButton
                      aria-label="Kategoriya qo'shish"
                      onClick={onOpenCreateCategory}
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        flex: '0 0 auto',
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, display: 'grid', gap: 1 }}>
              <Typography sx={{ fontWeight: 900 }}>Rasm yuklash</Typography>
              <Typography variant="body2" color="text.secondary">
                Menyu kartasi foni uchun rasm yuklang.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2}>
                <Button component="label" variant="outlined">
                  Rasm tanlash
                  <input hidden type="file" accept="image/*" onChange={(e) => handleDroppedFile(e.target.files?.[0] ?? null)} />
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {food.imageFile ? food.imageFile.name : 'Fayl tanlanmagan'}
                </Typography>
              </Stack>

              <Box
                ref={uploadAreaRef}
                tabIndex={0}
                onMouseEnter={() => uploadAreaRef.current?.focus()}
                onClick={() => uploadAreaRef.current?.focus()}
                onPaste={handlePaste}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setIsDragActive(true)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (!isDragActive) setIsDragActive(true)
                }}
                onDragLeave={(event) => {
                  event.preventDefault()
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                  setIsDragActive(false)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const file = event.dataTransfer.files?.[0]
                  handleDroppedFile(file ?? null)
                }}
                sx={{
                  mt: 1,
                  height: 160,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: isDragActive ? 'warning.main' : 'divider',
                  overflow: 'hidden',
                  bgcolor: isDragActive ? 'rgba(255, 152, 0, 0.08)' : 'background.default',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  backgroundImage: previewUrl ? `url("${previewUrl}")` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'border-color 120ms ease, background-color 120ms ease',
                  outline: 'none',
                  '&:focus-visible': {
                    borderColor: 'warning.main',
                    boxShadow: '0 0 0 3px rgba(255, 152, 0, 0.18)',
                  },
                }}
              >
                {!previewUrl ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                    {isDragActive ? 'Rasmni shu yerga tashlang' : "Rasm ko'rinishi yoki Ctrl+V bosing"}
                  </Typography>
                ) : null}
              </Box>
            </Paper>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button color="error" variant="contained" onClick={onClose} fullWidth size="large" sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}>
          Bekor qilish
        </Button>
        <Button color="success" variant="contained" onClick={onSubmit} fullWidth size="large" sx={{ py: 1.6, fontSize: 16, fontWeight: 900 }}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function PosFoodDialogs({
  menuCategories,
  createOpen,
  newFood,
  newFoodPreviewUrl,
  onCloseCreateFood,
  onCreateFood,
  onNewFoodChange,
  onPickImage,
  onOpenCreateCategory,
  createCategoryOpen,
  newCategoryName,
  onNewCategoryNameChange,
  onCloseCreateCategory,
  onCreateCategory,
  editOpen,
  editFood,
  editFoodPreviewUrl,
  onCloseEditFood,
  onUpdateFood,
  onEditFoodChange,
  onPickEditImage,
  productMenu,
  onCloseProductMenu,
  onEditFromMenu,
}: {
  menuCategories: Category[]
  createOpen: boolean
  newFood: NewFoodForm
  newFoodPreviewUrl: string
  onCloseCreateFood: () => void
  onCreateFood: () => void
  onNewFoodChange: (updater: (prev: NewFoodForm) => NewFoodForm) => void
  onPickImage: (file: File | null) => void
  onOpenCreateCategory: () => void
  createCategoryOpen: boolean
  newCategoryName: string
  onNewCategoryNameChange: (value: string) => void
  onCloseCreateCategory: () => void
  onCreateCategory: () => void
  editOpen: boolean
  editFood: EditFoodForm
  editFoodPreviewUrl: string
  onCloseEditFood: () => void
  onUpdateFood: () => void
  onEditFoodChange: (updater: (prev: EditFoodForm) => EditFoodForm) => void
  onPickEditImage: (file: File | null) => void
  productMenu: ProductMenuState
  onCloseProductMenu: () => void
  onEditFromMenu: (product: UiProduct) => void
}) {
  return (
    <>
      <FoodDialog
        open={createOpen}
        title="Mahsulot yaratish"
        food={newFood}
        categories={menuCategories}
        previewUrl={newFoodPreviewUrl}
        onClose={onCloseCreateFood}
        onSubmit={onCreateFood}
        onFoodChange={(updater) => onNewFoodChange((prev) => updater(prev) as NewFoodForm)}
        onPickImage={onPickImage}
        onOpenCreateCategory={onOpenCreateCategory}
        submitLabel="Yaratish"
        showCreateCategory
      />

      <FoodDialog
        open={editOpen}
        title="Mahsulotni tahrirlash"
        food={editFood}
        categories={menuCategories}
        previewUrl={editFoodPreviewUrl}
        onClose={onCloseEditFood}
        onSubmit={onUpdateFood}
        onFoodChange={(updater) => onEditFoodChange((prev) => updater(prev) as EditFoodForm)}
        onPickImage={onPickEditImage}
        submitLabel="Saqlash"
      />

      <Dialog open={createCategoryOpen} onClose={onCloseCreateCategory} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 1000 }}>Kategoriya yaratish</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Kategoriya nomi"
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" variant="contained" onClick={onCloseCreateCategory}>
            Bekor qilish
          </Button>
          <Button color="success" variant="contained" onClick={onCreateCategory}>
            Yaratish
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={!!productMenu}
        onClose={onCloseProductMenu}
        anchorReference="anchorPosition"
        anchorPosition={productMenu ? { left: productMenu.left, top: productMenu.top } : undefined}
      >
        <MenuItem
          onClick={() => {
            if (!productMenu) return
            const target = productMenu.product
            onCloseProductMenu()
            onEditFromMenu(target)
          }}
        >
          Tahrirlash
        </MenuItem>
        <MenuItem onClick={onCloseProductMenu}>Bekor qilish</MenuItem>
      </Menu>
    </>
  )
}
