create unique index if not exists profiles_customer_code_uidx on public.profiles(customer_code);

create or replace function public.keep_customer_code_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.customer_code is distinct from old.customer_code then
    new.customer_code := old.customer_code;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_customer_code_immutable on public.profiles;
create trigger profiles_customer_code_immutable
before update of customer_code on public.profiles
for each row execute function public.keep_customer_code_immutable();