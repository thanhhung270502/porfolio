---
name: Refactor sweetpixtiles structure
overview: Refactor toàn bộ folder structure của `service-sweetpixtiles/web` để khớp với kiến trúc của `sweetpix-base` (modules + shared + libs + common + tailwind-config), đồng thời xóa bỏ backend code (repositories, services) vì sẽ dùng backend riêng.
todos:
  - id: setup-root-dirs
    content: "Tạo các thư mục root mới: tailwind-config/, common/, eslint-config/ (copy structure từ sweetpix-base, bỏ nội dung backend-specific)"
    status: pending
  - id: update-tsconfig
    content: "Cập nhật tsconfig.json: thêm path aliases @tailwind-config/* và @common"
    status: pending
  - id: create-shared
    content: "Tạo src/shared/ với các subfolder: components/, hooks/, providers/, stores/, types/, utils/, constants/, enums/, layouts/"
    status: pending
  - id: migrate-ui-components
    content: Di chuyển src/components/ui/ và src/components/layout/ → src/shared/components/
    status: pending
  - id: create-modules
    content: "Tạo src/modules/ với từng module: landing, studio, auth, cart, account, contact, gallery-walls, photos, checkout — mỗi module có components/, hooks/, store/, types/, utils/, pages/, index.ts"
    status: pending
  - id: migrate-components-to-modules
    content: Di chuyển từng nhóm components vào module tương ứng (landing, studio/editor, auth, cart, account, contact, gallery-walls, photos)
    status: pending
  - id: migrate-hooks
    content: Di chuyển src/hooks/ → module hooks hoặc src/shared/hooks/ theo mapping
    status: pending
  - id: migrate-stores
    content: Di chuyển src/stores/ → src/shared/stores/ (auth, order) và module-level stores (cart, editor, studio, wallBuilder)
    status: pending
  - id: migrate-providers
    content: Di chuyển src/providers/ → src/shared/providers/
    status: pending
  - id: migrate-types
    content: Di chuyển src/types/ → src/shared/types/ và module types
    status: pending
  - id: migrate-libs
    content: Rename src/lib/ → src/libs/ và di chuyển domain utils vào module utils tương ứng
    status: pending
  - id: migrate-utils
    content: Di chuyển src/utils/cn.ts → tailwind-config/utils/cn.ts; src/utils/ → src/shared/utils/
    status: pending
  - id: update-imports
    content: Cập nhật tất cả import paths trong codebase sau khi di chuyển files
    status: pending
  - id: add-index-exports
    content: Thêm index.ts barrel exports cho mỗi module và shared subfolder
    status: pending
  - id: lint-typecheck
    content: Chạy npm run lint và npm run build để xác nhận không có lỗi sau refactor
    status: pending
isProject: false
---

# Refactor sweetpixtiles/web Structure

## Mục tiêu

Chuyển `service-sweetpixtiles/web` từ flat structure sang module-based architecture của `sweetpix-base`.

## So sánh hiện tại vs mục tiêu

**Hiện tại (`service-sweetpixtiles/web/src/`):**

```
src/
  app/               # Next.js pages
  components/        # Tất cả components (landing, studio, editor, layout, ui, ...)
  hooks/             # Tất cả hooks
  lib/               # Utilities + API client
  providers/         # Data providers (mock, api)
  stores/            # Zustand stores
  styles/            # CSS tokens
  types/             # TypeScript types
  utils/             # Utilities (cn, index)
  middleware.ts
```

**Mục tiêu (theo `sweetpix-base/src/`):**

```
src/
  app/               # Giữ nguyên (Next.js routing)
  libs/              # lib/ → libs/ (api-client, firebase, + các utility libs)
  modules/           # Feature modules (mỗi module tự chứa components, hooks, store, types, utils)
    landing/
    studio/
    editor/
    account/
    cart/
    auth/
    checkout/
    contact/
    gallery-walls/
    photos/          # (images/)
  shared/            # Thứ dùng chung cross-module
    components/      # ui/ → shared/components/
    hooks/           # Global hooks
    providers/       # providers/ → shared/providers/
    stores/          # stores/ → shared/stores/
    types/           # Global types
    utils/           # utils/ → shared/utils/ (cn.ts, ...)
    constants/
    enums/
    layouts/
  middleware.ts
```

**Root-level thêm mới (copy từ sweetpix-base):**

- `tailwind-config/` — brand CSS tokens, breakpoints, utility `cn.ts`
- `common/` — shared API models, constants, API route definitions
- `eslint-config/` — shared ESLint config

## Mapping chi tiết

### `src/lib/` → `src/libs/`

- `api-client.ts` → `src/libs/api-client.ts`
- `firebase.ts` → `src/libs/firebase.ts`
- `cropImage.ts`, `dpiCheck.ts`, `fileUpload.ts`, `filterPresets.ts`, `wallTemplates.ts`, ... → vào module tương ứng hoặc `src/libs/`

### `src/components/` → `src/modules/` + `src/shared/`


| Nguồn                 | Đích                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `components/ui/`      | `src/shared/components/`                                               |
| `components/layout/`  | `src/shared/components/` hoặc `src/modules/landing/components/`        |
| `components/landing/` | `src/modules/landing/components/`                                      |
| `components/studio/`  | `src/modules/studio/components/`                                       |
| `components/editor/`  | `src/modules/studio/components/` hoặc `src/modules/editor/components/` |
| `components/auth/`    | `src/modules/auth/components/`                                         |
| `components/cart/`    | `src/modules/cart/components/`                                         |
| `components/contact/` | `src/modules/contact/components/`                                      |
| `components/account/` | `src/modules/account/components/`                                      |
| `components/gallery/` | `src/modules/gallery-walls/components/`                                |
| `components/images/`  | `src/modules/photos/components/`                                       |


### `src/hooks/` → phân tán vào modules

- `useStudioKonvaCanvas.ts`, `useStudioPrintTiles.ts` → `src/modules/studio/hooks/`
- `usePhotoKonvaCanvas.ts`, `usePhotoDetailToolbar.ts` → `src/modules/photos/hooks/`
- `useFocusRefetch.ts` → `src/shared/hooks/`

### `src/stores/` → `src/shared/stores/` + module-level stores

- `authStore.ts` → `src/shared/stores/`
- `cartStore.ts` → `src/modules/cart/store/`
- `editorStore.ts`, `studioStore.ts`, `wallBuilderStore.ts` → `src/modules/studio/store/`
- `orderStore.ts` → `src/shared/stores/`

### `src/providers/` → `src/shared/providers/`

- Giữ mock và api provider subfolders

### `src/types/` → `src/shared/types/` + module types

- `photo.ts`, `studio.ts` → `src/modules/studio/types/` hoặc `src/modules/photos/types/`
- `account-api.ts`, `order-api.ts` → `src/shared/types/`

### `src/utils/` → `src/shared/utils/`

- `cn.ts` → `tailwind-config/utils/cn.ts` (+ re-export từ `src/shared/utils/`)

### `src/styles/tokens.css` → `tailwind-config/brand/`

## Xóa bỏ backend code

- Không áp dụng ở đây vì `service-sweetpixtiles/web` không có `repositories/` hay `services/`
- Các API call đang dùng `src/lib/api-client.ts` (Axios client) → giữ lại và move vào `src/libs/`

## tsconfig.json — thêm path aliases mới

```json
"paths": {
  "@/*": ["./src/*"],
  "@tailwind-config/*": ["./tailwind-config/*"],
  "@common": ["./common"]
}
```

## Không thay đổi (giữ nguyên)

- `src/app/` — toàn bộ Next.js routing
- `src/middleware.ts`
- `public/`, `tailwind.config.ts`, `next.config.ts`, `package.json`
- Core logic bên trong từng file (chỉ di chuyển vị trí, không rewrite)

