# Quy định Commit và Merge Git (Git Commit & Merge Ruleset)

Tài liệu này quy định các nguyên tắc về đặt tên nhánh, viết thông điệp commit và quy trình merge mã nguồn trong repository **Tokyo Event Crawler**. Việc tuân thủ quy tắc này giúp lịch sử Git (Git History) sạch sẽ, dễ theo dõi và thuận tiện cho việc CI/CD hoặc tự động hóa.

---

## 1. Quy tắc Viết Commit Message (Commit Convention)

Dự án áp dụng tiêu chuẩn **Conventional Commits**. Mọi commit message phải tuân theo cấu trúc sau:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 1.1. Các Loại Commit (`type`)

Sử dụng các tiền tố sau để xác định mục đích của commit:

| Loại (`type`) | Ý nghĩa | Ví dụ |
| :--- | :--- | :--- |
| **`feat`** | Tính năng mới (Feature) | `feat(crawler): tích hợp Puppeteer auto-scroll` |
| **`fix`** | Sửa lỗi (Bug fix) | `fix(crawler): khắc phục màn hình đen nhấp nháy trên Windows` |
| **`docs`** | Cập nhật tài liệu (Documentation) | `docs(readme): hướng dẫn cài đặt và khởi chạy dự án` |
| **`style`** | Định dạng code, CSS (không đổi logic code) | `style(client): điều chỉnh glassmorphism panel trong App.css` |
| **`refactor`** | Tái cấu trúc code (không sửa lỗi cũng không thêm tính năng) | `refactor(client): tách form crawler ra SettingsManager component` |
| **`test`** | Thêm hoặc sửa đổi các file test | `test(server): bổ sung test case cho API crawl/preview` |
| **`chore`** | Cập nhật thư viện, build tool, `.gitignore`, v.v. | `chore(deps): cài đặt puppeteer và cheerio dependencies` |

### 1.2. Mô tả (`description`)
- Viết ngắn gọn, rõ ràng (dưới 72 ký tự).
- Sử dụng tiếng Việt hoặc tiếng Anh một cách nhất quán.
- Không viết hoa chữ cái đầu tiên và không để dấu chấm ở cuối câu mô tả.
  - **Đúng**: `feat(client): thêm sidebar quản lý cấu hình`
  - **Sai**: `feat(client): Thêm sidebar quản lý cấu hình.`

---

## 2. Quy tắc Đặt Tên Nhánh (Branch Naming)

Nhánh chính của dự án là `main`. Khi phát triển tính năng hoặc sửa lỗi, bắt buộc phải tạo nhánh phụ từ `main` theo cú pháp:

`type/tên-nhánh-ngắn-gọn`

Các loại nhánh thông dụng:
- **`feature/`**: Phát triển tính năng mới. (Ví dụ: `feature/nosql-database`, `feature/scheduler`)
- **`bugfix/`**: Sửa lỗi thông thường từ nhánh dev/main. (Ví dụ: `bugfix/windows-popup-flash`)
- **`hotfix/`**: Sửa lỗi khẩn cấp trực tiếp trên môi trường production. (Ví dụ: `hotfix/api-timeout`)

---

## 3. Quy trình Merge Mã Nguồn (Merging Ruleset)

Để tránh xung đột code (conflict) và đảm bảo code chạy ổn định trên nhánh chính `main`, hãy tuân thủ quy trình sau:

### 3.1. Các Bước Thực Hiện Trước Khi Commit & Push
1. **Kiểm tra lộc bộ**: Đảm bảo dự án không có lỗi cú pháp hoặc lỗi build ở cả client và server:
   - Server: `node server.js` chạy ổn định, không crash.
   - Client: `npm run build` không báo lỗi.
2. **Cập nhật code mới nhất**: Trước khi push nhánh của bạn lên, hãy gộp code mới nhất từ `main` về để giải quyết xung đột (conflict) ở máy cá nhân:
   ```bash
   git checkout main
   git pull origin main
   git checkout <nhánh-của-bạn>
   git merge main
   ```

### 3.2. Quy tắc Tạo Pull Request (PR) và Merge
1. **Không push trực tiếp** lên nhánh `main` (trừ các cập nhật tài liệu hoặc cấu hình nhỏ và bạn làm việc độc lập). Hãy luôn tạo Pull Request trên GitHub.
2. **Tiêu đề Pull Request**: Đặt theo định dạng commit message chính của tính năng đó (ví dụ: `feat: tích hợp cơ sở dữ liệu local NoSQL`).
3. **Chiến lược Merge (Merge Strategy)**:
   - **Squash and Merge**: Khuyến khích sử dụng khi gộp các nhánh `feature/*` vào `main`. Cách này giúp gộp toàn bộ các commit nhỏ/thử nghiệm trong quá trình phát triển của bạn thành **1 commit duy nhất** sạch sẽ trên nhánh `main`.
   - **Rebase and Merge**: Sử dụng khi muốn giữ lịch sử commit tuyến tính, không tạo thêm commit merge phụ.
   - **Create a Merge Commit**: Chỉ dùng khi gộp các nhánh lớn (ví dụ gộp nhánh `dev` vào `main`).

---

## 4. Checklist Trước Khi Commit & Merge

- [ ] Dự án khởi chạy bình thường, không bị crash ở server hay lỗi compile ở client.
- [ ] Đã thêm các file mới vào `.gitignore` (như `node_modules/`, `data/`, v.v.) để tránh lọt file rác lên GitHub.
- [ ] Tên nhánh tuân thủ đúng định dạng `type/tên-nhánh`.
- [ ] Thông điệp commit tuân thủ quy tắc Conventional Commits.
- [ ] Các xung đột (conflict) đã được giải quyết triệt để dưới local trước khi tạo Pull Request.
