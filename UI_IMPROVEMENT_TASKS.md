# UI Improvement Tasks

## Scope

Improve the VPOS point of sales UI without removing existing features.

## Main Menu Page

- Show `frontend/public/defaults/default_product.png` for products when:
  - the image URL is missing, empty, or not provided
  - the provided image fails to load in the browser, including backend 404 responses
- Remove the `Savat` text and the `x` button from the top of the right-side order cart.
- Replace the `Nasiya savdo` and `Ofitsiant xizmati` checkboxes with two horizontal orange switch controls.
- Rename those labels to:
  - `Nasiya`
  - `Usluga`
- Change the logout button to a red power icon button.

## Order History Page

- Replace indexed pagination with infinite scroll.
- Load the next page when the user scrolls within roughly 200-300px of the bottom.
- Remove pagination index buttons completely.
- Show a small loading spinner at the bottom while more order rows are loading.
- Make the order history table fill available height down to the bottom edge of the window.
- Remove the `Lavozim` column.
- Replace the `Tafsilotlar` text button with a circular eye icon button using a light black foreground color.
- Remove the word `so'm` from the `To'langan`, `Jami`, and `Chegirma` rows.

## Implementation Rule

- Do not start implementation until the user explicitly says to proceed.

## Follow-up UI Improvement Tasks

### Main Menu Page

- Replace the current compact switch controls with larger touchscreen-friendly rectangle bar toggles.
- Put each toggle label above its toggle button.
- Use orange to clearly represent the `ON` state and gray/white for `OFF`.
- Make the orange switch shape move left/right inside the rectangle bar.
- Keep the labels:
  - `Nasiya`
  - `Usluga`
- Make the logout power icon button the same size as the other circular navbar action buttons.
- Add visible border color styling for navbar action buttons:
  - settings button
  - create/plus button
  - cash drawer opening button
  - logout button
- Keep the existing action behavior for each navbar button.

### Shared Navbar

- Keep using one shared navbar component across pages.
- Update navbar UI consistency in the shared component and page usages.
- Preserve page-specific behavior:
  - menu/users pages can still show the plus button
  - plus button action remains page-specific
  - search bar still appears only where it currently appears
  - existing navigation behavior remains unchanged
- Apply the same logout power icon design across all pages that show logout.
- Keep navbar action positioning and visual style consistent across pages.

### Order History Page

- Move the totals row from the bottom of the table to the top of the table body, directly under the column labels.
- Use bold text for the totals row.
- Remove `so'm` from the `Ofitsiant xizmati` total value too.
- Keep `so'm` removed from:
  - `Chegirma`
  - `To'langan`
  - `Jami`

### Order Details Modal

- Show `frontend/public/defaults/default_product.png` when an order item product image:
  - is missing, empty, or not provided
  - fails to load in the browser
  - returns a backend 404 or other failed image response
- Match the same fallback behavior used on the main menu product images.
