# Runbook: Database Outage & Recovery

## 1. Triệu chứng nhận biết (Symptoms)
- Endpoint `/readyz` trả về `503 Service Unavailable` với message `DB unreachable`.
- Prometheus cảnh báo `BackendServiceDown` hoặc `High5xxErrorRate > 0.1%`.
- Logs xuất hiện: `PrismaClientInitializationError: Can'\''t reach database server` hoặc `Timed out fetching a new connection from the pool`.

## 2. Các bước phân loại & Triage ban đầu (Immediate Action)
1. **Kiểm tra trạng thái Container / RDS Database:**
   ```bash
   # Nếu chạy Docker Compose:
   docker ps | grep postgres
   docker logs --tail 100 auraic-postgres

   # Nếu chạy Cloud RDS / Supabase:
   aws rds describe-db-instances --db-instance-identifier auraic-production-pg
   ```
2. **Kiểm tra Connection Pool & Max Connections:**
   - Đăng nhập trực tiếp vào PostgreSQL:
     ```sql
     SELECT count(*), state FROM pg_stat_activity GROUP BY state;
     SELECT max_conn, used, res_for_super, max_conn-used-res_for_super AS res_for_normal 
     FROM (SELECT count(*) AS used FROM pg_stat_activity) t1,
          (SELECT setting::int AS max_conn FROM pg_settings WHERE name='max_connections') t2,
          (SELECT setting::int AS res_for_super FROM pg_settings WHERE name='superuser_reserved_connections') t3;
     ```
   - Nếu số connection đạt max, tiến hành kill các connection bị idle/stale:
     ```sql
     SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = '\''idle'\'' AND state_change < current_timestamp - INTERVAL '\''15'\'' MINUTE;
     ```

## 3. Quy trình Failover hoặc Khôi phục từ Backup (Disaster Procedure)
Nếu cơ sở dữ liệu chính bị hỏng hoàn toàn (data corruption hoặc hardware fault):
1. **Dừng traffic backend** (hoặc chuyển về chế độ maintenance qua CDN Cloudflare).
2. **Khôi phục bản backup gần nhất:**
   ```bash
   # Tải bản sao lưu từ R2/S3
   aws s3 cp s3://auraic-production-db-backups/db-backups/auraic_db_LATEST.sql.gz ./
   
   # Chạy script restore
   npm run db:restore ./auraic_db_LATEST.sql.gz
   ```
3. **Chạy migration đồng bộ:**
   ```bash
   npm run prisma:push
   ```
4. **Xác thực readiness probe:**
   ```bash
   curl http://localhost:5000/readyz
   ```
5. Mở lại traffic và theo dõi Grafana SLO dashboard trong 30 phút.

## 4. Verification (Xác minh)
1. **Database connection pool đã bình thường:** Chạy lại SQL `pg_stat_activity`, xác nhận số connection dưới ngưỡng an toàn, không còn idle connection lạ.
2. **Data integrity sau restore:**
   ```sql
   SELECT count(*) FROM "User";
   SELECT count(*) FROM "Track";
   SELECT count(*) FROM "Playlist";
   SELECT max("createdAt") FROM "User";
   ```
   Xác nhận số lượng record hợp lý, `createdAt` mới nhất gần với thời điểm hiện tại.
3. **Backend ready:** `curl http://localhost:5000/readyz` trả `200 OK`.
4. **API smoke test:** Gọi `/api/catalog?page=1` hoặc `/api/search?q=test` trả `200 OK` với data thực tế.
5. **Auth test:** Đăng nhập tài khoản thật, xác nhận nhận JWT hợp lệ, không bị lỗi DB.

## 5. Rollback (Nếu cần)
- **Rollback restore:** Nếu restore backup mới nhất lỗi hoặc data bị lỗi, thử restore từ backup cũ hơn (theo snapshot schedule), hoặc rollback Terraform nếu đang dùng managed DB.
- **Rollback migration:** Nếu `prisma:push` gây lỗi schema, rollback migration bằng `prisma migrate resolve --rolled-back <migration_name>` (nếu dùng migrate) hoặc khôi phục schema từ backup.
- **Rollback connection kill:** Nếu kill connection nhầm session quan trọng, không thể rollback; cần restart backend pods/containers để reconnect pool.

## 6. Prerequisites & Access
- Quyền truy cập PostgreSQL trực tiếp (superuser hoặc role có quyền `pg_terminate_backend`).
- Quyền truy cập AWS CLI (để tải backup từ S3).
- Quyền truy cập Cloudflare (để bật maintenance mode nếu cần).
- Quyền truy cập backend container logs.
- Quyền truy cập CI/CD hoặc local tooling: `npm`, `docker`, `prisma`.

## 7. Timing
- Triage + kiểm tra connection pool: **5-10 phút**.
- Kill idle connections (nếu cần): **1-2 phút**.
- Download backup + verify: **2-5 phút** (tùy backup size).
- Database restore: **5-15 phút**.
- Run migration: **3-5 phút**.
- Smoke verification: **5 phút**.
- Tổng ước tính: **20-40 phút**.

## 8. Escalation & On-call
- **On-call:** Xem kênh `#on-call-auraic` trên Slack hoặc PagerDuty schedule.
- **Escalation:** Nếu DB down kéo dài > 15 phút hoặc restore backup lỗi, liên hệ DBA/Platform Lead ngay.
- **Communication:** Cập nhật status page nếu downtime > 5 phút, thông báo stakeholders mỗi 10-15 phút.

## 9. Owner
- **Primary:** Platform/DevOps team + DBA.
- **Secondary:** Backend on-call.

