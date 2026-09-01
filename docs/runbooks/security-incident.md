# Runbook: Security Incident Response & Key Rotation

## 1. Các kịch bản sự cố (Scenarios)
- Rò rỉ Supabase Service Role Key hoặc JWT Secret.
- Admin token bị đánh cắp hoặc xuất hiện hành vi bất thường từ tài khoản đặc quyền.
- Tấn công DDoS hoặc brute-force vào Auth API.

## 2. Quy trình ứng phó khẩn cấp (Immediate Containment)
1. **Xoay vòng Secret (Secret Rotation):**
   - Vào Supabase Dashboard -> Project Settings -> API -> Generate new `SERVICE_ROLE_KEY` & `JWT_SECRET`.
   - Cập nhật biến môi trường trên Production Cloud / Kubernetes Secret.
   - Restart toàn bộ backend pods/containers để invalidate các token cũ:
     ```bash
     docker compose restart backend
     ```
2. **Thu hồi quyền Admin đáng ngờ (Admin Privilege Revocation):**
   ```sql
   -- Hạ quyền tài khoản nghi vấn
   UPDATE "User" SET role = 'USER' WHERE email = 'suspicious_admin@auraic.app';
   ```
3. **Rà soát Audit Logs:**
   ```sql
   -- Tra cứu các thao tác admin gần nhất
   SELECT id, actorId, action, targetType, targetId, ipAddress, createdAt
   FROM "AdminAuditLog"
   ORDER BY "createdAt" DESC
   LIMIT 50;
   
   -- Tra cứu thao tác của một admin cụ thể
   SELECT action, targetType, targetId, changes, ipAddress, createdAt
   FROM "AdminAuditLog"
   WHERE actorId = '<suspicious-admin-id>'
   ORDER BY "createdAt" DESC;
   ```
   - Các thao tác được ghi nhận: `UPDATE_USER_ROLE`, `DELETE_PLAYLIST`, `UPDATE_SETTINGS`, `RUN_INGESTION`.
4. **Siết chặt Rate Limit & Chặn IP tấn công:**
   - Trên Cloudflare WAF: Tạo rule Block IP hoặc Challenge (Managed Challenge) đối với các IP có lượng request bất thường.

## 3. Verification (Xác minh)
1. **Kiểm tra token cũ không còn hiệu lực:** Thử gọi API với token cũ, phải trả `401 Unauthorized`.
2. **Kiểm tra token mới hoạt động:** Gọi `/healthz` hoặc endpoint cần auth với token mới, phải trả `200 OK`.
3. **Kiểm tra quyền admin đã bị thu hồi:** Đăng nhập tài khoản nghi vấn, xác nhận không còn truy cập được admin routes.
4. **Kiểm tra WAF rule đang chặn IP tấn công:** Xem Cloudflare Analytics/Logs, xác nhận các IP đáng ngờ đã bị block hoặc challenge.
5. **Kiểm tra log backend không còn request bất thường:** `docker logs auraic-backend --tail 200` hoặc log aggregation (Datadog/Sentry).

## 4. Rollback (Nếu cần)
- Nếu xoay vòng secret gây lỗi: khôi phục secret cũ, restart backend, sau đó mới xoay lại secret mới đúng cách.
- Nếu thu hồi quyền nhầm người: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'correct_admin@auraic.app';`
- Nếu WAF rule quá chặt gây lỗi người dùng thật: tạm tắt rule, điều chỉnh condition, rồi bật lại.

## 5. Prerequisites & Access
- Quyền truy cập Supabase Dashboard (Project Owner/Admin).
- Quyền truy cập Production Cloud / Kubernetes Secret / Vault.
- Quyền truy cập Cloudflare WAF (Account Admin).
- Quyền truy cập Database để chạy SQL audit.
- Quyền truy cập backend container logs.

## 6. Timing
- Secret rotation + restart: **5-10 phút**.
- Admin revocation + audit log review: **10-15 phút**.
- WAF rule setup: **5 phút**.
- Tổng ước tính khống chế sự cố: **20-30 phút**.

## 7. Escalation & On-call
- **On-call:** Xem kênh `#on-call-auraic` trên Slack hoặc PagerDuty schedule.
- **Escalation:** Nếu không kiểm soát được trong 15 phút, liên hệ Security Lead / Platform Lead.
- **War room:** Tạo channel Slack `#incident-security-YYYYMMDD` để theo dõi và giao tiếp.

## 8. Owner
- **Primary:** Platform/Security team.
- **Secondary:** Backend on-call.

