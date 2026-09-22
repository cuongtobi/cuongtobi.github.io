---
layout: post
title: "Superpowers: Workflow có kỷ luật cho AI coding agent"
date: 2026-09-22
author: Cuong Vuong
description: "Phân tích dự án obra/superpowers: cách hệ thống skill điều khiển coding agent qua brainstorming, planning, worktree, TDD, code review và verification; kèm hướng dẫn cài đặt và ví dụ sử dụng."
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

Coding agent ngày càng giỏi viết code. Nhưng trên một project thật, vấn đề khó nhất thường không phải là **AI có viết được code hay không**.

Vấn đề là quy trình:

- Agent có hiểu đúng thứ cần xây trước khi code không?
- Nó có tự ý lao vào implementation quá sớm không?
- Có tách thay đổi khỏi branch đang làm việc không?
- Có viết test trước hay chỉ thêm test sau khi code đã xong?
- Có review từng phần trước khi tiếp tục không?
- Khi nói "done", nó có evidence thật hay chỉ thấy code có vẻ ổn?

[Superpowers](https://github.com/obra/superpowers) của Jesse Vincent và Prime Radiant cố giải quyết chính lớp vấn đề này.

Thay vì là một model mới hay một IDE mới, Superpowers là **một methodology phát triển phần mềm cho coding agent**, được đóng gói thành các skill có thể kết hợp với nhau và một bootstrap giúp agent tự kích hoạt đúng skill vào đúng thời điểm.

Tại thời điểm tôi đọc repo cho bài viết này, plugin manifest đang ở phiên bản **6.4.1**, giấy phép **MIT**, và repository hỗ trợ nhiều coding harness khác nhau như Claude Code, Codex, Antigravity, Cursor, Gemini CLI, Devin CLI, GitHub Copilot CLI, Kimi Code, OpenCode, Pi, Qwen Code, Hermes Agent và Muse.

**Repository:** [github.com/obra/superpowers](https://github.com/obra/superpowers)

---

## Superpowers thực chất là gì?

Cách dễ hiểu nhất là xem Superpowers như một **lớp quy trình nằm trên coding agent**.

Agent vẫn là Claude Code, Codex, Gemini hay một harness khác. Superpowers không thay model và cũng không thay compiler, test runner hay Git.

Nó bổ sung một hệ thống skill để ép quá trình phát triển đi qua những bước có kỷ luật hơn:

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

Điểm quan trọng là đây không chỉ là một thư mục chứa prompt.

Superpowers có một bootstrap tên <code>using-superpowers</code>. Mục đích của bootstrap là làm cho agent **kiểm tra skill trước khi hành động**, thay vì đợi user nhớ và gọi từng skill bằng tay.

Trong tài liệu của repo, một integration được coi là đúng khi bootstrap này được nạp ngay từ đầu session; nếu chỉ copy các file skill vào máy nhưng không khiến agent tự kích hoạt chúng, tác giả coi đó là một integration chưa hoàn chỉnh.

---

## Cơ chế hoạt động: skill trước, action sau

Skill <code>using-superpowers</code> đặt ra một rule khá mạnh:

> Nếu có khả năng một skill liên quan tới task hiện tại, agent phải kiểm tra và dùng skill đó trước khi trả lời hoặc hành động.

Ý nghĩa thực tế là agent không nên làm kiểu:

~~~text
User: thêm feature X

Agent:
- mở vài file
- sửa code
- chạy test
- báo xong
~~~

Flow mong muốn là:

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

Đây là điểm tôi thấy quan trọng nhất của Superpowers: **workflow không phụ thuộc vào việc user nhớ một prompt dài**.

Nếu plugin được tích hợp đúng với harness, agent phải tự biết khi nào cần brainstorm, debug, test, review hoặc verify.

---

## Flow chính của Superpowers

README mô tả một basic workflow gồm brainstorming, worktree, planning, implementation, TDD, review và finish branch.

Khi đọc sâu hơn vào các skill hiện tại, flow có thể hình dung như sau:

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

<code>brainstorming</code> được thiết kế để chạy trước creative work.

Agent trước tiên phải hiểu:

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

Dùng cho thay đổi nhỏ, scope rõ, flow cần sửa đã tồn tại trong repo.

Ví dụ:

~~~text
"Thêm một flag vào endpoint hiện có."
~~~

Agent đọc context, hỏi những câu cần thiết, trình bày một thiết kế ngắn ngay trong chat và **chờ user approve trước khi implementation**.

#### Architectural

Dùng cho project mới, subsystem mới hoặc thay đổi làm đổi cách các component kết nối với nhau.

Flow đầy đủ hơn:

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

Điểm này tạo ra một ranh giới khá rõ: **approval cho ý tưởng không đồng nghĩa approval cho implementation**.

---

## 2. Writing Plans: biến design thành các task có thể thực thi

Sau khi có spec đủ rõ, <code>writing-plans</code> chuyển thiết kế thành implementation plan.

Plan mặc định nằm tại:

~~~text
docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md
~~~

Điểm đáng chú ý là plan của Superpowers không chỉ ghi:

~~~text
1. tạo API
2. thêm test
3. update UI
~~~

Skill yêu cầu chi tiết hơn nhiều.

Mỗi task phải mô tả:

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

Lý do rất thực dụng: implementation agent có thể không có toàn bộ context của người đã viết plan.

Plan phải đủ rõ để một agent mới mở task lên vẫn biết chính xác phải làm gì.

---

## 3. Worktree: implementation nên diễn ra trong workspace cô lập

<code>using-git-worktrees</code> đảm bảo feature work không vô tình làm bẩn checkout chính.

Skill trước tiên kiểm tra xem agent đã ở trong linked worktree hay chưa. Nếu harness có native worktree tool thì ưu tiên dùng tool đó. Nếu không có, nó fallback về Git worktree.

Ý tưởng:

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

Nếu baseline đã fail trước khi feature bắt đầu, agent phải báo điều đó thay vì mặc định mọi lỗi sau này là do code mới.

Đây là một chi tiết nhỏ nhưng quan trọng khi dùng agent trên repository đang phát triển thật.

---

## 4. Hai cách execute plan

Superpowers hiện cho phép hai hướng chính.

### Subagent-driven development

Đây là mode kỹ hơn.

Mỗi task được giao cho một implementer subagent mới. Sau implementation lại có reviewer kiểm tra task đó.

Flow:

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

Mục tiêu của fresh subagent là giảm context pollution.

Thay vì một agent giữ toàn bộ lịch sử dài của session rồi vừa design, vừa implement, vừa tự review chính code của mình, controller chỉ cấp cho worker đúng phần context của task.

Superpowers còn lưu progress trong một ledger dưới vùng:

~~~text
.superpowers/sdd/
~~~

Ledger được dùng như recovery map nếu session bị compaction hoặc mất context.

Đây là một điểm thiết kế khá đáng chú ý: **progress quan trọng không chỉ nằm trong trí nhớ hội thoại của model**.

### Executing Plans / native execution

Mode này rẻ và đơn giản hơn.

Một agent thực thi các task trong cùng session, sau đó dùng một reviewer mới cho toàn branch.

Trade-off:

| Mode | Ưu điểm | Chi phí |
|---|---|---|
| Subagent-driven | context sạch theo task, review từng task | nhiều lượt agent hơn |
| Native / executing-plans | ít overhead, nhanh và rẻ hơn | ít isolation và review độc lập hơn |

Superpowers không giả định mọi task đều cần mode đắt nhất.

---

## 5. TDD là rule cứng, không phải gợi ý

<code>test-driven-development</code> là một trong những skill mạnh tay nhất của project.

Nguyên tắc:

~~~text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
~~~

Flow chuẩn:

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

Điểm quan trọng không chỉ là "có test".

Agent phải **thấy test fail trước**.

Nếu test mới viết đã pass ngay, nó chưa chứng minh được feature mới thực sự được test.

Với bug fix, pattern tốt sẽ là:

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

Cách làm này chậm hơn việc patch ngay vài dòng, nhưng giảm khả năng agent tự thuyết phục rằng một thay đổi "có vẻ đúng".

---

## 6. Review không chỉ diễn ra ở cuối

Trong subagent-driven mode, sau mỗi task sẽ có task review.

Reviewer kiểm tra ít nhất hai nhóm vấn đề:

- spec compliance,
- code quality.

Nếu có finding quan trọng, task đi vào fix loop rồi được scoped re-review.

Sau khi toàn bộ task hoàn thành, branch còn có một whole-branch review nữa.

Điều này tách ba vai trò:

~~~text
planner
implementer
reviewer
~~~

thay vì để một model vừa quyết định requirement, vừa viết code, vừa tự tuyên bố code của mình đúng.

---

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

Nó cần fresh verification evidence.

Đây là một trong những triết lý xuyên suốt repo:

> **Evidence over claims.**

---

## 8. Finishing branch: kết thúc cũng có workflow

Khi implementation hoàn tất, <code>finishing-a-development-branch</code> chạy full test suite trước.

Sau khi baseline xanh, agent mới đi tới bước tích hợp và cleanup.

README mô tả các lựa chọn như:

- merge,
- mở pull request,
- giữ branch,
- discard.

Như vậy Superpowers không coi "viết code xong" là terminal state.

Terminal state nằm sau:

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

Thay vào đó, agent phải điều tra evidence và root cause trước khi sửa.

Sau fix vẫn quay lại TDD và verification.

Nếu chính Superpowers hoạt động không đúng trong một session — ví dụ skill không trigger, agent bỏ plan hoặc lặp việc — README còn cung cấp skill <code>diagnosing-superpowers</code> để đọc transcript và phân tích session với evidence.

---

## Cách cài Superpowers

Installation phụ thuộc vào coding harness. Nếu bạn dùng nhiều agent, README khuyến nghị cài riêng cho từng harness.

### Claude Code

Cách đơn giản nhất là dùng official Claude plugin marketplace:

~~~bash
/plugin install superpowers@claude-plugins-official
~~~

Project cũng có marketplace riêng.

Đăng ký:

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

README cho biết Antigravity chạy session-start hook của plugin, vì vậy Superpowers active từ message đầu tiên.

Muốn update có thể chạy lại cùng command.

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

Ngoài ra project còn có hướng dẫn cho Devin CLI, Factory Droid, GitHub Copilot CLI, Grok Build CLI, Kimi Code, OpenCode, Pi, Qwen Code, Hermes Agent và Muse.

---

## Cài xong thì sử dụng như thế nào?

Điểm thú vị là **không cần một câu lệnh đặc biệt cho mọi task**.

Bạn vẫn nói chuyện với coding agent bình thường.

Ví dụ:

~~~text
Let's add team invitations to this app.

An admin can invite a user by email.
The invitation expires after 48 hours.
The invited user can accept it once.
Please add tests.
~~~

Nếu Superpowers được bootstrap đúng, agent không nên ngay lập tức mở editor và thêm endpoint.

Với một thay đổi đủ lớn, flow kỳ vọng sẽ gần như:

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

Sau khi scope rõ, agent trình bày design và chờ approval.

Với một project mới, đây là architectural path, nên design có thể được lưu thành:

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

Chạy test.

Expected state:

~~~text
FAIL
~~~

Sau đó agent mới viết implementation tối thiểu.

Chạy lại:

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

Nếu output xác nhận toàn bộ test pass, lúc đó mới được báo success.

---

## Ví dụ với bug fix

Giả sử user nói:

~~~text
The checkout API sometimes creates two orders when the client retries after a timeout.
Find the root cause and fix it.
~~~

Superpowers nên ưu tiên <code>systematic-debugging</code> thay vì patch ngay.

Flow mong muốn:

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

Điểm đáng giá là bug fix có một evidence chain.

Nếu sáu tháng sau bug quay lại, team vẫn có regression test để biết behavior mong muốn là gì.

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

Các skill không chỉ nói "nên brainstorm".

Chúng mô tả:

- khi nào skill phải chạy,
- khi nào phải dừng,
- user phải approve ở đâu,
- evidence nào cần có trước khi đi tiếp.

Điều này giúp giảm ambiguity cho agent.

### 3. Context được chia theo vai trò

Subagent-driven development không đưa toàn bộ session history cho mọi worker.

Planner, implementer và reviewer nhận context khác nhau.

Đây là một cách thực dụng để giảm việc model bị nhiễu bởi lịch sử không liên quan.

### 4. Git và test được coi là source of truth

Worktree, commit, diff, ledger và test output tạo ra state bên ngoài model.

Điều này quan trọng vì conversation context có thể bị compact hoặc mất.

### 5. Verification được tách khỏi confidence

Một model có thể rất tự tin nhưng sai.

Superpowers cố biến:

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

Rule "test fail trước code" được áp dụng rất mạnh.

Nếu team của bạn chủ yếu làm prototype, generated code hoặc exploratory work, bạn có thể thấy workflow này cứng hơn thói quen hiện tại.

### Subagent review tốn thêm compute

Fresh implementer + reviewer cho từng task giúp context sạch hơn, nhưng chắc chắn tốn nhiều agent turns hơn.

Repo vì vậy cũng có <code>executing-plans</code> cho trường hợp muốn giảm chi phí.

### Khả năng phụ thuộc vào harness

Cùng một skill library nhưng mỗi coding harness có tool và lifecycle khác nhau.

Repository phải duy trì integration riêng cho Claude Code, Codex, Gemini, Cursor, Pi và các runtime khác.

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

Tôi nghĩ project này đáng thử nếu bạn:

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

thì toàn bộ workflow có thể không cần thiết.

Nhưng khi coding agent bắt đầu sửa nhiều file, tạo branch, chạy test và làm việc hàng giờ, một methodology rõ ràng bắt đầu có giá trị hơn rất nhiều.

---

## Kết luận

Điều thú vị nhất của Superpowers không nằm ở một skill riêng lẻ.

Brainstorming, TDD, worktree, code review hay systematic debugging đều là những khái niệm đã tồn tại từ lâu.

Điểm khác biệt là project **đóng gói chúng thành một state machine cho coding agent**:

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

Coding agent vẫn có quyền reasoning và viết code.

Nhưng nó không được tự do bỏ qua những checkpoint quan trọng chỉ vì "có vẻ task này đơn giản".

Đó là lý do tôi xem Superpowers không chỉ là một bộ prompt, mà là một thử nghiệm khá nghiêm túc về câu hỏi:

> **Nếu AI trở thành developer trong team, chúng ta nên đưa cho nó quy trình làm việc như thế nào?**

Nếu bạn đang dùng Claude Code, Codex, Antigravity hoặc một coding agent khác trên project thật, repo này đáng để đọc source và thử trên một project nhỏ trước.

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
