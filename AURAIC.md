Chào mừng bạn đến với dự án **Auraic** – một nền tảng âm nhạc không chỉ để nghe, mà để *cảm nhận*.

Với yêu cầu khắt khe về mặt thẩm mỹ (dành cho người có "gu" âm nhạc) và quy mô hệ thống phức tạp, được xây dựng hoàn toàn trên hệ sinh thái **JavaScript/TypeScript**, dưới đây là bản thiết kế kiến trúc và danh sách công việc (To-do list) chi tiết nhất theo tiêu chuẩn của các công ty công nghệ hàng đầu hiện nay.

### **PHẦN 1: ĐỊNH HƯỚNG UI/UX \- "GU" CỦA AURAIC**

Để không bị giống các giao diện "nhựa" hay AI tạo ra, Auraic cần hướng tới phong cách **Audiophile Minimalism (Tối giản cao cấp)** hoặc **Glassmorphism (Kính mờ) kết hợp Grainy Gradient (Đổ bóng hạt)** – phong cách đang được các website đạt giải Awwwards ưa chuộng.

**Công việc thiết kế & Lập trình UI:**

* \[ \] **Hệ thống Typography:** Không dùng font mặc định. Kết hợp một font Serif sang trọng cho tiêu đề (ví dụ: *Playfair Display* hoặc *Clash Display*) và một font Sans-serif dễ đọc cho nội dung (ví dụ: *Inter* hoặc *Satoshi*).  
* \[ \] **Color Palette (Bảng màu):** Sử dụng nền tối sâu (Deep Dark/OLED Black) làm chủ đạo. Màu nhấn (Accent color) sẽ **tự động trích xuất từ ảnh bìa Album** đang phát (Dynamic Theme) và làm mờ (blur) ở background.  
* \[ \] **Micro-interactions (Tương tác nhỏ):** Sử dụng **Framer Motion** để làm hiệu ứng chuyển trang mượt mà như app native. Khi hover vào bài hát, nút Play hiện ra từ từ.  
* \[ \] **Player Interface (Giao diện phát nhạc):** Không đặt ở dưới cùng một cách nhàm chán. Thiết kế thanh Player nổi (Floating Player) hoặc dạng Vinyl Record xoay khi phát nhạc.  
* \[ \] **Web Audio Visualizer:** Dùng **Three.js** hoặc Canvas API vẽ sóng nhạc (audio waveform) chuyển động real-time theo dải tần số của bài hát.

### **PHẦN 2: LẬP TRÌNH FRONT-END (CLIENT-SIDE)**

**Công nghệ:** `Next.js 14/15` (App Router), `React`, `TypeScript`, `Tailwind CSS`, `Zustand` (Quản lý State nhẹ hơn Redux), `Radix UI` (Components không viền).

**Danh sách công việc (To-do):**

* \[ \] **Khởi tạo kiến trúc SPA:** Cấu hình Next.js để trang chuyển mượt mà, layout Player không bao giờ bị re-render (tải lại) khi chuyển qua lại giữa các trang (Trang chủ, Khám phá, Playlist).  
* \[ \] **Audio Engine (Động cơ âm thanh):**  
  * Sử dụng HTML5 `<audio>` kết hợp **Web Audio API** để có thể can thiệp vào âm lượng, EQ (Equalizer), âm thanh vòm (Spatial Audio).  
  * Tích hợp thư viện **HLS.js** để đọc các luồng stream nhạc được chia nhỏ.  
* \[ \] **State Management (Quản lý trạng thái):** Dùng *Zustand* để quản lý:  
  * `currentTrack`: Bài hát đang phát.  
  * `queue`: Danh sách chờ (hỗ trợ kéo thả bằng `dnd-kit`).  
  * `playerStatus`: Playing, Paused, Buffering.  
* \[ \] **Đồng bộ Lời bài hát (Synced Lyrics):** Xây dựng component đọc file `.lrc` (file lời bài hát có timestamp) và highlight (làm sáng) từng câu hát khớp với mili-giây của `audio.currentTime`.

### **PHẦN 3: LẬP TRÌNH BACK-END & STREAMING**

**Công nghệ:** `Node.js` kết hợp `NestJS` (Framework JS chuẩn doanh nghiệp, kiến trúc giống Angular/Spring Boot), `Socket.io` (Real-time).

**Danh sách công việc (To-do):**

* \[ \] **Xây dựng API Gateway & Microservices:** Chia nhỏ Back-end thành các service: `User Service`, `Music Service`, `Search Service`.  
* \[ \] **Hệ thống Transcoding (Chuyển mã file nhạc):**  
  * Dùng **FFmpeg** (tích hợp qua wrapper của Node.js) để biến file nhạc MP3/WAV gốc người dùng upload thành định dạng streaming HLS (m3u8).  
  * Tự động tạo ra 3 phiên bản: 128kbps, 256kbps, 320kbps.  
* \[ \] **Streaming Controller:** Viết API stream nhạc dạng Chunk (gửi từng gói 200KB về Client) thay vì gửi cả file 10MB, hỗ trợ header `Range` (để người dùng tua nhanh không bị lỗi).  
* \[ \] **Hệ thống Real-time:** Dùng WebSockets để làm tính năng "Nghe chung" (Listen Together) – 2 người ở 2 nơi nghe cùng 1 bài hát, ai bấm Pause thì bên kia cũng Pause.

### **PHẦN 4: DATABASE & CLOUD INFRASTRUCTURE**

**Công nghệ:** Các công ty lớn đang dịch chuyển sang kiến trúc Serverless và Edge Computing.

**Danh sách công việc (To-do):**

* \[ \] **Object Storage (Lưu file vật lý):** Không dùng AWS S3 vì phí băng thông đắt. Sử dụng **Cloudflare R2** (miễn phí phí xuất dữ liệu \- egress fee) để lưu file `.ts` (nhạc HLS) và ảnh bìa.  
* \[ \] **Relational DB (Cơ sở dữ liệu chính):** Dùng **PostgreSQL** (qua ORM là *Prisma* hoặc *Drizzle*) để lưu thông tin: Users, Playlists, Albums, Artists, Follows.  
* \[ \] **Caching (Bộ nhớ đệm):** Dùng **Redis** (có thể dùng *Upstash* Serverless Redis) để lưu Cache cho trang chủ. (VD: Top 100 bài hát thịnh hành sẽ được lấy từ Redis trong 10ms thay vì chọc vào DB).  
* \[ \] **Mạng phân phối (CDN):** Cấu hình Cloudflare CDN để cache các đoạn nhạc HLS ở các máy chủ trên toàn cầu, giúp tải nhạc siêu tốc.

### **PHẦN 5: AI & SMART SEARCH CỦA AURAIC**

**Công nghệ:** `Typesense` hoặc `Meilisearch` (thay cho Elasticsearch vì nó nhẹ và viết bằng C++/Rust rất nhanh), `Pinecone` (Vector DB), API của `OpenAI` hoặc `HuggingFace`.

**Danh sách công việc (To-do):**

* \[ \] **Full-text & Fuzzy Search:** Tích hợp *Typesense* vào Node.js. Sync toàn bộ dữ liệu bài hát từ PostgreSQL sang Typesense. Cấu hình tính năng "Typo Tolerance" (Người dùng gõ "Chắc ai đô sẽ vê" vẫn ra "Chắc ai đó sẽ về").  
* \[ \] **Vector Search (Tìm nhạc theo ngữ cảnh):**  
  * Viết một script (Cronjob) chạy ngầm: Mỗi khi bài hát mới lên, gọi API OpenAI tạo ra embedding vectors (dãy số ý nghĩa) của bài hát dựa trên thể loại, tâm trạng, nhịp độ.  
  * Lưu vector vào *Pinecone*.  
  * Khi người dùng gõ: *"Nhạc buồn nghe dưới trời mưa"*, chuyển câu này thành Vector và so sánh trong Pinecone để trả về kết quả.  
* \[ \] **Recommendation Engine (Thuật toán gợi ý):** Ghi nhận lịch sử nghe nhạc (Listening History) vào DB. Dùng thuật toán Cosine Similarity để tính toán điểm tương đồng giữa các bài hát và tạo ra mục **"Auraic Daily Mix"**.

### **TỔNG KẾT ROADMAP THỰC THI (Theo thứ tự ưu tiên)**

Nếu bạn làm project này một mình (Solo Developer) hoặc một nhóm nhỏ, hãy đi theo trình tự sau:

1. **Giai đoạn 1 (Core MVP):** Setup Next.js, dựng UI/UX thật "nghệ" với Tailwind, làm xong cái Trình phát nhạc (Audio Player) cho phát file MP3 tĩnh.  
2. **Giai đoạn 2 (Backend & Streaming):** Dựng Node.js, viết luồng upload nhạc, dùng FFmpeg cắt file nhạc sang HLS, tích hợp PostgreSQL.  
3. **Giai đoạn 3 (Smart Search):** Dựng Typesense, đồng bộ data, làm thanh tìm kiếm xịn xò chống sai chính tả.  
4. **Giai đoạn 4 (AI & Advanced):** Tích hợp Vector DB, làm AI gợi ý nhạc, code tính năng chạy lời bài hát (Karaoke).  
5. **Giai đoạn 5 (Tối ưu):** Đẩy static files lên Cloudflare R2, cài Redis cache, tối ưu hiệu năng (Performance Tuning).

**Auraic** là một cái tên rất đẹp. Với Tech Stack Javascript/Typescript toàn diện từ Front tới Back như trên, bạn hoàn toàn có thể xây dựng một hệ thống mạnh ngang ngửa các startup triệu đô hiện nay.

