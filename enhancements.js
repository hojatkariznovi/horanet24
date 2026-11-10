(() => {
 const dbUrl="https://iqrgqkluuhbyphtihsls.supabase.co";
 const dbKey="sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
 const bot="https://eitaa.com/huranet24_app";
 const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 let slides=[],index=0,timer=null;
 const $=id=>document.getElementById(id);
 function paint(){
  const root=$("heroSlides"),dots=$("heroDots");if(!root||!slides.length)return;
  root.innerHTML=slides.map((s,i)=>'<article class="hero-slide '+(i===index?"active":"")+'" '+(s.image_url?'style="background-image:linear-gradient(90deg,#102c43ed,#153f56a8),url('+esc(s.image_url)+');background-size:cover;background-position:center"':"")+'><div class="hero-slide-copy"><span class="hero-kicker">'+esc(s.eyebrow||"اطلاعیه حورانت۲۴")+'</span>'+(s.badge_label?'<span class="hero-pill">'+esc(s.badge_label)+'</span>':"")+'<h2>'+esc(s.title)+'</h2><p>'+esc(s.description||"برای دریافت جزئیات و راهنمایی، از مسیر رسمی حورانت۲۴ اقدام کن.")+'</p><a class="hero-slide-cta" href="'+esc(s.button_url||bot)+'" target="_blank" rel="noopener">'+esc(s.button_text||"مشاهده جزئیات")+' <i data-lucide="arrow-up-left"></i></a></div><div class="hero-slide-art"><span class="hero-art-orbit"></span><span class="hero-art-icon"><i data-lucide="bell-ring"></i></span><span class="hero-art-chip">HORANET24</span></div></article>').join("");
  dots.innerHTML=slides.map((_,i)=>'<button type="button" class="hero-dot '+(i===index?"active":"")+'" data-slide="'+i+'" aria-label="رفتن به اسلاید '+(i+1)+'"></button>').join("");
  dots.querySelectorAll("[data-slide]").forEach(b=>b.addEventListener("click",()=>go(Number(b.dataset.slide))));
  window.lucide?.createIcons?.({attrs:{"stroke-width":1.8}});
 }
 function go(n){if(!slides.length)return;index=(n+slides.length)%slides.length;paint();restart();}
 function restart(){clearInterval(timer);if(slides.length>1)timer=setInterval(()=>go(index+1),5000);}
 async function load(){
  if(!window.supabase?.createClient)return;
  const db=window.supabase.createClient(dbUrl,dbKey);
  const [sr,settings]=await Promise.all([
   db.from("hero_slides").select("eyebrow,title,description,badge_label,button_text,button_url,image_url,sort_order").eq("is_active",true).order("sort_order"),
   db.from("site_settings").select("setting_value").eq("setting_key","premium_channel").maybeSingle()
  ]);
  if(!sr.error&&sr.data?.length){slides=sr.data;index=0;paint();restart();}
  const cfg=settings.data?.setting_value||{};
  const link=$("premiumChannelLink");
  if(link){link.href=cfg.url||bot;link.textContent=cfg.url?"ورود به کانال ویژه":"دریافت شرایط عضویت";link.addEventListener("click",e=>{if(!cfg.url){e.preventDefault();window.open(bot,"_blank","noopener");}});}
 }
 document.addEventListener("DOMContentLoaded",load);
 $("heroPrev")?.addEventListener("click",()=>go(index-1));
 $("heroNext")?.addEventListener("click",()=>go(index+1));
 document.addEventListener("visibilitychange",()=>{if(document.hidden)clearInterval(timer);else restart();});
})();