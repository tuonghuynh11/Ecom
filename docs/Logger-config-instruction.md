# Logger: Pino

Ứng dụng ghi log vào file `logs/app.log`. Trên môi trường production Linux, nên dùng
`logrotate` để giới hạn kích thước file và lưu các bản log cũ.

## 1. Xác định đường dẫn tuyệt đối của file log

Trong thư mục dự án, chạy:

```bash
realpath logs/app.log
```

Ví dụ kết quả:

```text
/var/www/ecom/logs/app.log
```

Đường dẫn trong cấu hình logrotate bắt buộc phải là đường dẫn tuyệt đối. Các ví dụ
bên dưới sử dụng `/var/www/ecom/logs/app.log`; hãy thay nó bằng đường dẫn thực tế
trên server.

## 2. Cài đặt logrotate

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install logrotate
```

Rocky Linux/AlmaLinux/CentOS/RHEL:

```bash
sudo dnf install logrotate
```

## 3. Tạo cấu hình cho ứng dụng

Tạo file `/etc/logrotate.d/ecom`:

```bash
sudo nano /etc/logrotate.d/ecom
```

Thêm nội dung sau:

```conf
/var/www/ecom/logs/app.log {
    daily
    maxsize 20M
    rotate 14

    missingok
    notifempty

    dateext
    dateformat -%Y%m%d-%H%M%S
    compress
    delaycompress

    copytruncate
}
```

Ý nghĩa:

- `daily`: rotate log mỗi ngày khi logrotate được scheduler gọi.
- `maxsize 20M`: cho phép rotate sớm nếu file lớn hơn 20 MB.
- `rotate 14`: giữ tối đa 14 bản log cũ.
- `missingok`: không báo lỗi nếu `app.log` chưa tồn tại.
- `notifempty`: không rotate file rỗng.
- `dateext`: thêm ngày vào tên file đã rotate.
- `compress`: nén các bản log cũ thành `.gz`.
- `delaycompress`: trì hoãn nén bản vừa được rotate gần nhất.
- `copytruncate`: sao chép log sang file cũ rồi làm rỗng `app.log`. Pino có thể
  tiếp tục ghi vào cùng file mà không cần restart ứng dụng.

> `maxsize` không tự theo dõi file liên tục. File chỉ được kiểm tra khi service hoặc
> cron của logrotate chạy. Muốn giới hạn kích thước sát hơn, hãy cấu hình scheduler
> gọi logrotate thường xuyên hơn.

Nếu logrotate báo thư mục cha có quyền không an toàn, hoặc ứng dụng chạy bằng user
riêng (ví dụ user và group đều là `ecom`), thêm dòng này ngay sau dấu `{`:

```conf
    su ecom ecom
```

Không thêm `create` khi đang dùng `copytruncate`, vì `app.log` hiện tại không bị xóa
và tạo lại.

## 4. Kiểm tra cấu hình

Kiểm tra thử mà không thay đổi file log:

```bash
sudo logrotate --debug /etc/logrotate.d/ecom
```

Ép rotate ngay để kiểm thử:

```bash
sudo logrotate --force --verbose /etc/logrotate.d/ecom
```

Kiểm tra kết quả:

```bash
ls -lh /var/www/ecom/logs
```

Kết quả dự kiến:

```text
app.log
app.log-20260828-143000
```

Sau đó gọi một API của ứng dụng và xác nhận Pino vẫn ghi log mới:

```bash
tail -f /var/www/ecom/logs/app.log
```

## 5. Kiểm tra lịch chạy tự động

Trên hệ thống dùng systemd:

```bash
systemctl status logrotate.timer
systemctl list-timers logrotate.timer
```

Nếu timer chưa chạy:

```bash
sudo systemctl enable --now logrotate.timer
```

Một số bản Linux dùng cron thay vì systemd timer. Có thể kiểm tra file
`/etc/cron.daily/logrotate`.

## 6. Test trong môi trường dev

Để test nhanh, tạm giảm `maxsize` xuống `1K` và `rotate` xuống `3`:

```conf
/var/www/ecom/logs/app.log {
    maxsize 1K
    rotate 3
    missingok
    notifempty
    dateext
    nocompress
    copytruncate
}
```

Chạy `npm run start:dev`, gọi API nhiều lần để tạo log, rồi thực hiện:

```bash
sudo logrotate --force --verbose /etc/logrotate.d/ecom
```

Sau khi kiểm thử xong, khôi phục cấu hình production (`daily`, `maxsize 20M`,
`rotate 14`, `compress` và `delaycompress`).

`logrotate` là công cụ Linux. Nếu phát triển trên Windows, hãy kiểm thử trong WSL,
Docker Linux hoặc server dev/staging; PowerShell không có `logrotate` mặc định.

## Lưu ý về `copytruncate`

`copytruncate` đơn giản và phù hợp với `pino/file`, nhưng một lượng rất nhỏ log có
thể bị mất trong khoảng thời gian sao chép rồi truncate. Với yêu cầu không được mất
log, nên chuyển sang ghi log ra stdout để Docker/systemd thu thập, hoặc dùng một
transport có cơ chế reopen/rotate file chuyên dụng.
