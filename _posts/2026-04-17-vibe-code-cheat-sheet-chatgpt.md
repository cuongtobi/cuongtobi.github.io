---
layout: post
title: 🚀 Vibe Code Cheat Sheet (ChatGPT Client)
date: 2026-04-17
author: cuongtobi
categories: today-i-learned
description: Dành cho stack JavaScript, PHP, Python, HTML, MySQL, MongoDB, SQLite
---
> Dành cho stack: **JavaScript, PHP, Python, HTML, MySQL, MongoDB, SQLite**
> Mục tiêu: code nhanh, tiết kiệm, không dùng API
---

# 🧠 1. Prompt khung chung

```text
Bạn là senior full-stack developer.

Stack của tôi:
- JavaScript
- PHP
- Python
- HTML
- MySQL
- MongoDB
- SQLite

Khi trả lời:
1. Chọn cách làm đơn giản, thực dụng
2. Tránh over-engineering
3. Code rõ ràng, production-minded
4. Có validate input + xử lý lỗi cơ bản
5. Chú ý security cơ bản
6. Nếu sửa code, ưu tiên sửa tối thiểu
7. Trả lời theo format:

## Phân tích
## Cách làm
## Code
## Cách chạy/test
## Lưu ý

Task: [điền task ở đây]
```

---

# 🧩 2. Chia task (Task Breakdown) — QUAN TRỌNG

```text
Tôi có yêu cầu sau:
[ mô tả feature / bài toán ]

Stack:
- Frontend: [HTML/JS]
- Backend: [JS/PHP/Python]
- Database: [MySQL/MongoDB/SQLite]

Hãy chia task để tôi implement nhanh theo dạng MVP:

1. Xác định mục tiêu chính (1–2 câu)
2. Liệt kê các bước triển khai theo thứ tự (từ dễ → khó)
3. Mỗi bước phải:
   - Có output rõ ràng (file / API / UI)
   - Có tiêu chí hoàn thành (definition of done)
4. Chỉ ra dependency giữa các bước (nếu có)
5. Đề xuất thứ tự build tối ưu nhất
6. Nêu các rủi ro kỹ thuật cần tránh

Yêu cầu:
- Chia nhỏ tối đa (mỗi task làm trong < 2h)
- Ưu tiên làm được end-to-end sớm
- Tránh over-engineering
- Trả lời dạng checklist dễ follow
```

---

# 🧩 3. Tạo feature mới (Overview)

```text
Tôi đang làm project [mô tả ngắn].

Stack:
- Frontend: [HTML/JS]
- Backend: [JS/PHP/Python]
- Database: [MySQL/MongoDB/SQLite]

Tôi muốn build feature: [tên feature]

Hãy:
1. Chia nhỏ task
2. Đề xuất cấu trúc file
3. Nêu input/output
4. Liệt kê rủi ro cần tránh
5. Đưa kế hoạch implement đơn giản nhất
```

# 🧩 3. Bảo trì dự án

```text
Tôi đang bảo trì một project hiện có.

Thay đổi cần làm:
[ mô tả thay đổi ]

Stack:
- Frontend: [HTML/JS]
- Backend: [JS/PHP/Python]
- Database: [MySQL/MongoDB/SQLite]

Code hiện tại / cấu trúc liên quan:
[ mô tả ngắn hoặc paste file liên quan ]

Hãy giúp tôi:

1. Phân tích vùng ảnh hưởng của thay đổi này
2. Liệt kê các file hoặc loại file có thể cần sửa
3. Chia task triển khai theo thứ tự an toàn
4. Nêu bug hồi quy có thể xảy ra nếu sót chỗ
5. Đề xuất checklist test sau khi sửa
6. Nếu tôi paste code tiếp theo, hãy ưu tiên sửa tối thiểu thay vì viết lại toàn bộ

Yêu cầu:
- Tập trung vào bảo trì thực tế
- Không over-engineering
- Ưu tiên an toàn và dễ rollout
- Trả lời dạng checklist rõ ràng
```

---

# ⚙️ 4. Sinh code module

```text
Viết code cho module: [tên module]

Bối cảnh:
- Project: [mô tả]
- Stack: [JS/PHP/Python/HTML]
- Database: [MySQL/MongoDB/SQLite]
- Mục đích: [mô tả]

Yêu cầu:
- [chức năng 1]
- [chức năng 2]
- [chức năng 3]

Điều kiện:
- production-ready
- dễ maintain
- có validate input
- có xử lý lỗi cơ bản
- không dùng thư viện thừa

Trả:
1. Giải thích ngắn
2. Code hoàn chỉnh
3. File nào chứa code nào
4. Lệnh cài dependency nếu cần
```

---

# 🐛 5. Debug lỗi

````text
Tôi gặp lỗi.

Stack:
- Backend: [JS/PHP/Python]
- Frontend: [HTML/JS]
- Database: [MySQL/MongoDB/SQLite]

Code liên quan:
```[language]
[paste code]
````

Lỗi:

```text
[paste error]
```

Kết quả mong muốn:
[mô tả]

Hãy:

1. Tìm nguyên nhân gốc
2. Chỉ ra đoạn lỗi
3. Sửa code hoàn chỉnh
4. Giải thích ngắn
5. Cách tránh lỗi

````

---

# ♻️ 6. Refactor

```text
Hãy refactor đoạn code sau:

```[language]
[paste code]
````

Mục tiêu:

* clean hơn
* dễ maintain
* giữ nguyên chức năng

Yêu cầu:

* không đổi behavior
* không thêm thư viện
* trả code hoàn chỉnh

````

---

# 🔍 7. Review code

```text
Hãy review đoạn code sau:

```[language]
[paste code]
````

Đánh giá:

1. Readability
2. Maintainability
3. Security
4. Performance
5. Bug tiềm ẩn

Trả:

* vấn đề quan trọng
* mức độ (cao/trung bình/thấp)
* đề xuất sửa

````

---

# 🧪 8. Viết test

```text
Hãy viết test cho module sau:

```[language]
[paste code]
````

Yêu cầu:

* happy path
* edge cases
* error cases
* code test hoàn chỉnh

````

---

# 🌐 9. Thiết kế API

```text
Hãy thiết kế API cho chức năng: [tên]

Backend: [JS/PHP/Python]
Database: [MySQL/MongoDB/SQLite]

Trả:
1. Endpoint
2. Method
3. Input
4. Body
5. Response
6. Validation
7. Error cases
````

---

# 🗄️ 10. Database schema

## SQL

```text
Thiết kế schema cho [chức năng]

Database: [MySQL/SQLite]

Trả:
1. Tables
2. Columns
3. Types
4. PK/FK
5. Index
6. SQL create table
```

## MongoDB

```text
Thiết kế schema MongoDB cho [chức năng]

Trả:
1. Collection
2. Structure
3. Field types
4. Index
5. Sample document
```

---

# 🔁 11. CRUD nhanh

```text
Tạo CRUD cho [module]

Stack:
- Backend: [JS/PHP/Python]
- Database: [MySQL/MongoDB/SQLite]

Fields:
- [field]

Trả:
1. Schema
2. API
3. Code backend
4. Hướng dẫn test
```

---

# ⚡ 12. Prompt siêu ngắn

### API

```text
Tạo API [tên] bằng [stack], dùng [DB], có validate + xử lý lỗi, trả code hoàn chỉnh.
```

### Form

```text
Tạo form HTML + JS cho [chức năng], validate + gọi API.
```

### Query

```text
Tối ưu query sau: [query], DB: [MySQL/MongoDB].
```

---

# 📌 13. Nguyên tắc vàng

## ✅ Làm đúng

* chia task nhỏ
* paste code liên quan
* nói rõ stack
* giữ format output

## ❌ Tránh

* paste cả project
* hỏi chung chung
* yêu cầu build full hệ thống

---

# 🧠 14. Cách chia thread

* Thread 1: Architect
* Thread 2: Backend
* Thread 3: Frontend
* Thread 4: Debug

---

# 🎯 15. Công thức prompt chuẩn

```text
[làm gì] + [stack] + [database] + [input/output] + [ràng buộc]
```

Ví dụ:

```text
Tạo CRUD sản phẩm bằng PHP + MySQL, validate name + price, dùng PDO.
```

---

# 💡 Tip cuối

👉 "Chia nhỏ + rõ ràng = rẻ + chính xác"

---

**Use daily. Ship fast. Save money.** 🚀

