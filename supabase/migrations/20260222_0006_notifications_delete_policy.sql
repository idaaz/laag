-- Migration to allow deleting app notifications
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'app_notifications' 
        AND policyname = 'Users can delete their own notifications'
    ) THEN
        CREATE POLICY "Users can delete their own notifications" ON public.app_notifications
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
