# Runbook: Jamendo API Outage & Fallback Handling

## 1. Triệu chứng nhận biết (Symptoms)
- Prometheus alert: `jamendo_api_duration_seconds > 2s` hoặc tỷ lệ request thất bại tới Jamendo tăng vọt.
- Logs backend ghi nhận `Jamendo upstream timeout` hoặc `status 502/503/429`.
- Người dùng gặp lỗi khi tìm kiếm bài hát mới hoặc mở trang Discover.

## 2. Quy trình xử lý (Action Plan)
1. **Kiểm tra trạng thái Jamendo API:**
   ```bash
   curl -I "https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=1"
   ```
2. **Kích hoạt Catalog Cache Fallback:**
   - Khi Jamendo down, backend tự động phục vụ các track đã được snapshot/lưu trong database local.
   - Nếu bị rate limit (HTTP 429), xoay vòng sang Secondary Jamendo Client ID:
     ```bash
     # Cập nhật JAMENDO_CLIENT_ID trong production secrets và reload service
     ```
3. **Cấu hình CDN Edge Caching dài hạn tạm thời:**
   - Trên Cloudflare, tăng Edge Cache TTL cho các endpoint `/api/catalog/*` và `/api/search/*` lên 24 giờ để giảm thiểu phụ thuộc upstream trong thời gian sự cố.
4. **Theo dõi và phục hồi:**
   - Khi Jamendo API hoạt động ổn định trở lại, khôi phục lại Cache TTL mặc định.

## 3. Verification (Xác minh)
1. **Xác nhận Jamendo đã down:** `curl` trả `5xx` hoặc timeout rõ ràng, không phải lỗi mạng nội bộ.
2. **Kiểm tra Catalog Cache Fallback đang hoạt động:** Gọi `/api/catalog?page=1` hoặc `/api/search?q=test`, backend trả kết quả từ DB local (không gọi Jamendo).
3. **Kiểm tra CDN Edge Cache đã cập nhật:** Dùng `curl -I` kiểm tra header `Cache-Control` của response, xác nhận TTL dài.
4. **Kiểm tra secondary client ID (nếu đã rotate):** Log backend không còn lỗi `429`, request tới Jamendo thành công với client mới.

## 4. Rollback (Nếu cần)
- **Rollback Cache TTL:** Đặt lại Cloudflare Edge Cache TTL về giá trị mặc định.
- **Rollback Client ID:** Đổi ngược `JAMENDO_CLIENT_ID` về primary nếu secondary cũng gặp vấn đề.
- **Rollback Fallback mode (nếu DB local cũ/kém chất lượng):** Tắt fallback mode, hiển thị thông báo bảo trì cho người dùng thay vì trả kết quả cũ.

## 5. Prerequisites & Access
- Quyền truy cập Production Cloud / Kubernetes Secret hoặc Vault để đổi `JAMENDO_CLIENT_ID`.
- Quyền truy cập Cloudflare (Account Admin) để chỉnh Cache TTL và WAF rule nếu cần.
- Quyền truy cập Supabase Dashboard để kiểm tra catalog DB snapshot.
- Quyền truy cập backend container logs và metrics (Prometheus/Grafana).

## 6. Timing
- Kiểm tra Jamendo status: **2-5 phút**.
- Bật fallback + đổi client ID: **5-10 phút**.
- Điều chỉnh Cloudflare Cache TTL: **3-5 phút**.
- Tổng ước tính ứng phó: **10-20 phút**.

## 7. Escalation & On-call
- **On-call:** Xem kênh `#on-call-auraic` trên Slack hoặc PagerDuty schedule.
- **Escalation:** Nếu Jamendo down kéo dài > 1 giờ mà chưa có giải pháp, liên hệ Integrations/Content team để đánh giá nguồn dữ liệu thay thế khác.
- **Communication:** Thông báo status page nếu sự cố ảnh hưởng > 5 phút.

## 8. Owner
- **Primary:** Integrations/Content team.
- **Secondary:** Backend on-call.

