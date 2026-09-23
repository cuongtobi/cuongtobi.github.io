---
layout: post
title: "HyperFrames: Viết video bằng HTML, render từng frame bằng Chrome và FFmpeg"
date: 2026-09-24
author: Cuong Vuong
categories:
  - ai-projects
description: "Tìm hiểu heygen-com/hyperframes: framework mã nguồn mở biến HTML, CSS, media và animation có thể seek thành video MP4; kèm kiến trúc, cách cài đặt, sử dụng và ví dụ cơ bản."
image: /assets/images/hyperframes-html-video-cover.svg
cover_image: /assets/images/hyperframes-html-video-cover.svg
image_width: 1200
image_height: 630
tags:
  - hyperframes
  - video-generation
  - html-video
  - motion-graphics
  - ai-coding
  - ffmpeg
  - puppeteer
  - heygen
  - developer-tools
---

Nếu đã quen làm web, ý tưởng của **HyperFrames** khá dễ hình dung: thay vì dựng video trong một timeline độc quyền, ta mô tả cảnh bằng **HTML + CSS + JavaScript**, gắn thông tin timing lên các element, rồi để engine đi qua từng thời điểm chính xác và render thành video.

[HyperFrames](https://github.com/heygen-com/hyperframes) là dự án mã nguồn mở của HeyGen cho hướng tiếp cận đó. Repository mô tả nó là framework biến **HTML, CSS, media và seekable animations** thành video có đầu ra xác định. Bạn có thể dùng CLI trực tiếp, dùng nó như rendering core trong ứng dụng riêng, hoặc để coding agent tạo composition thông qua bộ skill của dự án.

Điểm tôi thấy đáng chú ý không phải là “HTML cũng làm được animation”. Chuyện đó đã có từ lâu. Phần thú vị nằm ở chỗ HyperFrames cố biến web animation thành một pipeline **frame-accurate** có thể render lặp lại, kiểm tra bằng CI và tự động hóa bằng agent.

Tại thời điểm tôi đọc repo cho bài viết này, package CLI đang ở nhánh **0.8.x**, source code dùng giấy phép **Apache-2.0**, runtime yêu cầu **Node.js 22+** và **FFmpeg**.

**Repository:** [github.com/heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)

---

## HyperFrames là gì?

Ở mức sử dụng cơ bản nhất, một video HyperFrames có thể chỉ là một file <code>index.html</code>.

Trong HTML đó, mỗi phần tử có thể mang metadata về thời gian:

~~~html
<h1
  class="clip"
  data-start="1"
  data-duration="4"
  data-track-index="1"
>
  Launch day
</h1>
~~~

<code>data-start</code> cho biết clip bắt đầu ở giây nào, <code>data-duration</code> cho biết nó tồn tại bao lâu, còn <code>data-track-index</code> thể hiện track của element trong composition.

Video, audio, text, SVG, canvas, WebGL hay các phần tử HTML bình thường đều có thể tham gia vào composition. Animation không bị khóa vào một framework riêng. README hiện liệt kê các hướng như:

- CSS animation,
- GSAP,
- Lottie,
- Three.js,
- Anime.js,
- Web Animations API,
- adapter tùy chỉnh.

Nói ngắn gọn:

~~~text
HTML/CSS/JS + media
        ↓
composition có timing
        ↓
seek tới thời điểm chính xác
        ↓
Chrome render frame
        ↓
FFmpeg encode + mix audio
        ↓
video output
~~~

Đây là khác biệt quan trọng so với việc chỉ quay màn hình một trang web đang chạy animation.

---

## Vì sao cần "seekable animation"?

Một animation bình thường trên web thường phụ thuộc vào đồng hồ thực.

Ví dụ:

~~~text
0 ms     animation bắt đầu
16 ms    browser vẽ frame tiếp theo
32 ms    frame tiếp theo
...
~~~

Nếu máy chậm, browser bận hoặc tab bị throttle, animation có thể bỏ frame hoặc lệch timing. Điều đó không quá nghiêm trọng khi người dùng chỉ xem animation trực tiếp trong trình duyệt, nhưng lại không phù hợp với một renderer video cần tạo chính xác frame số 157, 158, 159...

HyperFrames đi theo hướng khác: renderer **yêu cầu composition hiển thị trạng thái tại một timestamp cụ thể**.

Ví dụ video 30 fps:

~~~text
frame 0   → t = 0.000s
frame 1   → t = 0.033s
frame 2   → t = 0.067s
...
frame 150 → t = 5.000s
~~~

Engine có thể seek composition tới từng thời điểm rồi capture frame đó. Vì vậy render không cần phụ thuộc vào việc animation "play" trơn tru theo thời gian thực.

Đây cũng là lý do tài liệu HyperFrames nhấn mạnh tính **deterministic**: cùng input và cùng môi trường render thì pipeline hướng tới việc tạo lại cùng một chuỗi frame.

---

## Kiến trúc repository

HyperFrames không phải một package duy nhất. Repository là monorepo gồm nhiều lớp.

Một số package quan trọng:

~~~text
packages/
├── cli
├── core
├── engine
├── producer
├── studio
├── player
├── shader-transitions
└── aws-lambda
~~~

Có thể hiểu chúng theo luồng sau:

~~~text
CLI / Studio / Agent
        ↓
@hyperframes/core
        ↓
@hyperframes/engine
        ↓
@hyperframes/producer
        ↓
Chrome + FFmpeg
        ↓
MP4 / WebM / MOV / ...
~~~

### <code>hyperframes</code> CLI

Đây là lớp hầu hết người dùng sẽ chạm vào đầu tiên.

CLI cung cấp các command cho workflow như:

~~~bash
npx hyperframes init
npx hyperframes preview
npx hyperframes lint
npx hyperframes check
npx hyperframes render
~~~

Nếu chỉ muốn làm video, thường không cần gọi trực tiếp engine bên dưới.

### <code>@hyperframes/core</code>

Core giữ các contract và runtime dùng để hiểu composition:

- timing,
- clip tree,
- parser,
- lint,
- animation adapter,
- runtime seek,
- audio metadata,
- schema và utility dùng chung.

Đây là lớp giúp HTML không còn chỉ là một trang web, mà trở thành một composition có timeline mà renderer hiểu được.

### <code>@hyperframes/engine</code>

Đây là phần thú vị nhất nếu muốn hiểu renderer hoạt động thế nào.

Theo README của package engine, nó dùng **Puppeteer + Chrome DevTools Protocol** để mở composition trong headless Chrome. Renderer seek từng frame, capture kết quả rồi đưa sang FFmpeg.

Các service được repository tách riêng gồm những phần như:

~~~text
browserManager
frameCapture
screenshotService
chunkEncoder
streamingEncoder
audioMixer
videoFrameExtractor
parallelCoordinator
fileServer
~~~

Có nghĩa engine không chỉ chụp ảnh màn hình. Nó còn xử lý lifecycle của browser, capture session, frame buffer, encode, audio mix và parallel rendering.

### <code>@hyperframes/producer</code>

Nếu <code>engine</code> là các primitive render, <code>producer</code> là pipeline cao hơn dùng để đưa composition tới output hoàn chỉnh.

Package này chứa phần render orchestration, parity/regression harness, distributed rendering và nhiều kiểm tra phục vụ production.

### Studio và Player

<code>@hyperframes/studio</code> cung cấp giao diện browser để preview/edit composition. <code>@hyperframes/player</code> là web component để nhúng playback vào ứng dụng web.

Điều này cho phép cùng một project HTML đi qua nhiều bề mặt:

~~~text
coding agent
    ↕
project files
    ↕
Studio
    ↕
CLI renderer
~~~

---

## HyperFrames khác video editor truyền thống ở đâu?

HyperFrames không cố trở thành Premiere Pro hay After Effects trong trình duyệt.

Nó phù hợp hơn với cách nghĩ của developer:

~~~text
asset + code + timing + data
              ↓
         render pipeline
              ↓
            video
~~~

Thay vì kéo layer trên timeline bằng chuột, bạn có thể sinh hàng loạt video bằng code, thay text bằng dữ liệu, đổi ảnh theo input hoặc để agent viết composition.

Điểm mạnh của mô hình này thường xuất hiện khi video cần **tự động hóa**:

- video giới thiệu sản phẩm,
- changelog hoặc feature announcement,
- chart/data animation,
- social video có template,
- video tài liệu,
- video giải thích được tạo từ script + asset,
- pipeline render hàng loạt theo dữ liệu.

Ngược lại, nếu workflow chủ yếu là chỉnh tay từng keyframe bằng GUI và làm compositing phức tạp kiểu VFX, HyperFrames không thay thế hoàn toàn các editor truyền thống.

---

## HyperFrames và coding agent

Một phần khá rõ trong thiết kế của dự án là hướng tới coding agent.

Repository có các integration cho nhiều môi trường agent và một bộ skill riêng. Quickstart chính thức gợi ý cài skill:

~~~bash
npx skills add heygen-com/hyperframes
~~~

Sau đó có thể yêu cầu agent bằng ngôn ngữ tự nhiên, ví dụ:

~~~text
Using /hyperframes, make a 10-second product intro for https://example.com.
~~~

Ngoài route tổng quát <code>/hyperframes</code>, repo còn chia knowledge thành các skill chuyên biệt như:

~~~text
/hyperframes-core
/hyperframes-animation
/hyperframes-keyframes
/hyperframes-creative
/hyperframes-cli
/hyperframes-audio
/hyperframes-registry
/media-use
/figma
~~~

Cách chia này hợp lý vì một agent làm video cần nhiều kiến thức hơn việc "viết HTML": timing, animation phải seek được, audio, typography, transition, media asset và quy tắc render đều ảnh hưởng tới output cuối.

Điểm đáng chú ý là HyperFrames vẫn để lại **project files bình thường**. Agent không chỉ gửi yêu cầu tới một black box rồi trả về MP4. Sau khi agent tạo video, bạn vẫn có thể mở HTML/CSS/JS để sửa tay, preview trong Studio hoặc render lại bằng CLI.

---

## Cài đặt

### Yêu cầu

Theo tài liệu hiện tại:

- Node.js **22+**,
- FFmpeg.

Kiểm tra Node:

~~~bash
node --version
~~~

Kiểm tra FFmpeg:

~~~bash
ffmpeg -version
~~~

Bạn có thể chạy HyperFrames trực tiếp bằng <code>npx</code>, không bắt buộc cài global.

---

## Cách 1: tạo project bằng CLI

Khởi tạo một project mới:

~~~bash
npx hyperframes init my-video
cd my-video
~~~

Mở preview:

~~~bash
npx hyperframes preview
~~~

Sau khi composition ổn, render video:

~~~bash
npx hyperframes render
~~~

Nếu muốn chỉ định file output:

~~~bash
npx hyperframes render --output final.mp4
~~~

Trước khi render final, workflow tài liệu khuyến nghị chạy:

~~~bash
npx hyperframes lint
npx hyperframes check
npx hyperframes render --output final.mp4
~~~

<code>lint</code> kiểm tra cấu trúc composition. <code>check</code> mở project trong browser và tìm các vấn đề runtime/layout/motion/media/contrast trước khi encode.

---

## Cách 2: dùng với coding agent

Nếu đang ở trong một folder mà Codex, Claude Code hoặc agent khác có thể thao tác file, có thể cài bộ skill trước:

~~~bash
npx hyperframes skills update
~~~

Hoặc dùng skill installer:

~~~bash
npx skills add heygen-com/hyperframes
~~~

Sau đó đưa yêu cầu dạng tự nhiên:

~~~text
Using /hyperframes, create a 10-second 1920x1080 intro video.
Use a dark background, a large title, one subtitle and a simple upward reveal.
Preview it locally when finished.
~~~

Agent sẽ tạo project thay vì chỉ trả về một đoạn prompt.

Sau đó vẫn dùng các command quen thuộc:

~~~bash
npx hyperframes preview
npx hyperframes lint
npx hyperframes check
npx hyperframes render --output intro.mp4
~~~

---

## Ví dụ cơ bản: title card 6 giây

Giả sử ta muốn tạo một video 1920×1080 dài 6 giây, gồm nền tối và một tiêu đề xuất hiện từ giây thứ 1.

Một composition tối giản có thể trông như sau:

~~~html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1920,height=1080" />
  <style>
    html,
    body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0a0a0a;
      color: white;
      font-family: Inter, system-ui, sans-serif;
    }

    #stage {
      position: relative;
      width: 1920px;
      height: 1080px;
    }

    #title {
      position: absolute;
      left: 120px;
      top: 390px;
      font-size: 110px;
      font-weight: 800;
      letter-spacing: -4px;
    }

    #subtitle {
      position: absolute;
      left: 126px;
      top: 535px;
      font-size: 34px;
      color: #a3a3a3;
    }
  </style>
</head>
<body>
  <div
    id="stage"
    data-composition-id="intro"
    data-start="0"
    data-duration="6"
    data-width="1920"
    data-height="1080"
    data-fps="30"
  >
    <h1
      id="title"
      class="clip"
      data-start="1"
      data-duration="4"
      data-track-index="0"
    >
      HyperFrames
    </h1>

    <p
      id="subtitle"
      class="clip"
      data-start="1.4"
      data-duration="3.6"
      data-track-index="1"
    >
      HTML in. Video out.
    </p>
  </div>
</body>
</html>
~~~

Ở mức này ta mới khai báo **thời gian tồn tại** của element. Nếu muốn motion mượt hơn, có thể thêm GSAP/CSS/WAAPI và đăng ký timeline theo contract của HyperFrames để renderer seek animation chính xác.

Ví dụ với GSAP theo pattern trong README:

~~~html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });

  tl.from("#title", {
    opacity: 0,
    y: 60,
    duration: 0.8
  }, 1);

  tl.from("#subtitle", {
    opacity: 0,
    y: 24,
    duration: 0.6
  }, 1.35);

  window.__timelines = window.__timelines || {};
  window.__timelines.intro = tl;
</script>
~~~

Sau đó:

~~~bash
npx hyperframes preview
~~~

Kiểm tra:

~~~bash
npx hyperframes lint
npx hyperframes check
~~~

Và render:

~~~bash
npx hyperframes render --output intro.mp4
~~~

---

## Thêm video, audio và nhiều track

Một composition thực tế thường có nhiều loại media.

Ví dụ:

~~~html
<video
  class="clip"
  data-start="0"
  data-duration="6"
  data-track-index="0"
  src="intro.mp4"
  muted
  playsinline
></video>

<h1
  class="clip"
  data-start="1"
  data-duration="4"
  data-track-index="1"
>
  Launch day
</h1>

<audio
  data-start="0"
  data-duration="6"
  data-track-index="2"
  data-volume="0.5"
  src="music.wav"
></audio>
~~~

Từ góc nhìn workflow, cách viết này khá giống một timeline editor nhưng timeline được biểu diễn bằng dữ liệu trong HTML.

Điều đó rất hữu ích khi composition được sinh tự động.

Ví dụ một pipeline có thể là:

~~~text
script.json
assets/
voice.wav
captions.srt
      ↓
code / agent
      ↓
index.html + sub-compositions
      ↓
HyperFrames
      ↓
final.mp4
~~~

---

## Catalog và component tái sử dụng

HyperFrames có catalog cho các block và component dựng sẵn.

README đưa ra các ví dụ như:

~~~bash
npx hyperframes add flash-through-white
npx hyperframes add instagram-follow
npx hyperframes add data-chart
~~~

Đây là hướng quan trọng nếu muốn dùng HyperFrames cho production. Thay vì để agent tự viết lại transition, chart, caption hoặc social overlay mỗi lần, có thể chuẩn hóa thành component rồi lắp vào nhiều video khác nhau.

Với pipeline tự động, khả năng tái sử dụng này có giá trị hơn việc mỗi video đều là một file HTML hoàn toàn bespoke.

---

## Điểm mạnh

Sau khi đọc cấu trúc repo và tài liệu, tôi thấy HyperFrames có vài điểm mạnh rõ ràng.

### 1. Authoring model đơn giản

HTML/CSS/JS là format mà developer và coding agent đều đã biết. Không cần một DSL video hoàn toàn mới.

### 2. Không bắt buộc React

Composition có thể là HTML thuần. Với những video chỉ cần typography, SVG, canvas hoặc WebGL, đây là một lựa chọn khá nhẹ.

### 3. Frame-accurate thay vì screen recording

Renderer chủ động seek từng frame. Đây là nền tảng quan trọng để video có thể chạy trong CI hoặc pipeline tự động.

### 4. Có đường đi từ local tới distributed render

Repo đã tách engine, producer và các package cloud như AWS Lambda. Điều này cho thấy thiết kế không chỉ nhắm tới demo local.

### 5. Hợp với agent workflow

Project là file thật, CLI không phụ thuộc vào GUI và repo có skill riêng. Agent có thể tạo, lint, preview, sửa rồi render trong cùng workflow.

---

## Những điểm cần lưu ý

HyperFrames vẫn là một framework video bằng code, nên chi phí chuyển từ "ý tưởng" sang video đẹp không biến mất.

### Animation phải được viết theo cách seek được

Một thư viện animation có thể chạy đẹp trong browser nhưng chưa chắc render deterministic nếu nó phụ thuộc vào timer hoặc side effect không kiểm soát.

### Browser vẫn là runtime

Font, GPU, media codec, WebGL/WebGPU và môi trường Chrome có thể ảnh hưởng tới output. Với production, cần cố định môi trường và chạy regression test cho composition quan trọng.

### HTML-native không có nghĩa là mọi thứ đều đơn giản

Khi video có nhiều scene, narration, captions, SFX, transition, 3D và asset, project vẫn cần kiến trúc tốt. HyperFrames giải quyết rendering contract; nó không tự động giải quyết toàn bộ bài toán creative direction.

### Repository khá lớn

Repo chứa nhiều package, test, registry asset và golden video dùng Git LFS. Nếu chỉ muốn thử framework, dùng <code>npx</code> hoặc clone source với LFS skip sẽ nhẹ hơn việc kéo toàn bộ regression asset.

---

## Khi nào tôi sẽ chọn HyperFrames?

Tôi sẽ cân nhắc HyperFrames khi đầu vào video đã có cấu trúc và có khả năng tự động hóa, ví dụ:

~~~text
script
voice
subtitle
images/video assets
brand rules
       ↓
video generator
~~~

Đây là bài toán rất hợp với authoring bằng code: mỗi scene có timing rõ, asset có ID, animation có preset, subtitle có timestamp và output cần render lặp lại nhiều lần.

Ngược lại, với video cần chỉnh thủ công rất nhiều bằng cảm giác, keyframe phức tạp và compositing nặng, editor truyền thống vẫn có lợi thế lớn về tốc độ thao tác.

---

## Kết luận

HyperFrames là một cách tiếp cận khá thẳng: **coi video như một chương trình web có timeline**, sau đó render trạng thái của chương trình đó theo từng frame.

Điều làm dự án đáng quan tâm không chỉ là chuyện dùng HTML để dựng cảnh. Phần quan trọng hơn là toàn bộ stack xung quanh:

~~~text
HTML composition
+ timing contract
+ seekable animation
+ browser renderer
+ FFmpeg
+ lint/check
+ reusable catalog
+ agent skills
+ local/cloud render
~~~

Nếu đang xây hệ thống tạo video tự động từ script, dữ liệu, voice và asset, HyperFrames là một project đáng thử vì format đầu vào rất gần với cách developer và coding agent vốn đã làm việc.

Còn nếu chỉ muốn thử nhanh, workflow ngắn nhất là:

~~~bash
npx hyperframes init my-video
cd my-video
npx hyperframes preview
npx hyperframes render
~~~

Từ đó có thể nâng dần composition bằng GSAP, media track, component catalog hoặc để coding agent viết scene theo design system của riêng mình.

---

## Tài liệu tham khảo

- [HyperFrames repository](https://github.com/heygen-com/hyperframes)
- [HyperFrames documentation](https://hyperframes.heygen.com/introduction)
- [Quickstart](https://hyperframes.heygen.com/quickstart)
- [CLI package](https://github.com/heygen-com/hyperframes/tree/main/packages/cli)
- [Engine package](https://github.com/heygen-com/hyperframes/tree/main/packages/engine)
- [Rendering guide](https://hyperframes.heygen.com/guides/rendering)
- [HyperFrames launch video example](https://github.com/heygen-com/hyperframes-launch-video)
