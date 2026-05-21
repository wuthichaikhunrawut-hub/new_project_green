import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col">

  <!-- Header -->
  <div class="border-b border-white/10 bg-white/5 backdrop-blur px-6 py-4 flex items-center gap-4 flex-shrink-0">
    <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
      <i class="fa-solid fa-robot text-white"></i>
    </div>
    <div>
      <h1 class="text-white font-bold text-lg">GreenSync AI Assistant</h1>
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-emerald-400 text-xs font-medium">พร้อมให้บริการ</span>
      </div>
    </div>
    <button (click)="clearMessages()" class="ml-auto text-white/40 hover:text-white/70 transition-colors text-sm">
      <i class="fa-solid fa-trash-can mr-1"></i> ล้างประวัติ
    </button>
  </div>

  <!-- Messages -->
  <div class="flex-1 overflow-y-auto px-4 py-6 space-y-4" #chatArea style="max-height: calc(100vh - 140px);">

    <!-- Welcome -->
    @if (messages.length === 0) {
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl mb-6">
          <i class="fa-solid fa-leaf text-white text-3xl"></i>
        </div>
        <h2 class="text-white text-2xl font-bold mb-2">สวัสดี! ฉันคือ GreenSync AI</h2>
        <p class="text-slate-400 text-sm max-w-md">ผมช่วยตอบคำถามเกี่ยวกับ Green Office · คาร์บอน · กลยุทธ์ความยั่งยืน และอื่นๆ ได้เลยครับ</p>

        <!-- Quick prompts -->
        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
          @for (prompt of quickPrompts; track prompt) {
            <button (click)="sendQuick(prompt)"
              class="text-left p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 hover:border-emerald-500/50 transition-all group">
              <i class="fa-solid fa-arrow-right text-emerald-400 mr-2 group-hover:translate-x-0.5 transition-transform"></i>{{ prompt }}
            </button>
          }
        </div>
      </div>
    }

    <!-- Chat messages -->
    @for (msg of messages; track msg.id) {
      <div class="flex gap-3" [class.flex-row-reverse]="msg.role === 'user'">
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
          [ngClass]="msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'">
          {{ msg.role === 'user' ? 'คุณ' : 'AI' }}
        </div>
        <!-- Bubble -->
        <div class="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
          [ngClass]="msg.role === 'user'
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/10'">
          @if (msg.isLoading) {
            <div class="flex gap-1 items-center py-1">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style="animation-delay:0ms"></span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style="animation-delay:150ms"></span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style="animation-delay:300ms"></span>
            </div>
          } @else {
            <div [innerHTML]="formatMessage(msg.content)"></div>
          }
          <div class="text-xs opacity-40 mt-1.5 text-right">{{ msg.timestamp | date:'HH:mm' }}</div>
        </div>
      </div>
    }
  </div>

  <!-- Input area -->
  <div class="border-t border-white/10 bg-white/5 backdrop-blur px-4 py-4 flex-shrink-0">
    <div class="flex items-end gap-3 max-w-4xl mx-auto">
      <div class="flex-1 rounded-2xl bg-white/10 border border-white/20 focus-within:border-emerald-500/60 transition-colors overflow-hidden">
        <textarea
          [(ngModel)]="inputText"
          (keydown.enter)="onEnter($event)"
          placeholder="ถามเกี่ยวกับ Green Office, คาร์บอน, กลยุทธ์ความยั่งยืน..."
          rows="1"
          class="w-full bg-transparent text-white placeholder-slate-500 text-sm px-4 py-3 resize-none focus:outline-none"
          style="max-height: 120px;"
          [disabled]="isTyping">
        </textarea>
      </div>
      <button (click)="sendMessage()"
        [disabled]="!inputText.trim() || isTyping"
        class="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
        <i class="fa-solid" [ngClass]="isTyping ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
      </button>
    </div>
    <p class="text-center text-slate-600 text-xs mt-2">GreenSync AI อาจเกิดข้อผิดพลาดได้ กรุณาตรวจสอบข้อมูลสำคัญก่อนนำไปใช้</p>
  </div>
</div>
  `
})
export class ChatbotComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  messages: ChatMessage[] = [];
  inputText = '';
  isTyping = false;

  quickPrompts = [
    'Green Office คืออะไร มีเกณฑ์อะไรบ้าง?',
    'วิธีลดการปล่อยคาร์บอนในสำนักงาน',
    'Net Zero คืออะไร และองค์กรควรทำอย่างไร?',
    'วิเคราะห์กลยุทธ์ความยั่งยืนสำหรับองค์กร'
  ];

  ngOnInit() {}

  sendQuick(prompt: string) {
    this.inputText = prompt;
    this.sendMessage();
  }

  onEnter(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-emerald-300">$1</code>')
      .replace(/\n/g, '<br>');
  }

  clearMessages() {
    this.messages = [];
    this.cdr.markForCheck();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    this.messages.push(userMsg);
    this.inputText = '';
    this.isTyping = true;

    // Add loading message
    const loadingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    this.messages.push(loadingMsg);
    this.cdr.markForCheck();

    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('access_token') : '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<{ response: string }>('http://localhost:3001/chatbot/ask', { message: text }, { headers }).subscribe({
      next: (res) => {
        const idx = this.messages.findIndex(m => m.id === loadingMsg.id);
        if (idx !== -1) {
          this.messages[idx] = {
            id: loadingMsg.id,
            role: 'assistant',
            content: res.response || 'ขออภัย ไม่สามารถประมวลผลได้ในขณะนี้',
            timestamp: new Date(),
            isLoading: false
          };
        }
        this.isTyping = false;
        this.cdr.markForCheck();
      },
      error: () => {
        const idx = this.messages.findIndex(m => m.id === loadingMsg.id);
        if (idx !== -1) {
          this.messages[idx] = {
            id: loadingMsg.id,
            role: 'assistant',
            content: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่อีกครั้ง',
            timestamp: new Date(),
            isLoading: false
          };
        }
        this.isTyping = false;
        this.cdr.markForCheck();
      }
    });
  }
}
