-- Migration: Add habit questions and completion answers tables

-- Create habit_questions table
CREATE TABLE IF NOT EXISTS habit_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('number', 'text', 'dropdown', 'percentage')),
  dropdown_options JSONB NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create habit_completion_answers table
CREATE TABLE IF NOT EXISTS habit_completion_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES habit_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  answer_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_habit_questions_habit_id ON habit_questions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_questions_user_id ON habit_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completion_answers_habit_id ON habit_completion_answers(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completion_answers_user_id ON habit_completion_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completion_answers_completion_date ON habit_completion_answers(completion_date);

-- Enable RLS (Row Level Security)
ALTER TABLE habit_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completion_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habit_questions
CREATE POLICY "Users can view their own habit questions"
  ON habit_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit questions"
  ON habit_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit questions"
  ON habit_questions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit questions"
  ON habit_questions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for habit_completion_answers
CREATE POLICY "Users can view their own habit completion answers"
  ON habit_completion_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit completion answers"
  ON habit_completion_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit completion answers"
  ON habit_completion_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completion answers"
  ON habit_completion_answers FOR DELETE
  USING (auth.uid() = user_id);
