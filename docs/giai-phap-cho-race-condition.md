## 1. **Pessimistic Lock (SELECT ... FOR UPDATE)**

### Ưu điểm

- **An toàn tuyệt đối:** Không xảy ra oversell, race condition vì chỉ một transaction được thao tác trên bản ghi tại một thời điểm.
- **Đơn giản về mặt logic:** Không cần xử lý retry ở tầng ứng dụng.

### Nhược điểm

- **Hiệu suất thấp khi nhiều người cùng thao tác:** Các transaction khác sẽ bị block/chờ, dễ gây nghẽn cổ chai.
- **Nguy cơ deadlock:** Nếu lock nhiều bản ghi theo thứ tự khác nhau.
- **Không scale tốt:** Chỉ hiệu quả khi dùng 1 DB, không phù hợp với hệ thống phân tán nhiều DB.
- **Chỉ hỗ trợ tốt trên một số DB (Postgres, MySQL).**

### Khi nào nên dùng?

- Khi số lượng xung đột thấp, hệ thống nhỏ hoặc vừa.
- Khi cần đảm bảo tuyệt đối không oversell (ví dụ: bán vé sự kiện, flash sale nhỏ).
- Khi chỉ chạy 1 instance app hoặc 1 DB.

---

## 2. **Optimistic Lock (Kiểm tra version/updatedAt)**

### Ưu điểm

- **Hiệu suất cao:** Không block transaction khác, phù hợp hệ thống nhiều đọc, ít ghi xung đột.
- **Dễ scale:** Không phụ thuộc vào lock DB, dễ mở rộng nhiều instance app.
- **Triển khai đơn giản:** Chỉ cần thêm trường version/updatedAt.

### Nhược điểm

- **Có thể xảy ra lỗi khi xung đột:** Nếu nhiều người cùng thao tác, sẽ có request bị lỗi version conflict, cần retry ở frontend.
- **Cần xử lý retry ở tầng ứng dụng hoặc báo lỗi cho người dùng.**
- **Không phù hợp cho thao tác ghi xung đột cao (flash sale lớn).**

### Khi nào nên dùng?

- Khi hệ thống chủ yếu là đọc, ít ghi xung đột.
- Khi cần scale out nhiều instance app.
- Khi chấp nhận được việc một số request bị lỗi và retry.

---

## 3. **Redlock (Distributed Redis Lock)**

### Ưu điểm

- **Phù hợp hệ thống phân tán:** Đảm bảo chỉ một tiến trình thao tác trên tài nguyên dù chạy nhiều instance app/server.
- **Không phụ thuộc DB:** Có thể dùng với bất kỳ DB nào.
- **Hiệu suất cao hơn pessimistic lock khi scale out.**

### Nhược điểm

- **Không tuyệt đối an toàn:** Nếu lock Redis hết hạn trước khi transaction xong, vẫn có thể xảy ra race condition.
- **Cần quản lý thời gian lock, gia hạn lock nếu transaction lâu.**
- **Phức tạp hơn về mặt triển khai và vận hành Redis.**
- **Nếu Redis cluster gặp sự cố, có thể ảnh hưởng đến logic lock.**

### Khi nào nên dùng?

- Khi hệ thống chạy nhiều instance app, cần lock phân tán.
- Khi DB không hỗ trợ tốt pessimistic lock hoặc cần lock ngoài DB.
- Khi thao tác ghi xung đột vừa phải, transaction xử lý nhanh.
- Khi muốn kiểm soát lock ở tầng ứng dụng.

---

## **Tóm tắt bảng so sánh**

| Tiêu chí      | Pessimistic Lock      | Optimistic Lock     | Redlock (Redis Lock)         |
| ------------- | --------------------- | ------------------- | ---------------------------- |
| Độ an toàn    | Tuyệt đối             | Cao (nếu retry tốt) | Cao (nếu lock không hết hạn) |
| Hiệu suất     | Thấp nếu xung đột cao | Cao                 | Cao nếu lock hợp lý          |
| Scale out     | Kém                   | Tốt                 | Tốt                          |
| Độ phức tạp   | Trung bình            | Thấp                | Cao                          |
| Dễ triển khai | Dễ với 1 DB           | Dễ                  | Cần Redis, code phức tạp     |
| Retry         | Không cần             | Cần ở frontend      | Có thể cần ở frontend        |
| Deadlock      | Có thể xảy ra         | Không               | Không                        |

---

## **Khi nào dùng?**

- **Pessimistic lock:**  
  Hệ thống nhỏ, ít xung đột, cần an toàn tuyệt đối, chỉ 1 DB.

- **Optimistic lock:**  
  Hệ thống lớn, nhiều instance, chủ yếu đọc, ít ghi xung đột, chấp nhận retry.

- **Redlock:**  
  Hệ thống phân tán, nhiều instance, cần lock ngoài DB, thao tác ghi vừa phải, transaction nhanh.

---

**Tóm lại:**

- Hệ thống nhỏ, ít xung đột: **Pessimistic lock**.
- Hệ thống lớn, scale out, ít xung đột: **Optimistic lock**.
- Hệ thống phân tán, nhiều instance, cần lock ngoài DB: **Redlock**.
