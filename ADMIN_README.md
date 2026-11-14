# Khu vực Quản trị KDT-89 (`/admin`)

Tài liệu hướng dẫn vận hành khu vực quản trị riêng tại `/admin` cho hệ thống **Quà Tặng KDT-89**, tách biệt hoàn toàn với trang bán hàng khách hàng tại `/`.

---

## 1. Cách truy cập và đăng nhập Admin

- **Trang khách hàng:** `/` (chỉ hiển thị giao diện bán hàng, không có thanh công cụ, nút sửa giá, nút đổi ảnh hay nút đăng nhập admin).
- **Trang quản trị:** `/admin`
- **Phương thức xác thực:** Chỉ dùng **Firebase Google Authentication** với tài khoản email chủ sở hữu `nguyminhtuan10C2@gmail.com` (`emailVerified === true`).
- **Đã loại bỏ toàn bộ cửa hậu cũ:** Không còn hỗ trợ `?admin=true`, `?admin=89`, `#admin`, cookie `kdt89_admin`, `localStorage`, hay mã PIN cứng (`89`, `1234`, `admin`).

---

## 2. Các phân hệ trong `/admin`

1. **Tổng quan (Dashboard):** Thống kê nhanh số lượng sản phẩm đang hiển thị, đang ẩn, đã xóa mềm (soft-delete), phân bổ nguồn (Gốc / Đã chỉnh sửa / Nhập thêm), số đơn hàng mới, danh mục và ảnh tùy chỉnh.
2. **Quản lý sản phẩm:**
   - Tìm kiếm theo tên, mã model hoặc ID sản phẩm.
   - Lọc theo danh mục, trạng thái hiển thị (`Đang hoạt động`, `Đang hiển thị`, `Đang ẩn`, `Đã xóa mềm`, `Tất cả`) và nguồn dữ liệu (`Gốc`, `Đã sửa`, `Nhập thêm`).
   - Cập nhật nhanh **Tồn kho** trực tiếp trên bảng (`stockStatus`).
   - Thêm sản phẩm mới, Sửa chi tiết, Sửa giá (`ProductPriceModal`), Đổi ảnh (`ImageUpdateModal`), Ẩn/Hiện, Xóa mềm (`deletedProductIds`) và Khôi phục. Không xóa vĩnh viễn dữ liệu gốc trong `src/data/products.ts`.
3. **Quản lý danh mục:** Thêm danh mục mới, chỉnh sửa tiêu đề/mô tả/tagline, xóa mềm/khôi phục hoặc khôi phục về mặc định ban đầu.
4. **Nhập / Xuất & Sao lưu dữ liệu:** Xuất file và nhập hàng loạt an toàn (chi tiết ở mục 3 & 4).
5. **Quản lý đơn hàng:** Tìm kiếm, lọc trạng thái (`Mới`, `Đã liên hệ`, `Đang giao`, `Hoàn thành`, `Đã hủy`), cập nhật trạng thái xử lý, gọi/Zalo/mail khách và xuất CSV đơn hàng.
6. **Cài đặt Website:** Mở bộ chỉnh sửa nội dung văn bản & SEO, giao diện hiệu ứng/đếm ngược flash sale, bật/tắt các khối trên trang, và đổi Logo / Ảnh Hero.

---

## 3. Xuất dữ liệu & Xử lý ảnh Data URL lớn

Các nút xuất dữ liệu trong `/admin` **chỉ đọc trạng thái hiện tại trên trình duyệt và tải file về máy, tuyệt đối không ghi ngược lên Firebase**:

1. **Xuất CSV (`UTF-8 BOM`)**: Tương thích mở trực tiếp bằng Microsoft Excel (không lỗi font tiếng Việt) và Google Sheets.
2. **Xuất TSV (`Tab-separated`)**: Dễ copy/dán trực tiếp vào Google Sheets.
3. **Xuất JSON đầy đủ danh sách sản phẩm**: Bao gồm đầy đủ trường dữ liệu (`id`, `name`, `modelCode`, `category`, `programPrice`, `referencePrice`, `discountPercent`, `image`, `imageRef`, `gift`, `warranty`, `badge`, `specs`, `highlights`, `stockStatus`, `isVisible`, `isHidden`, `isDeleted`, `sourceType`, `isOriginal`, `isEdited`, `isCustom`, `hasCustomImage`).
4. **Xuất sao lưu cấu hình `settings/site`**: Tải toàn bộ JSON cấu hình hiện tại đang lưu trên Firestore `settings/site` để lưu trữ dự phòng.

**Xử lý an toàn đối với ảnh `data:image/...` dung lượng lớn:**
- Nếu sản phẩm có ảnh dạng `data:image/...` dài hơn 512 ký tự (ảnh upload nén lưu tại Firestore `custom_images/{id}`), file CSV/TSV/JSON sẽ **tự động thay chuỗi base64 dài** bằng tham chiếu gọn: `[data-url-firestore:custom_images/<id> (~XKB)]` ở cột ảnh (và ghi rõ ở `imageRef`), tránh làm treo Excel/Google Sheets hoặc phình dung lượng file xuất.

---

## 4. Quy trình Nhập (Import) sản phẩm an toàn (12 quy tắc)

1. Chọn file `.csv`, `.tsv`, `.json` hoặc dán trực tiếp nội dung dữ liệu bảng vào ô nhập.
2. **Khớp sản phẩm hiện có:** Ưu tiên khớp theo `id`; nếu không có hoặc không trùng `id`, kiểm tra tiếp theo `modelCode` (không phân biệt hoa thường).
3. **Chống trùng lặp trong file:** Nếu file import chứa nhiều dòng trùng `id` hoặc trùng `modelCode`, các dòng trùng sau sẽ được gắn cờ `Trùng lặp trong file` và bỏ qua khi ghi.
4. **Kiểm tra dữ liệu hợp lệ:** Bắt buộc có `name` (và cần ít nhất `category` + `programPrice` hợp lệ cho sản phẩm mới). Giá hợp lệ hoặc chuỗi giá chuẩn (`1.400.000đ`).
5. **Xem trước trước khi ghi (Preview-before-write):** Hiển thị bảng phân loại rõ ràng từng dòng (`Thêm mới`, `Cập nhật`, `Không đổi`, `Trùng lặp`, `Lỗi`) — **tuyệt đối không ghi lên Firebase trước khi bạn xác nhận**.
6. **Không xóa sản phẩm thiếu trong file:** Các sản phẩm hiện có nhưng không nằm trong file import sẽ giữ nguyên hoàn toàn.
7. **Không ghi đè trống các trường bỏ qua:** Khi cập nhật sản phẩm đã tồn tại, những cột để trống hoặc không có trong file import (kể cả ảnh/thông số) sẽ giữ nguyên giá trị cũ.
8. **Không mất ảnh tùy chỉnh trong `custom_images`:** Các chuỗi tham chiếu `[data-url-firestore:...]` hoặc ô ảnh trống không ghi đè ảnh đang lưu trong `custom_images`.
9. **Gợi ý sao lưu trước khi ghi:** Nút **"Tải sao lưu settings/site"** luôn sẵn sàng ngay cạnh nút xác nhận import.
10. **Ghi nguyên tử 1 lần (Atomic Batch Patch):** Toàn bộ thay đổi hợp lệ được gộp thành **1 lần ghi duy nhất** vào `settings/site` kèm kiểm tra ngưỡng giới hạn `< 900 KB` của Firestore document.
11. **Không tự tạo dữ liệu mẫu:** Hệ thống không tự chèn sản phẩm test vào production.
12. **Báo cáo kết quả chi tiết:** Sau khi ghi thành công, giao diện hiển thị chính xác số lượng **Đã thêm mới / Đã cập nhật / Đã bỏ qua (trùng/lỗi)**.

---

## 5. Cách khôi phục (Rollback) từ file sao lưu `settings/site`

Nếu sau khi chỉnh sửa hàng loạt muốn quay về cấu hình trước đó:
1. Mở file `kdt89-settings-site-backup-YYYY-MM-DD.json` đã tải về trước khi thao tác.
2. Tại **Firebase Console → Firestore Database** (`databaseId`: `ai-studio-kdt89qu2010choan-50d6ee59-b9d5-4577-a226-e1557bd24956`), chọn collection `settings` → document `site`.
3. Khôi phục các trường từ JSON sao lưu (ví dụ `editedProducts`, `customProducts`, `customPrices`, `hiddenProductIds`, `deletedProductIds`, `customCategories`, `customTexts`, `decorSettings`), cập nhật `updatedAt` là thời điểm hiện tại.
4. Hoặc trong `/admin`, dùng nút **Khôi phục** (cho sản phẩm/danh mục đã xóa mềm) hoặc **Khôi phục mặc định** (cho từng danh mục đã sửa).

---

## 6. Bảng phân quyền Firestore Collections & Rủi ro bảo mật còn lại

File `firestore.rules` trong repo **đã được rà soát và siết chặt cục bộ** (chưa tự động deploy lên Firebase production theo đúng yêu cầu an toàn).

| Collection | Khách hàng (`/`) | Admin (`/admin`) | Trạng thái Rules trong `firestore.rules` |
|---|---|---|---|
| `settings/site` | `get` (đọc cấu hình hiển thị) | `get`, `create`, `update`, `delete` | **Đã khóa ghi/xóa** chỉ cho `isAdmin()` (`emailVerified == true` + email chủ sở hữu). `list` bị chặn. |
| `custom_images/{id}` | `get`, `list` (hiển thị ảnh sản phẩm) | `get`, `list`, `create`, `update`, `delete` | **Đã khóa ghi/xóa** chỉ cho `isAdmin()`. |
| `leads/{id}` | `create` (gửi form tư vấn) | `get`, `list`, `update`, `delete` | **Đã khóa đọc/sửa/xóa** chỉ cho `isAdmin()` (trước đây mở `true`). |
| `orders/{id}` | `create` + `update` giới hạn Bước 2 (`address`, `note` khi `status == 'Mới'`) | `get`, `list`, `update`, `delete` | **Đã khóa `get`, `list`, `delete`** chỉ cho `isAdmin()`. Ràng buộc `update` của khách chỉ sửa `address`/`note`. |
| `customers/{phone}` | `get`, `create`, `update` giới hạn trường hồ sơ (`lastLoginAt`, `fullName`, `address`, `vouchersClaimed`) | `get`, `list`, `create`, `update`, `delete` | **Đã khóa `list`, `delete`** cho `isAdmin()`. `get`/`create`/`update` vẫn mở theo SĐT để không làm hỏng luồng đăng nhập/ví voucher hiện tại. |
| `voucher_redemptions/{id}` | `get` (theo `{code}_{phone}`), `create` | `get`, `list`, `update`, `delete` | **Đã khóa `list`, `update`, `delete`** cho `isAdmin()`. |

### Rủi ro bảo mật còn lại cần lưu ý (chưa thể khóa 100% chỉ bằng Rules hiện tại):
1. **Chưa deploy `firestore.rules` mới:** File `firestore.rules` mới chỉ cập nhật trong source code, chưa deploy lên Firebase production. Trong thời gian chưa deploy, rule cũ trên server vẫn đang cho phép ghi rộng hơn.
2. **Luồng tài khoản khách hàng (`customers`) chưa dùng Firebase Auth:** Khách hàng hiện đăng nhập bằng số điện thoại trực tiếp với Firestore (`getDoc`/`setDoc`) mà chưa qua Firebase Anonymous Auth hoặc Phone Auth OTP. Do đó, `customers` vẫn phải cho phép `get` theo ID (`SĐT`), và mật khẩu tùy chọn trên tài khoản khách nếu có hiện lưu dạng văn bản thuần trong `customers` (không nên coi đây là bảo mật cấp ngân hàng; cần nâng cấp lên Firebase Auth + hash mật khẩu hoặc OTP ở pha sau nếu muốn khóa `get`/`update` theo `request.auth.uid`).
3. **Cập nhật địa chỉ Bước 2 ở `orders`:** Vì khách hàng vãng lai chưa có `request.auth.uid`, nếu biết chính xác `orderId` của một đơn đang ở trạng thái `'Mới'`, khách vẫn gọi được `updateDoc` cho riêng `address` và `note`. Chấp nhận được trong ngắn hạn vì `orderId` chứa timestamp + chuỗi ngẫu nhiên và không sửa được giá/sản phẩm/trạng thái; về dài hạn nên gắn `customerUid` qua Firebase Anonymous Auth để khóa `resource.data.customerUid == request.auth.uid`.
