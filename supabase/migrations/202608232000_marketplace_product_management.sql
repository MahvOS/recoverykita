-- RecoveryKita marketplace product management
-- Adds stock and is_active columns to products for admin stock management,
-- and provisions a public "products" storage bucket for product thumbnails.
-- Run in Supabase SQL Editor once. Safe to re-run (idempotent).

-- Add stock column (available inventory units, default 0)
alter table public.products add column if not exists stock bigint not null default 0;

-- Add is_active column (controls whether product is visible in marketplace)
alter table public.products add column if not exists is_active boolean not null default true;

-- Track last update timestamp
alter table public.products add column if not exists updated_at timestamp with time zone;

-- Backfill updated_at for existing rows that have no value
update public.products set updated_at = now() where updated_at is null;

-- Storage bucket for product thumbnails / gallery images
insert into storage.buckets (id, name, public) values
  ('products', 'products', true)
on conflict (id) do nothing;

-- Allow authenticated users (admins via profiles.is_admin) to read product thumbnails
create policy "Authenticated users can read products bucket"
  on storage.objects
  for select
  using (bucket_id = 'products');

create policy "Admins can upload to products bucket"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

create policy "Admins can update products bucket"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  )
  with check (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );

create policy "Admins can delete from products bucket"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin
    )
  );
