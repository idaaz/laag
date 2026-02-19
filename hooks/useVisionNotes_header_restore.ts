import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
    VisionHorizon,
    VisionNoteRow,
    VisionNoteType,
    VisionPillar
} from "@/lib/supabase/types";

const VISION_NOTES_QUERY_KEY = "vision-notes";

export type VisionNoteDraft = {
    title: string;
    body: string;
    note_type: VisionNoteType;
    vision_pillar: VisionPillar;
    horizon: VisionHorizon;
    impact_score: number;
    effort_score: number;
    tags: string[];
    review_date: string | null;
    pinned: boolean;
};

export type VisionNoteUpdate = Partial<Omit<VisionNoteDraft, "tags">> & {
    tags?: string[];
    archived?: boolean;
    archived_at?: string | null;
};
