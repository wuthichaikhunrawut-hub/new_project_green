# รายงานตรวจสอบระบบ GreenSync

วันที่ตรวจสอบ: 29 สิงหาคม 2026  
ขอบเขต: `frontend/src`, `frontend/e2e`, `backend/src`, `backend/test`, configuration และ manifests ที่เกี่ยวข้อง  
วิธีประเมิน: static analysis, TypeScript AST, build, unit/e2e tests, coverage, lint และตรวจ security sinks แบบเจาะจง

## Executive summary

ระบบมีโครงสร้างผลิตภัณฑ์ครบหลายบทบาทและ build production ผ่านทั้งสองฝั่ง แต่ยังไม่ควรถือว่า production-ready เต็มรูปแบบ เพราะ migration หลักว่าง, test coverage ต่ำมาก, Frontend coverage tool ขาด, มี default password ใน bulk import, มี DOM HTML injection path ใน PDF generation และ configuration สำคัญถูกเก็บเพียงใน memory

| ส่วนระบบ | ความสมบูรณ์โดยประมาณ | ฟังก์ชันสมบูรณ์ | ฟังก์ชันยังไม่สมบูรณ์ | Build | Tests |
|---|---:|---:|---:|---|---|
| Frontend (Angular) | 86% | 788 | 2 | ผ่าน; มี performance warnings | 7/7 ผ่าน; coverage วัดไม่ได้ |
| Backend (NestJS) | 82% | 360 | 2 | ผ่าน | Unit 49/49 + E2E 4/4 ผ่าน |
| รวม | 84% | 1,148 | 4 | ผ่าน | coverage ยังไม่ถึงเกณฑ์ production |

> ตัวเลขฟังก์ชันนับเฉพาะ named function/method/accessor ในไฟล์ `.ts` ที่ไม่ใช่ test ด้วย TypeScript AST; “ไม่สมบูรณ์” หมายถึง body ว่างหรือมี marker TODO/FIXME/not implemented โดยตรง ส่วนเปอร์เซ็นต์ระบบเป็น production-readiness estimate ที่ถ่วง build, implementation, test, security, data migration และ operational readiness จึงไม่เท่ากับสัดส่วนฟังก์ชันที่มี body

## 1. System completeness

### Frontend

- มี route และ feature ครอบคลุม auth, organization, assessment, carbon log, assessor, executive, subscription และ system admin
- production build ผ่าน แต่ initial browser bundle 994.63 kB raw; lazy dependency `apexcharts` 572.77 kB และ `jspdf` 411.12 kB
- CSS เกิน budget 2 จุด: `home.css` 15.65 kB และ `request-evaluate.css` 16.23 kB
- ฟังก์ชันที่ตรวจพบว่าง:
  - `removeQr()` ใน `features/admin/settings/settings.ts:105` เป็น deprecated stub
  - `ngAfterViewInit()` ใน `features/executive/dashboard/dashboard.ts:48` เป็น empty lifecycle hook
- E2E spec มีอยู่ 1 ไฟล์ แต่ไม่มี Playwright dependency/script ใน `package.json` จึงยังไม่อยู่ใน test pipeline

### Backend

- modules หลักครบและ production build ผ่าน
- ฟังก์ชันที่ตรวจพบว่างคือ migration `up()` และ `down()` ใน `migrations/1715450000000-InitSchema.ts`; กระทบ deployment จริงมากกว่าจำนวน 2 ฟังก์ชันที่ดูเล็ก
- payment/email mock มี guard กัน production บางส่วนแล้ว แต่ SMTP default ยังเป็น `mock`; ต้อง preflight และ integration test กับ provider จริง
- Settings เก็บใน `Map` ภายใน process ทำให้ค่าที่แก้จาก Admin UI หายเมื่อ restart และไม่ sync ระหว่างหลาย instance

## 2. Code structure review

### จุดที่ดี

- แยก Angular เป็น `core`, `shared`, `layout`, `features`; NestJS แยกตาม domain/module
- DTO, entity, controller, service และ module ส่วนใหญ่จัดวางตาม convention ของ framework
- มี production Dockerfiles, compose, preflight script, global validation, exception filter, Helmet, throttling และ CORS allowlist

### จุดที่ควรปรับ

- root มีรายงานซ้ำ (`report.html`, `report2.html`, `security_dashboard.html`), PDF ขนาดใหญ่, scratch/tool artifacts ปะปนกับ source; ควรย้ายไป `docs/`, `audit/` หรือ artifact storage
- assets ซ้ำอย่างน้อย 7 ชื่อข้าม `frontend/assets`, `frontend/public`, `frontend/src/assets` เช่น badge images และ `org_placeholder.png` (ซ้ำ 3 ตำแหน่ง)
- naming ผสม `*.component.ts` กับชื่อสั้น `dashboard.ts`, `users.ts`; backend ใช้ snake_case ใน model/database แต่ camelCase ใน DTO/service บางจุด จึงอ่านได้แต่ไม่สม่ำเสมอ
- มี unused declarations/imports 21 จุดจาก `tsc --noUnusedLocals --noUnusedParameters` ฝั่ง Backend; Frontend ไม่พบด้วยกฎเดียวกัน
- ESLint Backend ล้มเหลว 584 รายการ โดย 581 รายการแก้ได้อัตโนมัติและส่วนใหญ่เป็น CRLF/Prettier mismatch แสดงว่า CI formatting policy ยังไม่เสถียร

## 3. Code quality

- `ValidationPipe` เปิด `whitelist`, `forbidNonWhitelisted`, `transform` เป็นฐานที่ดี แต่หลาย controller รับ `Partial<Entity>`, `Record<string,string>` หรือ `any` ทำให้ validation ไม่ครอบคลุมทุก endpoint
- error handling มี global filter และ error interceptor; อย่างไรก็ตามยังมี `.catch(() => [])` และ `.catch(console.error)` หลายแห่ง ทำให้ upstream failure ถูกกลบเป็นข้อมูลว่าง
- async/await โดยรวมถูกต้องและ build ผ่าน; ไม่พบ unhandled Promise ที่เป็น compile error แต่มี fire-and-forget notification flows ที่ควรใช้ queue/retry
- raw SQL 3 จุดใน Gemini service ใช้ PostgreSQL placeholder `$1` จึงไม่พบ SQL injection ในจุดนั้น
- unused imports/declarations ฝั่ง Backend ได้แก่ `planRepo`, `Headers`, `UseInterceptors`, `fs`, `path`, ตัวแปร `ai` หลายจุด และอื่น ๆ รวม 21 จุด

## 4. Security audit

### Critical / High

1. **Default credential ใน bulk import — Critical**  
   `backend/src/users/users.service.ts:654` สร้างพนักงานทุกคนด้วย `Password123!`; หากไม่มี forced reset ผู้โจมตีเดารหัสผ่านได้ ควรสร้าง random one-time token, บังคับ reset และไม่ส่ง password ผ่าน log/email plaintext

2. **DOM XSS path ใน PDF generation — High**  
   `frontend/src/app/features/green-office/form/form.ts:516` เขียน `htmlContent` ลง `element.innerHTML` โดยตรงนอก Angular sanitizer และมีค่าจาก assessment/comment แทรกใน template ควร escape ทุก field หรือสร้าง DOM nodes/textContent/ใช้ sanitizer ที่มี allowlist

3. **Sensitive data exposure ใน server logs — High**  
   `backend/src/common/filters/all-exceptions.filter.ts:43-44` สร้าง `logData` ที่มี request body/query; แม้ปัจจุบัน logger ไม่ serialize ทั้งก้อนทุกกรณี แต่โครงสร้างนี้เสี่ยงหลุด password/token/PII เมื่อแก้ logging ในอนาคต ควร redact ตาม key และจำกัด payload

### Medium

- seed scripts มี `admin123`; ยอมรับได้เฉพาะ local development และต้องมี production guard
- Settings endpoint ใช้ `Record<string,string>` และยอมรับ arbitrary keys; ควรใช้ DTO allowlist และ audit log
- Sentry sampling 100% (`tracesSampleRate` และ `profilesSampleRate` = 1.0) เพิ่มทั้งต้นทุนและการส่ง metadata; ควรกำหนดผ่าน env และลดใน production
- ระบบใช้ Bearer token ไม่ใช่ cookie จึงมี CSRF exposure ต่ำ แต่ XSS จะรุนแรงขึ้นหาก token อยู่ใน localStorage
- ไม่พบ real API key/token/password ที่ดูเป็น production secret ใน source scan; ค่าที่พบเป็น example/test/default credentials
- ไม่พบ SQL injection ที่ยืนยันได้: raw SQL ใช้ parameter binding และ TypeORM QueryBuilder โดยรวมใช้ parameters
- Angular `[innerHTML]` ใน chatbot ถูก Angular sanitize ตามปกติ แต่ custom markdown converter ควรมี regression test กับ XSS payload

## 5. Performance

- endpoint หลายจุดใช้ repository `.find()` พร้อม relations โดยไม่มี pagination เช่น users, audit logs, invoices, uploads และ notifications; ข้อมูลโตแล้ว memory/latency จะเพิ่มตามขนาดตาราง
- `RolesGuard` โหลด settings ทั้งชุดทุก protected request; ปัจจุบันเป็น in-memory map จึงเร็ว แต่หากย้ายลง DB ควร cache permission map และ invalidate เมื่อแก้ค่า
- Sentry tracing/profiling 100% เป็น overhead ชัดเจนใน production
- frontend initial raw bundle เกือบ 1 MB และมี CommonJS optimization bailout จาก jsPDF/canvg/html2canvas chain
- PDF generation render HTML เป็น canvas scale 2 ทั้งหน้า เสี่ยง memory spike/crash บน mobile หรือรายงานยาว ควรแบ่งหน้า/stream หรือย้าย rendering ไป backend worker
- AI service มี external calls และการดึง context หลาย query; ควรกำหนด timeout, cancellation, retry budget และ metrics p95/p99

## 6. Testing & stability

| รายการ | ผล |
|---|---|
| Frontend unit | 5 files, 7 tests, ผ่านทั้งหมด |
| Frontend coverage | รันไม่ได้ เพราะขาด `@vitest/coverage-v8` |
| Frontend E2E | มี 1 spec แต่ไม่ถูกผูกกับ script/dependency |
| Backend unit | 17 suites, 49 tests, ผ่านทั้งหมด |
| Backend E2E | 1 suite, 4 tests, ผ่านทั้งหมด |
| Backend coverage | Statements 27.07%, Branches 8.52%, Functions 9.28%, Lines 26.59% |

พื้นที่เสี่ยงที่ coverage 0% หรือเกือบ 0% ได้แก่ executive, Gemini/AI, org-admin, assessor-admin, settings, notification, most subscription flows, upload controller, global guards/interceptors และ production bootstrap

จุด crash/instability สำคัญ:

- deploy ฐานข้อมูลใหม่ด้วย migration ปัจจุบันจะไม่สร้าง schema
- Frontend coverage job ล้มทันทีเพราะ dependency ขาด
- admin settings สูญหายเมื่อ process restart
- unbounded queries อาจทำให้ timeout/OOM เมื่อข้อมูลโต
- PDF canvas ขนาดใหญ่และ external AI/payment/email เป็น failure boundary ที่ยังขาด integration tests

## 7. Risk register และลำดับแก้ไข

| Priority | Issue | ผลกระทบ | แนวทางแก้ |
|---|---|---|---|
| P0 | Bulk import ใช้ default password เดียวกัน | Account takeover | one-time invite + forced reset + expiry |
| P0 | Migration `up/down` ว่าง | Deploy ใหม่/rollback ไม่ได้ | generate, review, test migration บน DB เปล่า |
| P1 | PDF `innerHTML` จากข้อมูล dynamic | Stored/DOM XSS | escape/allowlist sanitizer + XSS tests |
| P1 | Backend coverage ต่ำมาก | regression หลุด production | ตั้ง threshold และเพิ่ม tests ตาม risk |
| P1 | Settings อยู่ใน memory | ค่า config หาย/หลาย instance ไม่ตรงกัน | encrypted persistent store + cache invalidation |
| P1 | Endpoint lists ไม่มี pagination | latency/OOM | cursor pagination + max limit + indexes |
| P2 | Frontend coverage/E2E ไม่เข้าระบบ | UI regression | เพิ่ม coverage plugin และ Playwright script |
| P2 | 100% tracing/profiling | overhead/cost | env-based sample rates |
| P2 | assets/reports ซ้ำ | bundle/repo bloat | canonical asset path + artifact cleanup |
| P3 | 21 unused declarations + lint 584 | maintenance/CI noise | fix EOL policy, lint, remove dead code |

## Recommendations

### ภายใน 24–48 ชั่วโมง

1. ปิด deterministic password ใน bulk import และบังคับ reset สำหรับบัญชีที่เคยสร้างด้วย flow นี้
2. สร้าง migration จริงและทดสอบ `migration:run`/`migration:revert` บนฐานข้อมูลเปล่า
3. ปิดช่อง `innerHTML` ใน PDF และเพิ่ม XSS regression payloads
4. ตั้ง production preflight ให้ fail เมื่อ SMTP/Stripe/Supabase/JWT/migration ไม่พร้อม

### ภายใน 1 sprint

1. เพิ่ม Frontend coverage dependency และ threshold ขั้นต้น 50%; Backend เริ่มที่ 50% statements/branches 30% แล้วไต่เป็น 70%+
2. เพิ่ม integration tests ให้ auth/RBAC, organization isolation/IDOR, upload ownership, Stripe webhook idempotency, email retry และ AI timeout
3. ทำ pagination ทุก list API และเพิ่ม index จาก query patterns จริง
4. ย้าย settings ไป persistent encrypted storage พร้อม schema/DTO allowlist
5. แก้ Prettier/EOL config ให้ CI เหมือนกันทุก OS และเปิด `noUnusedLocals` ใน CI

### ก่อน Go-live

1. ทำ dependency vulnerability scan (`npm audit`/SCA), secret scan และ DAST ใน staging
2. ทำ restore drill, migration rollback drill, load test และ chaos test external providers
3. กำหนด SLO/alerts สำหรับ p95 latency, 5xx, queue/retry, DB pool, AI/Stripe/SMTP errors
4. ทำ manual authorization matrix test ทุก role และทุก controller

## ข้อจำกัดของการตรวจครั้งนี้

- ไม่ได้เชื่อมต่อ production database, Stripe, SMTP, Supabase หรือ Gemini จริง
- ไม่ได้ทำ dynamic penetration test หรือ load test
- percentage เป็น evidence-based readiness estimate ไม่ใช่การรับรองความปลอดภัย
- working tree มี user changes อยู่ก่อนแล้ว; การตรวจนี้ไม่แก้ source code เดิม
