# Nên viết Unit Test cho file nào ở dự án Ecom NestJs?

Ở chương Testing cơ bản, mình đã hướng dẫn viết Unit Test cho repository, service, controller, function tiện ích...

Nhưng trong một dự án thực tế, thời gian coding là có hạn, không nên viết Unit Test cho tất cả các file.

Đảm bảo **100% coverage** là không thực tế và không cần thiết.

Nên ưu tiên Unit test logic nghiệp vụ quan trọng

Vậy nên cần nhìn vào source thực tế mà chọn file để viết unit test.

Ví dụ trong auth routes

## Không cần viết unit test cho

`auth.module.ts`

Không cần viết unit test cho file này vì nó chỉ để cấu hình module, không có logic nghiệp vụ.

`auth.controller.ts`

- Không có business logic
- Chỉ nhận request → gọi service → trả response
- Logic đã được test ở service layer

`auth.repo.ts`

- Chỉ là wrapper của Prisma
- Tốn thời gian, ít giá trị

`auth.model.ts`

- Chỉ chứa Zod schemas và type definitions
- Logic validation đã được Zod xử lý
- Nếu muốn test, nên test ở service level khi dùng schemas này

`auth.dto.ts`

- Chỉ là wrapper của Zod schemas thành DTOs cho NestJS
- Không có logic riêng
- Validation được test tự động qua integration tests

`auth.error.ts`

- Chỉ là constants/factory cho exceptions
- Không có logic phức tạp
- Được test gián tiếp qua service tests

## Nên tập trung Unit test vào

Các file service (`auth.service.ts`, `google.service.ts`)
