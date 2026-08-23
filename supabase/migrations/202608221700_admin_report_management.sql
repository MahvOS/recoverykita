-- RecoveryKita admin access for report management
-- Run in Supabase SQL Editor once. Existing report submission remains user-owned.
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.report_logs enable row level security;

drop policy if exists "Admins can read all report logs" on public.report_logs;
create policy "Admins can read all report logs" on public.report_logs for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "Admins can update report logs" on public.report_logs;
create policy "Admins can update report logs" on public.report_logs for update to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "Users can create own report logs" on public.report_logs;
create policy "Users can create own report logs" on public.report_logs for insert to authenticated with check (user_id = auth.uid());

-- Promote an account manually after reviewing it:
-- update public.profiles set is_admin = true where id = '<auth-user-uuid>';
