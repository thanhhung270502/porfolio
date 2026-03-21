---
name: Add axios react-query stack
overview: Thêm axios + @tanstack/react-query vào dự án `service-sweetpixtiles/web` sau khi refactor structure, áp dụng pattern API layer → hooks layer giống `sweetpix-base`, đồng thời chuẩn hóa lại cách dùng zustand chỉ cho UI/client state.
todos:
  - id: install-deps
    content: Cài axios, @tanstack/react-query, @tanstack/react-query-devtools, @tanstack/react-query-next-experimental
    status: pending
  - id: create-axios-client
    content: Tạo src/libs/axios-client.ts (factory) và src/libs/api-client.ts (getRequest/postRequest/... wrappers)
    status: pending
  - id: create-query-client-util
    content: "Tạo src/shared/utils/query-client.util.ts: makeQueryClient, QueryProps, MutationProps types, re-export tanstack hooks"
    status: pending
  - id: create-query-provider
    content: Tạo src/shared/providers/query.provider.tsx với QueryClientProvider + ReactQueryStreamedHydration + DevTools
    status: pending
  - id: create-query-keys
    content: Tạo src/shared/constants/query-keys.constant.ts cho USER_KEYS, CART_KEYS, ORDER_KEYS, PRODUCT_KEYS
    status: pending
  - id: create-api-functions
    content: Tạo src/shared/apis/ với pure async functions cho từng domain (auth, cart, orders, products, uploads)
    status: pending
  - id: create-data-hooks
    content: Tạo src/shared/hooks/data/ với useQuery/useMutation hooks cho từng domain
    status: pending
  - id: refactor-zustand-stores
    content: "Chuẩn hóa zustand stores: chỉ giữ UI/client state (editor, studio, wallBuilder, authModal), xóa server-state khỏi stores"
    status: pending
  - id: remove-old-providers
    content: Xóa src/providers/ (mock + api pattern cũ) sau khi react-query đã thay thế
    status: pending
  - id: update-layout
    content: "Cập nhật src/app/layout.tsx: wrap với QueryProvider, cập nhật AuthHydrator dùng useQueryMe"
    status: pending
  - id: update-components
    content: Cập nhật các components thay thế provider-based data access bằng useQuery/useMutation hooks mới
    status: pending
  - id: add-error-handling
    content: Thêm asError util và global error boundary/toast cho react-query onError callbacks
    status: pending
isProject: false
---

# Thêm Axios + React-Query + Zustand vào sweetpixtiles/web

## Bối cảnh

Dự án hiện tại dùng `zustand` (provider-based pattern với mock/api providers) để xử lý cả server state lẫn client state. Sau khi refactor structure xong, cần tách biệt:

- **Server state** (data từ API) → `@tanstack/react-query`
- **Client/UI state** (auth modal, cart items, editor state) → `zustand`
- **HTTP requests** → `axios` thông qua wrapper `api-client`

## Kiến trúc mục tiêu

```
src/
  libs/
    api-client.ts         # Axios instance wrapper (GET/POST/PUT/PATCH/DELETE)
    axios-client.ts       # createAxios factory
  shared/
    apis/                 # Pure async functions gọi API (không có React)
      auth.ts
      cart.ts
      orders.ts
      ...
    hooks/
      data/               # useQuery / useMutation hooks
        auth.ts           # useLoginMutation, useQueryMe, ...
        cart.ts
        orders.ts
        ...
    utils/
      query-client.util.ts  # makeQueryClient, QueryProps, MutationProps types
    providers/
      query.provider.tsx    # QueryClientProvider wrapper
    stores/               # Zustand — chỉ client/UI state
      auth.store.ts         # isAuthOpen, sessionRefreshTrigger
      cart.store.ts         # cart items (local state khi chưa có API)
      editor.store.ts
      studio.store.ts
      ...
  modules/[feature]/
    hooks/                # Feature-specific useQuery/useMutation
```

## Các bước thực hiện

### 1. Cài đặt dependencies

```bash
npm install axios @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-query-next-experimental
```

### 2. Tạo Axios client (`src/libs/`)

Copy pattern từ `sweetpix-base/src/libs/api-client.ts`:

- `axios-client.ts` — factory tạo Axios instance với baseURL từ `NEXT_PUBLIC_API_BASE_URL`, interceptors xử lý token, 401 refresh
- `api-client.ts` — export `getRequest`, `postRequest`, `putRequest`, `patchRequest`, `deleteRequest`

Khác biệt so với sweetpix-base: không cần server-side `api-server.ts` vì không có Next.js API routes (backend riêng).

### 3. Tạo Query Client (`src/shared/utils/query-client.util.ts`)

```typescript
// Pattern copy từ sweetpix-base
export type QueryProps<Response, Input = null> = ...
export type MutationProps<Response, Input = unknown> = ...
export const makeQueryClient = () => new QueryClient({ defaultOptions: { queries: { staleTime: 5min, retry: false } } })
export { useQuery, useMutation, useQueryClient, useInfiniteQuery, ... }
```

### 4. Tạo QueryProvider (`src/shared/providers/query.provider.tsx`)

Wrap toàn bộ app với `QueryClientProvider` + `ReactQueryStreamedHydration` + `ReactQueryDevtools`.

### 5. Tạo API functions (`src/shared/apis/`)

Mỗi file export các pure async functions gọi HTTP:

```typescript
// src/shared/apis/auth.ts
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await postRequest({ path: '/api/auth/login', data });
  return res.data;
};
export const getMe = async (): Promise<UserObject> => { ... }
```

Các domain cần tạo: `auth`, `cart`, `orders`, `products`, `uploads`, v.v. (tùy theo backend API)

### 6. Tạo data hooks (`src/shared/hooks/data/`)

```typescript
// src/shared/hooks/data/auth.ts
export const useLoginMutation = (props?) => useMutation({
  mutationFn: login,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_KEYS.me() }),
  onError: (err) => toast.error(asError(err).message),
  ...props,
});

export const useQueryMe = (props?) => useQuery({
  queryKey: USER_KEYS.me(),
  queryFn: getMe,
  ...props,
});
```

### 7. Tạo query keys constants (`src/shared/constants/query-keys.constant.ts`)

```typescript
export const USER_KEYS = {
  all: () => ['user'] as const,
  me: () => [...USER_KEYS.all(), 'me'] as const,
};
export const CART_KEYS = { ... }
export const ORDER_KEYS = { ... }
```

### 8. Chuẩn hóa Zustand — chỉ giữ client/UI state

**Giữ lại trong zustand (client state):**

- `editorStore` — trạng thái editor canvas (active tile, filters, crop, ...)
- `studioStore` — sidebar mode, panel visibility
- `wallBuilderStore` — gallery wall layout builder state

**Chuyển sang react-query (server state):**

- `cartStore` (nếu cart được persist trên server) → `useCartQuery` + `useCartMutation`
- `orderStore` → `useOrderQuery`
- `authStore` (user data) → `useQueryMe`

**authStore zustand chỉ giữ:**

- `isAuthModalOpen: boolean`
- `sessionRefreshTrigger: number`

### 9. Loại bỏ Provider pattern cũ

Xóa `src/providers/` (mock/, api/, types.ts) sau khi đã chuyển sang react-query. Đây là pattern cũ dùng để inject data, không cần thiết khi có react-query cache.

### 10. Cập nhật `src/app/layout.tsx`

Wrap root layout với `QueryProvider`:

```tsx
<QueryProvider>
  <AuthHydrator />
  {children}
</QueryProvider>
```

## Thứ tự ưu tiên migrate

1. **Auth** (login/logout/me) — quan trọng nhất, nhiều component phụ thuộc
2. **Cart** — state được dùng nhiều trong UI
3. **Orders** — read-heavy, hưởng lợi nhiều từ caching
4. **Products/Templates** — public data, cache tốt với staleTime dài
5. **Studio/Editor** — giữ zustand cho local UI state

