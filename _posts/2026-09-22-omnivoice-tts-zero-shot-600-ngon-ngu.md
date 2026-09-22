---
layout: post
title: "OmniVoice: TTS zero-shot 600+ ngôn ngữ, voice cloning và voice design"
date: 2026-09-22
author: Cuong Vuong
description: "Phân tích k2-fsa/OmniVoice — mô hình text-to-speech zero-shot hỗ trợ hơn 600 ngôn ngữ, voice cloning, voice design, diffusion-style iterative decoding, cách cài đặt và ví dụ sử dụng bằng Python/CLI."
image: /assets/images/omnivoice-tts-workflow-cover.svg
cover_image: /assets/images/omnivoice-tts-workflow-cover.svg
image_width: 1200
image_height: 630
tags:
  - ai-audio
  - tts
  - voice-cloning
  - speech-synthesis
  - pytorch
  - huggingface
  - developer-tools
---

Nếu vài năm trước text-to-speech thường gắn với một số ít ngôn ngữ và một tập speaker cố định, các hệ TTS mới đang đi theo hướng khác: **một model duy nhất có thể nói nhiều ngôn ngữ, clone giọng từ vài giây audio tham chiếu và thậm chí tạo giọng theo mô tả**.

[OmniVoice](https://github.com/k2-fsa/OmniVoice) của nhóm **k2-fsa** là một project theo hướng đó.

Theo README của dự án, OmniVoice là một mô hình **massively multilingual zero-shot text-to-speech** hỗ trợ **hơn 600 ngôn ngữ**, có ba mode sinh giọng chính:

- **Voice Cloning** — bắt chước giọng từ một đoạn audio tham chiếu ngắn.
- **Voice Design** — mô tả giọng muốn tạo bằng thuộc tính như giới tính, tuổi, pitch, accent hoặc dialect.
- **Auto Voice** — chỉ đưa text, để model tự chọn giọng.

Project sử dụng một kiến trúc được tác giả mô tả là **diffusion language model-style**, sinh audio token bằng quá trình **iterative unmasking** thay vì autoregressive token-by-token truyền thống.

Tại thời điểm tôi đọc repo cho bài viết này, package đang ở phiên bản **0.2.1**, yêu cầu **Python >= 3.10**, source code dùng giấy phép **Apache-2.0**.

**Repository:** [github.com/k2-fsa/OmniVoice](https://github.com/k2-fsa/OmniVoice)

---

## OmniVoice có gì đáng chú ý?

README hiện liệt kê các điểm chính:

- hơn **600 ngôn ngữ**,
- zero-shot voice cloning,
- voice design,
- non-verbal control như <code>[laughter]</code>,
- pronunciation control bằng pinyin hoặc phoneme,
- long-form generation,
- batch inference nhiều GPU,
- optional FlashInfer acceleration,
- training, fine-tuning và LoRA fine-tuning.

Một điểm đáng chú ý là API khá thống nhất.

Dù dùng cloning, design hay auto voice, entry point vẫn là:

~~~python
model.generate(...)
~~~

Khác biệt chủ yếu nằm ở prompt bạn truyền vào.

~~~text
text + ref_audio      → Voice Cloning
text + instruct       → Voice Design
text only             → Auto Voice
~~~

Điều này làm cho project khá dễ thử ở mức application trước khi cần đọc sâu phần training.

---

## Cấu trúc repository

Repo được chia khá rõ giữa inference, data, training và evaluation:

~~~text
OmniVoice/
├── omnivoice/
│   ├── cli/
│   ├── data/
│   ├── eval/
│   ├── models/
│   ├── scripts/
│   ├── training/
│   └── utils/
├── examples/
├── docs/
├── tests/
├── pyproject.toml
└── README.md
~~~

Phần quan trọng nhất cho inference là:

~~~text
omnivoice/models/omnivoice.py
~~~

File này chứa:

- <code>OmniVoice</code>,
- <code>OmniVoiceConfig</code>,
- <code>OmniVoiceGenerationConfig</code>,
- <code>VoiceClonePrompt</code>,
- inference pipeline,
- audio token encode/decode,
- long-form chunking,
- iterative masked decoding.

CLI được expose qua <code>pyproject.toml</code>:

~~~text
omnivoice-demo
omnivoice-infer
omnivoice-infer-batch
omnivoice-merge-lora
~~~

---

## Flow tổng quát của OmniVoice

Nếu bỏ qua chi tiết tensor, pipeline inference có thể hình dung như sau:

~~~text
                 ┌─────────────────────┐
Text ───────────►│ text preprocessing  │
                 └──────────┬──────────┘
                            │
Reference audio ───────┐    │
                       ▼    ▼
                 ┌─────────────────────┐
                 │ prompt preparation  │
                 │ language / instruct │
                 │ reference tokens    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ masked audio tokens │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ iterative unmasking │
                 │ diffusion-style     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ audio tokenizer     │
                 │ decode tokens       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ post processing     │
                 │ silence/fade/volume │
                 └──────────┬──────────┘
                            │
                            ▼
                         waveform
~~~

Để hiểu kỹ hơn, có thể tách thành từng bước.

---

## 1. Load model, text tokenizer và audio tokenizer

Khi gọi:

~~~python
OmniVoice.from_pretrained("k2-fsa/OmniVoice")
~~~

code sẽ load nhiều thành phần.

Ở mức cao:

~~~text
OmniVoice model
    +
text tokenizer
    +
audio tokenizer
    +
duration estimator
~~~

Audio tokenizer dùng **Higgs Audio V2 tokenizer**.

Trong code, nếu checkpoint local/model snapshot không có thư mục <code>audio_tokenizer</code>, OmniVoice fallback sang:

~~~text
eustlb/higgs-audio-v2-tokenizer
~~~

Audio tokenizer có hai vai trò:

~~~text
waveform
   ↓ encode
discrete audio tokens
~~~

và chiều ngược lại:

~~~text
generated audio tokens
   ↓ decode
waveform
~~~

Model chính không trực tiếp dự đoán từng sample PCM.

Nó làm việc trên **discrete audio token**.

---

## 2. Chọn mode generation

<code>generate()</code> hỗ trợ ba mode.

### Voice Cloning

Bạn cung cấp:

~~~text
text
ref_audio
ref_text
~~~

hoặc một <code>VoiceClonePrompt</code> đã encode từ trước.

### Voice Design

Bạn cung cấp:

~~~text
text
instruct
~~~

Ví dụ:

~~~text
female, young adult, high pitch, british accent
~~~

### Auto Voice

Chỉ cần:

~~~text
text
~~~

Không có reference audio và cũng không có <code>instruct</code>.

---

## 3. Voice cloning: reference audio được biến thành prompt như thế nào?

Đây là một flow khá rõ trong <code>create_voice_clone_prompt()</code>.

~~~text
ref.wav
  ↓
load / resample
  ↓
measure RMS
  ↓
optional silence removal
  ↓
optional trim
  ↓
ASR nếu ref_text bị thiếu
  ↓
audio tokenizer.encode()
  ↓
reference audio tokens
  ↓
VoiceClonePrompt
~~~

### Preprocessing reference audio

OmniVoice có thể:

- resample về sampling rate mà audio tokenizer cần,
- chuyển multi-channel về mono,
- remove silence,
- normalize mức âm lượng,
- trim reference quá dài.

README khuyến nghị reference clip khoảng:

~~~text
3–10 giây
~~~

Reference dài hơn có thể làm inference chậm hơn, tốn memory hơn và thậm chí giảm chất lượng clone.

### Không có transcript thì sao?

Nếu bạn không truyền <code>ref_text</code>, OmniVoice có thể dùng **Whisper ASR** để tự transcribe reference audio.

Default ASR model trong code là:

~~~text
openai/whisper-large-v3-turbo
~~~

ASR chỉ được load khi cần hoặc khi bạn chủ động yêu cầu.

Điều này tiện, nhưng đồng nghĩa lần đầu dùng auto-transcription sẽ cần thêm model và memory.

### Reference được encode thành discrete token

Sau preprocessing:

~~~python
ref_audio_tokens = self.audio_tokenizer.encode(...)
~~~

Kết quả được lưu cùng:

- transcript,
- RMS volume,
- audio tokens.

Đó chính là <code>VoiceClonePrompt</code>.

---

## 4. Có thể cache giọng clone để tái sử dụng

Một feature thực dụng là bạn không phải encode lại cùng một reference audio ở mọi session.

~~~python
prompt = model.create_voice_clone_prompt(
    ref_audio="ref.wav",
    ref_text="Reference transcript."
)

prompt.save("my_voice.pt")
~~~

Session sau:

~~~python
from omnivoice import VoiceClonePrompt

prompt = VoiceClonePrompt.load("my_voice.pt")

audio = model.generate(
    text="Hello again.",
    voice_clone_prompt=prompt,
)
~~~

Flow lúc này:

~~~text
ref.wav
   ↓ một lần
VoiceClonePrompt
   ↓ save
my_voice.pt
   ↓ reuse nhiều lần
generation
~~~

Nếu bạn đang làm app TTS có một tập voice cố định, đây là cách hợp lý hơn việc encode reference audio trên từng request.

---

## 5. Text, language và voice instruction được đóng gói thành conditioning

Trước khi model sinh audio token, OmniVoice build các token conditioning.

Trong code có các nhóm special token như:

~~~text
<|denoise|>

<|lang_start|>
...
<|lang_end|>

<|instruct_start|>
...
<|instruct_end|>

<|text_start|>
...
<|text_end|>
~~~

Về mặt ý tưởng, sequence sẽ bao gồm:

~~~text
style tokens
+
text tokens
+
optional reference audio tokens
+
masked target audio tokens
~~~

Target audio lúc đầu **chưa có token thật**.

Nó được fill bằng <code>audio_mask_id</code>.

---

## 6. Diffusion-style iterative unmasking

Đây là phần thú vị nhất.

OmniVoice không nhất thiết phải sinh audio theo kiểu:

~~~text
token 1
  ↓
token 2
  ↓
token 3
  ↓
...
~~~

Thay vào đó, output bắt đầu như một vùng token bị mask:

~~~text
[MASK] [MASK] [MASK] [MASK] [MASK] ...
~~~

Sau đó model chạy nhiều step.

Default hiện tại:

~~~text
num_step = 32
~~~

Mỗi step sẽ dự đoán các audio token và mở dần một phần vị trí.

~~~text
step 0
[M] [M] [M] [M] [M] [M]

step 1
[A] [M] [M] [B] [M] [M]

step 2
[A] [C] [M] [B] [M] [D]

...

final
[A] [C] [E] [B] [F] [D]
~~~

Trong implementation, model còn tạo cả:

~~~text
conditional input
+
unconditional input
~~~

để thực hiện **classifier-free guidance**.

Default:

~~~text
guidance_scale = 2.0
~~~

Cùng với đó còn có:

- position temperature,
- class temperature,
- layer penalty,
- time-step schedule.

Đây là lý do project gọi kiến trúc của mình là **diffusion language model-style**.

---

## 7. OmniVoice dùng nhiều audio codebook

Config mặc định hiện có:

~~~text
num_audio_codebook = 8
audio_vocab_size   = 1025
audio_mask_id      = 1024
~~~

Model có:

~~~text
audio_embeddings
audio_heads
~~~

để đưa discrete audio token vào hidden space của language model và dự đoán token trở lại theo từng codebook layer.

Điểm này giúp nhìn OmniVoice đúng hơn:

Nó không đơn giản là:

~~~text
LLM → waveform
~~~

mà gần hơn với:

~~~text
text / prompt
    ↓
language-model backbone
    ↓
multi-codebook audio token prediction
    ↓
audio tokenizer decoder
    ↓
waveform
~~~

---

## 8. Duration estimator quyết định cần bao nhiêu audio token

Nếu bạn không set duration, OmniVoice dùng <code>RuleDurationEstimator</code> để ước lượng độ dài speech từ text.

Sau đó:

~~~text
estimated duration
    ↓
target token length
    ↓
number of masked audio positions
~~~

Bạn vẫn có thể override.

### Tăng tốc độ nói

~~~python
audio = model.generate(
    text="Hello world",
    speed=1.2,
)
~~~

### Ép duration

~~~python
audio = model.generate(
    text="Hello world",
    duration=5.0,
)
~~~

Nếu có cả hai:

~~~text
duration > speed
~~~

tức <code>duration</code> được ưu tiên.

---

## 9. Long-form generation

Sinh một đoạn speech dài trong một lần thường làm VRAM tăng mạnh.

OmniVoice xử lý bằng chunking.

Default:

~~~text
audio_chunk_threshold = 30 giây
audio_chunk_duration  = 15 giây
~~~

Nếu estimated audio dài hơn threshold:

~~~text
long text
   ↓
split theo punctuation
   ↓
chunk 1
chunk 2
chunk 3
...
   ↓
generate theo chunk
   ↓
cross-fade
   ↓
final waveform
~~~

Nếu không có reference voice, output của chunk đầu còn có thể được dùng làm reference cho các chunk tiếp theo để giữ consistency tốt hơn.

Cách này giúp long-form generation giữ mức VRAM gần ổn định hơn thay vì tăng theo toàn bộ độ dài text.

---

## 10. Decode token về waveform

Sau iterative decoding, output vẫn là discrete token.

Audio tokenizer sẽ decode:

~~~text
audio tokens
   ↓
Higgs audio tokenizer
   ↓
waveform
~~~

Nếu là long-form, các chunk waveform được cross-fade trước khi ghép.

Sau đó còn có post-processing:

- remove long silence,
- restore volume theo reference RMS,
- fade in/out,
- padding đầu/cuối.

Kết quả từ <code>generate()</code> là một list NumPy array, với sampling rate theo audio tokenizer; README hiện dùng **24 kHz** trong ví dụ.

---

# Cài đặt OmniVoice

Project hỗ trợ hai flow chính:

~~~text
pip
hoặc
uv
~~~

Tôi khuyên tạo environment mới để tránh conflict PyTorch/CUDA.

---

## Cách 1 — pip

### Tạo virtual environment

Linux/macOS:

~~~bash
python -m venv .venv
source .venv/bin/activate
~~~

Windows PowerShell:

~~~powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
~~~

### Cài PyTorch

Với NVIDIA, README hiện đưa ví dụ CUDA 12.8:

~~~bash
pip install torch==2.8.0+cu128 torchaudio==2.8.0+cu128 \
  --extra-index-url https://download.pytorch.org/whl/cu128
~~~

Bạn nên chọn build PyTorch đúng với driver/CUDA của máy thay vì copy version một cách máy móc.

### Apple Silicon

~~~bash
pip install torch==2.8.0 torchaudio==2.8.0
~~~

Sau đó dùng:

~~~python
device_map="mps"
~~~

### Intel Arc / XPU

README cũng có support XPU:

~~~bash
pip install torch torchaudio \
  --index-url https://pytorch-extension.intel.com/release-whl/stable/xpu/us/
~~~

Kiểm tra:

~~~bash
python -c "import torch; print(torch.xpu.is_available(), torch.xpu.device_count())"
~~~

Sau đó dùng:

~~~python
device_map="xpu"
~~~

---

## Cài package OmniVoice

Stable release từ PyPI:

~~~bash
pip install omnivoice
~~~

Latest source từ GitHub:

~~~bash
pip install git+https://github.com/k2-fsa/OmniVoice.git
~~~

Hoặc development mode:

~~~bash
git clone https://github.com/k2-fsa/OmniVoice.git
cd OmniVoice

pip install -e .
~~~

---

## Cách 2 — uv

~~~bash
git clone https://github.com/k2-fsa/OmniVoice.git
cd OmniVoice

uv sync
~~~

Repo hiện pin PyTorch/Torchaudio 2.8.0 trong phần constraint của uv và cấu hình CUDA index cho Linux/Windows.

---

# Chạy nhanh bằng giao diện web

Sau khi cài package:

~~~bash
omnivoice-demo --ip 0.0.0.0 --port 8001
~~~

Sau đó mở:

~~~text
http://localhost:8001
~~~

Gradio demo cho phép thử các mode mà không phải viết Python trước.

README cũng cung cấp Hugging Face Space và Google Colab.

---

# Ví dụ 1 — Auto Voice đơn giản

Nếu chỉ muốn text-to-speech và không quan tâm speaker cụ thể:

~~~python
import soundfile as sf
import torch

from omnivoice import OmniVoice

model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map="cuda:0",
    dtype=torch.float16,
)

audio = model.generate(
    text="Xin chào. Đây là một thử nghiệm với OmniVoice.",
    language="Vietnamese",
)

sf.write(
    "auto_voice.wav",
    audio[0],
    model.sampling_rate,
)
~~~

Flow:

~~~text
Vietnamese text
    ↓
text tokenizer
    ↓
auto voice conditioning
    ↓
iterative audio token generation
    ↓
audio decoder
    ↓
auto_voice.wav
~~~

---

# Ví dụ 2 — Voice cloning

Chỉ nên clone **giọng của chính bạn hoặc giọng mà bạn có quyền/được phép sử dụng**.

Giả sử có file:

~~~text
ref.wav
~~~

và transcript đúng với reference.

~~~python
import soundfile as sf
import torch

from omnivoice import OmniVoice

model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map="cuda:0",
    dtype=torch.float16,
)

audio = model.generate(
    text="Đây là câu mới được tổng hợp bằng giọng tham chiếu.",
    language="Vietnamese",
    ref_audio="ref.wav",
    ref_text="Đây là nội dung được đọc trong đoạn âm thanh tham chiếu.",
)

sf.write(
    "cloned.wav",
    audio[0],
    model.sampling_rate,
)
~~~

README khuyến nghị reference khoảng **3–10 giây**.

---

## Không muốn tự nhập transcript?

Có thể bỏ <code>ref_text</code>:

~~~python
audio = model.generate(
    text="This is generated from my reference voice.",
    ref_audio="ref.wav",
)
~~~

OmniVoice sẽ load Whisper ASR để transcribe reference audio.

Nếu dùng nhiều GPU, bạn còn có thể đặt ASR ở GPU khác:

~~~python
model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map="cuda:0",
    dtype=torch.float16,
    asr_device="cuda:1",
)
~~~

hoặc để ASR trên CPU:

~~~python
asr_device="cpu"
~~~

---

# Ví dụ 3 — Cache cloned voice

Nếu cùng một speaker được dùng nhiều lần:

~~~python
prompt = model.create_voice_clone_prompt(
    ref_audio="ref.wav",
    ref_text="Reference transcript.",
)

prompt.save("my_voice.pt")
~~~

Sau này:

~~~python
from omnivoice import VoiceClonePrompt

prompt = VoiceClonePrompt.load("my_voice.pt")

audio = model.generate(
    text="A new sentence from the same cached voice.",
    voice_clone_prompt=prompt,
)
~~~

Cách này bỏ qua việc load reference audio, silence preprocessing, ASR và audio encoding ở các lần generate sau.

---

# Ví dụ 4 — Voice Design

Không cần reference audio.

~~~python
audio = model.generate(
    text="Welcome to the OmniVoice voice design demo.",
    instruct="female, young adult, low pitch, british accent",
)
~~~

Các nhóm thuộc tính được docs liệt kê gồm:

- gender,
- age,
- pitch,
- whisper,
- English accent,
- Chinese dialect.

Ví dụ:

~~~text
male, elderly, low pitch, whisper
~~~

hoặc:

~~~text
female, high pitch, british accent
~~~

### Một giới hạn quan trọng

README nói model chủ yếu được train cho **voice cloning**, nên đây là mode ổn định nhất.

Voice Design được train trên dữ liệu **Chinese và English**.

Nó có thể generalize sang ngôn ngữ khác nhưng kết quả có thể không ổn định, đặc biệt với low-resource language hoặc attribute combination hiếm.

---

# Ví dụ 5 — Non-verbal control

Bạn có thể chèn control tag trực tiếp vào text.

~~~python
audio = model.generate(
    text="[laughter] You really got me. I did not see that coming."
)
~~~

README hiện liệt kê các tag như:

~~~text
[laughter]
[sigh]
[confirmation-en]
[question-en]
[surprise-ah]
[surprise-oh]
...
~~~

Đây là một feature thú vị nếu muốn speech có thêm expression ngoài plain text.

---

# Ví dụ 6 — Pronunciation control

### English

Có thể dùng CMU pronunciation format:

~~~python
audio = model.generate(
    text="He plays the [B EY1 S] guitar while catching a [B AE1 S] fish."
)
~~~

Hai từ "bass" được ép phát âm khác nhau.

### Chinese

Repo hỗ trợ pinyin tone number inline để sửa pronunciation cho một ký tự cụ thể.

---

# Ví dụ 7 — Text normalization

Để đọc số tự nhiên hơn:

~~~bash
pip install "omnivoice[tn]"
~~~

Sau đó:

~~~python
audio = model.generate(
    text="I have 2345 apples.",
    normalize_text=True,
)
~~~

Chinese và English dùng WeTextProcessing.

Các language khác fallback về <code>num2words</code> cho integer khi dependency có sẵn.

---

# Sử dụng bằng CLI

Nếu không muốn viết Python, <code>omnivoice-infer</code> là cách nhanh nhất.

## Voice Cloning

~~~bash
omnivoice-infer \
  --model k2-fsa/OmniVoice \
  --text "This is a test for text to speech." \
  --ref_audio ref.wav \
  --ref_text "Transcription of the reference audio." \
  --output hello.wav
~~~

## Voice Design

~~~bash
omnivoice-infer \
  --model k2-fsa/OmniVoice \
  --text "This is a test for text to speech." \
  --instruct "male, British accent" \
  --output hello.wav
~~~

## Auto Voice

~~~bash
omnivoice-infer \
  --model k2-fsa/OmniVoice \
  --text "This is a test for text to speech." \
  --output hello.wav
~~~

---

# Batch inference nhiều GPU

Repo có:

~~~text
omnivoice-infer-batch
~~~

Input là JSONL.

Ví dụ:

~~~json
{"id":"sample_001","text":"Hello world","ref_audio":"/data/ref.wav","ref_text":"Reference transcript","language_id":"en","speed":1.0}
~~~

Chạy:

~~~bash
omnivoice-infer-batch \
  --model k2-fsa/OmniVoice \
  --test_list test.jsonl \
  --res_dir results/
~~~

Chỉ <code>id</code> và <code>text</code> là bắt buộc.

Các field khác dùng để chuyển mode hoặc control generation.

---

# FlashInfer acceleration

Với NVIDIA GPU, project có optional integration FlashInfer.

README hiện nói inference có thể được tăng tốc khoảng **2–2.9x** trong các trường hợp benchmark của họ.

Ví dụ cài cho CUDA 12.8:

~~~bash
pip install flashinfer-python==0.6.15.post1 \
  "flashinfer-jit-cache==0.6.15.post1+cu128" \
  --extra-index-url https://flashinfer.ai/whl/cu128/
~~~

Python API:

~~~python
from omnivoice.models.omnivoice_flashinfer import apply_flashinfer

model = OmniVoice.from_pretrained(
    "k2-fsa/OmniVoice",
    device_map="cuda",
    dtype=torch.float16,
)

apply_flashinfer(model)
~~~

Batch=1 có thể dùng CUDA graph:

~~~python
apply_flashinfer(
    model,
    enable_cuda_graph=True,
)
~~~

Theo benchmark trong README, trên **H100, fp16, num_step=32**, batch size 8 giảm Average RTF từ:

~~~text
0.0298
~~~

xuống:

~~~text
0.0115
~~~

tương đương khoảng **2.6x** trong benchmark đó.

Đây là số đo có điều kiện cụ thể, không nên coi là guarantee cho mọi GPU/workload.

---

# Training và fine-tuning

OmniVoice không chỉ publish inference code.

Thư mục <code>examples/</code> có flow:

~~~text
training from scratch
fine-tuning
LoRA fine-tuning
evaluation
~~~

Training từ scratch với Emilia được chia ba stage:

~~~text
Stage 0
verify dataset / manifests
    ↓
Stage 1
tokenize audio → WebDataset shards
    ↓
Stage 2
multi-GPU training with accelerate
~~~

Fine-tuning custom data dùng JSONL kiểu:

~~~json
{"id":"sample_001","audio_path":"/data/audio/001.wav","text":"Hello world","language_id":"en"}
~~~

Repo cũng có LoRA để giảm chi phí fine-tune so với update toàn bộ model.

---

# Một số giới hạn nên biết trước khi dùng

## Voice cloning ổn định hơn voice design

Đây là chính project tự ghi rõ.

Nếu mục tiêu của bạn là production TTS với speaker cụ thể, nên ưu tiên voice cloning trước.

## Reference audio nên ngắn và sạch

Khuyến nghị:

~~~text
3–10 giây
~~~

Reference quá dài có thể chậm, tốn memory và giảm chất lượng.

## Cross-lingual cloning có thể mang accent của reference

Ví dụ:

~~~text
reference: English
target: Vietnamese
~~~

voice identity có thể được giữ, nhưng output có thể mang accent từ language của reference.

README khuyên nếu muốn pronunciation chuẩn nhất thì reference nên cùng language với target.

## Clip cực ngắn có thể khó hơn

Docs ghi rằng output khoảng **1–2 giây**, đặc biệt khi không có reference audio, có thể không ổn định.

Nếu cần clip rất ngắn, reference audio có thể giúp.

## Min Nan / Hokkien có format input riêng

Ở model version hiện tại, docs nói Min Nan Chinese chỉ support input bằng **Tai-lo romanization**, không phải Chinese character.

---

# So sánh ba mode để chọn nhanh

| Mode | Input thêm | Ưu điểm | Khi nên dùng |
|---|---|---|---|
| Auto Voice | Không | đơn giản nhất | demo, prototype |
| Voice Cloning | reference audio | giữ speaker identity | app cần giọng cụ thể |
| Voice Design | instruct | không cần reference | tạo giọng theo thuộc tính |

Nếu mới bắt đầu, tôi sẽ thử theo thứ tự:

~~~text
Auto Voice
   ↓
Voice Cloning
   ↓
Voice Design
   ↓
batch / optimization
~~~

như vậy dễ tách lỗi environment khỏi lỗi prompt/voice conditioning.

---

# Flow triển khai thực tế tôi sẽ dùng

Nếu đưa OmniVoice vào một application, tôi sẽ chia system như sau:

~~~text
                    ┌─────────────────┐
                    │  Web / API app  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ TTS job request │
                    └────────┬────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
               ▼             ▼             ▼
          Auto voice      Clone voice   Voice design
                            │
                            ▼
                    cached VoiceClonePrompt
               │             │             │
               └─────────────┼─────────────┘
                             ▼
                    OmniVoice.generate()
                             │
                             ▼
                         WAV output
                             │
                             ▼
                    object storage / CDN
~~~

Nếu speaker được dùng lặp lại, tôi sẽ cache <code>VoiceClonePrompt</code> thay vì encode reference trên mỗi request.

Nếu workload lớn, chuyển inference sang worker queue và batch theo GPU thay vì chạy trực tiếp trong HTTP request.

---

# OmniVoice phù hợp với ai?

Project đáng thử nếu bạn đang làm:

- multilingual TTS,
- audiobook / narration,
- localization,
- voice assistant,
- accessibility,
- game/character speech,
- research về diffusion-style speech generation,
- ứng dụng cần voice cloning hợp pháp,
- batch speech synthesis.

Đặc biệt, coverage hơn 600 language làm OmniVoice thú vị với những bài toán mà các TTS phổ biến chỉ cover một nhóm language lớn.

---

# Lưu ý về voice cloning và sử dụng có trách nhiệm

Voice cloning là một capability mạnh nhưng cũng dễ bị lạm dụng.

README của OmniVoice có disclaimer rõ: không dùng model cho unauthorized voice cloning, impersonation, fraud, scams hoặc hoạt động trái pháp luật/phi đạo đức.

Nếu đưa vào sản phẩm thật, ít nhất nên có:

- quyền sử dụng voice rõ ràng,
- consent của speaker,
- access control cho voice profile,
- audit log,
- policy chống impersonation,
- quy trình xóa voice data khi được yêu cầu.

Technology không tự giải quyết phần governance này.

---

# Kết luận

Điểm tôi thấy đáng chú ý nhất ở OmniVoice không chỉ là con số **600+ languages**.

Nó là sự kết hợp của nhiều thứ trong một API khá gọn:

~~~text
text
+
optional reference voice
+
optional voice instruction
    ↓
multilingual conditioning
    ↓
diffusion-style masked audio token generation
    ↓
audio tokenizer decode
    ↓
speech waveform
~~~

Với developer, entry point rất đơn giản:

~~~python
model.generate(...)
~~~

nhưng bên dưới đã có:

- audio tokenizer,
- duration estimation,
- optional ASR,
- iterative unmasking,
- classifier-free guidance,
- long-form chunking,
- cross-fade,
- batch inference,
- optional FlashInfer acceleration.

Nếu bạn đang tìm một open-source TTS project để thử multilingual speech, voice cloning hoặc nghiên cứu diffusion-style generation, OmniVoice là một repo đáng đọc sâu.

**Repository:** [https://github.com/k2-fsa/OmniVoice](https://github.com/k2-fsa/OmniVoice)

---

## Nguồn tôi dùng để phân tích

Bài viết được đọc và đối chiếu với snapshot repository <code>k2-fsa/OmniVoice</code> tại commit:

~~~text
08be0b4ccbac3e13e374e86fbfead4b4cac343e2
~~~

ngày 22/09/2026.

- [README](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/README.md)
- [Core model — omnivoice.py](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/omnivoice/models/omnivoice.py)
- [Generation parameters](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/docs/generation-parameters.md)
- [Voice Design](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/docs/voice-design.md)
- [Tips & Notes](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/docs/tips.md)
- [Examples: training, fine-tuning, evaluation](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/examples/README.md)
- [Package configuration](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/pyproject.toml)
- [Apache-2.0 license](https://github.com/k2-fsa/OmniVoice/blob/08be0b4ccbac3e13e374e86fbfead4b4cac343e2/LICENSE)
