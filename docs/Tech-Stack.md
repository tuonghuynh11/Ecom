# Tech stack

## Tổng quan

Đây là backend REST API cho hệ thống thương mại điện tử, được xây dựng theo kiến trúc module của NestJS. Hệ thống cung cấp các nhóm chức năng chính: xác thực và phân quyền, quản lý người dùng/sản phẩm/đơn hàng, giỏ hàng, thanh toán, đánh giá, đa ngôn ngữ, upload media, thông báo thời gian thực và xử lý tác vụ nền.

## Nền tảng và kiến trúc

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Ngôn ngữ | TypeScript 5 | Tăng tính an toàn kiểu dữ liệu và khả năng bảo trì. |
| Runtime | Node.js | Môi trường chạy phía máy chủ. |
| Framework | NestJS 11 | Tổ chức ứng dụng theo module, controller, service, guard, pipe và interceptor. |
| Kiến trúc API | REST API | API có tiền tố `/api`; tài liệu tương tác được cung cấp tại `/api-docs`. |
| Thời gian thực | Socket.IO | Gateway cho chat và cập nhật thanh toán theo thời gian thực. |

## Dữ liệu và đồng bộ

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Cơ sở dữ liệu chính | PostgreSQL | Lưu trữ dữ liệu nghiệp vụ: người dùng, quyền, sản phẩm, SKU, giỏ hàng, đơn hàng, thanh toán, đánh giá và tin nhắn. |
| ORM | Prisma ORM 7 + `@prisma/adapter-pg` | Định nghĩa schema, truy cập PostgreSQL có type-safety và sinh Prisma Client. |
| Bộ nhớ đệm | Redis + Keyv | Cache dùng chung cho ứng dụng thông qua Nest Cache Manager. |
| Hàng đợi | BullMQ + `@nestjs/bullmq` | Xử lý tác vụ bất đồng bộ, hiện có consumer cho luồng thanh toán. |
| Phân tán/locking | Redlock | Đồng bộ các thao tác cần khóa phân tán khi chạy nhiều instance. |
| Kiểm soát cạnh tranh | Optimistic locking | Chiến lược được tài liệu hóa để xử lý các luồng cập nhật dữ liệu cạnh tranh. |
| Scheduler | `@nestjs/schedule` | Chạy cronjob, ví dụ dọn refresh token hết hạn. |

Redis còn được dùng bởi Socket.IO Redis Adapter để phát sự kiện WebSocket nhất quán giữa nhiều instance API.

## Xác thực và bảo mật

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Authentication | JWT access token và refresh token | Xác thực phiên đăng nhập; refresh token được gắn với thiết bị. |
| Authorization | RBAC | Phân quyền dựa trên role và permission theo HTTP method/đường dẫn. |
| Mật khẩu | bcrypt | Băm mật khẩu trước khi lưu trữ. |
| Xác thực hai lớp | TOTP (`otpauth`) | Hỗ trợ 2FA cho tài khoản. |
| Đăng nhập bên thứ ba | Google OAuth (`googleapis`) | Tích hợp xác thực bằng tài khoản Google. |
| HTTP headers | Helmet | Thiết lập các security header cơ bản. |
| Rate limiting | `@nestjs/throttler` | Hạn chế tần suất request theo nhiều mức thời gian; có guard hỗ trợ môi trường sau proxy. |
| CORS | NestJS CORS | Cho phép client truy cập API theo cấu hình ứng dụng. |
| Cấu hình môi trường | dotenv + Zod | Nạp và kiểm tra bắt buộc các biến môi trường khi ứng dụng khởi động. |

## Validation, API contract và tài liệu

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Validation | Zod + `nestjs-zod` | Kiểm tra DTO đầu vào bằng global validation pipe. |
| Serialization | `nestjs-zod` | Chuẩn hóa và lọc dữ liệu phản hồi qua serializer interceptor. |
| API documentation | Swagger / OpenAPI (`@nestjs/swagger`) | Sinh tài liệu API, hỗ trợ Bearer token và API key cho endpoint thanh toán. |
| Internationalization | `nestjs-i18n` | Hỗ trợ tiếng Anh và tiếng Việt; xác định ngôn ngữ qua query `lang` hoặc header `Accept-Language`. |

## Tích hợp dịch vụ ngoài

| Dịch vụ | Công nghệ | Vai trò |
| --- | --- | --- |
| Lưu trữ media | AWS S3 SDK v3 | Upload multipart, tạo URL ký sẵn và quản lý file media. |
| Email | Resend + React Email | Gửi email giao dịch/OTP với template email. |
| Thanh toán | SePay Webhook + VietQR + Payment API key | Nhận giao dịch chuyển khoản qua webhook SePay, tạo mã VietQR, xác thực webhook bằng API key và đối soát trạng thái thanh toán. |

## Logging, kiểm thử và chất lượng mã

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Logging | Pino + `nestjs-pino` | Log HTTP có request ID, phân cấp mức log và che các trường nhạy cảm như token/mật khẩu. |
| Hiển thị log khi phát triển | `pino-pretty` | Định dạng log dễ đọc trên terminal. |
| Testing | Jest + ts-jest | Unit testing cho các thành phần nghiệp vụ của ứng dụng. |
| Linting | ESLint | Phát hiện và tự động sửa các vấn đề mã nguồn. |
| Formatting | Prettier | Chuẩn hóa định dạng TypeScript. |
| Build/CLI | Nest CLI, ts-node, tsconfig-paths | Build, chạy development và hỗ trợ script/seed TypeScript. |

## Hạ tầng triển khai

- Docker là lựa chọn phù hợp để đóng gói API cùng PostgreSQL và Redis, giúp đồng nhất môi trường phát triển và triển khai. Hiện repository chưa chứa `Dockerfile` hoặc file Docker Compose, vì vậy đây là định hướng hạ tầng chứ chưa phải cấu hình đã được triển khai trong mã nguồn.
- Ứng dụng nhận cấu hình qua file `.env`, bao gồm kết nối PostgreSQL/Redis, JWT, S3, Resend, Google OAuth và thông tin thanh toán.
- Trong môi trường Linux production, log Pino được ghi vào `logs/app.log`; xem hướng dẫn xoay log tại [About.md](About.md).

## Sơ đồ thành phần

```text
Client (Web/Mobile)
        │ HTTP REST / Socket.IO
        ▼
NestJS API
 ├── Swagger · Zod · i18n · Helmet · Throttler · Pino
 ├── Authentication / JWT / RBAC / 2FA / Google OAuth
 ├── Prisma ──────────────────────────────► PostgreSQL
 ├── Cache · BullMQ · Redlock · Socket.IO Adapter ─► Redis
 ├── Worker / Cronjob / SePay webhook
 ├── Media service ───────────────────────► AWS S3
 ├── Email service ───────────────────────► Resend
 └── Payment webhook ◄──────────────────── SePay
```

## Phiên bản chính

Các phiên bản dưới đây được lấy từ `package.json` tại thời điểm cập nhật tài liệu:

- NestJS 11, Prisma 7, BullMQ 6, Socket.IO 4.
- Zod 4, Pino/NestJS Pino 4, Jest 30 và TypeScript 5.
- AWS SDK for JavaScript v3, Redis client 6 và PostgreSQL thông qua Prisma adapter `pg`.
