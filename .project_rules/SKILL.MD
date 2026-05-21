# Green Sync - Project Skill Context

## ภาพรวมโปรเจกต์

Green Sync คือแพลตฟอร์มสำหรับบริหารจัดการ Green Office และ Sustainability ภายในองค์กรและมหาวิทยาลัย

ระบบถูกออกแบบมาเพื่อ:
- จัดการการประเมิน Green Office
- จัดเก็บเอกสารและหลักฐาน
- คำนวณ Carbon Emission
- จัดการข้อมูล ESG
- แสดง Dashboard และ Report
- จัดการองค์กรและผู้ใช้งาน
- รองรับ Subscription และ Multi Organization
- ใช้งานได้ระดับ Production

กลุ่มผู้ใช้งาน:
- มหาวิทยาลัย
- องค์กร
- หน่วยงานรัฐ
- ผู้ดูแลระบบ
- ผู้ประเมิน
- เจ้าหน้าที่ด้านสิ่งแวดล้อม

---

# เป้าหมายหลักของระบบ

ระบบต้องเน้น:
1. UX/UI ทันสมัย
2. ใช้งานง่าย
3. Architecture ระดับ Enterprise
4. รองรับการขยายระบบในอนาคต
5. Database ที่ออกแบบดี
6. Dashboard สวยและอ่านง่าย
7. Responsive ทุกอุปกรณ์
8. รองรับ AI Workflow
9. มีความเป็น Green / Eco / Modern
10. พร้อมใช้งานจริงระดับ Production

---

# แนวทางการออกแบบ UI/UX

Theme หลัก:
- Modern
- Premium
- Eco-Tech
- Minimal
- Professional

สีหลัก:
- Green
- Emerald
- White
- Soft Gray

แรงบันดาลใจ UI:
- Stripe
- Notion
- Linear
- Vercel
- Supabase

หลีกเลี่ยง:
- UI แบบเก่า
- Dashboard ที่รก
- Border หนาเกินไป
- สีฉูดฉาด
- Layout แบบ Bootstrap ยุคเก่า

สไตล์ที่ต้องการ:
- มุมโค้ง
- Shadow นุ่ม
- Layout โปร่ง
- Animation ลื่น
- Card-based UI
- Typography ทันสมัย

---

# Frontend Rules

Stack ที่แนะนำ:
- React
- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui

แนวทาง:
- Responsive Design
- Component-based
- Reusable Components
- Clean Code
- Loading State ที่ดี
- Skeleton Loading
- Empty State ที่สวย
- UX เข้าใจง่าย

ให้ความสำคัญกับ:
- User Experience
- Readability
- Visual Hierarchy
- Performance

---

# Backend Rules

Stack ที่ใช้:
- Node.js
- NestJS
- PostgreSQL
- TypeORM

Architecture:
- Modular Structure
- Service-based
- REST API
- DTO Validation
- Role-based Access Control

Backend ต้อง:
- Secure
- Maintainable
- Scalable
- Query มีประสิทธิภาพ
- มี Validation ที่ดี
- จัดการ Transaction อย่างปลอดภัย

---

# Database Rules

Database:
- PostgreSQL

ข้อกำหนดสำคัญ:
- ใช้ Foreign Key อย่างถูกต้อง
- หลีกเลี่ยงข้อมูลซ้ำซ้อน
- Maintain Normalization
- ใช้ Index เมื่อจำเป็น
- ระวังการแก้ไข Schema เดิม

กฎสำคัญ:
- ห้ามลบ Table อัตโนมัติ
- ห้ามแก้ไข Schema แบบทำลายข้อมูลโดยไม่ได้รับอนุญาต
- ต้องวิเคราะห์ผลกระทบก่อน Migration ทุกครั้ง
- ต้องรักษาข้อมูล Production เสมอ

AI ต้องระวัง:
- การ Sync Entity ที่อาจลบ Table
- การ Migration ที่ทำให้ข้อมูลหาย
- การเปลี่ยน Relation โดยไม่จำเป็น

---

# Logic ของระบบ Green Office

ระบบรองรับ:
- Emission Factors
- Carbon Calculation
- Green Office Criteria
- Evidence Management
- ESG Reporting
- KPI ด้านสิ่งแวดล้อม

ข้อมูลต้อง:
- ตรวจสอบย้อนหลังได้
- มีความถูกต้อง
- รองรับการ Audit
- เก็บประวัติการประเมิน

---

# พฤติกรรมที่ AI ควรปฏิบัติ

เมื่อสร้าง Code:
- เน้น Maintainability
- เน้น Scalability
- หลีกเลี่ยงการทำระบบเดิมพัง
- อธิบายจุดเสี่ยงก่อนแก้ไขใหญ่

เมื่อสร้าง UI:
- ทำให้ดู Modern และ Premium
- เน้น UX
- Layout สะอาด
- อ่านง่าย
- ใช้งานจริงได้

เมื่อแก้ Database:
- วิเคราะห์ผลกระทบก่อนเสมอ
- หลีกเลี่ยง Destructive Migration
- ป้องกันข้อมูลสูญหาย
- ไม่อนุญาตให้เพิ่ม ลบ Table หรือเปลี่ยน Schema อัตโนมัติ 
---

# Coding Standards

Code ต้อง:
- อ่านง่าย
- Clean
- Modular
- Type-safe
- Production-ready

หลีกเลี่ยง:
- Hardcode
- Logic ซ้ำ
- File ใหญ่เกินไป
- Naming ที่ไม่ชัดเจน

การตั้งชื่อ:
- ชัดเจน
- สม่ำเสมอ
- เข้าใจง่าย

เมื่อเขียนเสร็จ
- ให้ทำการรัน build บน command (เช่น `npm run build`) เพื่อให้แน่ใจว่าไม่มี syntax error
- **สำคัญมาก:** หากโปรเจกต์รันอยู่บน Docker (เช่น `green_frontend`) และมีการติดตั้ง Package ใหม่ (`npm install`) **ต้องรันคำสั่งติดตั้งเข้าไปใน Docker Container ด้วยเสมอ** (เช่น `docker exec green_frontend npm install`) แล้วตามด้วยการ restart container เพื่อไม่ให้เกิด Error กับผู้ใช้ที่รัน Docker อยู่
- แก้ไข code ที่ไม่ผ่านการรันจนกว่าจะผ่านทั้งหมด โดยไม่ต้องรอให้ผู้ใช้มาแจ้ง Error

# เป้าหมายของโปรเจกต์

Green Sync ต้องเป็นระบบ Green Office และ Sustainability Platform ที่:
- ดูทันสมัย
- ใช้งานง่าย
- รองรับองค์กรจริง
- ขยายต่อได้
- มีคุณภาพระดับ Enterprise
- พร้อมใช้งาน Production จริง