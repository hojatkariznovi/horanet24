import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = {
  "Access-Control-Allow-Origin": "https://horanet24.ir",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const origin = req.headers.get("origin");
  if (origin && !["https://horanet24.ir", "https://www.horanet24.ir"].includes(origin)) return reply({ error: "Origin not allowed" }, 403);
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return reply({ error: "ابتدا وارد حساب مدیر شوید." }, 401);

  const userClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return reply({ error: "نشست مدیر معتبر نیست؛ دوباره وارد شوید." }, 401);
  const adminId = authData.user.id;
  const { data: membership, error: memberError } = await admin.from("site_admins").select("user_id").eq("user_id", adminId).maybeSingle();
  if (memberError || !membership) return reply({ error: "دسترسی مدیریت تأیید نشد." }, 403);

  const audit = async (action: string, target: string | null, details: Record<string, unknown> = {}) => {
    const { error } = await admin.from("admin_audit_logs").insert({ admin_id: adminId, action, target_user_id: target, details });
    if (error) console.error("audit insert failed", error.message);
  };

  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "list") {
      const page = Math.max(1, Math.min(100, Number(body.page) || 1));
      const perPage = Math.max(10, Math.min(50, Number(body.perPage) || 20));
      const query = String(body.query || "").trim().toLocaleLowerCase();
      const authUsers: any[] = [];
      const pagesToFetch = query ? 10 : page;
      for (let p = 1; p <= pagesToFetch; p++) {
        const { data, error } = await admin.auth.admin.listUsers({ page: p, perPage: 100 });
        if (error) throw error;
        const batch = data.users || [];
        authUsers.push(...batch);
        if (batch.length < 100) break;
      }
      const ids = authUsers.map(u => u.id);
      const { data: profiles, error: profileError } = ids.length
        ? await admin.from("profiles").select("id,full_name,phone,birth_date,avatar_url,referral_code,referred_by,points_balance,created_at,updated_at,customer_code").in("id", ids)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      let users = authUsers.map(u => {
        const p: any = profileMap.get(u.id) || {};
        const providers = (u.identities || []).map((i: any) => i.provider).filter(Boolean);
        return {
          id: u.id, email: u.email || null, phone: p.phone || u.phone || null,
          full_name: p.full_name || u.user_metadata?.full_name || u.user_metadata?.name || null,
          customer_code: p.customer_code || null, points_balance: p.points_balance || 0,
          referral_code: p.referral_code || null, referred_by: p.referred_by || null,
          birth_date: p.birth_date || null, avatar_url: p.avatar_url || null,
          created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null,
          email_confirmed_at: u.email_confirmed_at || null, phone_confirmed_at: u.phone_confirmed_at || null,
          banned_until: u.banned_until || null, providers,
          is_admin: false
        };
      });
      const { data: admins } = await admin.from("site_admins").select("user_id");
      const adminIds = new Set((admins || []).map((a: any) => a.user_id));
      users = users.map(u => ({ ...u, is_admin: adminIds.has(u.id) }));
      if (query) users = users.filter(u => [u.full_name,u.email,u.phone,u.customer_code,u.referral_code].some(v => String(v || "").toLocaleLowerCase().includes(query)));
      users.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const total = users.length;
      const start = (page - 1) * perPage;
      return reply({ users: users.slice(start, start + perPage), total, page, perPage, scanned: authUsers.length, searchLimited: query && authUsers.length >= 1000 });
    }

    if (action === "detail") {
      const id = String(body.userId || "");
      if (!id) return reply({ error: "شناسه کاربر لازم است." }, 400);
      const [{ data: authResult, error: authErr }, { data: profile, error: profileErr }, { data: notes, error: notesErr }, { data: ledger, error: ledgerErr }, { count: invitedCount }, { count: inviterCount }] = await Promise.all([
        admin.auth.admin.getUserById(id),
        admin.from("profiles").select("*").eq("id", id).maybeSingle(),
        admin.from("admin_customer_notes").select("id,note,admin_id,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(30),
        admin.from("customer_points_ledger").select("id,delta,balance_after,reason,admin_id,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(30),
        admin.from("referrals").select("id", { count: "exact", head: true }).eq("inviter_id", id),
        admin.from("referrals").select("id", { count: "exact", head: true }).eq("invited_user_id", id)
      ]);
      if (authErr) throw authErr;
      if (profileErr || notesErr || ledgerErr) throw profileErr || notesErr || ledgerErr;
      const u = authResult.user;
      return reply({ user: { id: u.id, email: u.email || null, auth_phone: u.phone || null, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null, banned_until: u.banned_until || null, email_confirmed_at: u.email_confirmed_at || null, phone_confirmed_at: u.phone_confirmed_at || null, providers: (u.identities || []).map((i: any) => i.provider) }, profile, notes: notes || [], ledger: ledger || [], invitedCount: invitedCount || 0, inviterCount: inviterCount || 0 });
    }

    if (action === "points") {
      const id = String(body.userId || "");
      const delta = Math.trunc(Number(body.delta));
      const reason = String(body.reason || "").trim();
      if (!id || !Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 100000 || !reason) return reply({ error: "مقدار امتیاز و دلیل معتبر وارد کنید." }, 400);
      const { data: target, error: targetErr } = await admin.auth.admin.getUserById(id);
      if (targetErr || !target.user) return reply({ error: "کاربر پیدا نشد." }, 404);
      const { data: result, error } = await admin.rpc("admin_adjust_customer_points", { p_user_id: id, p_admin_id: adminId, p_delta: delta, p_reason: reason });
      if (error) throw error;
      await audit("points_adjusted", id, { delta, reason, balance_after: result });
      return reply({ ok: true, balance: result });
    }

    if (action === "note") {
      const id = String(body.userId || "");
      const note = String(body.note || "").trim();
      if (!id || note.length < 1 || note.length > 2000) return reply({ error: "یادداشت باید بین ۱ تا ۲۰۰۰ نویسه باشد." }, 400);
      const { error } = await admin.from("admin_customer_notes").insert({ user_id: id, admin_id: adminId, note });
      if (error) throw error;
      await audit("customer_note_added", id, { length: note.length });
      return reply({ ok: true });
    }

    if (action === "ban") {
      const id = String(body.userId || "");
      const blocked = !!body.blocked;
      const reason = String(body.reason || "").trim();
      if (!id || id === adminId) return reply({ error: "امکان مسدودسازی حساب خود مدیر وجود ندارد." }, 400);
      const { data: target, error: targetErr } = await admin.auth.admin.getUserById(id);
      if (targetErr || !target.user) return reply({ error: "کاربر پیدا نشد." }, 404);
      const { data: targetAdmin } = await admin.from("site_admins").select("user_id").eq("user_id", id).maybeSingle();
      if (targetAdmin) return reply({ error: "حساب مدیر از این بخش قابل مسدودسازی نیست." }, 403);
      const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: blocked ? "876000h" : "none" });
      if (error) throw error;
      await audit(blocked ? "customer_blocked" : "customer_unblocked", id, { reason });
      return reply({ ok: true });
    }

    if (action === "profile") {
      const id = String(body.userId || "");
      const full_name = String(body.full_name || "").trim().slice(0, 120);
      const phone = String(body.phone || "").trim().slice(0, 30);
      if (!id || (!full_name && !phone)) return reply({ error: "نام یا شماره معتبر وارد کنید." }, 400);
      const { error } = await admin.from("profiles").update({ full_name: full_name || null, phone: phone || null, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await audit("customer_profile_updated", id, { full_name, phone });
      return reply({ ok: true });
    }

    if (action === "referrals_list") {
      const { data, error } = await admin.from("referrals").select("id,inviter_id,invited_user_id,referral_code,status,created_at,qualified_at,rewarded_at,reward_points,admin_note").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      const ids = [...new Set((data || []).flatMap((x: any) => [x.inviter_id, x.invited_user_id]))];
      const { data: profiles, error: pErr } = ids.length ? await admin.from("profiles").select("id,full_name,customer_code").in("id", ids) : { data: [], error: null };
      if (pErr) throw pErr;
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      const referrals = (data || []).map((x: any) => ({ ...x, inviter_name: (map.get(x.inviter_id) as any)?.full_name || "کاربر", invited_name: (map.get(x.invited_user_id) as any)?.full_name || "کاربر" }));
      return reply({ referrals, total: referrals.length, pending: referrals.filter((x: any) => x.status === "pending").length, qualified: referrals.filter((x: any) => x.status === "qualified").length, rewarded: referrals.filter((x: any) => x.status === "rewarded").length });
    }

    if (action === "referral_status") {
      const id = String(body.referralId || "");
      if (!id || body.status !== "qualified") return reply({ error: "وضعیت درخواستی معتبر نیست." }, 400);
      const { data: row, error: findErr } = await admin.from("referrals").select("id,status,inviter_id").eq("id", id).maybeSingle();
      if (findErr || !row) return reply({ error: "دعوت پیدا نشد." }, 404);
      if (row.status !== "pending") return reply({ error: "فقط دعوت در انتظار بررسی قابل تأیید است." }, 409);
      const { error } = await admin.from("referrals").update({ status: "qualified", qualified_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
      if (error) throw error;
      await audit("referral_qualified", row.inviter_id, { referral_id: id });
      return reply({ ok: true });
    }

    if (action === "referral_reward") {
      const id = String(body.referralId || "");
      const points = Math.trunc(Number(body.points));
      if (!id || !Number.isSafeInteger(points) || points < 1 || points > 100000) return reply({ error: "مقدار پاداش باید بین ۱ تا ۱۰۰٬۰۰۰ امتیاز باشد." }, 400);
      const { data: row, error: findErr } = await admin.from("referrals").select("id,status,inviter_id,invited_user_id").eq("id", id).maybeSingle();
      if (findErr || !row) return reply({ error: "دعوت پیدا نشد." }, 404);
      if (row.status !== "qualified") return reply({ error: "ابتدا دعوت را تأیید کنید." }, 409);
      const { data: balance, error: pointErr } = await admin.rpc("admin_adjust_customer_points", { p_user_id: row.inviter_id, p_admin_id: adminId, p_delta: points, p_reason: "پاداش معرفی دوست · " + id });
      if (pointErr) throw pointErr;
      const { error: updateErr } = await admin.from("referrals").update({ status: "rewarded", reward_points: points, rewarded_at: new Date().toISOString() }).eq("id", id).eq("status", "qualified");
      if (updateErr) throw updateErr;
      await audit("referral_rewarded", row.inviter_id, { referral_id: id, invited_user_id: row.invited_user_id, points, balance_after: balance });
      return reply({ ok: true, balance });
    }

    if (action === "audit") {
      const { data, error } = await admin.from("admin_audit_logs").select("id,admin_id,action,target_user_id,details,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return reply({ logs: data || [] });
    }

    return reply({ error: "درخواست ناشناخته است." }, 400);
  } catch (error) {
    console.error("customer-admin error", error);
    return reply({ error: error instanceof Error ? error.message : "خطای داخلی سرور" }, 500);
  }
});
