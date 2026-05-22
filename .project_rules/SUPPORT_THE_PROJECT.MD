# SUPPORT_THE_PROJECT.MD

# Green Sync — Support System & AI Development Workflow

## จุดประสงค์ของไฟล์นี้

ไฟล์นี้ถูกสร้างขึ้นเพื่อเป็น “Support Layer” สำหรับการพัฒนาโปรเจกต์ Green Sync ร่วมกับ AI Assistant และ Developer ทุกคนในทีม

เป้าหมายหลักคือ:

* ทำให้ AI เข้าใจโปรเจกต์ก่อนเขียนโค้ด
* ลดปัญหา AI แก้ระบบผิดพลาด
* ลด Context Loss ระหว่าง Session
* ทำให้การพัฒนามีมาตรฐานเดียวกัน
* ป้องกันปัญหา Database เสียหาย
* รองรับการพัฒนาระยะยาวระดับ Production

---

# Project Overview

Green Sync คือแพลตฟอร์มสำหรับบริหารจัดการ Green Office, ESG และ Sustainability ภายในองค์กรและมหาวิทยาลัย

ระบบรองรับ:

* Green Office Assessment
* ESG Management
* Carbon Emission Tracking
* Dashboard & Analytics
* Evidence Management
* Organization Management
* Multi Organization
* Subscription System
* AI Workflow
* Reporting System

กลุ่มผู้ใช้งาน:

* มหาวิทยาลัย
* องค์กร
* หน่วยงานรัฐ
* ผู้ดูแลระบบ
* ผู้ประเมิน
* เจ้าหน้าที่สิ่งแวดล้อม

---

# Current Project Direction

โปรเจกต์กำลังพัฒนาไปในทิศทาง:

* Smart Green Office Platform
* ESG Intelligence Platform
* Carbon Intelligence System
* AI-Powered Sustainability Platform

ระบบต้องรองรับการใช้งานจริงระดับ Enterprise และสามารถขยายต่อได้ในอนาคต

---

# Current Progress

## Core System

Completed / Mostly Completed:

* Authentication System
* Organization Management
* User Management
* Role-based Access Control
* Dashboard UI
* Evidence Upload System
* Green Office Criteria Structure
* PostgreSQL Database Structure
* Docker Environment
* Supabase Integration

In Progress:

* AI Assistant
* Smart Dashboard
* Stripe Subscription
* ESG Analytics
* Carbon Dashboard
* Reporting System

Planned:

* AI Insight Engine
* AI Evidence Analysis
* AI Recommendation System
* Advanced ESG Report
* Carbon Intelligence Module
* Notification System
* Audit Workflow

---

# Main Tech Stack

## Frontend

* React
* Next.js
* TypeScript
* TailwindCSS
* shadcn/ui

## Backend

* Node.js
* NestJS
* PostgreSQL
* TypeORM

## Infrastructure

* Docker
* Supabase
* PostgreSQL

## AI Stack

Planned / Current:

* OpenAI API
* AI Assistant
* Dashboard Insight AI
* RAG System
* Embedding Search

---

# UI/UX Direction

Theme:

* Modern
* Premium
* Eco-Tech
* Minimal
* Professional

Design References:

* Stripe
* Notion
* Linear
* Vercel
* Supabase

Design Rules:

* Green / Emerald Theme
* Clean Layout
* Soft Shadow
* Rounded Corner
* Modern Typography
* Responsive Design
* Smooth Animation
* Card-based UI
* High Readability

Avoid:

* Old Bootstrap Style
* Heavy Border
* Cluttered Dashboard
* Overuse of Colors

---

# Dashboard Vision

Dashboard คือหัวใจของระบบ Green Sync

Dashboard ต้อง:

* อ่านง่าย
* สวยระดับ Enterprise
* โหลดเร็ว
* Responsive
* มี Data Insight
* รองรับ AI Summary

Dashboard หลัก:

* Green Score Dashboard
* Carbon Dashboard
* Electricity Analytics
* Waste Analytics
* ESG Analytics
* Assessment Dashboard
* Organization Overview

---

# AI Assistant Vision

AI Assistant ต้องสามารถ:

* ตอบคำถาม Green Office
* วิเคราะห์ Dashboard
* วิเคราะห์ Carbon Data
* แนะนำการเพิ่มคะแนน
* วิเคราะห์หลักฐาน
* สรุปรายงาน
* แนะนำ ESG Improvement

AI ต้องทำงานจาก Context จริงของระบบ

ห้าม:

* Hallucinate
* เดาข้อมูล Database เอง
* สร้างข้อมูลเท็จ

---

# CRITICAL DATABASE RULES

## IMPORTANT

Database คือส่วนที่สำคัญที่สุดของระบบ

ห้ามทำลายข้อมูลเด็ดขาด

---

# STRICT RULES

NEVER:

* use synchronize: true in production
* auto drop schema
* destructive migration
* remove tables automatically
* modify relation blindly
* overwrite production data

ALWAYS:

* analyze migration impact
* backup database before schema changes
* preserve production data
* review relations carefully
* validate before deploy

AI MUST:

* ระวัง TypeORM Sync
* ระวัง Migration ที่ทำให้ข้อมูลหาย
* ระวังการเปลี่ยน Foreign Key
* วิเคราะห์ผลกระทบก่อนแก้ Schema

---

# Development Workflow

## ก่อนเริ่มทำงาน

AI และ Developer ต้อง:

1. อ่าน SKILL.MD
2. อ่าน SUPPORT_THE_PROJECT.MD
3. วิเคราะห์ระบบเดิม
4. วิเคราะห์ผลกระทบก่อนแก้ระบบใหญ่
5. เสนอแผนก่อนลงมือแก้

---

# Workflow การพัฒนา

## ขั้นตอนมาตรฐาน

1. วิเคราะห์ Requirement
2. ตรวจสอบผลกระทบ
3. วางแผน Architecture
4. เขียน Code
5. ตรวจสอบ Type Safety
6. Run Build
7. ตรวจสอบ Docker
8. ตรวจสอบ Database
9. Test Flow
10. Deploy

---

# Coding Standards

Code ต้อง:

* Clean
* Modular
* Type-safe
* Reusable
* Production-ready
* Maintainable
* Scalable

หลีกเลี่ยง:

* Hardcode
* Logic ซ้ำ
* File ใหญ่เกินไป
* Naming ไม่ชัดเจน
* Massive Components

---

# Docker Rules

หากมีการติดตั้ง Package ใหม่:

ต้องติดตั้งภายใน Docker Container ด้วยเสมอ

ตัวอย่าง:

```bash
npm install

docker exec green_frontend npm install

docker restart green_frontend
```

---

# AI Working Style

AI ต้อง:

* วิเคราะห์ก่อนเขียน
* ไม่แก้หลายระบบพร้อมกัน
* รักษา Architecture เดิม
* อธิบายจุดเสี่ยงก่อน Refactor
* เน้น Production-ready
* เน้น UX/UI ระดับ Premium

AI ห้าม:

* Refactor ใหญ่โดยไม่มีเหตุผล
* แก้ Database โดยไม่วิเคราะห์
* เดา Schema เอง
* ลบ Logic เดิมมั่ว

---

# Architecture Direction

Frontend:

* Next.js
* App Router
* Modular Components
* Shared UI System

Backend:

* NestJS Modular Architecture
* Service-based Structure
* DTO Validation
* RBAC
* Secure API

Database:

* PostgreSQL
* Relational Structure
* Proper Foreign Keys
* Optimized Queries

Infrastructure:

* Docker-based
* Production-ready
* Backup-ready

---

# Long-term Vision

Green Sync ต้องพัฒนาไปสู่:

* Smart Sustainability Platform
* ESG Intelligence Platform
* AI Environmental Assistant
* Carbon Intelligence Platform
* Enterprise Green Management System

---

# IMPORTANT FOR AI ASSISTANT

เมื่อเริ่ม Session ใหม่:

AI ต้อง:

1. อ่านไฟล์ใน `.project_rules`
2. เข้าใจ Project Context ก่อน
3. วิเคราะห์ระบบก่อนเขียนโค้ด
4. ห้ามเดา Architecture เอง
5. รักษา Production Stability เสมอ

---

# Priority Order

AI ต้องให้ความสำคัญตามลำดับ:

1. Database Safety
2. Existing Architecture
3. Production Stability
4. Maintainability
5. Scalability
6. UX/UI Quality
7. Performance
8. New Features

---

# Development Risks & Weak Points

## Current Technical Risks

### 1. Database Risk

ความเสี่ยงสูงสุดของระบบตอนนี้คือ Database Structure

ปัญหาที่เคยเกิด:

* TypeORM Sync ลบ Table
* Schema Conflict
* Migration กระทบข้อมูลจริง
* Relation เพี้ยน
* pgAdmin Cache Error

แนวทางพัฒนาต่อ:

* ใช้ Manual Migration เท่านั้น
* ทำ Backup ก่อนแก้ Schema ทุกครั้ง
* แยก Development / Production Environment
* ทำ Database Documentation
* ทำ ER Diagram
* เพิ่ม Migration Review Workflow

---

## 2. AI Context Risk

ปัจจุบันระบบเริ่มมี Context จำนวนมาก

ความเสี่ยง:

* AI จำโครงสร้างระบบไม่ได้
* AI แก้ Code ข้าม Architecture
* AI เดา Schema เอง
* Context Loss ระหว่าง Session

แนวทางพัฒนาต่อ:

* เพิ่ม Documentation Layer
* แยก Rules เป็นหมวด
* สร้าง AI Context System
* สร้าง Current Status File
* สร้าง Architecture Diagram
* ทำ AI Prompt Structure

---

## 3. Dashboard Complexity

Dashboard จะกลายเป็นระบบที่ซับซ้อนมากในอนาคต

ความเสี่ยง:

* Query หนัก
* Dashboard โหลดช้า
* Component ใหญ่เกินไป
* UX ซับซ้อน
* Mobile ใช้งานยาก

แนวทางพัฒนาต่อ:

* แยก Dashboard Modules
* Optimize Query
* ทำ Analytics Layer
* ใช้ Caching
* ใช้ Lazy Loading
* ทำ Responsive Dashboard จริงจัง

---

## 4. AI Assistant Complexity

AI Assistant จะเป็น Core Feature ของระบบ

ความเสี่ยง:

* AI Hallucination
* Context ไม่พอ
* ตอบผิดจากข้อมูลจริง
* วิเคราะห์ Dashboard ผิด
* Prompt Chaos

แนวทางพัฒนาต่อ:

* ทำ RAG System
* ใช้ Embedding Search
* สร้าง Prompt Layer
* จำกัด AI Permission
* เพิ่ม Validation Layer
* ทำ Context Injection System

---

## 5. Scalability Risk

ระบบเริ่มรองรับหลายองค์กร

ความเสี่ยง:

* Query ช้า
* Database โตเร็ว
* Upload File จำนวนมาก
* Dashboard หนัก
* API Latency สูง

แนวทางพัฒนาต่อ:

* Optimize Database
* เพิ่ม Index
* ใช้ Queue System
* แยก Analytics Service
* วางแผน Redis Cache
* เตรียม Storage Scaling

---

## 6. UI/UX Consistency Risk

เมื่อระบบใหญ่ขึ้น UI อาจเริ่มไม่สม่ำเสมอ

ความเสี่ยง:

* Component หลาย Style
* Spacing ไม่เท่ากัน
* UX คนละแนว
* Dashboard ดูรก

แนวทางพัฒนาต่อ:

* ทำ Design System
* สร้าง Shared Components
* กำหนด UI Standards
* สร้าง Dashboard Template
* ใช้ Theme System กลาง

---

# Recommended Next Development Phase

## Phase 1 — Stabilize System

สิ่งที่ควรทำก่อน:

* Database Documentation
* Migration Workflow
* Backup Strategy
* Docker Stability
* Environment Separation
* API Standardization

---

## Phase 2 — Smart Dashboard

พัฒนาระบบ Dashboard อัจฉริยะ

ควรมี:

* KPI Analytics
* Carbon Dashboard
* ESG Dashboard
* Trend Analysis
* AI Summary
* Organization Insights

---

## Phase 3 — AI Assistant

พัฒนา AI Assistant เต็มระบบ

ควรมี:

* Chat AI
* Dashboard AI
* Evidence AI
* Report AI
* ESG Recommendation AI

---

## Phase 4 — Enterprise Expansion

พัฒนาระบบสำหรับองค์กรจริง

ควรมี:

* Multi Organization Scaling
* Audit Workflow
* Advanced Reporting
* Permission Matrix
* Enterprise Subscription
* Advanced ESG Analytics

---

# Final Goal

Green Sync ต้องเป็นระบบที่:

* ดูทันสมัย
* ใช้งานง่าย
* รองรับองค์กรจริง
* รองรับ ESG และ Sustainability
* มี AI ช่วยวิเคราะห์
* ขยายระบบได้ในอนาคต
* มีคุณภาพระดับ Enterprise
* พร้อมใช้งาน Production จริง
