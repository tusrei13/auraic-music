# Runbook: High API Latency & SLO Breach (p95 > 200ms)

## 1. Mục tiêu SLO & Cảnh báo (SLO Target)
- **Target SLO:** 95% API requests hoàn thành dưới 200ms.
- **Alert:** `HighP95LatencySLOBreach` (p95 > 200ms kéo dài trên 2 phút).

## 2. Các bước điều tra nguyên nhân (Diagnosis)
1. **Mở Grafana SLO Dashboard (`http://grafana:3000/d/auraic-slo-overview`):**
   - Xác định route nào đang bị spike latency: `/api/search`, `/api/catalog`, `/api/playlists` hay `/api/likes`?
2. **Kiểm tra OpenTelemetry & Database Slow Queries:**
   - Đăng nhập vào PostgreSQL và tìm các query chạy chậm:
     ```sql
     SELECT 
       substring(query, 1, 100) AS short_query,
       round(total_exec_time::numeric, 2) AS total_time,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_time,
       round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percentage_cpu
     FROM pg_stat_statements
     ORDER BY total_exec_time DESC
     LIMIT 10;
     ```
3. **Phát hiện thiếu Index hoặc N+1 Queries:**
   - Chạy `EXPLAIN ANALYZE` trên câu truy vấn nghi vấn.
   - Thêm index thiếu trên các cột quan hệ (ví dụ: `userId`, `trackId`, `playlistId`, `createdAt`).
4. **Kiểm tra áp lực tài nguyên CPU / Memory:**
   ```bash
   docker stats auraic-backend auraic-postgres
   ```
5. **Mitigation:**
   - Tăng replica backend nếu CPU > 80%.
   - Kích hoạt rate-limit chặt hơn đối với các IP bot scraping quá mức.

## 3. Mitigation Steps
1. **Thiếu index:** Chạy migration để thêm index, ví dụ:
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_like_user_track ON "Like"("userId", "trackId");
   ```
   - Chạy `prisma migrate deploy` hoặc `npm run prisma:push` để apply.
   - **Lưu ý:** `CREATE INDEX CONCURRENTLY` không khóa table, an toàn cho production; tránh `CREATE INDEX` thường nếu DB đang có traffic cao.
2. **N+1 queries:** Refactor Prisma query để dùng `include` hoặc raw query với join.
3. **Scale backend:** Sử dụng Terraform hoặc Kubernetes HPA để tăng số replica backend.
4. **Rate-limit bot:** Thêm rule Cloudflare WAF hoặc cấu hình backend rate-limit (ví dụ: `express-rate-limit`) cho các endpoint public.

## 4. Verification (Xác minh)
1. **Kiểm tra query đã được tối ưu:** Chạy lại `EXPLAIN ANALYZE` trên query đã fix, xác nhận `total_time` giảm rõ rệt.
2. **Kiểm tra index đã tồn tại:** `\d "Like"` trong psql hoặc query `pg_indexes` để xác nhận index mới có mặt.
3. **Kiểm tra SLO dashboard:** Sau 5-10 phút, xem p95 trên Grafana có giảm dưới 200ms không.
4. **Kiểm tra backend resource:** `docker stats` hoặc metrics CPU/Memory đã giảm sau khi scale.

## 5. Rollback (Nếu cần)
- **Rollback migration index:** `DROP INDEX CONCURRENTLY IF EXISTS idx_like_user_track;` (nếu index mới gây lỗi performance khác).
- **Rollback scale:** Giảm số replica backend về giá trị cũ nếu scale gây lỗi memory hoặc khác.
- **Rollback rate-limit:** Tạm tắt rule rate-limit nếu gây lỗi người dùng thật, sau đó điều chỉnh threshold lại.

## 6. Prerequisites & Access
- Quyền truy cập PostgreSQL (`pg_stat_statements` extension phải được enable).
- Quyền truy cập Grafana dashboard.
- Quyền truy cập backend container logs.
- Quyền truy cập Cloudflare WAF.
- Quyền truy cập Terraform/Kubernetes để scale backend.
- Quyền truy cập Supabase Dashboard hoặc CI/CD để chạy migration.

## 7. Timing
- Diagnosis + xác định root cause: **10-20 phút**.
- Thêm index / fix query: **15-30 phút** (tùy DB size).
- Scale backend: **5-10 phút**.
- Tổng ước tính khắc phục: **30-60 phút**.

## 8. Escalation & On-call
- **On-call:** Xem kênh `#on-call-auraic` trên Slack hoặc PagerDuty schedule.
- **Escalation:** Nếu không xác định được root cause sau 30 phút, liên hệ Senior Backend Engineer hoặc DBA.
- **Stakeholder:** Thông báo Product team nếu SLO breach kéo dài > 15 phút.

## 9. Owner
- **Primary:** Backend team.
- **Secondary:** Platform/DevOps team.

