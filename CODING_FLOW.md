# CODING FLOW (MINIMAL)

## 1. Kiến trúc

- **Controller**: nhận request, trả response  
- **Service**: xử lý nghiệp vụ  
- **Repository**: truy cập DB (Prisma)  
- **DTO**: validate input  
- **Common/Core**: guard, decorator, prisma,...
- **Prisma**: schema + migration + seed  

---

## 2. Cấu trúc


src/
├─ core/database (prisma)
├─ common (guard, decorator, pipe...)
└─ modules/
├─ posts
├─ users
├─ comments
└─ ...
prisma/
├─ schema.prisma
├─ migrations/
└─ seed.ts


---

## 3. Flow chính


Request
→ Controller
→ Guard + Validation
→ Service (business logic)
→ Repository (Prisma)
→ Response


---

## 4. Posts flow

### Create
- validate DTO  
- check category  
- generate slug  
- create post  

### Update
- check ownership/admin  
- block nếu published  
- update + regenerate slug nếu cần  

### Publish
- check quyền  
- validate content  
- set `published = true`  

### Delete
- check quyền  
- soft delete (`deletedAt`)  

### List / Detail
- query + pagination  
- map public response  

---

## 5. Prisma rules

- **Soft delete**: `deletedAt != null` = deleted  
- Luôn filter `deletedAt: null`  
- **Unique**: `slug + deletedAt`  
- **Index**: `authorId`, `categoryId`, `published`, `createdAt`  

---

## 6. Repository responsibility

**Chỉ gồm:**
- create / update / delete  
- find / count  
- transaction  

**Không gồm:**
- validate  
- permission  
- business rule  

---

## 7. Khi thêm feature

1. Update schema (nếu cần)  
2. Migration + generate  
3. Tạo DTO  
4. Viết logic ở service  
5. Gọi DB qua repository  
6. Expose controller  
7. Thêm guard/role nếu cần  

---

## 8. Summary

Controller = entry point
Service = business logic
Repository = data access
Prisma = database layer
