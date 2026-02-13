
export enum QuestionType {
  CLASS_EXAMPLE = 'CLASS_EXAMPLE',
  WRONG_QUESTION = 'WRONG_QUESTION',
}

export enum Subject {
  MATH = '数学',
  PHYSICS = '物理',
  CHEMISTRY = '化学',
  ENGLISH = '英语',
  OTHER = '其他',
}

export interface ReviewLog {
  timestamp: number;
  count: number;
  subject: string;
}

export interface DailyReflection {
  date: string; // 格式: YYYY-MM-DD
  content: string;
}

export interface Question {
  id: string;
  content: string; 
  answer: string;
  analysis?: string;
  type: QuestionType;
  subject: Subject;
  source: string;
  tags: string[];
  createdAt: number;
  
  // Ebbinghaus / Spaced Repetition Data
  reviewCount: number;
  lastReviewDate: number;
  nextReviewDate: number;
  masteryLevel: number; 
  isMastered: boolean;
  ef?: number;
  image?: string;
  ansImage?: string;

  // New field to track transformation
  isFromExample?: boolean;
}

export interface ReviewStats {
  totalQuestions: number;
  masteredCount: number;
  todayReviewCount: number;
  streakDays: number;
}
