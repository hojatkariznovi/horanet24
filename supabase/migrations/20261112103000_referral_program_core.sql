create extension if not exists pgcrypto;

create or replace function public.ensure_profile_referral_code()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.referral_code is null or length(trim(new.referral_code)) < 6 then
    loop
      new.referral_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));
      exit when not exists (select 1 from public.profiles p where p.referral_code = new.referral_code and p.id <> new.id);
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_referral_code_before_write on public.profiles;
create trigger profiles_referral_code_before_write before insert or update of referral_code on public.profiles for each row execute function public.ensure_profile_referral_code();
update public.profiles set referral_code = upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10)) where referral_code is null or length(trim(referral_code)) < 6;

alter table public.referrals add column if not exists qualified_at timestamptz, add column if not exists rewarded_at timestamptz, add column if not exists reward_points integer not null default 0 check (reward_points >= 0), add column if not exists admin_note text;
create index if not exists referrals_inviter_created_idx on public.referrals(inviter_id, created_at desc);
create index if not exists referrals_status_created_idx on public.referrals(status, created_at desc);
alter table public.referrals enable row level security;
drop policy if exists "user read own referrals" on public.referrals;
create policy "user read own referrals" on public.referrals for select to authenticated using (inviter_id = (select auth.uid()) or invited_user_id = (select auth.uid()));
revoke insert, update, delete on public.referrals from anon, authenticated;
grant select on public.referrals to authenticated;

create or replace function public.apply_referral_code(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_inviter uuid; v_existing uuid; v_code text := upper(trim(coalesce(p_code, '')));
begin
  if v_user is null then raise exception 'برای ثبت دعوت ابتدا وارد حساب شوید'; end if;
  if length(v_code) < 6 or length(v_code) > 20 then raise exception 'کد دعوت معتبر نیست'; end if;
  select referred_by into v_existing from public.profiles where id = v_user for update;
  if not found then raise exception 'پروفایل کاربر هنوز آماده نیست'; end if;
  if v_existing is not null then return jsonb_build_object('ok', false, 'reason', 'already_applied'); end if;
  select id into v_inviter from public.profiles where referral_code = v_code and id <> v_user limit 1;
  if v_inviter is null then raise exception 'کد دعوت پیدا نشد یا متعلق به خودتان است'; end if;
  update public.profiles set referred_by = v_inviter, updated_at = now() where id = v_user and referred_by is null;
  if not found then return jsonb_build_object('ok', false, 'reason', 'already_applied'); end if;
  insert into public.referrals(inviter_id, invited_user_id, referral_code, status) values (v_inviter, v_user, v_code, 'pending') on conflict (invited_user_id) do nothing;
  return jsonb_build_object('ok', true, 'status', 'pending');
end;
$$;
revoke all on function public.apply_referral_code(text) from public, anon;
grant execute on function public.apply_referral_code(text) to authenticated;
