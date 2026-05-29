import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserSubscriptionsService } from '../../../core/services/user-subscriptions.service';

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
  private cdr = inject(ChangeDetectorRef);
  private subscriptionService = inject(UserSubscriptionsService);

  isOpen = false;
  isLoading = false;
  showHistory = false;
  inputMessage = '';
  messages: ChatMessage[] = [];
  sessions: { id: number; title: string; messages: ChatMessage[]; logIds: number[] }[] = [];
  activeSessionId: number | null = null;
  
  // Custom Modal States
  showDeleteConfirmModal = false;
  showDeleteAllConfirmModal = false;
  sessionToDelete: any = null;

  // Resizing states
  chatWidth = 360;
  chatHeight = 480;
  isResizing = false;
  resizeDirection = '';
  startX = 0;
  startY = 0;
  startWidth = 0;
  startHeight = 0;

  onResizeStart(event: MouseEvent, direction: string) {
    event.preventDefault();
    this.isResizing = true;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.chatWidth;
    this.startHeight = this.chatHeight;

    const mouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
    const mouseUpHandler = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      this.cdr.markForCheck();
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    
    if (this.resizeDirection.includes('left')) {
      const dx = this.startX - event.clientX;
      this.chatWidth = Math.max(300, Math.min(800, this.startWidth + dx));
    }
    
    if (this.resizeDirection.includes('top')) {
      const dy = this.startY - event.clientY;
      this.chatHeight = Math.max(400, Math.min(800, this.startHeight + dy));
    }
    
    this.cdr.markForCheck();
  }

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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load chat history:', err);
        this.cdr.markForCheck();
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
              this.cdr.markForCheck();
              return;
            }
          }
          if (this.sessions.length > 0) {
            this.activeSessionId = this.sessions[0].id;
          }
        }
        this.cdr.markForCheck();
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

  groupMessagesIntoSessions(logs: any[]): { id: number; title: string; messages: ChatMessage[]; logIds: number[] }[] {
    const sessionsList: { id: number; title: string; messages: ChatMessage[]; logIds: number[] }[] = [];
    let currentSession: { id: number; title: string; messages: ChatMessage[]; logIds: number[] } | null = null;
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
          id: log.id || log.chat_log_id,
          title: log.question.substring(0, 24) + (log.question.length > 24 ? '...' : ''),
          messages: [userMsg, botMsg],
          logIds: [log.id || log.chat_log_id]
        };
        sessionsList.push(currentSession);
      } else if (currentSession) {
        currentSession.messages.push(userMsg, botMsg);
        currentSession.logIds.push(log.id || log.chat_log_id);
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
    this.cdr.markForCheck();

    this.http.post<{ reply: string }>(
      'http://localhost:3001/gemini/chat',
      { message: text },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', text: res.reply, time: new Date() });
        this.isLoading = false;
        this.cdr.markForCheck();
        this.scrollToBottom();
        this.loadHistoryAfterMessage();
        this.subscriptionService.quotaUpdated$.next();
      },
      error: (err) => {
        const isApiKeyError = err?.error?.message?.includes('GEMINI_API_KEY');
        const errorText = isApiKeyError
          ? '⚠️ ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ กรุณาแจ้งผู้ดูแลระบบ'
          : '❌ ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
        this.messages.push({ role: 'bot', text: errorText, time: new Date() });
        this.isLoading = false;
        this.cdr.markForCheck();
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

  openDeleteSessionModal(session: any, event: MouseEvent) {
    event.stopPropagation();
    this.sessionToDelete = session;
    this.showDeleteConfirmModal = true;
    this.cdr.markForCheck();
  }

  openDeleteAllModal() {
    this.showDeleteAllConfirmModal = true;
    this.cdr.markForCheck();
  }

  cancelDelete() {
    this.showDeleteConfirmModal = false;
    this.showDeleteAllConfirmModal = false;
    this.sessionToDelete = null;
    this.cdr.markForCheck();
  }

  confirmDelete() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.showDeleteConfirmModal && this.sessionToDelete) {
      const idsStr = this.sessionToDelete.logIds.join(',');
      this.http.delete(`http://localhost:3001/gemini/history/${idsStr}`, {
        headers: this.getHeaders()
      }).subscribe({
        next: () => {
          this.loadHistory();
          if (this.activeSessionId === this.sessionToDelete.id) {
            this.setDefaultMessage();
          }
          this.cancelDelete();
        },
        error: (err) => {
          console.error('Failed to delete session:', err);
          this.cancelDelete();
        }
      });
    } else if (this.showDeleteAllConfirmModal) {
      this.http.delete('http://localhost:3001/gemini/history', {
        headers: this.getHeaders()
      }).subscribe({
        next: () => {
          this.sessions = [];
          this.setDefaultMessage();
          this.showHistory = false;
          this.cancelDelete();
        },
        error: (err) => {
          console.error('Failed to clear chat history:', err);
          this.cancelDelete();
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
