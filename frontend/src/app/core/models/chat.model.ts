export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isThinking?: boolean; // เอาไว้โชว์สถานะ "AI กำลังพิมพ์..."
}
