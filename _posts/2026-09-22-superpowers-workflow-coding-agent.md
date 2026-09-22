---
layout: post
title: "Superpowers: Bộ skill giúp coding agent làm việc có quy trình hơn"
date: 2026-09-22
author: Cuong Vuong
description: "Tìm hiểu obra/superpowers: bộ skill đưa coding agent qua các bước brainstorm, lập kế hoạch, worktree, TDD, review và verification; kèm cách cài đặt và ví dụ sử dụng."
image: /assets/images/superpowers-coding-agent-workflow.svg
cover_image: /assets/images/superpowers-coding-agent-workflow.svg
image_width: 1200
image_height: 630
tags:
  - ai-coding
  - coding-agents
  - superpowers
  - tdd
  - codex
  - claude-code
  - developer-tools
---

Coding agent viết code ngày càng tốt. Nhưng khi đưa nó vào một repository thật, phần dễ hỏng thường không nằm ở cú pháp hay tốc độ gõ code. Vấn đề là **cách agent đi từ yêu cầu đến một thay đổi có thể tin được**:

- Agent có hiểu đúng thứ cần xây trước khi code không?
- Nó có tự ý lao vào implementation quá sớm không?
- Có tách thay đổi khỏi branch đang làm việc không?
- Có viết test trước hay chỉ thêm test sau khi code đã xong?
- Có review từng phần trước khi tiếp tục không?
- Khi nói "done", nó có evidence thật hay chỉ thấy code có vẻ ổn?

[Superpowers](https://github.com/obra/superpowers) của Jesse Vincent và Prime Radiant tập trung vào đúng lớp vấn đề đó.

Nó không phải model mới hay IDE mới. Superpowers là **một phương pháp làm việc cho coding agent**, đóng gói thành các skill và một bootstrap để agent biết lúc nào cần brainstorm, lập kế hoạch, test, review hoặc verify.

Tại thời điểm tôi đọc repo cho bài viết này, plugin manifest đang ở phiên bản **6.4.1**, giấy phép **MIT**, và repository hỗ trợ nhiều coding harness khác nhau như Claude Code, Codex, Antigravity, Cursor, Gemini CLI, Devin CLI, GitHub Copilot CLI, Kimi Code, OpenCode, Pi, Qwen Code, Hermes Agent và Muse.

**Repository:** [github.com/obra/superpowers](https://github.com/obra/superpowers)

---

## Superpowers thực chất là gì?

Có thể hình dung Superpowers như một **lớp quy trình đặt phía trên coding agent**. Agent vẫn là Claude Code, Codex, Gemini hay một harness khác. Superpowers không thay model và cũng không thay compiler, test runner hay Git.

Agent vẫn dùng tool của harness hiện tại, nhưng công việc được dẫn qua một chuỗi bước rõ ràng hơn:

~~~text
ý tưởng
  ↓
hiểu yêu cầu
  ↓
thiết kế
  ↓
lập kế hoạch
  ↓
workspace cô lập
  ↓
TDD
  ↓
implementation
  ↓
code review
  ↓
verification
  ↓
merge / PR / giữ branch
~~~

Repository hiện có các skill chính như:

~~~text
skills/
├── brainstorming
├── writing-plans
├── using-git-worktrees
├── subagent-driven-development
├── executing-plans
├── test-driven-development
├── requesting-code-review
├── receiving-code-review
├── systematic-debugging
├── verification-before-completion
├── finishing-a-development-branch
├── dispatching-parallel-agents
├── diagnosing-superpowers
├── writing-skills
└── using-superpowers
~~~

Nhìn qua repository rất dễ nghĩ đây chỉ là một thư mục prompt. Phần làm Superpowers khác đi là bootstrap <code>using-superpowers</code>: nó yêu cầu agent **kiểm tra skill trước khi hành động**, thay vì chờ người dùng nhớ tên skill và gọi thủ công.

Trong tài liệu của repo, một integration được coi là đúng khi bootstrap này được nạp ngay từ đầu session; nếu chỉ copy các file skill vào máy nhưng không khiến agent tự kích hoạt chúng, tác giả coi đó là một integration chưa hoàn chỉnh.

---

## Cơ chế hoạt động: skill trước, action sau

<code>using-superpowers</code> đặt ra một quy tắc khá cứng:

> Nếu có khả năng một skill liên quan tới task hiện tại, agent phải kiểm tra và dùng skill đó trước khi trả lời hoặc hành động.

Trong thực tế, nó muốn tránh kiểu làm việc này:

~~~text
User: thêm feature X

Agent:
- mở vài file
- sửa code
- chạy test
- báo xong
~~~

Thứ tự được khuyến khích là:

~~~text
User request
    ↓
using-superpowers
    ↓
skill nào phù hợp?
    ↓
process skill trước
    ↓
implementation skill sau
~~~

Ví dụ:

~~~text
"Let's build X"
      ↓
brainstorming
      ↓
design / approval
      ↓
implementation workflow
~~~

Trong khi:

~~~text
"Fix bug X"
      ↓
systematic-debugging
      ↓
root cause
      ↓
regression test
      ↓
fix
      ↓
verification
~~~

Phần tôi thích ở cách thiết kế này là **người dùng không phải nhớ một prompt dài để ép agent đi đúng quy trình**. Nếu integration của harness hoạt động đúng, việc chọn skill trở thành trách nhiệm của agent.

---

## Superpowers chạy theo flow nào?

README ghép các skill thành một workflow gồm brainstorming, worktree, planning, implementation, TDD, review và bước kết thúc branch. Đọc theo các skill hiện tại, luồng tổng thể trông như sau:

~~~text
SESSION START
    ↓
using-superpowers
    ↓
BRAINSTORMING
    ↓
classify task
    ├── spike
    ├── bounded
    └── architectural
    ↓
design approval
    ↓
WRITING PLAN
(khi task cần full plan)
    ↓
ISOLATED WORKSPACE
    ↓
EXECUTION
    ├── subagent-driven
    └── native / executing-plans
    ↓
TDD PER TASK
    ↓
CODE REVIEW
    ↓
VERIFICATION
    ↓
FINISH BRANCH
~~~

### 1. Brainstorming: không code ngay

Khi task có yếu tố thiết kế, <code>brainstorming</code> đi trước phần implementation. Trước khi code, agent cần làm rõ:

- mục tiêu thật sự là gì,
- ai sẽ dùng,
- success criteria là gì,
- constraint nào quan trọng,
- thay đổi này lớn đến đâu.

Skill hiện tại chia task thành ba nhóm.

#### Spike

Dùng khi mục tiêu là trả lời một câu hỏi khả thi:

~~~text
"Liệu thư viện này có xử lý được file 2 GB không?"
~~~

Output chính là câu trả lời hoặc kết quả probe, không phải production code.

#### Bounded

Dùng cho thay đổi nhỏ, scope rõ, flow cần sửa đã tồn tại trong repo. Ví dụ:

~~~text
"Thêm một flag vào endpoint hiện có."
~~~

Agent đọc context, hỏi những câu cần thiết, trình bày một thiết kế ngắn ngay trong chat và **chờ user approve trước khi implementation**.

#### Architectural

Dùng cho project mới, subsystem mới hoặc thay đổi làm đổi cách các component kết nối với nhau. Flow đầy đủ hơn:

~~~text
explore context
    ↓
clarify intent
    ↓
propose approaches
    ↓
present design
    ↓
user approves
    ↓
write spec
    ↓
self-review spec
    ↓
user reviews written spec
    ↓
writing-plans
~~~

Spec mặc định được lưu tại:

~~~text
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
~~~

Ranh giới ở đây khá rõ: **đồng ý với ý tưởng chưa có nghĩa là đã đồng ý cho agent bắt đầu implementation**. ---

## 2. Writing Plans: biến design thành các task có thể thực thi

Sau khi có spec đủ rõ, <code>writing-plans</code> chuyển thiết kế thành implementation plan. Plan mặc định nằm tại:

~~~text
docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md
~~~

Plan của Superpowers chi tiết hơn một checklist kiểu:

~~~text
1. tạo API
2. thêm test
3. update UI
~~~

Skill yêu cầu chi tiết hơn nhiều. Mỗi task phải mô tả:

- file nào tạo mới,
- file nào sửa,
- interface nào được consume,
- interface nào được produce,
- test nào phải viết,
- command nào phải chạy,
- expected result là gì,
- commit ở đâu.

Một task điển hình có cấu trúc gần như:

~~~text
Task N
  ↓
write failing test
  ↓
run test, confirm RED
  ↓
write minimal implementation
  ↓
run test, confirm GREEN
  ↓
commit
~~~

Skill còn cấm các placeholder kiểu:

~~~text
TODO
TBD
add proper error handling
write tests for the above
implement later
~~~

Lý do là agent thực thi có thể là một context hoàn toàn mới, không biết những gì planner đã suy nghĩ trước đó. Plan phải đủ rõ để một agent mới mở task lên vẫn biết chính xác phải làm gì.

---

## 3. Worktree: implementation nên diễn ra trong workspace cô lập

<code>using-git-worktrees</code> đảm bảo feature work không vô tình làm bẩn checkout chính.

Skill trước tiên kiểm tra xem agent đã ở trong linked worktree hay chưa. Nếu harness có native worktree tool thì ưu tiên dùng tool đó. Nếu không có, nó fallback về Git worktree. Ý tưởng:

~~~text
main checkout
    │
    ├── công việc hiện tại của user
    │
    └── .worktrees/feature-x
            ↓
        agent implementation
~~~

Sau khi tạo workspace, Superpowers còn cố gắng:

1. detect project setup,
2. cài dependency phù hợp,
3. chạy baseline test.

Nếu baseline đã fail trước khi feature bắt đầu, agent phải báo điều đó thay vì mặc định mọi lỗi sau này là do code mới. Việc chạy baseline trước khi sửa code giúp phân biệt lỗi có sẵn với lỗi do task mới tạo ra.

---

## 4. Hai cách execute plan

Superpowers hiện cho phép hai hướng chính.

### Subagent-driven development

Đây là lựa chọn nhiều bước hơn. Mỗi task được giao cho một implementer subagent mới. Sau implementation lại có reviewer kiểm tra task đó. Flow:

~~~text
Task 1
  ↓
fresh implementer
  ↓
implement + test + self-review
  ↓
task reviewer
  ↓
fix loop nếu cần
  ↓
Task 2
  ↓
fresh implementer
  ↓
...
  ↓
whole-branch review
~~~

Mỗi task dùng một subagent mới để hạn chế context cũ chen vào quyết định của task hiện tại. Thay vì một agent giữ toàn bộ lịch sử dài của session rồi vừa design, vừa implement, vừa tự review chính code của mình, controller chỉ cấp cho worker đúng phần context của task.

Superpowers còn lưu progress trong một ledger dưới vùng:

~~~text
.superpowers/sdd/
~~~

Ledger được dùng như recovery map nếu session bị compaction hoặc mất context. Nhờ ledger, tiến độ không chỉ tồn tại trong trí nhớ hội thoại của model — phần dễ mất khi session bị compact.

### Executing Plans / native execution

Mode này rẻ và đơn giản hơn. Một agent thực thi các task trong cùng session, sau đó dùng một reviewer mới cho toàn branch. Trade-off:

| Mode | Ưu điểm | Chi phí |
|---|---|---|
| Subagent-driven | context sạch theo task, review từng task | nhiều lượt agent hơn |
| Native / executing-plans | ít overhead, nhanh và rẻ hơn | ít isolation và review độc lập hơn |

Superpowers không giả định mọi task đều cần mode đắt nhất. ---

## 5. TDD là rule cứng, không phải gợi ý

<code>test-driven-development</code> là một trong những skill có quy tắc chặt nhất của project.

Nguyên tắc:

~~~text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
~~~

Chu trình được yêu cầu:

~~~text
RED
write failing test
    ↓
verify it fails for the right reason
    ↓
GREEN
write minimal code
    ↓
verify test passes
    ↓
REFACTOR
clean up while staying green
~~~

Ở đây, chỉ “có test” là chưa đủ. Agent phải **thấy test fail trước**. Nếu test mới viết đã pass ngay, nó chưa chứng minh được feature mới thực sự được test. Với bug fix, pattern tốt sẽ là:

~~~text
reproduce bug
    ↓
write regression test
    ↓
confirm test fails
    ↓
fix root cause
    ↓
confirm test passes
~~~

Cách làm này chậm hơn việc patch ngay vài dòng, nhưng giảm khả năng agent tự thuyết phục rằng một thay đổi "có vẻ đúng". ---

## 6. Review không chỉ diễn ra ở cuối

Trong subagent-driven mode, sau mỗi task sẽ có task review. Reviewer kiểm tra ít nhất hai nhóm vấn đề:

- spec compliance,
- code quality.

Nếu có finding quan trọng, task đi vào fix loop rồi được scoped re-review. Sau khi toàn bộ task hoàn thành, branch còn có một whole-branch review nữa. Cách tổ chức này tách ba vai trò:

~~~text
planner
implementer
reviewer
~~~

thay vì để một model vừa quyết định requirement, vừa viết code, vừa tự tuyên bố code của mình đúng. ---

## 7. Verification trước khi nói "done"

<code>verification-before-completion</code> có một nguyên tắc rất rõ:

~~~text
Evidence before claims.
~~~

Trước khi nói test pass, build thành công hay bug đã fix, agent phải:

1. xác định command nào chứng minh claim đó,
2. chạy command mới,
3. đọc output,
4. kiểm tra exit code / số lỗi,
5. chỉ sau đó mới được kết luận.

Ví dụ:

~~~text
"Tests pass"
~~~

không được suy ra từ:

~~~text
code looks correct
linter passed
agent con nói success
test đã chạy từ 20 phút trước
~~~

Nó cần fresh verification evidence. Có thể tóm gọn tinh thần này bằng câu của repo:

> **Evidence over claims.**

---

## 8. Finishing branch: kết thúc cũng có workflow

Khi implementation hoàn tất, <code>finishing-a-development-branch</code> chạy full test suite trước. Sau khi baseline xanh, agent mới đi tới bước tích hợp và cleanup. README mô tả các lựa chọn như:

- merge,
- mở pull request,
- giữ branch,
- discard.

Như vậy Superpowers không coi "viết code xong" là terminal state. Terminal state nằm sau:

~~~text
implementation
    ↓
tests
    ↓
review
    ↓
verification
    ↓
integration decision
~~~

---

## Khi có bug: systematic debugging thay vì đoán

Superpowers cũng có workflow riêng cho debugging.

<code>systematic-debugging</code> được mô tả như một quy trình root-cause theo bốn phase.

Tư tưởng là tránh pattern:

~~~text
thấy exception
    ↓
thêm một if
    ↓
exception biến mất
    ↓
done
~~~

Thay vào đó, agent phải điều tra evidence và root cause trước khi sửa. Sau fix vẫn quay lại TDD và verification.

Nếu chính Superpowers hoạt động không đúng trong một session — ví dụ skill không trigger, agent bỏ plan hoặc lặp việc — README còn cung cấp skill <code>diagnosing-superpowers</code> để đọc transcript và phân tích session với evidence.

---

## Cách cài Superpowers

Installation phụ thuộc vào coding harness. Nếu bạn dùng nhiều agent, README khuyến nghị cài riêng cho từng harness.

### Claude Code

Cách đơn giản nhất là dùng official Claude plugin marketplace:

~~~bash
/plugin install superpowers@claude-plugins-official
~~~

Project cũng có marketplace riêng. Đăng ký:

~~~bash
/plugin marketplace add obra/superpowers-marketplace
~~~

Sau đó cài:

~~~bash
/plugin install superpowers@superpowers-marketplace
~~~

### Codex App

Trong Codex App:

~~~text
Plugins
  ↓
Coding
  ↓
Superpowers
  ↓
+
  ↓
Install
~~~

### Codex CLI

Mở plugin search:

~~~text
/plugins
~~~

Tìm:

~~~text
superpowers
~~~

Sau đó chọn:

~~~text
Install Plugin
~~~

### Antigravity

Cài trực tiếp từ GitHub:

~~~bash
agy plugin install https://github.com/obra/superpowers
~~~

README cho biết Antigravity chạy session-start hook của plugin, vì vậy Superpowers active từ message đầu tiên. Muốn update có thể chạy lại cùng command.

### Cursor

Trong Cursor Agent chat:

~~~text
/add-plugin superpowers
~~~

Hoặc tìm "superpowers" trong plugin marketplace.

### Gemini CLI

~~~bash
gemini extensions install https://github.com/obra/superpowers
~~~

Update:

~~~bash
gemini extensions update superpowers
~~~

Ngoài ra project còn có hướng dẫn cho Devin CLI, Factory Droid, GitHub Copilot CLI, Grok Build CLI, Kimi Code, OpenCode, Pi, Qwen Code, Hermes Agent và Muse. ---

## Cài xong thì sử dụng như thế nào?

Sau khi cài xong, bạn **không phải đổi cách viết yêu cầu cho mọi task**. Bạn vẫn nói chuyện với coding agent bình thường. Ví dụ:

~~~text
Let's add team invitations to this app.

An admin can invite a user by email.
The invitation expires after 48 hours.
The invited user can accept it once.
Please add tests.
~~~

Nếu Superpowers được bootstrap đúng, agent không nên ngay lập tức mở editor và thêm endpoint. Với một thay đổi đủ lớn, flow kỳ vọng sẽ gần như:

~~~text
request
  ↓
brainstorming
  ↓
clarify requirements
  ↓
design
  ↓
approval
  ↓
spec
  ↓
implementation plan
  ↓
isolated workspace
  ↓
TDD tasks
  ↓
reviews
  ↓
verification
  ↓
finish branch
~~~

Bạn có thể kiểm tra installation bằng một prompt rất đơn giản:

~~~text
Let's make a react todo list
~~~

Trong tài liệu contribution của project, đây được dùng như một acceptance test cho harness integration: một clean session nên tự kích hoạt <code>brainstorming</code> trước khi viết code.

---

## Ví dụ cụ thể: xây một URL shortener nhỏ

Giả sử tôi mở một repo mới và yêu cầu:

~~~text
Build a small URL shortener API.

Requirements:
- POST /links accepts a long URL
- returns a short code
- GET /{code} redirects to the original URL
- SQLite is enough
- add tests
~~~

### Bước 1: Brainstorming

Superpowers có thể hỏi thêm:

~~~text
- short code cần random hay sequential?
- link có expire không?
- duplicate URL có tạo code mới không?
- có cần auth không?
- target traffic là demo hay production?
~~~

Sau khi scope rõ, agent trình bày design và chờ approval. Với một project mới, đây là architectural path, nên design có thể được lưu thành:

~~~text
docs/superpowers/specs/2026-09-22-url-shortener-design.md
~~~

### Bước 2: Implementation plan

<code>writing-plans</code> biến design thành các task nhỏ.

Ví dụ:

~~~text
Task 1: SQLite link repository
- create schema
- write repository failing tests
- implement minimal repository
- run tests
- commit

Task 2: POST /links
- write API failing test
- implement request validation
- create short code
- persist mapping
- verify response
- commit

Task 3: GET /{code}
- write redirect failing test
- resolve mapping
- return redirect
- test unknown code
- commit
~~~

### Bước 3: Workspace cô lập

Agent tạo hoặc dùng một worktree riêng và chạy baseline test.

~~~text
main
└── .worktrees/url-shortener
~~~

### Bước 4: TDD task đầu tiên

Trước tiên viết test:

~~~python
def test_create_link_returns_short_code(client):
    response = client.post(
        "/links",
        json={"url": "https://example.com/very/long/path"},
    )

    assert response.status_code == 201
    assert response.json()["code"]
~~~

Chạy test. Expected state:

~~~text
FAIL
~~~

Sau đó agent mới viết implementation tối thiểu. Chạy lại:

~~~text
PASS
~~~

### Bước 5: Review

Nếu dùng subagent-driven development:

~~~text
implementer
    ↓
task report
    ↓
review package
    ↓
reviewer
    ↓
clean?
  ↙     ↘
yes     fix loop
 ↓
next task
~~~

### Bước 6: Final verification

Trước khi nói feature hoàn tất, agent chạy command thật, ví dụ:

~~~bash
pytest -q
~~~

Nếu output xác nhận toàn bộ test pass, lúc đó mới được báo success. ---

## Ví dụ với bug fix

Giả sử user nói:

~~~text
The checkout API sometimes creates two orders when the client retries after a timeout.
Find the root cause and fix it.
~~~

Superpowers nên ưu tiên <code>systematic-debugging</code> thay vì patch ngay. Flow mong muốn:

~~~text
reproduce duplicate order
    ↓
trace request / retry behavior
    ↓
identify root cause
    ↓
write failing regression test
    ↓
minimal fix
    ↓
run regression test
    ↓
run affected/full tests
    ↓
verification-before-completion
~~~

Lợi ích là bug fix để lại một chuỗi bằng chứng rõ: cách tái hiện, regression test và kết quả sau khi sửa. Nếu sáu tháng sau bug quay lại, team vẫn có regression test để biết behavior mong muốn là gì.

---

## Những điểm tôi đánh giá cao trong thiết kế của repo

### 1. Superpowers coi process là sản phẩm chính

Nhiều tool AI coding tập trung vào:

~~~text
model mạnh hơn
context lớn hơn
tool nhiều hơn
~~~

Superpowers tập trung vào câu hỏi khác:

~~~text
agent nên làm việc theo trình tự nào?
~~~

Đó là một abstraction hợp lý vì model có thể thay đổi nhưng các nguyên tắc như design trước implementation, TDD, review và verification vẫn có giá trị.

### 2. Skill có trigger và hard gate rõ

Các skill không chỉ nói "nên brainstorm". Chúng mô tả:

- khi nào skill phải chạy,
- khi nào phải dừng,
- user phải approve ở đâu,
- evidence nào cần có trước khi đi tiếp.

Nhờ đó, agent ít phải tự đoán xem bước nào là bắt buộc và khi nào được phép đi tiếp.

### 3. Context được chia theo vai trò

Subagent-driven development không đưa toàn bộ session history cho mọi worker. Planner, implementer và reviewer nhận context khác nhau. Việc chia context theo vai trò giúp mỗi agent chỉ mang theo phần lịch sử cần cho công việc của mình.

### 4. Git và test được coi là source of truth

Worktree, commit, diff, ledger và test output tạo ra state bên ngoài model. Git và test output còn tồn tại ngay cả khi conversation context bị compact hoặc mất.

### 5. Verification được tách khỏi confidence

Một model có thể rất tự tin nhưng sai. Superpowers cố biến:

~~~text
"I think this works"
~~~

thành:

~~~text
"I ran this command on the current tree,
and here is the result."
~~~

---

## Trade-off và điểm cần cân nhắc

Superpowers không phải workflow tối ưu cho mọi tình huống.

### Process khá nặng

Với một thay đổi cực nhỏ, full architectural flow sẽ quá nhiều overhead.

Repo hiện đã xử lý phần nào bằng cách phân loại <code>spike</code>, <code>bounded</code> và <code>architectural</code>, nhưng người dùng vẫn nên hiểu rằng project ưu tiên discipline hơn tốc độ tuyệt đối.

### TDD rất nghiêm

Rule "test fail trước code" được áp dụng rất mạnh. Nếu team của bạn chủ yếu làm prototype, generated code hoặc exploratory work, bạn có thể thấy workflow này cứng hơn thói quen hiện tại.

### Subagent review tốn thêm compute

Fresh implementer + reviewer cho từng task giúp context sạch hơn, nhưng chắc chắn tốn nhiều agent turns hơn. Repo vì vậy cũng có <code>executing-plans</code> cho trường hợp muốn giảm chi phí.

### Khả năng phụ thuộc vào harness

Cùng một skill library nhưng mỗi coding harness có tool và lifecycle khác nhau. Repository phải duy trì integration riêng cho Claude Code, Codex, Gemini, Cursor, Pi và các runtime khác.

Do đó khi debug một behavior lạ, cần phân biệt:

~~~text
skill logic
vs
harness integration
vs
model behavior
~~~

---

## Superpowers phù hợp với ai?

Superpowers hợp với bạn hơn nếu bạn:

- dùng coding agent trên repository thật,
- làm feature kéo dài qua nhiều task,
- muốn design trước khi implementation,
- muốn TDD trở thành default,
- thường xuyên cần review code do agent viết,
- không muốn agent tự báo "done" khi chưa verify,
- muốn cùng một development methodology trên nhiều coding agent.

Nếu bạn chỉ dùng AI để:

~~~text
viết một regex
giải thích một function
tạo một script throwaway
~~~

thì toàn bộ workflow có thể không cần thiết. Nhưng khi coding agent bắt đầu sửa nhiều file, tạo branch, chạy test và làm việc hàng giờ, một methodology rõ ràng bắt đầu có giá trị hơn rất nhiều.

---

## Kết luận

Superpowers không phát minh ra brainstorming, TDD, worktree hay code review. Phần đáng xem là cách project **ghép những thực hành quen thuộc đó thành một state machine cho coding agent**:

~~~text
understand
    ↓
design
    ↓
plan
    ↓
isolate
    ↓
implement with tests
    ↓
review
    ↓
verify
    ↓
integrate
~~~

Agent vẫn tự reasoning và viết code, nhưng các checkpoint như design approval, test và verification không còn là những bước tùy hứng. Vì vậy, tôi xem Superpowers như một cách trả lời khá cụ thể cho câu hỏi:

> **Nếu AI trở thành developer trong team, chúng ta nên đưa cho nó quy trình làm việc như thế nào?**

Nếu đang dùng Claude Code, Codex, Antigravity hoặc một coding agent khác trên project thật, tôi nghĩ nên thử Superpowers trên một repo nhỏ trước để xem mức process này có hợp với cách làm việc của bạn hay không.

**Repository:** [https://github.com/obra/superpowers](https://github.com/obra/superpowers)

---

## Nguồn tôi dùng để phân tích

Bài viết được đọc và đối chiếu với snapshot repository <code>obra/superpowers</code> tại commit <code>5bf4e78011075bcfc0dc295f0724994cd123ee71</code> ngày 22/09/2026.

- [README của Superpowers](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/README.md)
- [using-superpowers](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/using-superpowers/SKILL.md)
- [brainstorming](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/brainstorming/SKILL.md)
- [writing-plans](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/writing-plans/SKILL.md)
- [subagent-driven-development](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/subagent-driven-development/SKILL.md)
- [test-driven-development](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/test-driven-development/SKILL.md)
- [verification-before-completion](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/verification-before-completion/SKILL.md)
- [using-git-worktrees](https://github.com/obra/superpowers/blob/5bf4e78011075bcfc0dc295f0724994cd123ee71/skills/using-git-worktrees/SKILL.md)
