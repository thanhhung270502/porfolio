# Prompt: Implement New API Endpoint

## Context

This is a Next.js 15 App Router project (Sweetpix) with the following backend stack:
- **Runtime:** Next.js App Router API Routes (`src/app/api/`)
- **Database:** Neon Postgres (serverless) via raw parameterized SQL — no ORM
- **Auth:** Session tokens (UUID) stored in HTTP-only cookies
- **Validation:** Zod (client) + manual checks (server)
- **HTTP Client:** Axios (via custom wrappers in `src/libs/`)
- **Data Fetching:** TanStack React Query

---

## Architecture: 3-Layer Pattern

```
API Route Handler (Controller)   → src/app/api/<resource>/<action>/route.ts
        ↓
Service (Business Logic)         → src/services/<resource>.service.ts
        ↓
Repository (Data Access)         → src/repositories/<resource>.repository.ts
        ↓
Raw SQL                          → src/libs/db.ts  (query<T>(sql, params))
```

**Never skip layers.** Routes call services. Services call repositories. Repositories call `query()`.

---

## Step-by-Step Implementation Checklist

When asked to implement a new API `<METHOD> /api/<resource>/<action>`, follow these steps **in order**:

### 1. Define Types in `common/`

**File:** `common/models/<resource>/<resource>-model.ts`

```typescript
// Request/Response interfaces
export interface <Resource>Request {
  field: string;
}

export interface <Resource>Response {
  id: string;
  field: string;
}

// Raw DB row type (snake_case — matches DB columns)
export interface <Resource>Row {
  id: string;
  field_name: string;
  created_at: Date;
}

// Clean object type (camelCase — returned from repositories/services)
export interface <Resource>Object {
  id: string;
  fieldName: string;
}
```

Export from `common/index.ts`.

---

### 2. Define API Metadata in `common/`

**File:** `common/models/<resource>/<resource>-api-model.ts`

```typescript
import { APIBaseRoutes } from "../../constants";
import type { APIDefinition } from "../api-route-model";
import { APIMethod } from "../api-route-model";
import type { <Resource>Request, <Resource>Response } from "./<resource>-model";

export const API_<RESOURCE>_<ACTION>: APIDefinition = {
  method: APIMethod.POST, // or GET, PUT, PATCH, DELETE
  baseUrl: APIBaseRoutes.<RESOURCE>,  // add to APIBaseRoutes if needed
  subUrl: "/<action>",
  requestBody: {} as <Resource>Request,
  responseBody: {} as <Resource>Response,
  buildUrlPath: () => `${APIBaseRoutes.<RESOURCE>}/<action>`,
};
```

If path has dynamic segments:
```typescript
buildUrlPath: (params: { id: string }) => `${APIBaseRoutes.<RESOURCE>}/${params.id}`,
```

---

### 3. Add Repository

**File:** `src/repositories/<resource>.repository.ts`

```typescript
import type { <Resource>Row, <Resource>Object } from "@common";
import { query } from "@/libs/db";

export const <Resource>Repository = {
  async findById(id: string): Promise<<Resource>Object | null> {
    const result = await query<<Resource>Object>(
      `SELECT id, field_name FROM <table> WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  },

  async create(field: string): Promise<<Resource>Object> {
    const result = await query<<Resource>Object>(
      `INSERT INTO <table> (field_name)
       VALUES ($1)
       RETURNING id, field_name`,
      [field]
    );
    return result.rows[0];
  },

  async update(id: string, field: string): Promise<boolean> {
    const result = await query(
      `UPDATE <table> SET field_name = $1 WHERE id = $2 RETURNING id`,
      [field, id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async delete(id: string): Promise<void> {
    await query(`DELETE FROM <table> WHERE id = $1`, [id]);
  },
};
```

**Rules:**
- Object literal export (not a class)
- Always use parameterized queries (`$1, $2, ...`) — never string interpolation
- Return typed results using `query<T>()`
- Return `null` with `?? null` when a single row is not found
- Return `boolean` from update/delete by checking `rowCount`

---

### 4. Add Service

**File:** `src/services/<resource>.service.ts`

```typescript
import type { <Resource>Object, <Resource>Request } from "@common";
import { <Resource>Repository } from "@/repositories/<resource>.repository";

export const <Resource>Service = {
  async create(data: <Resource>Request): Promise<<Resource>Object> {
    // Business logic: validate, check uniqueness, transform
    const existing = await <Resource>Repository.findByField(data.field);
    if (existing) {
      throw new Error("<Resource> already exists");
    }

    return <Resource>Repository.create(data.field);
  },

  async getById(id: string): Promise<<Resource>Object> {
    const item = await <Resource>Repository.findById(id);
    if (!item) {
      throw new Error("<Resource> not found");
    }
    return item;
  },

  async update(id: string, data: Partial<<Resource>Request>): Promise<<Resource>Object> {
    const updated = await <Resource>Repository.update(id, data.field ?? "");
    if (!updated) {
      throw new Error("<Resource> not found");
    }
    return this.getById(id);
  },

  async delete(id: string): Promise<void> {
    await <Resource>Repository.delete(id);
  },
};
```

**Rules:**
- Object literal export
- Throw `new Error("descriptive message")` for business rule violations
- Error messages are used directly for HTTP status code mapping in routes

---

### 5. Add Route Handler

**File:** `src/app/api/<resource>/<action>/route.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { <Resource>Service } from "@/services/<resource>.service";
import { CookieKeys } from "@/shared/enums/auth.enum";

// POST / PUT / PATCH
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { field } = body;

    // Server-side guard: check required fields
    if (!field) {
      return NextResponse.json(
        { message: "field is required" },
        { status: 400 }
      );
    }

    // (If auth required) extract token from cookie
    const token = request.cookies.get(CookieKeys.ACCESS_TOKEN)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await <Resource>Service.create({ field });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    const status = getStatusFromMessage(message);
    return NextResponse.json({ message }, { status });
  }
}

// GET
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CookieKeys.ACCESS_TOKEN)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const result = await <Resource>Service.getById(id!);
    return NextResponse.json(result);
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    const status = getStatusFromMessage(message);
    return NextResponse.json({ message }, { status });
  }
}

// Dynamic route: src/app/api/<resource>/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(CookieKeys.ACCESS_TOKEN)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await <Resource>Service.delete(params.id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    const message = error?.message || "Internal server error";
    const status = getStatusFromMessage(message);
    return NextResponse.json({ message }, { status });
  }
}

// HTTP status mapping helper (define in each route or move to a shared util)
function getStatusFromMessage(message: string): number {
  if (message.includes("not found")) return 404;
  if (message.includes("already exists") || message.includes("Unauthorized")) return 401;
  if (message.includes("required") || message.includes("invalid")) return 400;
  if (message.includes("Forbidden")) return 403;
  if (message.includes("Conflict")) return 409;
  return 500;
}
```

**Rules:**
- Each HTTP method is a named export (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Extract body via `request.json()`, query params via `new URL(request.url).searchParams`
- Extract auth token from `request.cookies.get(CookieKeys.ACCESS_TOKEN)?.value`
- Always wrap in try-catch; map error messages to HTTP status codes
- Return `NextResponse.json(data, { status })` — always include status explicitly
- HTTP context (cookies, headers) is set **only** at this layer, never in services

---

### 6. Add Client-side API Function

**File:** `src/shared/apis/<resource>.ts`

```typescript
import { getRequest, postRequest, putRequest, delRequest } from "@/libs/api-client";
import { API_<RESOURCE>_<ACTION> } from "@common";
import type { <Resource>Request, <Resource>Response } from "@common";

export const create<Resource> = async (data: <Resource>Request): Promise<<Resource>Response> => {
  const response = await postRequest({
    path: API_<RESOURCE>_<ACTION>.buildUrlPath({}),
    data,
  });
  return response.data;
};

export const get<Resource>ById = async (id: string): Promise<<Resource>Response> => {
  return await getRequest({
    path: API_<RESOURCE>_<ACTION>.buildUrlPath({ id }),
  });
};
```

Export from `src/shared/apis/index.ts`.

---

### 7. Add React Query Hooks

**File:** `src/shared/hooks/data/<resource>.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { asError } from "@/shared/utils/error.util";
import { create<Resource>, get<Resource>ById } from "@/shared/apis";
import type { MutationProps, QueryProps } from "@/shared/types";
import type { <Resource>Request, <Resource>Response } from "@common";

// Query keys
export const <RESOURCE>_KEYS = {
  all: () => ["<resource>"] as const,
  byId: (id: string) => ["<resource>", id] as const,
};

// --- GET ---
export const useQuery<Resource>ById = (id: string, props: QueryProps<<Resource>Response> = {}) => {
  return useQuery({
    queryKey: <RESOURCE>_KEYS.byId(id),
    queryFn: () => get<Resource>ById(id),
    enabled: !!id,
    ...props,
  });
};

// --- CREATE ---
type Create<Resource>MutationProps = MutationProps<<Resource>Response, <Resource>Request>;

export const useCreate<Resource>Mutation = (props: Create<Resource>MutationProps = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create<Resource>,
    onSuccess: async () => {
      toast.success("<Resource> created successfully");
      await queryClient.invalidateQueries({ queryKey: <RESOURCE>_KEYS.all() });
    },
    onError: (error) => {
      toast.error(asError(error).message);
    },
    ...props,
  });
};
```

**Rules:**
- `useQuery` for GET, `useMutation` for POST/PUT/PATCH/DELETE
- Always define query key constants
- `onSuccess`: show toast + invalidate related queries
- `onError`: show toast with `asError(error).message`
- Use `enabled: !!id` to prevent queries with empty params

---

### 8. Add Database Migration (if new table needed)

**File:** `src/libs/migrations-registry.ts` — append to the `migrations` array

```typescript
{
  name: "0XX_create_<table>",
  sql: `
    CREATE TABLE IF NOT EXISTS <table> (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      field_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    DO $body$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_<table>'
      ) THEN
        CREATE TRIGGER set_updated_at_<table>
          BEFORE UPDATE ON <table>
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END
    $body$;

    CREATE INDEX IF NOT EXISTS idx_<table>_user_id ON <table>(user_id);
  `,
},
```

**Rules:**
- Use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for idempotency
- Wrap trigger creation in `DO $body$ BEGIN IF NOT EXISTS ... END $body$`
- Always include `id UUID DEFAULT gen_random_uuid()`, `created_at`, `updated_at`
- Use `REFERENCES` with `ON DELETE CASCADE` or `ON DELETE SET NULL` for FK
- Add index on foreign key columns
- Increment migration name prefix (001, 002, ...)
- Export updated `schema.sql` after running migrations

---

## Invariants (Never Break These)

| Rule | Detail |
|------|--------|
| No ORM | Use raw SQL via `query<T>(sql, params[])` only |
| Parameterized queries | Always `$1, $2` — never template literals in SQL |
| Typed queries | Always `query<RowType>()` — never `query<any>` |
| No business logic in routes | Routes only: extract input → call service → return response |
| No DB calls in services | Services only call repositories, never `query()` directly |
| Error messages drive HTTP status | Services throw `new Error("...")` → routes map message → status |
| Auth via cookie only | Tokens in `httpOnly` cookies — never in body/query params |
| Common types in `common/` | Shared types exported from `common/index.ts`, imported via `@common` |
| API definitions in `common/` | `APIDefinition` objects define method, URL, request/response shape |
| Zod for client validation | `z.object({...})` + `zodResolver` in forms |

---

## File Creation Checklist

For a new resource `<Resource>` with action `<action>`:

- [ ] `common/models/<resource>/<resource>-model.ts` — Request, Response, Row, Object types
- [ ] `common/models/<resource>/<resource>-api-model.ts` — `APIDefinition` constants
- [ ] `common/index.ts` — re-export new types
- [ ] `src/repositories/<resource>.repository.ts` — data access methods
- [ ] `src/services/<resource>.service.ts` — business logic
- [ ] `src/app/api/<resource>/<action>/route.ts` — route handler(s)
- [ ] `src/shared/apis/<resource>.ts` — axios client functions
- [ ] `src/shared/apis/index.ts` — re-export
- [ ] `src/shared/hooks/data/<resource>.ts` — React Query hooks
- [ ] `src/libs/migrations-registry.ts` — migration entry (if new table)
