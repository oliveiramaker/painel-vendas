alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email,
    updated_at = now()
from auth.users u
where u.id = p.id and (p.email is null or p.email <> u.email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'kiwify',
  provider_customer_id text,
  provider_subscription_id text,
  provider_product_id text,
  plan text not null default 'premium' check (plan in ('free','premium')),
  status text not null default 'pending',
  buyer_email text,
  current_period_end timestamptz,
  last_event text,
  last_event_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_provider_subscription_id_idx on public.subscriptions(provider_subscription_id);
create index if not exists subscriptions_buyer_email_idx on public.subscriptions(lower(buyer_email));

alter table public.subscriptions enable row level security;
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription" on public.subscriptions
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.touch_subscription_updated_at()
returns trigger language plpgsql security invoker as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at before update on public.subscriptions for each row execute function public.touch_subscription_updated_at();

revoke execute on function public.handle_new_user() from anon, authenticated;