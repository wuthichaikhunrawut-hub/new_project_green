FR Checklist Web App
=====================

เรียกใช้งานเว็บแอพง่าย ๆ เพื่อสแกนสถานะฟีเจอร์ (FR) ในโปรเจคนี้

วิธีรัน:

1. เปิดเทอร์มินอลที่โฟลเดอร์โปรเจค (root):

```powershell
cd c:\Users\Vteca\project-green
node tools\checklist-web\server.js
```

2. เปิดเบราว์เซอร์ไปที่: http://localhost:3001

คำอธิบาย:
- เซิร์ฟเวอร์จะสแกนไฟล์ที่ระบุในชุดกฎ (ใน `server.js`) และแสดงตารางสถานะ (Implemented / Partially implemented / Missing)
- ลิงก์หลักฐานจะพยายามเสิร์ฟไฟล์โดยตรง (ถ้าเบราว์เซอร์/ระบบอนุญาต)

ปรับแต่ง:
- ถ้าต้องการใช้พอร์ตอื่น, ตั้งตัวแปร `PORT` ก่อนรัน: `set PORT=4000` (Windows PowerShell: `$env:PORT=4000`)

Limitations:
- เป็นการตรวจสอบด้วยการมีอยู่ของไฟล์เท่านั้น ไม่ได้รันโค้ดหรือประเมินความถูกต้องเชิงฟังก์ชัน

State persistence:
- คอมเมนต์และสถานะติ๊กจะถูกบันทึกชั่วคราวที่ `tools/checklist-web/state.json` — ลบทิ้งได้เมื่อเคลียร์ระบบ
