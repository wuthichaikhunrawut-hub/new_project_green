import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AssessmentCardComponent } from '../../../shared/components/assessment/assessment-card/assessment-card';

@Component({
  selector: 'app-green-office-form',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, AssessmentCardComponent],
  templateUrl: './form.html',
  styleUrl: './form.css'
})
export class GreenOfficeFormComponent {
  // Mock categories for the assessment
  categories = [
    { id: 1, title: 'หมวดที่ 1 การกำหนดนโยบายและการวางแผน', progress: 0, status: 'pending', totalWeight: 25, currentScore: 0 },
    { id: 2, title: 'หมวดที่ 2 การสื่อสารและสร้างจิตสำนึก', progress: 0, status: 'pending', totalWeight: 15, currentScore: 0 },
    { id: 3, title: 'หมวดที่ 3 การใช้ทรัพยากรและพลังงาน', progress: 0, status: 'pending', totalWeight: 15, currentScore: 0 },
    { id: 4, title: 'หมวดที่ 4 การจัดการของเสีย', progress: 0, status: 'pending', totalWeight: 15, currentScore: 0 },
    { id: 5, title: 'หมวดที่ 5 สภาพแวดล้อมและความปลอดภัย', progress: 0, status: 'pending', totalWeight: 15, currentScore: 0 },
    { id: 6, title: 'หมวดที่ 6 การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม', progress: 0, status: 'pending', totalWeight: 15, currentScore: 0 },
    { id: 7, title: 'หมวดที่ 7 การดำเนินงานเพื่อความต่อเนื่อง', progress: 0, status: 'pending', totalWeight: 10, currentScore: 0 }
  ];

  activeCategory = 1;
  
  // Storage for all questions across categories to persist state
  allQuestions: { [key: number]: any[] } = {
    1: [
      { id: '1.1.1', title: 'การกำหนดขอบเขตพื้นที่และกิจกรรม', description: 'มีการระบุพื้นที่รับผิดชอบและกิจกรรมทั้งหมดในสำนักงานที่ขอรับรองอย่างชัดเจน พร้อมผังบริเวณ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.1.2', title: 'นโยบายด้านสิ่งแวดล้อม', description: 'นโยบายต้องลงนามโดยผู้บริหารระดับสูง ระบุปีที่เริ่มต้น และครอบคลุมการปรับปรุงต่อเนื่อง/การควบคุมมลพิษ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.1.3', title: 'คณะทำงานด้านสิ่งแวดล้อม', description: 'มีการแต่งตั้งคณะทำงานที่มาจากทุกส่วนงาน กำหนดบทบาทหน้าที่ชัดเจน และมีการประชุมสม่ำเสมอ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.2.1', title: 'การระบุปัญหาสิ่งแวดล้อม (Aspect) - ภาวะปกติ', description: 'มีการระบุลักษณะปัญหาสิ่งแวดล้อมจากกิจกรรมต่างๆ ในภาวะการทำงานปกติ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.2.2', title: 'การระบุปัญหาสิ่งแวดล้อม - ภาวะผิดปกติและฉุกเฉิน', description: 'มีการระบุปัญหาที่อาจเกิดขึ้นในสภาวะไม่ปกติ (เช่น การซ่อมบำรุง) และภาวะฉุกเฉิน (เช่น อัคคีภัย)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.2.3', title: 'การประเมินปัญหาสิ่งแวดล้อมที่มีนัยสำคัญ', description: 'มีเกณฑ์การให้คะแนนเพื่อคัดเลือกปัญหาสิ่งแวดล้อมที่มีนัยสำคัญ (Significant Aspect) เพื่อนำไปจัดการ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.3.1', title: 'ทะเบียนกฎหมายและข้อกำหนดที่เกี่ยวข้อง', description: 'มีการรวบรวมกฎหมายสิ่งแวดล้อม ความปลอดภัย และข้อกำหนดอื่นๆ ที่เกี่ยวข้องกับสำนักงานให้เป็นปัจจุบัน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.3.2', title: 'การประเมินความสอดคล้องกับกฎหมาย', description: 'มีการประเมินว่าการดำเนินงานจริงสอดคล้องกับกฎหมายที่ระบุไว้หรือไม่ อย่างน้อยปีละ 1 ครั้ง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.4.1', title: 'การกำหนดขอบเขตข้อมูลก๊าซเรือนกระจก', description: 'มีการกำหนดขอบเขตการคำนวณคาร์บอนฟุตพริ้นท์ (Scope 1, 2, 3) ที่สอดคล้องกับกิจกรรมของสำนักงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.4.2', title: 'การรวบรวมข้อมูลดิบสำหรับการคำนวณ CFO', description: 'มีการเก็บข้อมูลการใช้ไฟฟ้า น้ำ เชื้อเพลิง และสารทำความเย็นอย่างเป็นระบบเพื่อใช้คำนวณ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.4.3', title: 'สรุปผลปริมาณก๊าซเรือนกระจกรายปี', description: 'มีการคำนวณและสรุปผลปริมาณการปล่อยก๊าซเรือนกระจกแยกตาม Scope และมีการวิเคราะห์แนวโน้ม', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.5.1', title: 'การกำหนดเป้าหมายด้านสิ่งแวดล้อม (KPI)', description: 'มีการกำหนดเป้าหมายเชิงปริมาณที่ท้าทายและสามารถวัดผลได้ (เช่น ลดการใช้ไฟลง 5%)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.5.2', title: 'แผนการดำเนินงานและโครงการสิ่งแวดล้อม', description: 'มีแผนงานระบุรายละเอียดกิจกรรม ผู้รับผิดชอบ งบประมาณ และระยะเวลา เพื่อให้บรรลุเป้าหมายที่ตั้งไว้', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '1.6.1', title: 'การประชุมทบทวนฝ่ายบริหาร', description: 'ผู้บริหารสูงสุดมีการประชุมทบทวนผลการดำเนินงาน Green Office และให้ทิศทางในการปรับปรุง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ],

    2: [
      { id: '2.1.1', title: 'แผนการฝึกอบรมและหลักสูตรที่ครอบคลุม', description: 'มีแผนการอบรมประจำปีและหลักสูตรที่ครอบคลุม 5 หัวข้อหลัก (ความสำคัญของ Green Office, การใช้ทรัพยากร, การจัดการของเสีย, การจัดซื้อสีเขียว, และก๊าซเรือนกระจก)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.1.2', title: 'ร้อยละของผู้เข้าร่วมอบรม', description: 'มีผู้เข้าร่วมอบรมในแต่ละหลักสูตรไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมายที่กำหนดไว้', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.1.3', title: 'การประเมินความรู้และความเข้าใจ', description: 'มีการประเมินผลความรู้ทั้งก่อนและหลังการอบรม (Pre-test / Post-test) และสรุปผลการประเมิน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.1.4', title: 'การบันทึกประวัติการฝึกอบรม', description: 'มีการจัดทำประวัติการอบรมรายบุคคลที่ระบุหลักสูตร วันเวลา และผลการทดสอบให้เป็นปัจจุบัน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.1.5', title: 'ผู้รับผิดชอบหรือวิทยากรที่มีความเหมาะสม', description: 'มีหลักฐานแสดงความรู้ความสามารถของวิทยากร (ประวัติ/ประสบการณ์) หรือใบรับรองจากหน่วยงานภายนอก', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.2.1', title: 'แผนการสื่อสารและประชาสัมพันธ์', description: 'มีแผนระบุหัวข้อ (นโยบาย, ปัญหาสำคัญ, กฎหมาย, 5ส, การใช้ทรัพยากร, สินค้าสีเขียว, ก๊าซเรือนกระจก) ช่องทาง และกลุ่มเป้าหมาย', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.2.2', title: 'การดำเนินการสื่อสารตามแผน', description: 'มีการสื่อสารผ่านช่องทางที่กำหนดอย่างสม่ำเสมอ (เช่น บอร์ด, Line, อีเมล, การประชุม) พร้อมหลักฐานการสื่อสาร', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.2.3', title: 'ร้อยละความเข้าใจของพนักงาน', description: 'มีการสุ่มสอบถามพนักงานเพื่อประเมินความเข้าใจต่อนโยบายและการดำเนินงาน โดยต้องมีความเข้าใจไม่น้อยกว่าร้อยละ 80', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '2.2.4', title: 'ช่องทางรับข้อเสนอแนะด้านสิ่งแวดล้อม', description: 'มีช่องทางรับฟังความคิดเห็นและข้อเสนอแนะด้านสิ่งแวดล้อม และมีบันทึกการพิจารณาปรับปรุงการดำเนินงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ],

    3: [
      { id: '3.1.1', title: 'มาตรการและแนวทางปฏิบัติการใช้น้ำ', description: 'มีการประกาศมาตรการประหยัดน้ำที่ชัดเจน และสื่อสารให้พนักงานทุกคนรับทราบและถือปฏิบัติ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.1.2', title: 'การเก็บข้อมูลและเปรียบเทียบเป้าหมายการใช้น้ำ', description: 'มีการบันทึกข้อมูลการใช้น้ำรายเดือน สรุปผลการใช้เทียบกับเป้าหมาย และวิเคราะห์สาเหตุกรณีไม่เป็นไปตามเป้าหมาย', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.1.3', title: 'พฤติกรรมการใช้น้ำของบุคลากร', description: 'พนักงานมีส่วนร่วมในการประหยัดน้ำและมีการตรวจสอบการรั่วไหลของอุปกรณ์ประปาสม่ำเสมอ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.2.1', title: 'มาตรการและแนวทางปฏิบัติการใช้ไฟฟ้า', description: 'มีมาตรการประหยัดไฟฟ้าในส่วนต่างๆ (แสงสว่าง, เครื่องปรับอากาศ, อุปกรณ์สำนักงาน) ที่ชัดเจน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.2.2', title: 'การเก็บข้อมูลและเปรียบเทียบเป้าหมายการใช้ไฟฟ้า', description: 'มีการบันทึกหน่วยการใช้ไฟรายเดือน สรุปผลเทียบกับเป้าหมาย และวิเคราะห์ผลการประหยัดพลังงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.2.3', title: 'พฤติกรรมการใช้ไฟฟ้าของบุคลากร', description: 'พนักงานปฏิบัติตามมาตรการ (เช่น ปิดไฟเมื่อไม่ใช้งาน, ปรับแอร์ 25 องศา) และมีระบบตรวจสอบหลังเลิกงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.3.1', title: 'มาตรการการใช้พลังงานเชื้อเพลิง', description: 'มีแนวทางการใช้รถยนต์ส่วนกลางอย่างมีประสิทธิภาพ และการบำรุงรักษารถยนต์เพื่อลดการใช้เชื้อเพลิง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.3.2', title: 'ข้อมูลการใช้เชื้อเพลิงและการปล่อยก๊าซเรือนกระจก', description: 'มีการบันทึกปริมาณการใช้เชื้อเพลิงรายเดือนและนำมาคำนวณปริมาณการปล่อยก๊าซเรือนกระจก (Scope 1)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.4.1', title: 'มาตรการการใช้กระดาษและทรัพยากรอื่นๆ', description: 'มีมาตรการลดการใช้กระดาษ (Paperless, Reuse) และการจัดการวัสดุอุปกรณ์สำนักงานอย่างคุ้มค่า', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.4.2', title: 'ข้อมูลการใช้ทรัพยากรสำนักงาน', description: 'มีการบันทึกข้อมูลการใช้กระดาษและหมึกพิมพ์รายเดือน และมีสรุปผลการลดปริมาณการใช้จริง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '3.5.1', title: 'การจัดประชุมและนิทรรศการที่เป็นมิตรต่อสิ่งแวดล้อม', description: 'มีแนวปฏิบัติ Green Meeting (เช่น งดใช้ขวดพลาสติก, การเลือกอาหารท้องถิ่น, การลดขยะจากการจัดงาน)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ],

    4: [
      { id: '4.1.1', title: 'มาตรการการจัดการขยะและการสร้างจิตสำนึก', description: 'มีมาตรการจัดการขยะแต่ละประเภท และมาตรการลดการใช้พลาสติกแบบครั้งเดียวทิ้ง (Single Use Plastic) และโฟม', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.1.2', title: 'การคัดแยกและรวบรวมขยะ', description: 'มีการคัดแยกขยะตามประเภทอย่างถูกต้อง มีป้ายบ่งชี้ที่ชัดเจน และจัดวางถังขยะในจุดที่เหมาะสม', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.1.3', title: 'การจัดการพื้นที่พักขยะ', description: 'มีจุดพักขยะที่ถูกหลักวิชาการ มีที่ปิดมิดชิด พื้นที่สะอาด และป้องกันสัตว์พาหะนำโรค', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.1.4', title: 'การนำขยะกลับมาใช้ประโยชน์', description: 'มีหลักฐานการนำขยะกลับมาใช้ประโยชน์ใหม่ (Reuse / Recycle) เช่น การทำปุ๋ยหมัก หรือการขายขยะรีไซเคิล', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.1.5', title: 'การบันทึกข้อมูลปริมาณขยะ', description: 'มีการบันทึกปริมาณขยะแต่ละประเภทเป็นรายเดือน และสรุปผลเปรียบเทียบกับเป้าหมาย', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.1.6', title: 'การส่งกำจัดขยะอย่างถูกต้อง', description: 'ส่งขยะให้ อปท. หรือผู้รับจ้างที่มีใบอนุญาตถูกต้องตามกฎหมาย และมีเอกสารยืนยันการกำจัด', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.2.1', title: 'การดูแลระบบบำบัดน้ำเสียและบ่อดักไขมัน', description: 'มีการทำความสะอาดตะแกรงดักเศษอาหารและบ่อดักไขมันสม่ำเสมอ พร้อมบันทึกการดูแลรักษา', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.2.2', title: 'การจัดการกากตะกอนและเศษอาหาร', description: 'มีการนำกากตะกอนและเศษอาหารจากระบบบำบัดไปกำจัดอย่างถูกต้อง ไม่ทิ้งรวมกับขยะทั่วไป', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '4.2.3', title: 'การตรวจสอบคุณภาพน้ำทิ้ง', description: 'มีผลการวิเคราะห์คุณภาพน้ำทิ้งจากห้องปฏิบัติการที่ได้รับการรับรอง ให้เป็นไปตามค่ามาตรฐานกฎหมาย', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ],

    5: [
      { id: '5.1.1', title: 'การจัดการคุณภาพอากาศในสำนักงาน', description: 'มีแผนบำรุงรักษาเครื่องปรับอากาศสม่ำเสมอ จัดวางเครื่องถ่ายเอกสารในที่ถ่ายเท และมีมาตรการป้องกันฝุ่น/สารเคมี', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.1.2', title: 'การจัดการแสงสว่าง', description: 'มีการตรวจวัดความเข้มของแสงสว่างในพื้นที่ทำงานให้เป็นไปตามมาตรฐานกฎหมาย (ใช้อุปกรณ์ที่สอบเทียบ)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.1.3', title: 'การจัดการมลพิษทางเสียง', description: 'มีมาตรการควบคุมเสียงดังจากการทำงานหรือกิจกรรมต่างๆ และมีการปฏิบัติตามอย่างเคร่งครัด', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.1.4', title: 'การควบคุมมลพิษจากการจราจร', description: 'มีมาตรการลดมลพิษจากยานพาหนะในพื้นที่สำนักงาน เช่น ป้ายรณรงค์ดับเครื่องยนต์ขณะจอด', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.1.5', title: 'การจัดการอุณหภูมิและความชื้น (Thermal Comfort)', description: 'มีการดูแลรักษาอุณหภูมิภายในสำนักงานให้เหมาะสมต่อการทำงาน (25-26 องศาเซลเซียส)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.2.1', title: 'ความเป็นระเบียบเรียบร้อยและสุขอนามัย (5ส)', description: 'มีการดำเนินกิจกรรม 5ส สม่ำเสมอ มีผังแสดงผู้รับผิดชอบพื้นที่ และการดูแลความสะอาดพื้นที่ส่วนกลาง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.2.2', title: 'การจัดสภาพแวดล้อมและพื้นที่สีเขียว', description: 'มีการจัดพื้นที่พักผ่อน พื้นที่สีเขียวทั้งภายในหรือภายนอกอาคารให้เหมาะสมและน่าทำงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.3.1', title: 'ความพร้อมของอุปกรณ์ป้องกันและระงับอัคคีภัย', description: 'มีถังดับเพลิงและสัญญาณเตือนภัยที่พร้อมใช้งาน มีป้ายทางหนีไฟชัดเจน และไม่มีสิ่งกีดขวางทางออก', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.3.2', title: 'การฝึกซ้อมอพยพหนีไฟ', description: 'มีการจัดฝึกซ้อมอพยพหนีไฟตามแผนงานประจำปี และสรุปผลการซ้อมเพื่อปรับปรุงแผน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.3.3', title: 'มาตรการป้องกันพาหะนำโรค', description: 'มีมาตรการป้องกันและกำจัดแมลงหรือสัตว์พาหะนำโรคอย่างปลอดภัยและสม่ำเสมอ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.3.4', title: 'สำนักงานปลอดบุหรี่', description: 'มีการรณรงค์และติดป้ายสำนักงานปลอดบุหรี่ และจัดเขตสูบบุหรี่ตามกฎหมาย (ถ้ามี)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '5.3.5', title: 'การจัดเตรียมอุปกรณ์ปฐมพยาบาล', description: 'มีการจัดเตรียมตู้ยาสามัญประจำบ้านและอุปกรณ์ปฐมพยาบาลเบื้องต้นที่พร้อมใช้งานและไม่หมดอายุ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ],


    6: [
      { id: '6.1.1', title: 'นโยบายและผู้รับผิดชอบการจัดซื้อสีเขียว', description: 'มีการกำหนดนโยบายและแต่งตั้งผู้รับผิดชอบที่มีความเข้าใจในหลักการเลือกซื้อสินค้าที่เป็นมิตรต่อสิ่งแวดล้อม', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.1.2', title: 'การกำหนดคุณลักษณะสินค้า (Spec) สีเขียว', description: 'มีการระบุเกณฑ์ด้านสิ่งแวดล้อมในรายละเอียดคุณลักษณะ (TOR) ของสินค้าที่จะจัดซื้ออย่างชัดเจน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.1.3', title: 'บัญชีรายชื่อสินค้าที่เป็นมิตรกับสิ่งแวดล้อม', description: 'มีการรวบรวมรายชื่อสินค้า ยี่ห้อ และประเภทฉลากสิ่งแวดล้อม (ฉลากเขียว, เบอร์ 5, ตะกร้าเขียว) ที่สอดคล้องกับการใช้งานจริง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.1.4', title: 'การประสานงานและแจ้งนโยบายแก่ผู้ขาย', description: 'มีการแจ้งนโยบายหรือขอความร่วมมือให้ผู้ขาย (Supplier) จัดหาสินค้าที่เป็นมิตรกับสิ่งแวดล้อมมาจำหน่ายให้สำนักงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.1.5', title: 'สรุปผลร้อยละการจัดซื้อสินค้าสีเขียว', description: 'มีการสรุปมูลค่าหรือปริมาณการจัดซื้อสินค้าสีเขียวเทียบกับการซื้อทั้งหมด และสรุปผลร้อยละให้เห็นชัดเจน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.2.1', title: 'เกณฑ์การคัดเลือกผู้รับจ้างบริการสีเขียว', description: 'มีการกำหนดเงื่อนไขด้านสิ่งแวดล้อมในการคัดเลือกผู้รับจ้าง (เช่น แม่บ้าน, รปภ., ผู้รับเหมา) หรือผู้ที่มีมาตรฐาน ISO 14001', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.2.2', title: 'สัญญาจ้างหรือข้อตกลงด้านสิ่งแวดล้อม', description: 'มีการระบุเงื่อนไขการดำเนินงานที่เป็นมิตรต่อสิ่งแวดล้อมไว้ในสัญญาจ้างหรือบันทึกข้อตกลงกับผู้รับจ้างอย่างชัดเจน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.2.3', title: 'การอบรมและสื่อสารให้ผู้รับจ้างบริการ', description: 'ผู้รับจ้างต้องได้รับการอบรมหรือสื่อสารแนวทาง Green Office ในส่วนที่เกี่ยวข้องกับการปฏิบัติงานของตน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.2.4', title: 'การประเมินประสิทธิภาพด้านสิ่งแวดล้อมผู้รับจ้าง', description: 'มีการประเมินผลการทำงานด้านสิ่งแวดล้อมของผู้รับจ้างตามรอบเวลา และนำผลมาพิจารณาปรับปรุงการทำงาน', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '6.2.5', title: 'การเลือกใช้บริการภายนอกที่เป็นมิตรต่อสิ่งแวดล้อม', description: 'การเลือกใช้บริการอื่นๆ เช่น โรงแรม หรือสถานที่จัดประชุม ที่ได้รับการรับรองด้านการจัดการสิ่งแวดล้อม (Green Hotel/Meeting)', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ],
    7: [
      { id: '7.1.1', title: 'คณะกรรมการตรวจประเมินภายใน', description: 'มีการแต่งตั้งคณะกรรมการตรวจประเมินภายในที่ผ่านการฝึกอบรมหลักสูตรที่เกี่ยวข้องและมีความเหมาะสม', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.1.2', title: 'แผนการตรวจประเมินภายในประจำปี', description: 'มีการกำหนดแผนและกำหนดการตรวจประเมินภายในอย่างน้อยปีละ 1 ครั้ง และครอบคลุมทุกหมวด', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.1.3', title: 'การดำเนินการตรวจประเมินภายใน', description: 'มีการดำเนินการตรวจประเมินตามแผน โดยผู้ตรวจที่มีความเป็นอิสระในหมวดที่ตนเองไม่ได้รับผิดชอบ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.1.4', title: 'สรุปผลและแนวทางการแก้ไข (CAR)', description: 'มีการจัดทำรายงานสรุปผลการตรวจประเมิน และมีการกำหนดแนวทางแก้ไข/ปรับปรุงสำหรับข้อบกพร่องที่พบ', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.1.5', title: 'การนำเสนอผลต่อฝ่ายบริหาร', description: 'มีการนำผลการตรวจประเมินภายในและสถานะการแก้ไขเข้าสู่ที่ประชุมทบทวนฝ่ายบริหาร', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.2.1', title: 'กิจกรรมต่อยอดด้านความยั่งยืน', description: 'มีการดำเนินกิจกรรมที่นอกเหนือจากเกณฑ์พื้นฐาน เช่น มาตรฐานระดับสากลอื่นๆ หรือโครงการ Carbon Neutral', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.2.2', title: 'กิจกรรมร่วมกับชุมชนและภายนอก', description: 'มีการดำเนินกิจกรรมด้านสิ่งแวดล้อมหรือการลดก๊าซเรือนกระจกร่วมกับหน่วยงานภายนอกหรือชุมชนรอบข้าง', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' },
      { id: '7.2.3', title: 'การเป็นแหล่งเรียนรู้และพี่เลี้ยง', description: 'มีการเปิดสำนักงานเป็นแหล่งศึกษาดูงาน หรือเป็นพี่เลี้ยงให้คำปรึกษาแก่หน่วยงานอื่นในการทำ Green Office', implementationStatus: 'none', score: null, details: '', fileCount: 0, status: 'ยังไม่เริ่ม' }
    ]



  };


  questions: any[] = [];
  activeSubCategory: string = '';
  subCategories: string[] = [];

  constructor() {
    this.selectCategory(1);
  }

  get filteredQuestions(): any[] {
    if (!this.activeSubCategory) return this.questions;
    return this.questions.filter(q => q.id.startsWith(this.activeSubCategory + '.'));
  }

  get activeCategoryTitle(): string {
    const category = this.categories.find(c => c.id === this.activeCategory);
    return category ? category.title : '';
  }

  get totalScore(): number {
    return this.categories.reduce((acc, cat) => acc + cat.currentScore, 0);
  }

  get assessmentLevel(): string {
    const score = this.totalScore;
    if (score >= 90) return 'ดีเยี่ยม (G Gold)';
    if (score >= 80) return 'ดีมาก (G Silver)';
    if (score >= 60) return 'ดี (G Bronze)';
    return 'ควรปรับปรุง';
  }

  get levelClass(): string {
    const level = this.assessmentLevel;
    if (level.includes('Gold')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (level.includes('Silver')) return 'bg-slate-200 text-slate-700 border-slate-300';
    if (level.includes('Bronze')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }

  // Radar Chart Configuration
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0,0,0,0.1)' },
        grid: { color: 'rgba(0,0,0,0.1)' },
        pointLabels: {
          font: { family: "'IBM Plex Sans Thai', sans-serif", size: 10, weight: 'bold' },
          color: '#64748b'
        },
        ticks: { display: false, stepSize: 20 },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  public radarChartLabels: string[] = ['หมวด 1', 'หมวด 2', 'หมวด 3', 'หมวด 4', 'หมวด 5', 'หมวด 6', 'หมวด 7'];

  public radarChartData: ChartData<'radar'> = {
    labels: this.radarChartLabels,
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        label: 'คะแนนเฉลี่ย (%)',
        backgroundColor: 'rgba(22, 163, 74, 0.2)',
        borderColor: '#16a34a',
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#16a34a',
        borderWidth: 3,
      }
    ]
  };

  public radarChartType: ChartType = 'radar';

  selectCategory(id: number) {
    this.activeCategory = id;
    this.questions = this.allQuestions[id];
    
    // Group questions into sub-categories (e.g., 6.1, 6.2)
    const subSet = new Set<string>();
    this.questions.forEach(q => {
      const parts = q.id.split('.');
      if (parts.length >= 2) {
        subSet.add(`${parts[0]}.${parts[1]}`);
      }
    });
    this.subCategories = Array.from(subSet).sort();
    this.activeSubCategory = this.subCategories.length > 0 ? this.subCategories[0] : '';
  }

  selectSubCategory(subId: string) {
    this.activeSubCategory = subId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextSubCategory() {
    const currentIndex = this.subCategories.indexOf(this.activeSubCategory);
    if (currentIndex < this.subCategories.length - 1) {
      this.selectSubCategory(this.subCategories[currentIndex + 1]);
    } else if (this.activeCategory < this.categories.length) {
      this.selectCategory(this.activeCategory + 1);
    }
  }

  prevSubCategory() {
    const currentIndex = this.subCategories.indexOf(this.activeSubCategory);
    if (currentIndex > 0) {
      this.selectSubCategory(this.subCategories[currentIndex - 1]);
    } else if (this.activeCategory > 1) {
      this.selectCategory(this.activeCategory - 1);
      // Go to last sub-category of previous category
      this.activeSubCategory = this.subCategories[this.subCategories.length - 1];
    }
  }

  onCardChanged(index: number, event: any) {
    this.questions[index] = { ...this.questions[index], ...event };
    this.recalculateProgress();
  }

  recalculateProgress() {
    const catIndex = this.categories.findIndex(c => c.id === this.activeCategory);
    if (catIndex > -1) {
      const cat = this.categories[catIndex];
      const questions = this.allQuestions[cat.id];
      
      // Calculate progress based on answered questions (score is not null)
      const answeredCount = questions.filter(q => q.score !== null).length;
      cat.progress = Math.round((answeredCount / questions.length) * 100);
      
      // Calculate current score for this category
      // Formula: (Sum of scores / (Questions * 5)) * Category Weight
      const sumScores = questions.reduce((acc, q) => acc + (q.score || 0), 0);
      cat.currentScore = Number(((sumScores / (questions.length * 5)) * cat.totalWeight).toFixed(2));

      // Update status
      if (cat.progress === 100) cat.status = 'completed';
      else if (cat.progress > 0) cat.status = 'in-progress';
      else cat.status = 'pending';
    }

    // Update Radar Chart
    this.radarChartData = {
      labels: this.radarChartLabels,
      datasets: [
        {
          ...this.radarChartData.datasets[0],
          data: this.categories.map(c => (c.currentScore / c.totalWeight) * 100)
        }
      ]
    };
  }

  saveProgress() {
    alert('บันทึกฉบับร่างเรียบร้อยแล้ว ข้อมูลของคุณถูกจัดเก็บในระบบชั่วคราว');
  }

  downloadPDF() {
    alert('กำลังสร้างรายงานประเมินตนเอง (PDF)... กรุณารอสักครู่');
  }

  submitAssessment() {
    const isAllComplete = this.categories.every(c => c.progress === 100);
    const incompleteItems: string[] = [];
    
    // Check validation: score 5 must have evidence
    for (let catId in this.allQuestions) {
      this.allQuestions[catId].forEach(q => {
        if (q.score === 5 && q.fileCount === 0) {
          incompleteItems.push(q.id);
        }
      });
    }

    if (incompleteItems.length > 0) {
      alert(`ไม่สามารถส่งแบบประเมินได้:\nข้อต่อไปนี้ได้รับคะแนนเต็ม แต่ยังไม่มีการแนบหลักฐาน: ${incompleteItems.join(', ')}`);
      return;
    }

    if (isAllComplete) {
      alert('ส่งแบบประเมินเรียบร้อยแล้ว! คณะกรรมการจะดำเนินการตรวจประเมินในลำดับถัดไป');
    } else {
      alert('กรุณากรอกข้อมูลให้ครบทุกหมวดก่อนส่งแบบประเมิน');
    }
  }

  analyzeAI() {
    alert('AI กำลังวิเคราะห์ข้อมูลการประเมิน... \nข้อแนะนำเบื้องต้น: หมวดที่ 1 ควรเพิ่มหลักฐานภาพถ่ายการประชุมคณะทำงานเพื่อให้ได้คะแนนเต็ม');
  }
}

