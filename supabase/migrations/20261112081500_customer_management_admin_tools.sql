create table if not exists public.admin_customer_notes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 admin_id uuid not null references auth.users(id), note text not null check (char_length(note) between 1 and 2000), created_at timestamptz not null default now()
);
create index if not exists admin_customer_notes_user_created_idx on public.admin_customer_notes(user_id,created_at desc);
alter table public.admin_customer_notes enable row level security;
revoke all on public.admin_customer_notes from anon, authenticated;
grant all on public.admin_customer_notes to service_role;

create table if not exists public.customer_points_ledger (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 admin_id uuid not null references auth.users(id), delta integer not null check (delta <> 0),
 balance_after integer not null check (balance_after >= 0), reason text not null check (char_length(reason) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists customer_points_ledger_user_created_idx on public.customer_points_ledger(user_id,created_at desc);
alter table public.customer_points_ledger enable row level security;
revoke all on public.customer_points_ledger from anon, authenticated;
grant all on public.customer_points_ledger to service_role;

create table if not exists public.admin_audit_logs (
 id bigint generated always as identity primary key, admin_id uuid not null references auth.users(id),
 action text not null, target_user_id uuid references auth.users(id) on delete set null,
 details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);
alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from anon, authenticated;
grant all on public.admin_audit_logs to service_role;

create or replace function public.admin_adjust_customer_points(p_user_id uuid,p_admin_id uuid,p_delta integer,p_reason text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_balance integer;
begin
 if p_delta = 0 or p_reason is null or length(trim(p_reason)) < 1 or length(p_reason) > 500 then raise exception 'مقدار امتیاز یا دلیل معتبر نیست'; end if;
 update public.profiles set points_balance = points_balance + p_delta, updated_at = now()
 where id = p_user_id and points_balance + p_delta >= 0 returning points_balance into v_balance;
 if v_balance is null then raise exception 'کاربر یافت نشد یا موجودی امتیاز برای کسر کافی نیست'; end if;
 insert into public.customer_points_ledger(user_id,admin_id,delta,balance_after,reason) values(p_user_id,p_admin_id,p_delta,v_balance,trim(p_reason));
 return v_balance;
end; $$;
revoke all on function public.admin_adjust_customer_points(uuid,uuid,integer,text) from public, anon, authenticated;
grant execute on function public.admin_adjust_customer_points(uuid,uuid,integer,text) to service_role;
