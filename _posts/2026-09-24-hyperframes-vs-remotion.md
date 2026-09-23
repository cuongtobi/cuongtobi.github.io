---
layout: post
title: "HyperFrames vs Remotion: Nên chọn HTML-native hay React để xây video bằng code?"
date: 2026-09-24
author: Cuong Vuong
categories:
  - ai-projects
description: "So sánh chi tiết HyperFrames và Remotion: authoring model, animation, renderer, Studio, Player, cloud rendering, AI coding agent, license, ưu nhược điểm và từng use case phù hợp."
image: /assets/images/hyperframes-vs-remotion-cover.svg
cover_image: /assets/images/hyperframes-vs-remotion-cover.svg
image_width: 1200
image_height: 630
tags:
  - hyperframes
  - remotion
  - video-generation
  - programmatic-video
  - html-video
  - react
  - ai-coding
  - motion-graphics
  - developer-tools
---

Sau khi đọc sâu cả **HyperFrames** và **Remotion**, tôi thấy hai dự án này nhìn bề ngoài khá giống nhau: đều dùng code để tạo video, đều có preview, renderer, player, cloud rendering và workflow với coding agent.

Nhưng chúng đặt cược vào hai mô hình authoring khác nhau:

~~~text
HyperFrames
HTML + CSS + media + seekable animation
                 ↓
               video

Remotion
React components + frame-based state
                 ↓
               video
~~~

Sự khác biệt này kéo theo gần như toàn bộ phần còn lại: cách tổ chức project, cách viết animation, mức độ phụ thuộc framework, workflow với AI agent, khả năng tái sử dụng component, cách scale hệ thống và cả vấn đề license.

Bài này không cố chọn một bên thắng tuyệt đối. Câu hỏi thực tế hơn là:

> **Khi nào nên dùng HyperFrames, khi nào nên dùng Remotion?**

Tại thời điểm viết bài:

- **HyperFrames CLI:** 0.8.66
- **Remotion:** 4.0.527

Hai bài phân tích riêng:

- [HyperFrames: Viết video bằng HTML, render từng frame bằng Chrome và FFmpeg](/hyperframes-html-video-rendering.html)
- [Remotion: Dùng React để lập trình video, preview bằng Studio và render tự động](/remotion-react-programmatic-video.html)

---

## Tóm tắt nhanh

| Tiêu chí | HyperFrames | Remotion |
|---|---|---|
| Authoring model | HTML + CSS + JavaScript | React + JSX/TSX |
| Source of truth | HTML composition | React component |
| Framework dependency | Không bắt buộc React | React là trung tâm |
| Timeline | Clip timing + seekable animation | Frame + component tree |
| Animation | GSAP, CSS, Lottie, Three.js, WAAPI, adapter | interpolate, spring, Sequence, React ecosystem |
| Build step | Có thể chạy trực tiếp từ HTML | Thường cần bundling |
| Coding agent | Thiết kế rất rõ theo agent-first | Có Agent Skills và integration riêng |
| Studio | Có, đang tiếp tục phát triển | Hệ sinh thái trưởng thành hơn |
| Player | Web component | React component |
| Server rendering | Có | Có |
| AWS Lambda | Có | Có |
| Component reuse | Block, catalog, web component | React component/package |
| License | Apache-2.0 | Remotion License riêng |
| Phù hợp nhất | HTML-native automation, asset/timeline pipeline | React apps, SaaS, template platform |

Nếu rút gọn thành một câu:

> **HyperFrames giống một HTML-native video runtime được thiết kế rất mạnh cho coding agent; Remotion giống một video application framework dựa trên React.**

---

## 1. Khác biệt nền tảng: HTML hay React?

Đây là điểm quan trọng nhất.

### HyperFrames: HTML là composition

HyperFrames coi HTML là format video.

Một composition có thể bắt đầu đơn giản như:

~~~html
<div
  data-composition-id="intro"
  data-width="1920"
  data-height="1080"
>
  <h1
    class="clip"
    data-start="1"
    data-duration="4"
  >
    Launch day
  </h1>
</div>
~~~

Timing nằm ngay trong DOM bằng data attributes.

Animation có thể đến từ:

- GSAP,
- CSS animation,
- Lottie,
- Three.js,
- Anime.js,
- Web Animations API,
- adapter tự viết.

HyperFrames không bắt toàn bộ video phải nằm trong một framework UI cụ thể.

Mô hình rất trực tiếp:

~~~text
HTML
CSS
JavaScript
media
↓
video
~~~

### Remotion: React là composition

Remotion coi React component là source of truth.

Một video được đăng ký bằng:

~~~tsx
<Composition
  id="Intro"
  component={Intro}
  durationInFrames={180}
  fps={30}
  width={1920}
  height={1080}
/>
~~~

Component đọc thời gian thông qua frame:

~~~tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1]);
~~~

Mô hình là:

~~~text
frame
↓
React render
↓
component tree
↓
frame hình ảnh
~~~

Nếu team đã quen React, cách này rất tự nhiên.

---

## 2. Triết lý timeline khác nhau

Cả hai đều hướng tới render có thể lặp lại, nhưng cách biểu diễn timeline khác nhau.

### HyperFrames: clip + timestamp

HyperFrames thiên về cách nghĩ của media timeline:

~~~text
clip A
start = 0
duration = 5

clip B
start = 1
duration = 3

audio
start = 0
duration = 8
~~~

Element có thể mang:

~~~text
data-start
data-duration
data-track-index
~~~

Cách này đặc biệt dễ map khi input đã có timeline sẵn, ví dụ subtitle, voice, asset index, B-roll, SFX hoặc scene list.

### Remotion: frame + component hierarchy

Remotion thiên về component tree:

~~~text
Composition
├── Sequence
│   └── Intro
├── Sequence
│   └── MainContent
└── Sequence
    └── Outro
~~~

Ví dụ:

~~~tsx
<Sequence from={0} durationInFrames={90}>
  <Intro />
</Sequence>

<Sequence from={90} durationInFrames={150}>
  <Content />
</Sequence>
~~~

Timeline được thể hiện qua component hierarchy. Khi video có nhiều reusable scene hoặc business logic, model này rất mạnh.

---

## 3. Animation: HyperFrames linh hoạt về engine, Remotion đồng nhất về model

### HyperFrames

HyperFrames không cố thay thế animation ecosystem của web.

Bạn có thể tiếp tục dùng:

~~~text
GSAP
CSS
Lottie
Three.js
Anime.js
WAAPI
custom adapter
~~~

Điều kiện quan trọng là animation phải **seekable**. Renderer phải có khả năng yêu cầu composition hiển thị đúng trạng thái tại một timestamp cụ thể, thay vì chỉ nhấn play rồi chờ.

**Ưu điểm:** tận dụng được rất nhiều thư viện animation web.

**Nhược điểm:** animation phụ thuộc timer, random không seed, network hoặc side effect có thể cần xử lý để render ổn định.

### Remotion

Remotion có model thống nhất hơn:

~~~text
frame
↓
interpolate()
spring()
Sequence
TransitionSeries
component props
~~~

Animation thường được viết trực tiếp theo frame.

**Ưu điểm:** rất rõ frame nào phải trông như thế nào.

**Nhược điểm:** nếu mang nguyên một animation system web có sẵn vào, đôi khi phải chuyển tư duy sang frame-driven.

---

## 4. Build system và độ thuần web

### HyperFrames

Một composition có thể chỉ là:

~~~text
index.html
assets/
audio/
video/
~~~

README hiện nhấn mạnh HTML composition có thể chạy trực tiếp, không cần biến thành React application.

Điều này rất tiện với coding agent:

~~~text
đọc HTML
↓
sửa DOM/CSS
↓
preview
↓
render
~~~

### Remotion

Remotion là một React project, thường có:

~~~text
src/
components/
Root.tsx
package.json
tsconfig.json
~~~

Server rendering thường đi qua bundling.

Nếu hệ thống vốn đã là React thì đây không phải overhead vô ích. Ngược lại, nó cho phép tận dụng TypeScript, npm packages, hooks, shared UI libraries, tests và component architecture.

---

## 5. Khả năng tái sử dụng

### HyperFrames

Reuse thường thông qua:

- block,
- catalog component,
- web component,
- HTML fragment,
- design token,
- reusable effect,
- frame.md / DESIGN.md.

Catalog có thể cài block như:

~~~bash
npx hyperframes add data-chart
npx hyperframes add instagram-follow
~~~

### Remotion

Reuse là thế mạnh tự nhiên của React:

~~~text
Title
LowerThird
ProductCard
Chart
Caption
CTA
~~~

Các component có thể đóng gói thành package nội bộ. Nếu công ty đã có design system React, video system có thể dùng cùng tư duy component.

---

## 6. Studio và preview

### HyperFrames Studio

HyperFrames có Studio browser-based. README hiện mô tả surface này là **available, evolving**.

Workflow nổi bật vẫn là:

~~~text
agent / code
↓
HTML files
↓
preview
↓
render
~~~

### Remotion Studio

Remotion Studio đã là một phần trung tâm của workflow:

- scrub timeline,
- chọn composition,
- chỉnh input props,
- inspect frame,
- preview animation,
- trigger render.

Với developer quen frontend, trải nghiệm này khá gần dev server + visual timeline.

---

## 7. Player và xây application

Đây là nơi Remotion đặc biệt mạnh nếu mục tiêu không chỉ là render file video.

### HyperFrames Player

HyperFrames có player dạng web component, nên có thể embed mà không buộc application phải dùng React.

### Remotion Player

Remotion có React Player và rất hợp với application React:

~~~text
Dashboard
↓
video configuration UI
↓
Remotion Player
↓
preview
↓
render API
↓
MP4
~~~

Nếu muốn xây video SaaS, template editor hoặc customer-facing configurator, đây là một lợi thế rõ.

---

## 8. Server-side rendering và cloud

### HyperFrames

Stack hiện có các lớp như:

~~~text
CLI
Core
Engine
Producer
AWS Lambda
GCP Cloud Run
~~~

Pipeline cơ bản:

~~~text
HTML composition
↓
browser rendering
↓
frame capture
↓
encode + audio mix
↓
video
~~~

### Remotion

Remotion có:

~~~text
@remotion/renderer
@remotion/lambda
serverless packages
client-side rendering
Node.js APIs
~~~

Các API quen thuộc gồm:

~~~text
bundle()
selectComposition()
renderMedia()
~~~

Remotion đã có hệ sinh thái server rendering rộng và lâu đời hơn.

---

## 9. Batch rendering

Cả hai đều có thể dùng cho batch video:

~~~text
10.000 input records
↓
template
↓
10.000 videos
~~~

### HyperFrames hợp khi input gần với timeline/media data

Ví dụ:

~~~text
script.json
asset-index.json
voice.wav
captions.srt
scene timing
~~~

Agent hoặc generator có thể biến chúng thành composition HTML.

### Remotion hợp khi input giống application data

Ví dụ:

~~~json
{
  "name": "Product A",
  "price": "$99",
  "image": "product.jpg"
}
~~~

Data được đưa vào React props. Nếu layout có nhiều conditional logic, component model rất tiện.

---

## 10. Coding agent

Đây là nơi hai project đang tiến lại gần nhau.

### HyperFrames

HyperFrames được thiết kế rất rõ theo hướng agent-first. README hiện liệt kê 21 skills và router chính cho workflow tạo video.

Cài:

~~~bash
npx skills add heygen-com/hyperframes
~~~

Hoặc:

~~~bash
npx hyperframes skills update
~~~

HTML là format đơn giản để agent đọc, sửa và diff.

### Remotion

Remotion cũng đầu tư mạnh vào coding agent.

Cài:

~~~bash
npx remotion skills add
~~~

Hoặc:

~~~bash
npx -y skills@latest add remotion-dev/skills -g -y
~~~

Do coding model hiện viết React khá tốt, Remotion cũng rất hợp với agent workflow.

---

## 11. HyperFrames có lợi thế gì cho agent?

Không phải vì agent không viết được React.

Điểm đáng chú ý là với nhiều video nhỏ, state space của project có thể gọn hơn:

~~~text
index.html
assets/
voice.wav
~~~

Agent không nhất thiết phải quản lý component hierarchy, hooks, bundler và package architecture.

Với video generated một lần hoặc scene-by-scene, sự đơn giản này có giá trị.

---

## 12. Remotion có lợi thế gì cho agent?

Khi video trở thành software system lớn, structure mạnh hơn lại có lợi.

Ví dụ hệ thống có:

~~~text
100 templates
50 reusable components
10 brand themes
20 chart types
multi-language captions
dynamic layouts
~~~

React + TypeScript giúp agent:

- tìm component,
- refactor,
- reuse,
- type-check,
- test,
- compose.

Ở quy mô lớn, architecture có cấu trúc thường quan trọng hơn việc source ngắn.

---

## 13. License: khác biệt rất lớn

### HyperFrames

HyperFrames dùng **Apache License 2.0**.

Đây là permissive open-source license phổ biến. README hiện cũng nhấn mạnh không có per-render fee hay commercial-use threshold.

### Remotion

Remotion có **Remotion License** riêng.

Free license hiện áp dụng cho:

- cá nhân,
- tổ chức for-profit tối đa 3 nhân viên,
- nonprofit / not-for-profit,
- evaluation chưa dùng commercial.

For-profit organization nằm ngoài nhóm này cần Company License.

Repository cũng ghi license sẽ có điều chỉnh ở Remotion 5.0.

Với công ty lớn, đây có thể là một tiêu chí kiến trúc cần xem ngay từ đầu.

---

## 14. Mức độ trưởng thành

### Remotion

Remotion có lợi thế về thời gian phát triển và ecosystem.

README hiện nói tài liệu đã vượt **1000 trang**. Project có nhiều package cho media, transitions, captions, shapes, Three.js, Player, Studio, Lambda, renderer và client rendering.

Nếu cần một platform đã trải qua nhiều edge case production, Remotion có lợi thế.

### HyperFrames

HyperFrames mới hơn. CLI hiện ở **0.8.66** và một số surface như Studio vẫn được mô tả là đang phát triển.

Đổi lại, kiến trúc mới tập trung rất mạnh vào:

- agent workflow,
- HTML-native authoring,
- deterministic rendering,
- design-system-to-video,
- reusable catalog.

---

## 15. Bảng so sánh chi tiết

| Hạng mục | HyperFrames | Remotion |
|---|---|---|
| Core abstraction | HTML composition | React Composition |
| Timing | seconds / clip timing | frames |
| Track model | rõ bằng data attributes | component + Sequence |
| Animation API | adapter-based | frame-based primitives |
| GSAP | rất tự nhiên | dùng được nhưng không phải core model |
| CSS animation | phù hợp khi seekable | thường ưu tiên frame-driven |
| Lottie | phù hợp | phù hợp |
| Three.js | hỗ trợ | có ecosystem riêng |
| React requirement | không | có |
| Plain HTML | core workflow | không phải core authoring model |
| TypeScript architecture | tùy chọn | rất tự nhiên |
| Component reuse | blocks/web components | React components |
| Build complexity | thấp hơn với composition đơn giản | cao hơn một chút |
| Studio maturity | đang phát triển | trưởng thành hơn |
| Player | web component | React component |
| CLI | có | có |
| AWS Lambda | có | có |
| Large React application | không phải thế mạnh chính | rất phù hợp |
| One-off generated video | rất phù hợp | phù hợp |
| Agent-generated HTML scene | rất phù hợp | không phải authoring chính |
| Typed template system | làm được | rất phù hợp |
| License | Apache-2.0 | custom Remotion License |

---

## 16. Ưu điểm của HyperFrames

- **HTML-native:** không cần React.
- **File format đơn giản:** dễ inspect, diff và sửa.
- **Tận dụng animation ecosystem web:** GSAP, Lottie, CSS, Three.js, WAAPI.
- **Agent-first:** Skills và CLI được thiết kế rõ cho coding agent.
- **Apache-2.0:** dễ đưa vào commercial infrastructure hơn về mặt license.
- **Hợp asset-driven pipeline:** script, voice, subtitle, asset và timing map tự nhiên vào composition.

---

## 17. Nhược điểm của HyperFrames

- **Ecosystem còn mới hơn Remotion.**
- **Seekable animation cần kỷ luật:** không phải animation web nào cũng deterministic.
- **Structure lớn phải tự thiết kế tốt:** type architecture không tự nhiên mạnh như React + TypeScript.
- **Studio còn đang phát triển:** code/agent workflow hiện là phần hấp dẫn hơn.

---

## 18. Ưu điểm của Remotion

- **React component model mạnh:** rất hợp video system lớn.
- **TypeScript và tooling tốt:** dễ refactor, test, type-check và package component.
- **Ecosystem production rộng:** Renderer, Lambda, Player, Studio và nhiều package media.
- **Rất hợp xây application:** video SaaS, editor, configurator, template platform.
- **Frame model rõ ràng:** animation biểu diễn trực tiếp theo frame.
- **Documentation và community lớn hơn.**

---

## 19. Nhược điểm của Remotion

- **React là dependency kiến trúc.**
- **Project nhỏ vẫn trở thành React codebase.**
- **License cần kiểm tra với công ty lớn.**
- **Có thể over-engineer video đơn giản** nếu chỉ cần vài scene HTML và media.

---

## 20. HyperFrames phù hợp với mục đích nào?

### AI agent tạo video từ script + asset

Ví dụ:

~~~text
script.json
voice.wav
subtitles.srt
assets/
asset-index.json
~~~

Agent tạo scene HTML theo timeline. Đây là mapping rất trực tiếp.

### Docs-to-video

README, website, PDF hoặc screenshot có thể được biến thành explainer mà không phải xây React app.

### PR walkthrough / code demo

Code diff, screenshot, caption, narration và pointer animation rất hợp với HTML/CSS.

### Design system chuyển thành motion

Nếu đã có design tokens, CSS và typography web, hướng frame.md của HyperFrames rất đáng chú ý.

### Commercial infrastructure cần permissive license

Apache-2.0 là lợi thế rõ nếu license là constraint quan trọng.

---

## 21. Remotion phù hợp với mục đích nào?

### Team đã dùng React/TypeScript

Có thể tái sử dụng conventions, lint, tests, shared packages và component architecture.

### Video SaaS

Workflow như:

~~~text
user input
↓
preview
↓
render
↓
download/share
~~~

rất hợp với Player + Renderer.

### Hàng trăm reusable templates

Sports, finance, ecommerce, real estate, social template có thể được component hóa và đóng gói.

### Video có nhiều business logic

Ví dụ locale khác nhau, layout khác nhau, optional sections, dynamic charts hoặc nhiều condition. React xử lý dạng logic này rất tự nhiên.

### Cần ecosystem production trưởng thành

Nếu cần large batch rendering, Player integration, nhiều media package và docs rộng, Remotion có lợi thế.

---

## 22. Với YouTube explainer thì sao?

Đây là case mà **cả hai đều phù hợp**.

Input giả sử gồm:

~~~text
script
voice
subtitle
images
video assets
music
SFX
~~~

### Chọn HyperFrames nếu workflow thiên về scene data

~~~text
scene 1
asset 1
start 0
end 7

scene 2
asset 2
start 7
end 13
~~~

Agent dựng HTML theo từng scene.

### Chọn Remotion nếu muốn xây library scene

~~~text
IntroScene
QuoteScene
TimelineScene
MapScene
ChartScene
OutroScene
~~~

Script chỉ cần chọn component và props. Khi pipeline phải sản xuất nhiều video cùng phong cách, model này rất mạnh.

---

## 23. Với TikTok / Reels / short video

### HyperFrames hợp khi

- kinetic caption,
- media overlay,
- transition,
- AI agent generate layout,
- asset thay đổi liên tục.

### Remotion hợp khi

- đã có bộ template,
- nhiều video dùng cùng visual system,
- cần render theo dữ liệu,
- preview nằm trong web app.

---

## 24. Với chart và dashboard-to-video

Cả hai đều mạnh.

HyperFrames có catalog và data-chart direction, đồng thời cho phép dùng web visualization library.

Remotion lại rất thuận lợi nếu dashboard hiện tại đã là React vì chart component có thể được đưa vào video cùng component ecosystem.

---

## 25. Với video editor cho end-user

Nếu application chính là React, tôi sẽ xem Remotion trước.

Lý do:

~~~text
React UI
+
Remotion Player
+
React video components
+
render API
~~~

Tất cả cùng một component ecosystem.

HyperFrames vẫn có thể xây editor và có Studio/Player, nhưng đây chưa phải phần ecosystem trưởng thành nhất của nó hiện tại.

---

## 26. Không nên chọn dựa trên công cụ nào render đẹp hơn

Chất lượng hình ảnh cuối cùng chủ yếu phụ thuộc vào:

- creative direction,
- typography,
- asset quality,
- motion design,
- timing,
- easing,
- composition,
- audio design.

Cả hai đều có thể tạo video rất đẹp.

Framework chủ yếu quyết định:

~~~text
cách biểu diễn video
cách maintain source
cách agent thao tác source
cách scale production
~~~

---

## 27. Một cách chọn thực dụng

Hãy hỏi:

> **Video của tôi giống document/timeline hay giống application?**

Nếu giống:

~~~text
HTML document
media timeline
asset-driven scenes
~~~

HyperFrames thường tự nhiên hơn.

Nếu giống:

~~~text
component application
typed data
conditional rendering
large reusable system
~~~

Remotion thường tự nhiên hơn.

---

## 28. Decision matrix theo use case

| Use case | Công cụ nên xem trước |
|---|---|
| Agent tạo one-off promo video | HyperFrames |
| Script + voice + asset → explainer | HyperFrames |
| Docs / website → video | HyperFrames |
| PR walkthrough / code demo | HyperFrames |
| HTML design system → motion | HyperFrames |
| React SaaS video app | Remotion |
| Video template platform | Remotion |
| Hàng trăm typed reusable templates | Remotion |
| Customer-facing video configurator | Remotion |
| Complex business logic | Remotion |
| Existing React team | Remotion |
| Framework-agnostic HTML pipeline | HyperFrames |
| Apache-2.0 requirement | HyperFrames |
| Mature video ecosystem priority | Remotion |
| Large-scale cloud render | Cả hai; Remotion hiện có ecosystem lâu đời hơn |
| Coding agent | Cả hai |

Đây không phải benchmark tuyệt đối. Nó chỉ cho thấy authoring model nào khớp tự nhiên hơn với từng bài toán.

---

## 29. Có thể dùng cả hai không?

Về kỹ thuật là có, nhưng phần lớn project không cần.

Ví dụ:

~~~text
HTML-generated scene
↓
HyperFrames
↓
render asset

React video assembly
↓
Remotion
↓
final video
~~~

Cách này chỉ đáng làm khi có ranh giới rõ giữa hệ thống tạo motion asset và hệ thống assemble final video.

Nếu không, chọn một source of truth sẽ dễ maintain hơn.

---

## 30. Nếu bắt đầu một project mới

Tôi sẽ dựa vào 5 câu hỏi:

**1. Team có React không?** Có thì Remotion rất tự nhiên; không thì HyperFrames giảm dependency.

**2. Video có nhiều business logic không?** Có thì component model của Remotion có lợi.

**3. Input có sẵn timeline không?** Có thì HyperFrames map khá trực tiếp.

**4. Coding agent có phải author chính không?** Nếu phần lớn video được agent generate từ đầu, HTML-native rất hấp dẫn.

**5. License có phải constraint quan trọng không?** Nếu cần permissive OSS license cho commercial infrastructure, Apache-2.0 của HyperFrames là một điểm mạnh.

---

## Kết luận

HyperFrames và Remotion giải cùng một bài toán lớn:

> **Biến video thành source code có thể version control, tự động hóa và render bằng máy.**

Nhưng chúng chọn hai con đường khác nhau.

### HyperFrames

~~~text
web document
+
timeline
+
seekable animation
=
video
~~~

Điểm mạnh nằm ở HTML-native, framework-agnostic, agent-first, animation ecosystem web và Apache-2.0.

### Remotion

~~~text
React application
+
frame state
+
components
=
video
~~~

Điểm mạnh nằm ở React architecture, typed reusable components, Studio/Player ecosystem và server rendering trưởng thành.

Nếu project là một **video generator nhẹ, agent-driven và asset-driven**, HyperFrames là lựa chọn đáng thử trước.

Nếu project đang tiến tới một **video software platform với nhiều component, logic và application UI**, Remotion là lựa chọn rất tự nhiên.

Với dự án cá nhân, cách kiểm chứng tốt nhất vẫn là dựng cùng một video 30–60 giây bằng cả hai. Sau một video thật, khác biệt về cách tổ chức source, asset và workflow sẽ rõ hơn nhiều so với chỉ đọc feature list.

---

## Đọc thêm

- [Bài phân tích HyperFrames](/hyperframes-html-video-rendering.html)
- [Bài phân tích Remotion](/remotion-react-programmatic-video.html)
- [HyperFrames repository](https://github.com/heygen-com/hyperframes)
- [HyperFrames documentation](https://hyperframes.heygen.com/introduction)
- [Remotion repository](https://github.com/remotion-dev/remotion)
- [Remotion documentation](https://www.remotion.dev/docs)
- [HyperFrames License](https://github.com/heygen-com/hyperframes/blob/main/LICENSE)
- [Remotion License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
