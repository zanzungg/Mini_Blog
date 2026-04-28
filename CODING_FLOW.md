# CODING FLOW

## 1. Kiến trúc

- **Controller**: nhận request và trả response.
- **Service**: xử lý nghiệp vụ.
- **Repository**: truy cập DB qua Prisma.
- **DTO**: validate input.
- **Common/Core**: guard, decorator, pipe, Prisma service,...
- **Prisma**: schema, migration, seed.

## 2. Cấu trúc thư mục

```text
src/
├─ core/
│  └─ database/
├─ common/
│  ├─ decorators/
│  ├─ filters/
│  ├─ guards/
│  ├─ interceptors/
│  └─ pipes/
├─ config/
└─ modules/
  ├─ auth/
  ├─ categories/
  ├─ comments/
  ├─ posts/
  ├─ stats/
  └─ users/

prisma/
├─ schema.prisma
├─ seed.ts
└─ migrations/
```


## 3. Flow chính

Request
→ Controller
→ Guard + Validation
→ Service (business logic)
→ Repository (Prisma)
→ Response
