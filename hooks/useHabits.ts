"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { HabitRow, HabitQuestionRow, HabitCompletionAnswerRow } from "@/lib/supabase/types";

const HABIT_QUERY_KEY = ["habits"];

export function useHabits(userId?: string, page = 1, limit = 10) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const baseKey = [...HABIT_QUERY_KEY, userId];
  const queryKey = [...baseKey, { page, limit }];

  const habitsQuery = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("habits")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return {
        data: (data ?? []) as HabitRow[],
        count: count ?? 0
      };
    }
  });

  const createHabit = useMutation({
    mutationFn: async (payload: {
      name: string;
      frequency_per_week?: number;
      xp_per_completion?: number;
      questions?: (Omit<HabitQuestionRow, "id" | "habit_id" | "user_id" | "created_at" | "updated_at"> & { id?: string })[]
    }) => {
      if (!userId) throw new Error("Missing user");
      const { data: habitData, error: habitError } = await supabase.from("habits").insert({
        user_id: userId,
        name: payload.name,
        frequency_per_week: payload.frequency_per_week ?? 5,
        xp_per_completion: payload.xp_per_completion ?? 12,
        current_streak: 0,
        longest_streak: 0,
        relapse_count: 0,
        is_active: true
      } as any).select().single();
      if (habitError) throw new Error(habitError.message);

      // Insert questions if provided
      if (payload.questions && habitData) {
        const hasOptional = payload.questions.some(q => q.question_text === "Optional Things");
        const finalQuestions = hasOptional ? payload.questions : [...payload.questions, {
          question_text: "Optional Things",
          answer_type: "text" as const,
          dropdown_options: null,
          display_order: 999
        }];

        const questionsToInsert = finalQuestions.map((q, idx) => ({
          habit_id: (habitData as any).id,
          user_id: userId,
          question_text: q.question_text,
          answer_type: q.answer_type,
          dropdown_options: q.dropdown_options,
          display_order: idx
        }));
        const { error: questionsError } = await supabase.from("habit_questions").insert(questionsToInsert as never);
        if (questionsError) throw new Error(questionsError.message);
      }
    },
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEY });

      // Trigger achievement check for habit creation
      if (userId) {
        const { checkAndUnlockAchievements } = await import("@/lib/engines/achievementEngine");
        checkAndUnlockAchievements(userId).catch(console.error);
      }
    }
  });

  const updateHabit = useMutation({
    mutationFn: async (payload: {
      habitId: string;
      name?: string;
      frequency_per_week?: number;
      xp_per_completion?: number;
      questions?: (Omit<HabitQuestionRow, "id" | "habit_id" | "user_id" | "created_at" | "updated_at"> & { id?: string })[]
    }) => {
      if (!userId) throw new Error("Missing user");

      // Update habit details if provided
      if (payload.name || payload.frequency_per_week !== undefined || payload.xp_per_completion !== undefined) {
        const { error } = await supabase.from("habits").update({
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.frequency_per_week !== undefined ? { frequency_per_week: payload.frequency_per_week } : {}),
          ...(payload.xp_per_completion !== undefined ? { xp_per_completion: payload.xp_per_completion } : {})
        } as never).eq("id", payload.habitId);
        if (error) throw new Error(error.message);
      }

      // Update questions if provided
      if (payload.questions) {
        const hasOptional = payload.questions.some(q => q.question_text === "Optional Things");
        const finalQuestions = hasOptional ? payload.questions : [...payload.questions, {
          question_text: "Optional Things",
          answer_type: "text" as const,
          dropdown_options: null,
          display_order: 999
        }];

        const { data: existingQuestions } = await supabase
          .from("habit_questions")
          .select("id")
          .eq("habit_id", payload.habitId);

        const existingIds = (existingQuestions ?? []).map((q: any) => q.id);
        const newIds = (finalQuestions as any[]).map(q => q.id).filter(Boolean) as string[];

        // Delete questions that are no longer in the list (except Optional Things if it has an id)
        const idsToDelete = existingIds.filter(id => !newIds.includes(id));
        if (idsToDelete.length > 0) {
          await supabase.from("habit_questions").delete().in("id", idsToDelete);
        }

        // Upsert new/updated questions
        if (finalQuestions.length > 0) {
          const questionsToUpsert = (finalQuestions as any[]).map((q, idx) => ({
            ...(q.id ? { id: q.id } : {}),
            habit_id: payload.habitId,
            user_id: userId,
            question_text: q.question_text,
            answer_type: q.answer_type,
            dropdown_options: q.dropdown_options,
            display_order: idx
          }));
          const { error: questionsError } = await supabase.from("habit_questions").upsert(questionsToUpsert as never);
          if (questionsError) throw new Error(questionsError.message);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEY });
    }
  });

  const deleteHabit = useMutation({
    mutationFn: async (habitId: string) => {
      // Delete associated XP events first
      await supabase.from("xp_events").delete().eq("source_id", habitId);

      // Delete the habit (this cascades to questions, answers, and relapses)
      const { error } = await supabase.from("habits").delete().eq("id", habitId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEY });
      // Invalidate XP summary as events were removed
      void queryClient.invalidateQueries({ queryKey: ["xp-summary"] });
    }
  });

  const completeHabit = useMutation({
    mutationFn: async (payload: { habit: HabitRow; answers?: { questionId: string; value: string }[] }) => {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("habits")
        .update({
          last_completed_on: today,
          current_streak: payload.habit.current_streak + 1,
          longest_streak: Math.max(payload.habit.longest_streak, payload.habit.current_streak + 1)
        } as never)
        .eq("id", payload.habit.id);
      if (error) throw new Error(error.message);

      // Save answers if provided
      if (payload.answers && payload.answers.length > 0 && userId) {
        const answersToInsert = payload.answers.map(a => ({
          habit_id: payload.habit.id,
          question_id: a.questionId,
          user_id: userId,
          completion_date: today,
          answer_value: a.value
        }));
        const { error: answersError } = await supabase.from("habit_completion_answers").insert(answersToInsert as never);
        if (answersError) throw new Error(answersError.message);
      }
    },
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: HABIT_QUERY_KEY });

      // Trigger achievement check
      if (userId) {
        const { checkAndUnlockAchievements } = await import("@/lib/engines/achievementEngine");
        checkAndUnlockAchievements(userId).catch(console.error);
      }
    }
  });

  const getHabitQuestions = async (habitId: string): Promise<HabitQuestionRow[]> => {
    const { data, error } = await supabase
      .from("habit_questions")
      .select("*")
      .eq("habit_id", habitId)
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as HabitQuestionRow[];
  };

  return { habitsQuery, createHabit, updateHabit, deleteHabit, completeHabit, getHabitQuestions };
}
