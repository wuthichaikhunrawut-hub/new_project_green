import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  time: Date;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrls: ['./ai-chat.css']
})
export class AiChatComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  isOpen = false;
  isLoading = false;
  showHistory = false;
  inputMessage = '';
  messages: ChatMessage[] = [];
  sessions: { id: number; title: string; messages: ChatMessage[] }[] = [];
  activeSessionId: number | null = null;

  ngOnInit() {
    this.setDefaultMessage();
    this.loadHistory();
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  loadHistory() {
    if (!isPlatformBrowser(this.platformId)) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.http.get<any[]>('http://localhost:3001/gemini/history', {
      headers: this.getHeaders()
    }).subscribe({
      next: (logs) => {
        if (logs && logs.length > 0) {
          this.sessions = this.groupMessagesIntoSessions(logs);
          if (this.sessions.length > 0) {
            // Load the latest session by default
            this.selectSession(this.sessions[0]);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load chat history:', err);
      }
    });
  }

  loadHistoryAfterMessage() {
    this.http.get<any[]>('http://localhost:3001/gemini/history', {
      headers: this.getHeaders()
    }).subscribe({
      next: (logs) => {
        if (logs && logs.length > 0) {
          const oldActiveId = this.activeSessionId;
          this.sessions = this.groupMessagesIntoSessions(logs);
          if (oldActiveId !== null) {
            const found = this.sessions.find(s => s.id === oldActiveId);
            if (found) {
              this.activeSessionId = found.id;
              return;
            }
          }
          if (this.sessions.length > 0) {
            this.activeSessionId = this.sessions[0].id;
          }
        }
      }
    });
  }

  setDefaultMessage() {
    this.messages = [
      {
        role: 'bot',
        text: 'สวัสดีครับ! ผม GreenBot ผู้ช่วย AI ด้านสำนักงานสีเขียวและ Carbon Footprint 🌿 ถามอะไรก็ได้เลยครับ',
        time: new Date()
      }
    ];
    this.activeSessionId = null;
  }

  groupMessagesIntoSessions(logs: any[]): { id: number; title: string; messages: ChatMessage[] }[] {
    const sessionsList: { id: number; title: string; messages: ChatMessage[] }[] = [];
    let currentSession: { id: number; title: string; messages: ChatMessage[] } | null = null;
    let lastTime = 0;

    logs.forEach((log, index) => {
      const logTime = new Date(log.created_at).getTime();
      const isNewSession = !currentSession || (logTime - lastTime > 30 * 60 * 1000); // 30 minutes gap

      const userMsg: ChatMessage = {
        role: 'user',
        text: log.question,
        time: new Date(log.created_at)
      };

      const botMsg: ChatMessage = {
        role: 'bot',
        text: log.answer,
        time: new Date(log.created_at)
      };

      if (isNewSession) {
        currentSession = {
          id: index,
          title: log.question.substring(0, 24) + (log.question.length > 24 ? '...' : ''),
          messages: [userMsg, botMsg]
        };
        sessionsList.push(currentSession);
      } else if (currentSession) {
        currentSession.messages.push(userMsg, botMsg);
      }
      lastTime = logTime;
    });

    return sessionsList.reverse(); // Newest sessions first
  }

  selectSession(session: any) {
    this.messages = [...session.messages];
    this.activeSessionId = session.id;
    this.showHistory = false;
    this.scrollToBottom();
  }

  startNewChat() {
    this.setDefaultMessage();
    this.showHistory = false;
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadHistory();
      this.scrollToBottom();
    }
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', text, time: new Date() });
    this.inputMessage = '';
    this.isLoading = true;

    this.http.post<{ reply: string }>(
      'http://localhost:3001/gemini/chat',
      { message: text },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', text: res.reply, time: new Date() });
        this.isLoading = false;
        this.scrollToBottom();
        this.loadHistoryAfterMessage();
      },
      error: (err) => {
        const isApiKeyError = err?.error?.message?.includes('GEMINI_API_KEY');
        const errorText = isApiKeyError
          ? '⚠️ ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ กรุณาแจ้งผู้ดูแลระบบ'
          : '❌ ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
        this.messages.push({ role: 'bot', text: errorText, time: new Date() });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });

    this.scrollToBottom();
  }

  onKeyEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (confirm('คุณต้องการลบประวัติการสนทนาทั้งหมดหรือไม่?')) {
      this.http.delete('http://localhost:3001/gemini/history', {
        headers: this.getHeaders()
      }).subscribe({
        next: () => {
          this.sessions = [];
          this.setDefaultMessage();
          this.showHistory = false;
        },
        error: (err) => {
          console.error('Failed to clear chat history:', err);
        }
      });
    }
  }

  private scrollToBottom() {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
