-- New exercise types for more varied lessons.
alter table exercises drop constraint if exists exercises_type_check;
alter table exercises add constraint exercises_type_check
  check (type in ('choice', 'order', 'match', 'truefalse', 'fill'));

-- Questions people ask the AI, kept so scholars can review the answers.
create table questions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  question text not null,
  answer text,
  created_at timestamptz not null default now()
);
alter table questions enable row level security;
create policy "read own questions" on questions for select using (auth.uid() = user_id);
