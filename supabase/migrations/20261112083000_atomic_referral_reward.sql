create or replace function public.admin_process_referral_reward(p_referral_id uuid,p_admin_id uuid,p_points integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_inviter uuid; v_status text; v_balance integer;
begin
  if p_points is null or p_points < 1 or p_points > 100000 then raise exception 'مقدار پاداش معتبر نیست'; end if;
  if not exists(select 1 from public.site_admins where user_id = p_admin_id) then raise exception 'دسترسی مدیر تأیید نشد'; end if;
  select inviter_id,status into v_inviter,v_status from public.referrals where id = p_referral_id for update;
  if not found then raise exception 'دعوت پیدا نشد'; end if;
  if v_status <> 'qualified' then raise exception 'این دعوت هنوز تأیید نشده یا قبلاً پاداش گرفته است'; end if;
  select public.admin_adjust_customer_points(v_inviter,p_admin_id,p_points,'پاداش معرفی دوست · '||p_referral_id::text) into v_balance;
  update public.referrals set status='rewarded',reward_points=p_points,rewarded_at=now() where id=p_referral_id;
  insert into public.admin_audit_logs(admin_id,action,target_user_id,details) values(p_admin_id,'referral_rewarded',v_inviter,jsonb_build_object('referral_id',p_referral_id,'points',p_points,'balance_after',v_balance));
  return jsonb_build_object('ok',true,'balance',v_balance);
end;
$$;
revoke all on function public.admin_process_referral_reward(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.admin_process_referral_reward(uuid,uuid,integer) to service_role;