---
name: useForm State Rule
overview: Tạo một Cursor rule cho các tính năng có nhiều state cần quản lý, quy định sử dụng `useForm` từ React Hook Form kết hợp với Zod schema thay vì nhiều `useState` riêng lẻ.
todos:
  - id: create-rule-file
    content: Tạo file .cursor/rules/use-form-for-state.mdc với nội dung rule
    status: pending
isProject: false
---

# Rule: useForm for Multi-State Features

## File sẽ tạo

`.cursor/rules/use-form-for-state.mdc`

## Scope

- `globs: src/**/*.tsx, src/**/*.ts`
- `alwaysApply: false`

## Nội dung rule

Rule sẽ enforce các patterns sau, dựa trên pattern của `[src/modules/auth/hooks/use-signup.ts](src/modules/auth/hooks/use-signup.ts)` và `[src/modules/auth/components/signup/signup-form.tsx](src/modules/auth/components/signup/signup-form.tsx)`:

### Pattern cần enforce

1. **Khi nào dùng `useForm`**: Khi một feature/component có từ 2+ state input cần quản lý (text, checkbox, select...) thay vì dùng nhiều `useState`.
2. **Cấu trúc bắt buộc** (tách ra custom hook):
  - Định nghĩa Zod schema (`xxxSchema`)
  - Infer type từ schema (`type XxxFormData = z.infer<typeof xxxSchema>`)
  - Custom hook (`useXxx`) chứa `useForm` với `zodResolver` và `defaultValues`
  - Export `type UseXxxReturn = ReturnType<typeof useXxx>`
3. **Trong component**: nhận `methods`, `onSubmit`, `isSubmitting` từ hook → dùng `<FormProvider>` bọc form, dùng `RHFInput`/`RHFPassword`/... thay vì input thô.

### Ví dụ BAD vs GOOD trong rule

**BAD**: Nhiều `useState` riêng lẻ trong component

```tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
```

**GOOD**: Custom hook với `useForm` + Zod

```ts
// use-xxx.ts
const xxxSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
export type XxxFormData = z.infer<typeof xxxSchema>;
export const useXxx = () => {
  const methods = useForm<XxxFormData>({ resolver: zodResolver(xxxSchema), defaultValues: { email: "", password: "" } });
  const onSubmit = methods.handleSubmit(async (values) => { ... });
  return { methods, onSubmit, isSubmitting: methods.formState.isSubmitting };
};
export type UseXxxReturn = ReturnType<typeof useXxx>;
```

```tsx
// xxx-form.tsx
export const XxxForm = ({ methods, onSubmit, isSubmitting }: UseXxxReturn) => (
  <FormProvider formMethods={methods} onSubmit={onSubmit}>
    <RHFInput name="email" control={methods.control} ... />
    <Button type="submit" loading={isSubmitting}>Submit</Button>
  </FormProvider>
);
```

