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
<div class="min-h-screen bg-slate-900 flex">
  
  <!-- Sidebar -->
  <div class="w-64 bg-slate-950 border-r border-white/10 flex flex-col flex-shrink-0 transition-all duration-300">
    <div class="p-4">
      <button (click)="newSession()" class="w-full py-2 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
        <i class="fa-solid fa-plus"></i> แชทใหม่
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
      <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">ประวัติการสนทนา</div>
      @for (session of sessions; track session.id) {
        <div class="group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
             [ngClass]="{'bg-white/10': currentSessionId === session.id}"
             (click)="selectSession(session.id)">
          <div class="flex items-center gap-2 overflow-hidden">
            <i class="fa-regular fa-message text-slate-400 text-sm"></i>
            <span class="text-slate-300 text-sm truncate">{{ session.title }}</span>
          </div>
          <button (click)="deleteSession(session.id, $event)" class="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      }
    </div>
  </div>

  <!-- Main Chat Area -->
  <div class="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
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
  </div>
</div>
  `
})
export class ChatbotComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  messages: ChatMessage[] = [];
  sessions: any[] = [];
  currentSessionId: number | null = null;
  inputText = '';
  isTyping = false;

  quickPrompts = [
    'Green Office คืออะไร มีเกณฑ์อะไรบ้าง?',
    'วิธีลดการปล่อยคาร์บอนในสำนักงาน',
    'Net Zero คืออะไร และองค์กรควรทำอย่างไร?',
    'วิเคราะห์กลยุทธ์ความยั่งยืนสำหรับองค์กร'
  ];

  ngOnInit() {
    this.loadSessions();
  }

  getHeaders() {
    const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('access_token') : '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadSessions() {
    this.http.get<any[]>('http://localhost:3001/gemini/sessions', { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.sessions = res;
        this.cdr.markForCheck();
      }
    });
  }

  selectSession(id: number) {
    this.currentSessionId = id;
    this.messages = [];
    this.http.get<any[]>(`http://localhost:3001/gemini/sessions/${id}/messages`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.messages = res.map(m => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at)
        }));
        this.cdr.markForCheck();
      }
    });
  }

  newSession() {
    this.currentSessionId = null;
    this.messages = [];
    this.cdr.markForCheck();
  }

  deleteSession(id: number, event: Event) {
    event.stopPropagation();
    this.http.delete(`http://localhost:3001/gemini/sessions/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== id);
        if (this.currentSessionId === id) this.newSession();
        this.cdr.markForCheck();
      }
    });
  }

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
    if (this.currentSessionId) {
      this.deleteSession(this.currentSessionId, new Event('click'));
    }
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

    const headers = this.getHeaders();
    const payload: any = { message: text };
    if (this.currentSessionId) {
      payload.sessionId = this.currentSessionId;
    }

    this.http.post<{ reply: string }>('http://localhost:3001/gemini/chat', payload, { headers }).subscribe({
      next: (res) => {
        const idx = this.messages.findIndex(m => m.id === loadingMsg.id);
        if (idx !== -1) {
          this.messages[idx] = {
            id: loadingMsg.id,
            role: 'assistant',
            content: res.reply || 'ขออภัย ไม่สามารถประมวลผลได้ในขณะนี้',
            timestamp: new Date(),
            isLoading: false
          };
        }
        this.isTyping = false;
        if (!this.currentSessionId) {
          this.loadSessions();
        }
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
