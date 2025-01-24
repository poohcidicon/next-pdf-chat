import fs from 'fs';
import path from 'path';

interface LogData {
  timestamp: string;
  userPrompt: string;
  conversationHistory: string;
  context: string;
}

export function logConversation(data: LogData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logDir = 'prompt-logs'
  const logFile = path.join(logDir, `log_${timestamp}.txt`);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
}
