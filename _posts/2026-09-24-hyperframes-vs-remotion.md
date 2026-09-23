---
layout: post
title: "HyperFrames vs Remotion: Hai cách rất khác để làm video bằng code"
date: 2026-09-24
author: Cuong Vuong
categories:
  - ai-projects
description: "So sánh HyperFrames và Remotion từ cách viết scene, timeline, animation, render, coding agent, cloud và license để chọn công cụ hợp với từng kiểu project."
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

Nhìn qua feature list, **HyperFrames** và **Remotion** khá dễ bị xếp vào cùng một nhóm: viết video bằng code, preview trong browser, render bằng Chrome/FFmpeg, có cloud path và đều đang đầu tư cho coding agent.

Nhưng dùng một lúc mới thấy chúng không chỉ là hai implementation của cùng một ý tưởng. Chúng bắt đầu từ hai cách nghĩ khác nhau.

HyperFrames xem video gần với một **tài liệu web có timeline**. Scene là HTML, timing gắn vào element, animation đến từ CSS/GSAP/Lottie/Three.js hoặc adapter khác.

Remotion lại xem video gần với một **ứng dụng React được render theo frame**. Scene là component, dữ liệu đi qua props, còn frame hiện tại là đầu vào để tính animation.

Khác biệt này nghe nhỏ, nhưng nó ảnh hưởng gần như mọi quyết định sau đó: project structure, cách chia scene, cách agent sửa code, khả năng reuse và cả việc hệ thống sẽ khó đến mức nào khi số template tăng lên.

Ở thời điểm tôi đọc hai repo, HyperFrames CLI đang ở **0.8.66**, còn Remotion ở **4.0.527**.

Nếu muốn đọc riêng từng project trước, tôi đã có hai bài chi tiết:

- [HyperFrames: Viết video bằng HTML, render từng frame bằng Chrome và FFmpeg](/hyperframes-html-video-rendering.html)
- [Remotion: Dùng React để lập trình video, preview bằng Studio và render tự động](/remotion-react-programmatic-video.html)

## Khác nhau ngay từ source of truth

Với HyperFrames, một composition có thể bắt đầu từ một file `index.html`. Element mang timing bằng các thuộc tính như `data-start`, `data-duration` và `data-track-index`.

~~~html
<h1
  class="clip"
  data-start="1"
  data-duration="4"
>
  Launch day
</h1>
~~~

Điều tôi thích ở cách này là nhìn source khá gần với thứ đang hiện trên màn hình. Text vẫn là text, video vẫn là thẻ video, CSS vẫn là CSS. Nếu project vốn đã có design token, component web hoặc animation bằng GSAP thì khoảng cách từ web sang video không quá xa.

Remotion đi theo hướng khác. Video là React component được đăng ký thành `Composition`, có `fps`, kích thước và `durationInFrames`. Component đọc frame hiện tại rồi tính style, transform, media state hoặc bất kỳ logic nào khác.

~~~text
frame
  ↓
React component
  ↓
DOM / canvas / SVG / WebGL
  ↓
renderer
  ↓
video
~~~

Nếu đã có một codebase React lớn, đây lại là cách rất tự nhiên. Video không đứng ngoài hệ thống mà dùng luôn component, type, package và cách tổ chức code mà team đang quen.

Nói cách khác, HyperFrames gần **document/timeline** hơn; Remotion gần **application/component tree** hơn.

## Timeline: giây và track hay frame và Sequence?

HyperFrames bộc lộ timeline khá trực tiếp. Một clip có thời điểm bắt đầu, thời lượng và track. Nếu input của bạn vốn đã đến từ script, subtitle, voice hoặc asset index thì mapping khá dễ hình dung:

~~~text
scene 1: 0s  → 7s
scene 2: 7s  → 13s
voice:   0s  → 58s
music:   0s  → 58s
~~~

Remotion thường chia timeline bằng `Sequence` và frame:

~~~text
0 ─────── 90 ─────────── 210 ─────── 300
| Intro   | Features      | Outro      |
~~~

Hai cách đều rõ, nhưng hợp với hai kiểu dữ liệu khác nhau.

Nếu pipeline của tôi đã có timestamp từ trước, tôi thấy model clip/timing của HyperFrames dễ map hơn. Nếu scene cần chứa nhiều logic và tái sử dụng như component, model của Remotion tiện hơn.

## Animation: cùng cần deterministic, nhưng đường đi khác nhau

HyperFrames cho phép mang khá nhiều animation tool của web vào composition: GSAP, CSS, Lottie, Three.js, Anime.js, WAAPI hoặc adapter riêng. Điều kiện quan trọng là animation phải **seek được**. Renderer cần hỏi “ở 2.433 giây thì scene trông như thế nào?” và nhận đúng trạng thái đó.

Sự linh hoạt này rất hữu ích nếu đã có motion code từ web. Đổi lại, developer phải để ý những thứ làm animation khó lặp lại như timer, random không seed hoặc side effect phụ thuộc thời gian thực.

Remotion đồng nhất hơn. Animation thường là hàm của frame, dùng `interpolate()`, `spring()`, `Sequence` và các primitive liên quan. Cách viết này có thể dài hơn một chút khi chuyển từ animation web có sẵn, nhưng đổi lại logic render rất rõ: cùng frame thì phải ra cùng trạng thái.

Tôi không nghĩ bên nào “mượt hơn” về mặt hình ảnh. Chất lượng motion vẫn phụ thuộc người dựng. Sự khác nhau nằm ở cách source biểu diễn chuyển động.

## Khi project lớn dần, khác biệt mới lộ rõ

Một video ngắn có thể làm tốt bằng cả hai. Sự khác biệt rõ nhất xuất hiện khi project không còn là một video mà trở thành một **hệ thống tạo video**.

Với HyperFrames, reuse thường đi qua block, catalog, web component, HTML fragment, design token hoặc effect dùng lại. Project có Catalog để cài các block như chart hay social overlay, và hướng `frame.md` khá thú vị nếu muốn đưa design system web sang motion.

Với Remotion, reuse đi đúng con đường React quen thuộc: component, props, TypeScript type và package nội bộ. Một library kiểu `Title`, `LowerThird`, `ChartScene`, `Caption`, `CTA` có thể được dùng lại trên hàng trăm template mà không thay đổi cách team frontend vốn làm việc.

Nếu tôi chỉ cần agent dựng nhiều scene khác nhau từ asset và timing, HyperFrames có vẻ gọn hơn.

Nếu tôi đang xây 100 template, nhiều theme, nhiều locale và nhiều nhánh business logic, Remotion bắt đầu có lợi thế rõ vì structure mạnh hơn.

## Studio và Player

Cả hai đều đã có Studio và Player, nhưng mức độ trưởng thành không hoàn toàn giống nhau.

HyperFrames có browser Studio và `@hyperframes/player` dạng web component. Điểm hay là player không bắt application phải là React. README hiện vẫn mô tả Studio là surface đang tiếp tục phát triển, nên cảm giác chung của project vẫn nghiêng nhiều về code/CLI/agent workflow.

Remotion Studio đã là một phần rất quen thuộc của hệ sinh thái. Developer có thể scrub timeline, đổi props, inspect composition và render ngay từ môi trường dev. `@remotion/player` lại đặc biệt hợp khi sản phẩm chính là React app.

Đây là một khác biệt đáng cân nhắc nếu bạn đang làm video editor hoặc configurator cho end-user. Nếu UI ngoài video cũng là React, Remotion Player nối vào application rất tự nhiên.

## Render local, server và cloud

Cả hai đều đã đi xa hơn chuyện “render thử trên laptop”.

HyperFrames tách Core, Engine và Producer; có đường render local, Docker, AWS Lambda và cả package cho GCP Cloud Run trong repo. Engine dùng browser capture rồi encode/mix media bằng FFmpeg.

Remotion có `@remotion/renderer`, `@remotion/lambda`, serverless package và Node.js/Bun APIs như `bundle()`, `selectComposition()`, `renderMedia()`.

Nếu chỉ hỏi “có batch render được không?” thì câu trả lời là cả hai đều có.

Nếu hỏi “ecosystem nào đã đi qua nhiều năm production hơn?” thì Remotion hiện nhỉnh hơn. Project lâu đời hơn, docs rộng hơn và surface cho renderer/Player/Studio đã được dùng qua nhiều phiên bản.

HyperFrames mới hơn nhưng đang đi rất nhanh, và cách tách engine/producer cho thấy mục tiêu không dừng ở demo local.

## Coding agent: chỗ hai project gặp nhau

Đây là phần thú vị nhất vì cả hai đều đang xem coding agent như một workflow chính thức chứ không phải use case phụ.

HyperFrames có router và nhiều skill chuyên cho animation, audio, registry, CLI, media, Figma... Điểm thuận lợi là agent thường chỉ phải thao tác HTML/CSS/JS và asset. Với video one-off hoặc scene được sinh theo script, số lớp cần hiểu có thể khá ít.

Remotion cũng có Agent Skills. Lợi thế của nó xuất hiện khi agent bước vào một codebase lớn: React + TypeScript cho agent nhiều structure để tìm component, sửa props, refactor và tái sử dụng.

Vì vậy tôi không chọn công cụ chỉ dựa trên câu “agent viết cái nào tốt hơn?”. Coding model hiện viết cả HTML lẫn React khá ổn.

Câu hỏi hữu ích hơn là: **sau khi agent tạo xong vòng đầu, source sẽ được maintain theo kiểu nào?**

Nếu câu trả lời là “mỗi video là một composition tương đối độc lập”, HyperFrames rất hợp.

Nếu câu trả lời là “đây sẽ là một product codebase sống nhiều năm”, Remotion có nhiều lợi thế từ component architecture.

## License là khác biệt không nên bỏ qua

HyperFrames dùng **Apache-2.0**. Đây là permissive open-source license quen thuộc và không có commercial-use threshold theo quy mô công ty trong README hiện tại.

Remotion dùng **Remotion License** riêng. Free license hiện dành cho cá nhân, nonprofit/not-for-profit, evaluation và tổ chức for-profit tối đa 3 nhân viên. Doanh nghiệp for-profit ngoài nhóm này cần Company License. Repo cũng ghi license sẽ có thay đổi ở Remotion 5.0.

Với personal project, điểm này thường không gây trở ngại.

Với sản phẩm công ty, đặc biệt nếu framework trở thành phần lõi của hạ tầng video, nên kiểm tra license ngay từ lúc chọn architecture thay vì đợi tới khi hệ thống đã phụ thuộc sâu.

## Bảng so sánh tôi thực sự quan tâm

| Câu hỏi | HyperFrames | Remotion |
|---|---|---|
| Source chính là gì? | HTML/CSS/JS | React/TSX |
| Timeline tự nhiên nhất | clip + timestamp + track | frame + Sequence |
| Mang animation web có sẵn vào | rất thuận | làm được, nhưng frame-driven là model chính |
| React bắt buộc | không | có |
| Player | web component | React component |
| Studio | có, đang phát triển nhanh | trưởng thành hơn |
| Component reuse | block/catalog/web component | React component/package |
| Agent tạo scene one-off | rất hợp | hợp |
| Codebase nhiều template/logic | làm được | rất hợp |
| Local/server/cloud render | có | có |
| License | Apache-2.0 | Remotion License |
| Độ trưởng thành ecosystem | mới hơn | lâu đời hơn |

## Tôi sẽ dùng cái nào cho từng kiểu việc?

Nếu là **script + voice + subtitle + asset → video explainer**, tôi sẽ thử HyperFrames trước. Timeline của voice/subtitle thường đã có sẵn, asset có thể đánh index và agent map trực tiếp chúng vào scene HTML.

Nếu pipeline explainer đó dần ổn định thành một thư viện scene dùng lại — intro, quote, map, chart, timeline, outro — thì Remotion bắt đầu hấp dẫn hơn vì mỗi scene có thể trở thành typed component.

Với **video SaaS**, configurator hoặc editor cho khách hàng, tôi sẽ nghiêng về Remotion nếu phần còn lại của sản phẩm là React. Player, props và component tree nằm cùng một ecosystem nên ít ma sát hơn.

Với **docs-to-video, PR walkthrough, website tour hoặc video sinh nhanh bằng agent**, HyperFrames có lợi thế ở sự trực tiếp của HTML. Nhiều thứ vốn đã là DOM/CSS nên không cần bọc lại thành React component chỉ để render.

Với **hàng trăm template có business logic**, nhiều locale và layout phụ thuộc dữ liệu, Remotion hợp hơn với cách tôi muốn maintain code.

Còn nếu requirement quan trọng là **permissive OSS license**, HyperFrames có lợi thế rõ nhờ Apache-2.0.

## Riêng với YouTube explainer dài

Đây là trường hợp tôi thấy dễ phân vân nhất.

Giả sử đầu vào đã có:

~~~text
script
voice
subtitle
assets/1, 2, 3...
music
SFX
scene timing
~~~

Nếu mỗi đoạn script chủ yếu chọn asset, đặt timing và gắn một số motion preset, HyperFrames rất hợp. JSON scene data có thể gần như map thẳng sang composition.

Nhưng nếu muốn xây hẳn một “ngôn ngữ scene” nội bộ, ví dụ:

~~~text
IntroScene
CharacterScene
MapScene
TimelineScene
ChartScene
QuoteScene
OutroScene
~~~

rồi mỗi video chỉ truyền props vào những scene đó, Remotion có lợi thế lâu dài hơn.

Tức là cùng một workflow có thể bắt đầu hợp HyperFrames nhưng sau này lại nghiêng về Remotion khi mức độ reuse tăng lên. Không có gì mâu thuẫn ở đây; chỉ là architecture thay đổi theo độ trưởng thành của pipeline.

## Điều tôi không dùng để quyết định

Tôi sẽ không chọn dựa trên câu “framework nào làm video đẹp hơn”.

Cả hai đều render bằng browser technology và đều có thể dùng typography, SVG, canvas, WebGL, media và animation library mạnh. Một video đẹp hay không vẫn phụ thuộc design, timing, easing, asset và audio nhiều hơn framework.

Tôi cũng không quá coi trọng số lượng feature nếu project chỉ dùng một phần nhỏ. Một framework có 50 package nhưng workflow của mình chỉ cần 5 package thì 45 package còn lại không giúp video tốt hơn.

Cuối cùng, tôi cũng không mặc định “ít code hơn” luôn tốt hơn. Video one-off cần sự gọn nhẹ; video platform cần structure để còn sống được sau nhiều tháng.

## Kết luận

Sau khi đọc cả hai repo, tôi không thấy HyperFrames và Remotion là hai sản phẩm tranh nhau đúng một vị trí.

**HyperFrames** hấp dẫn khi video gần với web document + timeline: asset-driven, HTML-native, agent tạo scene nhanh và không muốn phụ thuộc React.

**Remotion** hấp dẫn khi video gần với software application: component nhiều, dữ liệu động, business logic lớn và source cần được maintain như một codebase React thực thụ.

Nếu vẫn phân vân, cách thử có ích nhất là dựng cùng một video 30–60 giây bằng cả hai. Không cần benchmark render time ngay. Chỉ cần để ý ba thứ: source có dễ đọc không, sửa timing có khó không và sau ba vòng chỉnh sửa project có bắt đầu rối không.

Ba câu hỏi đó thường nói nhiều hơn một bảng feature.

## Đọc thêm

- [Bài phân tích HyperFrames](/hyperframes-html-video-rendering.html)
- [Bài phân tích Remotion](/remotion-react-programmatic-video.html)
- [HyperFrames repository](https://github.com/heygen-com/hyperframes)
- [HyperFrames documentation](https://hyperframes.heygen.com/introduction)
- [Remotion repository](https://github.com/remotion-dev/remotion)
- [Remotion documentation](https://www.remotion.dev/docs)
- [HyperFrames License](https://github.com/heygen-com/hyperframes/blob/main/LICENSE)
- [Remotion License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
