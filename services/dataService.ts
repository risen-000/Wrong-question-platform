import { supabase } from './supabaseClient';
import { Question, ReviewLog } from '../types';

// ==================== 工具函数 ====================

function questionToRow(q: Partial<Question>): Record<string, any> {
    // RLS 会自动处理 user_id，不需要在前端显式传递（除非有特殊需求）
    // Supabase 的 auth.uid() 会在数据库层被引用
    const row: Record<string, any> = {};
    if (q.id !== undefined) row.id = q.id;
    if (q.content !== undefined) row.content = q.content;
    if (q.answer !== undefined) row.answer = q.answer;
    if (q.analysis !== undefined) row.analysis = q.analysis;
    if (q.type !== undefined) row.type = q.type;
    if (q.subject !== undefined) row.subject = q.subject;
    if (q.source !== undefined) row.source = q.source;
    if (q.tags !== undefined) row.tags = q.tags;
    if (q.createdAt !== undefined) row.created_at = q.createdAt;
    if (q.reviewCount !== undefined) row.review_count = q.reviewCount;
    if (q.lastReviewDate !== undefined) row.last_review_date = q.lastReviewDate;
    if (q.nextReviewDate !== undefined) row.next_review_date = q.nextReviewDate;
    if (q.masteryLevel !== undefined) row.mastery_level = q.masteryLevel;
    if (q.isMastered !== undefined) row.is_mastered = q.isMastered;
    if (q.ef !== undefined) row.ef = q.ef;
    if (q.image !== undefined) row.image = q.image;
    if (q.ansImage !== undefined) row.ans_image = q.ansImage;
    if (q.isFromExample !== undefined) row.is_from_example = q.isFromExample;
    return row;
}

function rowToQuestion(row: any): Question {
    return {
        id: row.id,
        content: row.content,
        answer: row.answer,
        analysis: row.analysis,
        type: row.type,
        subject: row.subject,
        source: row.source,
        tags: row.tags || [],
        createdAt: row.created_at,
        reviewCount: row.review_count,
        lastReviewDate: row.last_review_date,
        nextReviewDate: row.next_review_date,
        masteryLevel: row.mastery_level,
        isMastered: row.is_mastered,
        ef: row.ef,
        image: row.image,
        ansImage: row.ans_image,
        isFromExample: row.is_from_example,
    };
}

function rowToReviewLog(row: any): ReviewLog {
    return {
        timestamp: row.timestamp,
        count: row.count,
        subject: row.subject,
    };
}

// ==================== Questions ====================

export async function fetchQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取题目失败:', error);
        return [];
    }
    return (data || []).map(rowToQuestion);
}

export async function addQuestion(question: Question): Promise<boolean> {
    // 插入时，RLS policy (default auth.uid()) 会自动填充 user_id
    const row = questionToRow(question);

    // 显式去除非数据库字段（如果有），或者依赖 supabase 忽略多余字段
    // 确保 user_id 不被手动篡改（虽然 RLS 会拦截，但最佳实践是不传）

    const { error } = await supabase
        .from('questions')
        .insert(row);

    if (error) {
        console.error('添加题目失败:', error);
        return false;
    }
    return true;
}

export async function updateQuestion(question: Question): Promise<boolean> {
    const row = questionToRow(question);
    const { error } = await supabase
        .from('questions')
        .update(row)
        .eq('id', question.id);

    if (error) {
        console.error('更新题目失败:', error);
        return false;
    }
    return true;
}

export async function updateQuestions(questions: Question[]): Promise<boolean> {
    const rows = questions.map(q => questionToRow(q));
    const { error } = await supabase
        .from('questions')
        .upsert(rows, { onConflict: 'id' });

    if (error) {
        console.error('批量更新题目失败:', error);
        return false;
    }
    return true;
}

export async function deleteQuestion(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('删除题目失败:', error);
        return false;
    }
    return true;
}

// ==================== ReviewLogs ====================

export async function fetchReviewLogs(): Promise<ReviewLog[]> {
    const { data, error } = await supabase
        .from('review_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

    if (error) {
        console.error('获取复习记录失败:', error);
        return [];
    }
    return (data || []).map(rowToReviewLog);
}

export async function addReviewLog(log: ReviewLog): Promise<boolean> {
    const { error } = await supabase
        .from('review_logs')
        .insert({
            timestamp: log.timestamp,
            count: log.count,
            subject: log.subject,
        });

    if (error) {
        console.error('添加复习记录失败:', error);
        return false;
    }
    return true;
}

// ==================== Reflections ====================

export async function fetchReflections(): Promise<Record<string, string>> {
    const { data, error } = await supabase
        .from('reflections')
        .select('*');

    if (error) {
        console.error('获取心得失败:', error);
        return {};
    }

    const result: Record<string, string> = {};
    (data || []).forEach((row: any) => {
        result[row.date] = row.content;
    });
    return result;
}

export async function upsertReflection(date: string, content: string): Promise<boolean> {
    const { error } = await supabase
        .from('reflections')
        .upsert({ date, content }, { onConflict: 'date' }); // 注意：这里可能需要唯一索引配合 RLS，如果是多用户，onConflict date 只对当前用户生效吗？
    // Postgres upsert on conflict 依赖 unique constraint。
    // 如果 reflections 表的 date 是 primary key，那它是全局唯一的。
    // 多用户情况下，Primary Key 应该是 (user_id, date)。
    // TODO: 提醒用户在数据库中修改 reflections 表的主键为 (user_id, date) 或者是 UUID id。
    // 现在的 schema.sql 中 reflections date 是 PRIMARY KEY，这意味着不同用户不能有同一天的心得。
    // 这是一个 schema bug，需要在 auth_policy.sql 修复。

    if (error) {
        console.error('保存心得失败:', error);
        return false;
    }
    return true;
}
