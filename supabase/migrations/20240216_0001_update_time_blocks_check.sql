-- Update time_blocks category check constraint to match frontend definitions
-- Categories from TimeBlockLogger.tsx: 
-- Deep Work, Education, Skill, Musical Work, Daily Work, Health, Entertainment, Break, Wasted

do $$
begin
  -- Drop the old constraint if it exists (name might vary, but 'time_blocks_category_check' is standard)
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'time_blocks_category_check'
    and table_name = 'time_blocks'
  ) then
    alter table public.time_blocks drop constraint time_blocks_category_check;
  end if;

  -- Add the new constraint with updated categories
  alter table public.time_blocks 
    add constraint time_blocks_category_check 
    check (category in (
      'Deep Work', 
      'Education', 
      'Skill', 
      'Musical Work', 
      'Daily Work', 
      'Health', 
      'Entertainment', 
      'Break', 
      'Wasted'
    ));

end $$;
