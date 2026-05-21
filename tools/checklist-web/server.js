const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const STATE_FILE = path.join(__dirname, 'state.json');

const FR_LIST = [
  { id: 'FR-01', desc: 'ผู้ใช้งานสามารถลงทะเบียนสมัครสมาชิกใหม่ได้', files: ['backend/src/auth/auth.controller.ts'] },
  { id: 'FR-02', desc: 'เข้าสู่ระบบ ออกจากระบบ และจัดการโปรไฟล์', files: ['backend/src/auth/auth.controller.ts','backend/src/users/users.controller.ts'], partial: true },
  { id: 'FR-03', desc: 'ผู้ดูแลจัดการบัญชีและกำหนดสิทธิ์', files: ['backend/src/users/users.controller.ts'] },
  { id: 'FR-04', desc: 'ผู้ดูแลตรวจสอบ/อนุมัติโปรไฟล์ผู้ตรวจประเมิน', files: ['backend/src/users/users.service.ts','backend/src/assessor/assessor.controller.ts'] },
  { id: 'FR-05', desc: 'จัดการเกณฑ์สำนักงานสีเขียวและค่า EF', files: ['backend/src/assessments/green-criteria.controller.ts','backend/src/carbon-logs/emission-factors.controller.ts'] },
  { id: 'FR-06', desc: 'จัดการแพ็กเกจ/โควต้า/ประวัติชำระเงิน', files: ['backend/src/subscriptions/subscriptions.controller.ts','backend/src/subscriptions/payment.controller.ts'] },
  { id: 'FR-08', desc: 'จัดการข้อมูลพื้นฐานและกำหนดเป้าหมายคาร์บอน', files: ['backend/src/organizations/organizations.controller.ts'] },
  { id: 'FR-09', desc: 'สร้างคำร้องขอประเมินและกรอกคะแนนตนเอง', files: ['backend/src/assessments/assessments.controller.ts'] },
  { id: 'FR-10', desc: 'อัปโหลดไฟล์หลักฐานประกอบการประเมิน', files: ['backend/src/uploads/uploads.controller.ts'] },
  { id: 'FR-11', desc: 'ยื่นส่งคำร้องและแก้ไขตามคำแนะนำ', files: ['backend/src/assessments/assessments.controller.ts','backend/src/assessor/assessor.controller.ts'] },
  { id: 'FR-12', desc: 'ผู้ตรวจเรียกดูคำร้องที่ได้รับมอบหมายและดาวน์โหลดเอกสาร', files: ['backend/src/assessor/assessor.controller.ts','backend/src/uploads/uploads.controller.ts'] },
  { id: 'FR-13', desc: 'ผู้ตรวจบันทึกคะแนน/พิมพ์ข้อเสนอแนะ/เปลี่ยนสถานะ', files: ['backend/src/assessor/assessor.controller.ts'] },
  { id: 'FR-14', desc: 'สรุปคะแนนรวมและกำหนดระดับการรับรอง', files: ['backend/src/assessor/assessor.service.ts','backend/src/assessments/entities/certificate.entity.ts'] },
  { id: 'FR-16', desc: 'บันทึกปริมาณการใช้พลังงานและแนบหลักฐาน', files: ['backend/src/carbon-logs/carbon-logs.controller.ts','backend/src/uploads/uploads.controller.ts'] },
  { id: 'FR-17', desc: 'อัปโหลดบิลให้ AI OCR สกัดข้อมูลอัตโนมัติ', files: ['backend/src/gemini/gemini.controller.ts','backend/src/gemini/gemini.service.ts'] },
  { id: 'FR-18', desc: 'ตรวจสอบ/ยืนยัน/จัดการประวัติการบันทึกคาร์บอน', files: ['backend/src/carbon-logs/carbon-logs.controller.ts'] },
  { id: 'FR-19', desc: 'พิมพ์แชทถามข้อมูลและขอคำปรึกษากับ AI Assistant', files: ['backend/src/gemini/gemini.controller.ts','backend/src/gemini/gemini.service.ts'] },
  { id: 'FR-20', desc: 'ดูโควต้าพแพ็กเกจ ชำระเงิน และต่ออายุ', files: ['backend/src/subscriptions/user-subscriptions.controller.ts','backend/src/subscriptions/payment.controller.ts'] },
  { id: 'FR-21', desc: 'ผู้บริหารดู Dashboard สรุปการประเมิน', files: ['backend/src/executive/executive.controller.ts','backend/src/executive/executive.service.ts'] },
  { id: 'FR-22', desc: 'Dashboard แยกตาม Scope และเทียบกับเป้าหมายปีฐาน', files: ['backend/src/executive/executive.service.ts'] },
  { id: 'FR-23', desc: 'ผู้บริหารรับคำแนะนำเชิงลึก (Actionable Insights) จาก AI', files: ['backend/src/gemini/gemini.service.ts'], partial: true },
  { id: 'FR-24', desc: 'ส่งออกรายงานเป็น PDF/Excel และดาวน์โหลดใบรับรอง', files: ['backend/src/assessments/entities/certificate.entity.ts'], partial: true },
  { id: 'FR-25', desc: 'ผู้ดูแลดู Dashboard สถิติภาพรวมแพลตฟอร์ม', files: ['backend/src/analytics/analytics.controller.ts','backend/src/analytics/analytics.service.ts'] }
];

function checkFileExists(relPath) {
  try {
    const full = path.join(process.cwd(), relPath);
    return fs.existsSync(full);
  } catch (e) {
    return false;
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return {};
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function evaluateFR(fr, state) {
  const evidence = fr.files.filter(f => checkFileExists(f));
  const implemented = evidence.length > 0;
  let status = 'Missing';
  if (implemented && fr.partial) status = 'Partially implemented';
  else if (implemented) status = 'Implemented';
  const saved = state[fr.id] || {};
  return { id: fr.id, desc: fr.desc, status, evidence, checked: !!saved.checked, comment: saved.comment || '' };
}

function buildHtml(results) {
  const rows = results.map(r => {
    const evidenceLinks = r.evidence.length > 0 ? r.evidence.map(f => `<a href="${encodeURI(f)}" target="_blank">${f}</a>`).join('<br>') : '';
    const checked = r.checked ? 'checked' : '';
    const comment = (r.comment || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<tr data-id="${r.id}"><td><input type="checkbox" class="fr-check" data-id="${r.id}" ${checked}></td><td>${r.id}<br/><small>${r.desc}</small></td><td>${r.status}</td><td>${evidenceLinks}</td><td><input class="fr-comment" data-id="${r.id}" value="${comment}" placeholder="เพิ่มคอมเมนต์"></td></tr>`;
  }).join('\n');

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FR Checklist Viewer</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:20px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px;vertical-align:top}
    th{background:#f4f6f8}
    td a{color:#0b66c3;text-decoration:none}
    .fr-comment{width:100%;box-sizing:border-box}
    tr:hover{background:#fafafa}
  </style>
</head>
<body>
  <h1>FR Checklist (Quick View)</h1>
  <p>สแกนจากโฟลเดอร์โปรเจคปัจจุบัน: <strong>${process.cwd()}</strong></p>
  <table>
    <thead><tr><th>ติ๊ก</th><th>รหัส / คำอธิบาย</th><th>สถานะ</th><th>หลักฐาน (ไฟล์/โมดูล)</th><th>คอมเมนต์</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p>หมายเหตุ: การตรวจสอบใช้การมีอยู่ของไฟล์/คอนโทรลเลอร์เป็นตัวชี้วัดเบื้องต้นเท่านั้น</p>

  <script>
    async function fetchState(){
      try{const r=await fetch('/state.json'); if(r.ok) return await r.json();}catch(e){}; return {};
    }

    function debounce(fn, wait=250){let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a), wait)}}

    async function saveState(state){
      try{await fetch('/save-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});}catch(e){console.error('save failed',e)}
    }

    (async ()=>{
      const state = await fetchState();
      document.querySelectorAll('.fr-check').forEach(cb=>{
        cb.addEventListener('change', async (ev)=>{
          ev.stopPropagation();
          const id = cb.dataset.id; state[id] = state[id]||{}; state[id].checked = cb.checked; await saveState(state);
        });
      });

      document.querySelectorAll('.fr-comment').forEach(inp=>{
        const id = inp.dataset.id; inp.addEventListener('input', debounce(async ()=>{ state[id]=state[id]||{}; state[id].comment=inp.value; await saveState(state); },400));
        inp.addEventListener('dblclick', (e)=>{ e.stopPropagation(); });
      });

      document.querySelectorAll('tbody tr').forEach(row=>{
        row.addEventListener('dblclick', (e)=>{
          // open first evidence link if available
          const link = row.querySelector('a');
          if(link){ window.open(link.href, '_blank'); }
        });
        // prevent row dblclick when interacting with inputs
        row.querySelectorAll('input, a').forEach(el=>el.addEventListener('dblclick', (ev)=>ev.stopPropagation()));
      });
    })();
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const results = FR_LIST.map(evaluateFR);
    const html = buildHtml(results);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // fallback: try to serve static file if exists (allow user to click file links)
  const requested = decodeURI(req.url.replace(/^\//, ''));
  const fullPath = path.join(process.cwd(), requested);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const stream = fs.createReadStream(fullPath);
    res.writeHead(200);
    stream.pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`FR Checklist server running on http://localhost:${PORT}`);
});
