# Environment Variables

## Các biến môi trường cần thiết

Tạo file `.env.local` trong thư mục `frontend/` với các biến sau:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Loyalty API URL
NEXT_PUBLIC_LOYALTY_API_URL=https://loyaltyapi.vmt.vn
```

## Mô tả

- `NEXT_PUBLIC_API_URL`: URL của backend API (mặc định: `http://localhost:3000`)
- `NEXT_PUBLIC_LOYALTY_API_URL`: URL của Loyalty API (mặc định: `https://loyaltyapi.vmt.vn`)

Lưu ý: Các biến môi trường có prefix `NEXT_PUBLIC_` sẽ được expose ra client-side trong Next.js.

