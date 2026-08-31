# Runbook: Disaster Recovery (DR) & Cold Site Recreation

## 1. Mục tiêu khôi phục (Recovery Objectives)
- **RTO (Recovery Time Objective):** < 30 phút để đưa hệ thống online tại region mới.
- **RPO (Recovery Point Objective):** < 1 giờ (dữ liệu tối đa có thể mất phụ thuộc vào chu kỳ snapshot).

## 2. Quy trình khôi phục toàn diện từ con số 0 (Step-by-step Full Recovery)
1. **Khởi tạo hạ tầng mới bằng Terraform:**
   ```bash
   cd infra/terraform
   terraform init
   terraform apply -var-file="environments/prod.tfvars" -auto-approve
   ```
2. **Khôi phục dữ liệu Database từ R2/S3 snapshot:**
   ```bash
   # Lấy file backup mới nhất từ S3 bucket
   aws s3 cp s3://auraic-production-db-backups/db-backups/latest.sql.gz ./latest.sql.gz
   aws s3 cp s3://auraic-production-db-backups/db-backups/latest.sql.gz.sha256 ./latest.sql.gz.sha256

   # Chạy restore với SHA-256 verification
   npm run db:restore ./latest.sql.gz
   ```
3. **Triển khai ứng dụng Frontend & Backend:**
   ```bash
   docker compose -f docker-compose.yml up -d
   ```
4. **Kiểm tra sức khỏe toàn diện (Smoke Verification):**
   ```bash
   curl -I https://api.auraic.app/healthz
   curl -I https://api.auraic.app/readyz
   curl -I https://auraic.app/
   ```
5. **Chuyển hướng DNS Cloudflare** sang IP / CNAME của hạ tầng mới.

## 3. Verification (Xác minh sau khôi phục)
1. **Database health:**
   ```sql
   SELECT count(*) FROM "User";
   SELECT count(*) FROM "Track";
   SELECT count(*) FROM "Playlist";
   ```
   Xác nhận số lượng record hợp lý, không bị mất mass data.
2. **Backend health:**
   ```bash
   curl -I https://api.auraic.app/healthz
   curl -I https://api.auraic.app/readyz
   ```
   Cả hai phải trả `200 OK`.
3. **Auth flow test:** Đăng nhập bằng tài khoản thật, xác nhận nhận được JWT hợp lệ.
4. **Search & Catalog test:** Gọi `/api/search?q=test` và `/api/catalog?page=1`, xác nhận trả kết quả.
5. **Frontend smoke test:** Mở `https://auraic.app/` trên browser, xác nhận trang load được, không có console error.

## 4. Rollback (Nếu cần)
- **Rollback hạ tầng:** Nếu Terraform apply lỗi hoặc tạo sai hạ tầng, xóa resource bằng `terraform destroy` (chỉ chạy khi chắc chắn không ảnh hưởng prod đang chạy), rồi re-apply lại.
- **Rollback database restore:** Nếu restore lỗi, giữ nguyên DB cũ, debug restore script trước khi thử lại.
- **Rollback DNS:** Nếu site mới lỗi, đổi ngược DNS về IP cũ trên Cloudflare.

## 5. Prerequisites & Access
- Quyền truy cập Terraform Cloud/state backend (S3/GCS + DynamoDB lock).
- Quyền truy cập AWS credentials (S3 để lấy backup, EC2/RDS nếu cần).
- Quyền truy cập Cloudflare (DNS + WAF).
- Quyền truy cập Supabase Dashboard hoặc managed DB console.
- Quyền truy cập CI/CD để deploy frontend/backend.
- Quyền truy cập Docker Registry để pull image mới nhất.
- Local tooling: `terraform`, `awscli`, `docker`, `npm`, `curl`.

## 6. Timing
- Terraform init + apply: **10-15 phút**.
- Download backup + verify SHA-256: **2-5 phút** (tùy backup size).
- Database restore: **5-15 phút** (tùy DB size).
- Run migration + deploy app: **5-10 phút**.
- Smoke verification: **5 phút**.
- DNS cutover + propagate: **5-30 phút** (tùy TTL cũ).
- Tổng ước tính: **32-80 phút** (mục tiêu < 30 phút nếu đã prepare sẵn infrastructure).

## 7. Escalation & On-call
- **On-call:** Xem kênh `#on-call-auraic` trên Slack hoặc PagerDuty schedule.
- **Escalation:** Nếu DB restore lỗi hoặc data corruption nghiêm trọng, liên hệ DBA/Data team + Platform Lead.
- **Communication:** Cập nhật status page ngay khi bắt đầu DR, thông báo stakeholders mỗi 15-30 phút.
- **Post-mortem:** Sau khi khôi phục xong, lên lịch post-mortem trong 24-48 giờ.

## 8. Owner
- **Primary:** Platform/DevOps team.
- **Secondary:** Backend team + DBA.

