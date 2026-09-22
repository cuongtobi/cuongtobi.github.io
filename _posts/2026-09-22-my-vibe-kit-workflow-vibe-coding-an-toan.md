---
layout: post
title: "My Vibe Kit: Workflow gọn cho vibe coding trên codebase thật"
date: 2026-09-22
author: Cuong Vuong
description: "My Vibe Kit là bộ workflow tôi dùng với Codex, Claude Code và Antigravity để giữ context vừa đủ, theo dõi dependency và chỉ báo hoàn thành khi có kết quả kiểm chứng thật."
image: /assets/images/my-vibe-kit-workflow-cover.svg
cover_image: /assets/images/my-vibe-kit-workflow-cover.svg
image_width: 1200
image_height: 630
tags:
  - vibe-coding
  - ai-coding
  - codex
  - claude-code
  - antigravity
  - fastapi
  - developer-tools
---
Vibe coding cho cảm giác rất nhanh: mô tả yêu cầu, để agent tạo file, viết API, sửa bug hoặc refactor. Với project nhỏ, cách này thường đủ tốt. Khi codebase lớn dần, câu hỏi không còn là **AI có viết được code hay không**. Tôi quan tâm nhiều hơn đến việc nó đang đọc gì, sửa gì và dựa vào đâu để kết luận task đã xong:

- AI có đang đọc đúng phần code cần thiết không?
- Nó có quét cả repository và đốt context không cần thiết không?
- Nó có hiểu dependency và những file bị ảnh hưởng không?
- Một session mới có phải đọc lại toàn bộ project từ đầu không?
- Khi sửa bug, nó có tìm root cause hay chỉ patch triệu chứng?
- Sau khi sửa xong, nó có thực sự chạy test hay chỉ nhìn code rồi nói “done”?
- Nếu test command chưa được cấu hình, AI có vô tình coi task là hoàn thành không?

**My Vibe Kit** ra đời từ đúng những vấn đề đó.

**Repository:** [github.com/cuongtobi/my-vibe-kit](https://github.com/cuongtobi/my-vibe-kit)

Hiện tôi dùng kit như một workflow chung cho **Codex, Claude Code và Google Antigravity**. Phần runtime được tách khỏi từng agent, nên logic kiểm tra project không phụ thuộc vào một công cụ cụ thể.

---

## My Vibe Kit là gì?

Tôi cố tình giữ My Vibe Kit nhỏ. Phần agent nhìn thấy chỉ nên đủ để biết phải làm gì; những việc có thể xác định bằng code thì đẩy xuống runtime. Toàn bộ workflow công khai chỉ có 4 skill:

```text
vibe
plan
build
verify
```

Trong đó:

- `vibe` điều phối toàn bộ task.
- `plan` thu thập context, dependency, impact và lập kế hoạch.
- `build` thực hiện thay đổi trong đúng scope.
- `verify` kiểm chứng kết quả bằng runtime evidence.

Luồng cơ bản:

```text
vibe
  ↓
plan
  ↓
build
  ↓
verify
```

Nếu bung chi tiết hơn:

```text
User request
    ↓
VIBE
    ↓
PLAN
├── project context
├── dependency graph
├── relevant context
├── impact analysis
├── architecture policy
└── acceptance criteria
    ↓
BUILD
├── minimal code change
├── focused tests
└── preserve existing user changes
    ↓
VERIFY
├── dependency diff
├── lint / typecheck / test / build
├── acceptance evidence
└── final diff review
    ↓
PASS_VERIFIED
```

Ở bước cuối, code trông hợp lý vẫn chưa đủ. **Task chỉ được coi là đã kiểm chứng khi các verification command thực sự chạy và pass.** Vì vậy, `PASS_VERIFIED` là trạng thái có bằng chứng đi kèm, không phải kết luận theo cảm giác của agent.

Nếu project chưa có command kiểm chứng đáng tin cậy, runtime trả về:

```text
NEEDS_VERIFICATION_CONFIG
```

Nếu chưa có cách kiểm chứng đáng tin cậy, kit dừng ở trạng thái này thay vì tự coi task là xong.

---

## Vì sao tôi không muốn agent đọc toàn bộ project mỗi session?

Với project sống lâu, context nhanh chóng trở thành vấn đề thực tế. Cách đơn giản nhất là mỗi session mới:

```text
scan toàn repository
→ đọc nhiều file
→ đọc task cũ
→ đọc dependency
→ bắt đầu làm
```

Cách này hoạt động với project nhỏ, nhưng càng lớn càng tốn token và càng dễ đưa những thông tin không liên quan vào context. My Vibe Kit không làm vậy. Nó chia thông tin thành bốn lớp:

```text
durable project truth
persistent local state
current-task runtime
cold task history
```

### Durable project truth

Lớp này chứa những gì tôi coi là nguồn sự thật của project:

```text
AGENTS.md
.vibe/config.json
source code
tests
package manifests
architecture docs
```

Nếu lịch sử chat mâu thuẫn với source hiện tại, source luôn được ưu tiên.

---

### Persistent state

Context và dependency đã tính toán được cache tại:

```text
.vibe/state/
├── index-state.json
├── file-index.json
├── last-context.json
├── last-dependency.json
├── last-framework.json
├── last-adapter.json
└── last-architecture.json
```

Phần này chỉ là cache để tiết kiệm thời gian và token; nó không được dùng làm bằng chứng kiểm chứng. Runtime kiểm tra Git state, file hash, config hash và checksum trước khi tái sử dụng cache.

Có ba trạng thái chính:

```text
CACHE_HIT
INCREMENTAL_REFRESH
FULL_REBUILD
```

### CACHE_HIT

Repository không thay đổi. Runtime tái sử dụng context/dependency cũ.

### INCREMENTAL_REFRESH

Git phát hiện một số file thay đổi. Runtime chỉ refresh phần bị ảnh hưởng thay vì quét lại toàn project.

### FULL_REBUILD

Dùng khi:

- chạy lần đầu,
- cache bị hỏng,
- scanner version thay đổi,
- Git delta không đáng tin cậy,
- hoặc user yêu cầu rebuild.

Nhờ vậy, session mới không phải đọc lại cả repository chỉ để khôi phục bối cảnh cơ bản.

---

## Bounded context: chỉ đưa phần cần thiết cho AI

Dependency graph có thể rất lớn, nhưng model không cần nhìn toàn bộ graph. My Vibe Kit tạo:

```text
.vibe/runtime/relevant-context.json
```

với context được giới hạn. Mặc định first-pass:

```text
20 source files
10 test files
8 related modules
dependency depth = 2
```

Agent đọc neighborhood này trước. Nếu một dependency, consumer, failing test hoặc contract cho thấy cần mở rộng scope thì mới đọc thêm. Cách đọc context vì thế gần với:

```text
find the relevant neighborhood
        ↓
reason locally
        ↓
expand only with evidence
```

thay vì:

```text
load everything
        ↓
hope the important part is somewhere inside
```

---

## Adapter: cùng một workflow nhưng hiểu từng stack

Bốn skill cốt lõi không được viết riêng cho từng framework. Thay vào đó runtime detect:

```text
language
   +
framework
   ↓
active-adapter.json
```

Ví dụ:

```text
Python + FastAPI
TypeScript + React + Vite
TypeScript + Next.js
PHP + Laravel
PHP + WordPress
Ruby + Rails
Java + Spring
Go + Gin
Rust + Actix Web
```

Adapter cung cấp cho workflow những thông tin như:

- manifest,
- dependency scanner,
- route,
- controller,
- component,
- model,
- framework convention,
- verification command phù hợp.

Ví dụ với FastAPI:

```text
language adapter: python
framework adapter: fastapi
```

Python dùng AST để xây local import graph. FastAPI adapter bổ sung context cho:

```text
routes
APIRouter
Depends
Pydantic schemas
```

và architecture guidance như:

- tách transport schema khỏi business logic khi cần,
- theo dõi dependency được inject qua `Depends`,
- giữ route handler mỏng nếu workflow bắt đầu phức tạp.

---

## Architecture policy: không ép Clean Architecture vào mọi project

Coding agent cũng rất dễ over-engineer nếu prompt không đặt ranh giới rõ. Một feature nhỏ đôi khi bị biến thành:

```text
interface
repository
service
factory
adapter
port
DTO
mapper
use case
```

trong khi project thực tế chỉ cần vài function rõ ràng. My Vibe Kit mặc định dùng:

```text
feature-first
+
modular layered
+
framework-native
+
Clean Code
```

Profile mặc định:

```text
standard
```

Flow tư duy cơ bản:

```text
presentation / route / controller
            ↓
application / service
            ↓
domain / business rules
            ↓
data / infrastructure boundary
```

Nhưng không bắt buộc phải tạo mọi layer. Rule quan trọng là:

> Chỉ thêm abstraction khi có boundary, variation, reuse hoặc testing need thực sự.

Khi project lớn hơn hoặc được cấu hình `strict`, kit có thể chuyển sang dependency rule kiểu Clean/Hexagonal. Framework convention vẫn được ưu tiên. FastAPI nên vẫn trông giống FastAPI.

Rails nên vẫn giống Rails. Laravel vẫn nên dùng convention của Laravel.

---

## Ví dụ: dùng My Vibe Kit với một project FastAPI nhỏ

Giả sử chúng ta có project:

```text
vibe-sample-fastapi/
├── app/
│   ├── __init__.py
│   └── main.py
├── tests/
│   └── test_health.py
└── pyproject.toml
```

### 1. Tạo FastAPI project

`pyproject.toml`:

```toml
[project]
name = "vibe-sample-fastapi"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi",
    "uvicorn"
]

[project.optional-dependencies]
dev = [
    "pytest",
    "httpx",
    "ruff"
]
```

`app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

`tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

Cài dependency theo cách bạn đang dùng cho project, sau đó chạy:

```bash
python -m pytest -q
```

Project lúc này chỉ có một endpoint:

```text
GET /health
```

---

## 2. Cài My Vibe Kit vào project

Clone kit:

```bash
git clone https://github.com/cuongtobi/my-vibe-kit.git
cd my-vibe-kit
```

Cài vào FastAPI project:

```bash
python install.py \
  --target /path/to/vibe-sample-fastapi \
  --agents codex claude antigravity
```

Trên PowerShell:

```powershell
python .\install.py `
  --target C:\code\vibe-sample-fastapi `
  --agents codex claude antigravity
```

Installer sẽ materialize workflow vào project. Sau đó project có thêm các phần như:

```text
vibe-sample-fastapi/
├── .agents/
├── .claude/
├── .vibe/
│   ├── adapters/
│   ├── config.json
│   ├── state/
│   ├── runtime/
│   ├── tasks/
│   └── tools/
├── AGENTS.md
├── CLAUDE.md
├── app/
├── tests/
└── pyproject.toml
```

Installer detect được:

```text
Python
+
FastAPI
```

và có thể discover các verification tool đã khai báo như:

```text
ruff
pytest
```

---

## 3. Giao một task cho agent

Giả sử tôi muốn thêm Todo API. Thay vì viết prompt rất dài mô tả từng bước, tôi chỉ cần yêu cầu:

```text
Use vibe to add POST /tasks.

Request body:
- title: string

Response:
- id: integer
- title: string
- done: false

Keep storage in memory for now.
Add tests.
```

Từ đây `vibe` điều phối toàn bộ workflow.

---

## 4. PLAN — trước khi sửa code

Đầu tiên task được phân loại:

```text
mode = feature
```

Runtime tạo task record mới. Về logic, agent sẽ chạy các bước tương đương:

```bash
python .vibe/tools/vibe.py task start \
  --mode feature \
  --request "add POST /tasks"
```

Sau đó refresh project facts:

```bash
python .vibe/tools/vibe.py context --summary
python .vibe/tools/vibe.py deps --summary
python .vibe/tools/vibe.py relevant
```

Runtime lúc này biết:

```text
primary language: python
framework: fastapi
```

Dependency scanner Python dùng AST để nhìn local import graph. FastAPI framework context tìm route và router liên quan. Architecture policy cũng được materialize. Các artifact có thể xuất hiện tại:

```text
.vibe/runtime/
├── current-task.json
├── project-map.json
├── framework-map.json
├── active-adapter.json
├── architecture-policy.json
├── dependency-map.json
└── relevant-context.json
```

Agent không cần đọc toàn repository. Với project nhỏ này context có thể rất ít, ví dụ:

```text
app/main.py
tests/test_health.py
pyproject.toml
```

---

### Snapshot trước thay đổi

Trước khi implementation bắt đầu:

```bash
python .vibe/tools/vibe.py snapshot before
```

Dependency baseline ban đầu được giữ lại. Nếu workflow phải re-plan hoặc session bị ngắt, baseline này không được âm thầm thay thế bằng state mới. Lấy snapshot “before” sau khi code đã bị sửa sẽ khiến dependency diff mất ý nghĩa.

---

## 5. Impact analysis

Khi target đã rõ, kit có thể chạy:

```bash
python .vibe/tools/vibe.py impact app/main.py
```

Mục tiêu không phải chỉ hỏi:

> File nào tôi định sửa?

Mà còn hỏi:

> File nào phụ thuộc vào nó, test nào liên quan, route nào bị ảnh hưởng?

Ví dụ:

```text
target
  app/main.py

affected tests
  tests/test_health.py

framework
  fastapi

routes
  GET /health
```

Nếu project lớn hơn và route import service khác, reverse dependency graph có thể chỉ ra thêm consumers cần kiểm tra.

---

## 6. Plan có acceptance criteria cụ thể

Thay vì plan kiểu:

```text
1. sửa API
2. thêm test
3. chạy test
```

kit khuyến khích acceptance criteria có thể kiểm chứng. Ví dụ:

```text
AC1
POST /tasks với title hợp lệ trả HTTP 200/201.

AC2
Response có:
id
title
done=false

AC3
Task mới được giữ trong in-memory store.

AC4
GET /health cũ vẫn hoạt động.

AC5
pytest và ruff pass.
```

Mỗi criterion phải gắn với evidence:

```text
AC1 → API test
AC2 → response assertion
AC3 → behavior test
AC4 → existing regression test
AC5 → verification commands
```

Mục đích là tránh trường hợp:

```text
tests pass
```

nhưng phần user thực sự yêu cầu lại chưa được test.

---

## 7. BUILD — thay đổi nhỏ nhất có thể

Sau plan, `build` triển khai trong đúng scope. Với demo nhỏ, agent có thể tạo code tương tự:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class CreateTask(BaseModel):
    title: str

class Task(BaseModel):
    id: int
    title: str
    done: bool = False

tasks: list[Task] = []

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/tasks")
def create_task(payload: CreateTask) -> Task:
    task = Task(
        id=len(tasks) + 1,
        title=payload.title,
    )
    tasks.append(task)
    return task
```

và test:

```python
def test_create_task() -> None:
    response = client.post(
        "/tasks",
        json={"title": "Learn My Vibe Kit"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "title": "Learn My Vibe Kit",
        "done": False,
    }
```

Ở ví dụ này, kit **không ép project phải có repository interface, service layer hay database adapter**. In-memory storage là yêu cầu hiện tại. Project còn nhỏ. Không có lý do để thêm abstraction chỉ để trông “enterprise”.

Nếu sau này task đổi thành PostgreSQL, lúc đó boundary dữ liệu mới trở nên có ý nghĩa.

---

## 8. VERIFY — code viết xong chưa có nghĩa là task đã xong

Sau implementation, verify refresh lại state:

```bash
python .vibe/tools/vibe.py context --summary
python .vibe/tools/vibe.py deps --summary
```

Nếu task có baseline hợp lệ:

```bash
python .vibe/tools/vibe.py snapshot after
```

Runtime có thể tạo dependency diff:

```text
added edges
removed edges
new cycles
unexpected consumers
```

Sau đó:

```bash
python .vibe/tools/vibe.py verify --summary
```

Với FastAPI demo, verification có thể chạy:

```bash
python -m ruff check .
python -m pytest -q
```

Nếu tất cả pass, source fingerprint ổn định và không xuất hiện dependency cycle bị cấm:

```text
PASS_VERIFIED
```

Nếu command fail:

```text
FAIL_VERIFICATION
```

Nếu chưa có command nào được cấu hình:

```text
NEEDS_VERIFICATION_CONFIG
```

Đây là nguyên tắc tôi muốn giữ xuyên suốt kit:

> Không có test evidence thì không gọi đó là verified.

---

## Nếu verification command tự sửa source thì sao?

Một edge case khá nguy hiểm là formatter hoặc generator chạy trong verification nhưng lại thay đổi source code. Ví dụ:

```text
verify command
    ↓
formatter thay file
    ↓
test cũ đã chạy trên state trước
```

Nếu vẫn báo pass thì evidence đã stale. My Vibe Kit bind verification với source fingerprint. Nếu input thay đổi trong quá trình verify:

```text
rerun_required = true
```

Các command liên quan phải chạy lại trên final tree.

---

## Workflow sửa bug khác gì feature?

Với bug, `vibe` dùng flow chặt hơn:

```text
REPRODUCE
    ↓
ROOT CAUSE
    ↓
FAILING REGRESSION TEST
    ↓
MINIMAL FIX
    ↓
PASSING REGRESSION TEST
    ↓
AFFECTED TESTS
    ↓
VERIFY
```

Ý tưởng là tránh kiểu:

```text
thấy exception
→ thêm if
→ exception biến mất
→ done
```

Agent phải cố xác định root cause từ evidence và giữ regression test nếu có thể.

---

## Current task và task history

Một điều tôi không muốn là mỗi session mới lại đọc hàng chục task cũ. Do đó:

```text
.vibe/tasks/
```

được coi là **cold history**. Agent chỉ tập trung vào current task:

```text
.vibe/runtime/current-task.json
```

Nếu user tiếp tục cùng mục tiêu ở session sau, workflow tái sử dụng task hiện tại và baseline gốc. Không tạo task mới chỉ vì:

- mở session mới,
- verification fail,
- prompt được diễn đạt lại,
- phải re-plan.

Nhờ vậy, lịch sử task không bị phình ra chỉ vì đổi session và baseline ban đầu vẫn được giữ đúng.

---

## Bảo vệ code đang làm dở của user

Một coding agent không nên giả định working tree luôn sạch. Trước khi build, workflow ghi nhận:

```bash
git status --short --untracked-files=all
git diff --name-status
git diff --cached --name-status
```

Mục tiêu là phân biệt:

```text
thay đổi có sẵn của user
```

với:

```text
thay đổi do task hiện tại tạo ra
```

Build không được reset hoặc discard code của user chỉ để làm diff “đẹp”. Trên repository thật, việc này quan trọng hơn nhiều so với một sandbox demo.

---

## Tại sao runtime chỉ dùng Python standard library?

Tôi cũng muốn kit có thể mang sang project khác mà không kéo theo một stack runtime nặng. Bản thân runtime không yêu cầu một dependency stack lớn. Nó dùng Python standard library để làm baseline cho:

- repository inspection,
- cache,
- Git state,
- dependency graph,
- impact analysis,
- task state,
- verification orchestration.

Khi ecosystem có tool mạnh hơn, kit có thể tận dụng chúng như verification/native tooling. Ví dụ:

```text
Python → Ruff / Pyright / mypy / pytest
Ruby → RuboCop / RSpec
PHP → PHPStan / Pest / PHPUnit
Node → lint / typecheck / test / build scripts
Go → go test
Rust → cargo check / cargo test
```

Runtime baseline không cố thay thế compiler, framework hay test runner. Nó điều phối chúng.

---

## My Vibe Kit không cố giải quyết điều gì?

My Vibe Kit không nhằm biến coding agent thành một hệ thống tự động hoàn hảo. Static analysis vẫn có giới hạn, nhất là với những cơ chế động của framework. Ví dụ:

- dependency injection động,
- reflection,
- generated code,
- framework registry,
- dynamic import,
- JS/TS alias phức tạp,
- Rails Zeitwerk autoload,
- macro hoặc metaprogramming,

có thể cần native tooling hoặc kiểm tra sâu hơn. Runtime coi dependency scanner là **baseline deterministic**, không phải sự thật tuyệt đối về mọi runtime behavior. Quan trọng là workflow biết giới hạn của scanner và không biến một suy đoán thành “verified fact”.

---

## Khi nào My Vibe Kit hữu ích nhất?

Kit hữu ích nhất khi bạn:

- dùng coding agent hàng ngày,
- làm việc trên repository tồn tại lâu dài,
- thường xuyên mở session mới,
- không muốn AI đọc lại toàn project,
- muốn kiểm soát scope,
- hay sửa bug/refactor,
- muốn dùng cùng workflow trên nhiều agent,
- và không muốn câu “looks good” được coi là bằng chứng hoàn thành.

Với project nhỏ, workflow vẫn nhẹ. Với project lớn hơn, persistent context và incremental dependency refresh bắt đầu mang lại lợi ích rõ hơn.

---

## Cách sử dụng hằng ngày

Phần lớn task tôi muốn interaction đơn giản như:

```text
Use vibe to implement CSV export for reports.
```

Hoặc:

```text
Use vibe to fix the crash when history is empty.
```

Nếu chỉ muốn phân tích:

```text
Use plan to analyze migrating SQLite to PostgreSQL.
Do not edit code yet.
```

Phần phức tạp nằm dưới workflow, không nằm trong prompt hằng ngày. Tôi muốn câu lệnh gửi cho agent ngắn, còn việc giữ state, dependency và verification do kit lo.

---

## Kết luận

My Vibe Kit bắt đầu từ một nhu cầu khá đơn giản của chính tôi:

> Tôi muốn vibe code nhanh, nhưng vẫn biết agent đã đọc gì, sửa gì và kiểm chứng bằng cách nào.

Vì vậy, thay vì tiếp tục thêm prompt và instruction, tôi giữ workflow ở bốn bước:

```text
vibe
  ↓
plan
  ↓
build
  ↓
verify
```

và đưa các phần có thể deterministic xuống runtime:

```text
context
dependency
impact
cache
task state
verification evidence
```

Agent vẫn làm phần nó mạnh nhất:

- hiểu yêu cầu,
- reasoning,
- thiết kế thay đổi,
- viết code,
- xử lý lỗi.

Runtime giữ những phần không nên phụ thuộc vào trí nhớ của model: state, dependency, fingerprint và kết quả kiểm chứng. Mục tiêu cuối cùng không phải để AI viết nhiều code hơn, mà để mỗi thay đổi dễ kiểm soát hơn:

```text
đọc ít context hơn
+
sửa đúng scope hơn
+
giữ được trạng thái qua nhiều session
+
biết dependency bị ảnh hưởng
+
có evidence trước khi nói task hoàn thành
```

Nếu bạn đang dùng Codex, Claude Code hoặc Antigravity trên một codebase thật, source của My Vibe Kit nằm ở:

[https://github.com/cuongtobi/my-vibe-kit](https://github.com/cuongtobi/my-vibe-kit)
