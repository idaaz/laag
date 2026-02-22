export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type ScreenLogSource = "manual" | "extension";
export type TimerSessionType =
  | "pomodoro"
  | "short_break"
  | "long_break"
  | "deep_work";
export type NotificationType =
  | "task_deadline"
  | "habit_reminder"
  | "streak_warning"
  | "daily_log_reminder"
  | "relapse_alert";
export type NotificationTone = "motivational" | "brutal" | "mother";
export type UnlockType = "theme" | "title" | "sound";
export type VisionNoteType =
  | "thought"
  | "idea"
  | "decision"
  | "risk"
  | "question"
  | "milestone"
  | "insight"
  | "information"
  | "secret";
export type VisionPillar =
  | "product"
  | "growth"
  | "discipline"
  | "health"
  | "relationships"
  | "learning"
  | "operations";
export type VisionHorizon = "today" | "this_week" | "this_month" | "quarter" | "long_term";

export interface TableShape<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
}

export type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  truth_mode_count: number;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline_at: string | null;
  completed_at: string | null;
  xp_base: number;
  xp_bonus: number;
  xp_awarded: number;
  is_flagged: boolean;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  frequency_per_week: number;
  xp_per_completion: number;
  current_streak: number;
  longest_streak: number;
  last_completed_on: string | null;
  relapse_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HabitQuestionRow = {
  id: string;
  habit_id: string;
  user_id: string;
  question_text: string;
  answer_type:
  | "text"
  | "number"
  | "percentage"
  | "link"
  | "clock_timer"
  | "counting_timer"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "file"
  | "listing";
  dropdown_options: string[] | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type HabitCompletionAnswerRow = {
  id: string;
  habit_id: string;
  question_id: string;
  user_id: string;
  completion_date: string;
  answer_value: string;
  created_at: string;
};

export type VisitedUrlRow = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  visited_at: string;
  created_at: string;
};

export type DailyLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  study_minutes: number;
  workout_minutes: number;
  sleep_hours: number;
  screen_minutes: number;
  mood: number;
  productivity: number;
  daily_log_completion: number;
  journal_ciphertext: string | null;
  journal_iv: string | null;
  journal_salt: string | null;
  retro_edit_flag: boolean;
  edit_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type RelapseLogRow = {
  id: string;
  user_id: string;
  habit_id: string | null;
  relapse_at: string;
  severity: number;
  trigger: string | null;
  notes: string | null;
  created_at: string;
};

export type ScreenLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  source: ScreenLogSource;
  minutes: number;
  created_at: string;
};

export type TimerRow = {
  id: string;
  user_id: string;
  session_type: TimerSessionType;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  completed: boolean;
  interruptions: number;
  xp_awarded: number;
  created_at: string;
};

export type XPEventRow = {
  id: string;
  user_id: string;
  source_type: string;
  source_id: string | null;
  delta_xp: number;
  reason: string | null;
  capped: boolean;
  decay_applied: boolean;
  tone_used: NotificationTone | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  tone: NotificationTone;
  title: string;
  body: string;
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  escalation_level: number;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
};

export type AchievementRow = {
  id: string;
  user_id: string;
  code: string;
  title: string;
  description: string;
  unlocked_at: string;
  meta: Json;
};

export type AchievementCategory = 'tasks' | 'habits' | 'productivity' | 'analytics' | 'wellness' | 'social' | 'milestones' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AchievementDefinitionRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon_name: string;
  unlock_condition: Json;
  xp_reward: number;
  is_hidden: boolean;
  is_repeatable: boolean;
  display_order: number;
  created_at: string;
};

export type AchievementProgressRow = {
  id: string;
  user_id: string;
  achievement_code: string;
  current_value: number;
  target_value: number;
  last_updated: string;
};

export type SettingsRow = {
  id: string;
  user_id: string;
  xp_rules: Json;
  discipline_rules: Json;
  notification_prefs: Json;
  lock_mode: Json;
  brutal_truth_mode: boolean;
  recovery_threshold: number;
  strictness_profile: Json;
  created_at: string;
  updated_at: string;
};

export type ThemeRow = {
  id: string;
  user_id: string;
  theme_key: string;
  name: string;
  palette: Json;
  is_active: boolean;
  created_at: string;
};

export type UnlockRow = {
  id: string;
  user_id: string;
  unlock_type: UnlockType;
  unlock_key: string;
  unlocked_at: string;
};

export type DisciplineSnapshotRow = {
  id: string;
  user_id: string;
  snapshot_date: string;
  score: number;
  completed_tasks: number;
  total_tasks: number;
  habit_consistency: number;
  daily_log_completion: number;
  burnout_index: number;
  overconfidence_index: number;
  created_at: string;
};

export type AnalyticsCacheRow = {
  id: string;
  user_id: string;
  metric_key: string;
  period_start: string;
  period_end: string;
  payload: Json;
  generated_at: string;
  expires_at: string;
  cache_version: number;
};

export type TimeBlockRow = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  activity: string;
  category: "Deep Work" | "Education" | "Skill" | "Health" | "Entertainment" | "Break" | "Wasted" | "Musical Work" | "Daily Work";
  is_planned: boolean;
  energy_level: number;
  output_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VisionNoteRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  note_type: VisionNoteType;
  horizon: VisionHorizon;
  impact_score: number;
  effort_score: number;
  tags: string[];
  review_date: string | null;
  pinned: boolean;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  attachments: Json;
};

export type AppNotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Json;
  is_read: boolean;
  created_at: string;
};

type InsertWithoutGenerated<T> = Omit<T, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      users: TableShape<UserRow, InsertWithoutGenerated<UserRow>, Partial<UserRow>>;
      tasks: TableShape<TaskRow, InsertWithoutGenerated<TaskRow>, Partial<TaskRow>>;
      habits: TableShape<HabitRow, InsertWithoutGenerated<HabitRow>, Partial<HabitRow>>;
      habit_questions: TableShape<
        HabitQuestionRow,
        InsertWithoutGenerated<HabitQuestionRow>,
        Partial<HabitQuestionRow>
      >;
      habit_completion_answers: TableShape<
        HabitCompletionAnswerRow,
        InsertWithoutGenerated<HabitCompletionAnswerRow>,
        Partial<HabitCompletionAnswerRow>
      >;
      daily_logs: TableShape<
        DailyLogRow,
        InsertWithoutGenerated<DailyLogRow>,
        Partial<DailyLogRow>
      >;
      relapse_logs: TableShape<
        RelapseLogRow,
        InsertWithoutGenerated<RelapseLogRow>,
        Partial<RelapseLogRow>
      >;
      screen_logs: TableShape<
        ScreenLogRow,
        InsertWithoutGenerated<ScreenLogRow>,
        Partial<ScreenLogRow>
      >;
      timers: TableShape<TimerRow, InsertWithoutGenerated<TimerRow>, Partial<TimerRow>>;
      xp_events: TableShape<XPEventRow, InsertWithoutGenerated<XPEventRow>, Partial<XPEventRow>>;
      notifications: TableShape<
        NotificationRow,
        InsertWithoutGenerated<NotificationRow>,
        Partial<NotificationRow>
      >;
      achievements: TableShape<
        AchievementRow,
        InsertWithoutGenerated<AchievementRow>,
        Partial<AchievementRow>
      >;
      settings: TableShape<
        SettingsRow,
        InsertWithoutGenerated<SettingsRow>,
        Partial<SettingsRow>
      >;
      themes: TableShape<ThemeRow, InsertWithoutGenerated<ThemeRow>, Partial<ThemeRow>>;
      unlocks: TableShape<UnlockRow, InsertWithoutGenerated<UnlockRow>, Partial<UnlockRow>>;
      discipline_snapshots: TableShape<
        DisciplineSnapshotRow,
        InsertWithoutGenerated<DisciplineSnapshotRow>,
        Partial<DisciplineSnapshotRow>
      >;
      analytics_cache: TableShape<
        AnalyticsCacheRow,
        InsertWithoutGenerated<AnalyticsCacheRow>,
        Partial<AnalyticsCacheRow>
      >;
      time_blocks: TableShape<
        TimeBlockRow,
        InsertWithoutGenerated<TimeBlockRow>,
        Partial<TimeBlockRow>
      >;
      visited_urls: TableShape<
        VisitedUrlRow,
        InsertWithoutGenerated<VisitedUrlRow>,
        Partial<VisitedUrlRow>
      >;
      vision_notes: TableShape<
        VisionNoteRow,
        InsertWithoutGenerated<VisionNoteRow>,
        Partial<VisionNoteRow>
      >;
      app_notifications: TableShape<
        AppNotificationRow,
        InsertWithoutGenerated<AppNotificationRow>,
        Partial<AppNotificationRow>
      >;
    };
    Enums: {
      task_priority: TaskPriority;
      task_status: TaskStatus;
      screen_log_source: ScreenLogSource;
      timer_session_type: TimerSessionType;
      notification_type: NotificationType;
      notification_tone: NotificationTone;
      unlock_type: UnlockType;
    };
    Functions: {
      get_tracking_analytics: {
        Args: {
          p_user_id: string;
          p_start_date: string;
        };
        Returns: Json;
      };
    };
  };
};

export type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
