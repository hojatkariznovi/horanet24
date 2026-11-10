(() => {
 const bot="https://eitaa.com/huranet24_app", $=id=>document.getElementById(id);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let slides=[],index=0,timer=null,initialized=false;
 const safeLink=value=>{try{const u=new URL(value||bot,location.origin);return /^https?:$/.test(u.protocol)?u.href:bot;}catch{return bot;}};
 function paint(){
  const root=$("heroSlides"),dots=$("heroDots"),arrows=document.querySelector(".hero-arrows");
  if(!root||!dots)return;
  if(!slides.length){root.innerHTML='<div class="hero-slide active"><div class="hero-slide-copy"><span class="hero-kicker">حورانت۲۴</span><h2>همراه دیجیتال شما</h2><p>اطلاعیه‌ها و خدمات تازه را از اینجا دنبال کنید.</p></div></div>';dots.innerHTML="";if(arrows)arrows.hidden=true;return;}
  root.innerHTML=slides.map((s,i)=>{
   const image=i===index&&s.image_url?'style="background-image:linear-gradient(90deg,#102c43ed,#153f56a8),url(\''+esc(safeLink(s.image_url))+'\');background-size:cover;background-position:center"':"";
   return '<article class="hero-slide '+(i===index?"active":"")+'" '+image+'><div class="hero-slide-copy"><span class="hero-kicker">'+esc(s.eyebrow||"اطلاعیه حورانت۲۴")+'</span>'+(s.badge_label?'<span class="hero-pill">'+esc(s.badge_label)+'</span>':"")+'<h2>'+esc(s.title)+'</h2><p>'+esc(s.description||"برای دریافت جزئیات و راهنمایی، از مسیر رسمی حورانت۲۴ اقدام کنید.")+'</p><a class="hero-slide-cta" href="'+esc(safeLink(s.button_url))+'" target="_blank" rel="noopener">'+esc(s.button_text||"مشاهده جزئیات")+' <i data-lucide="arrow-up-left"></i></a></div><div class="hero-slide-art"><span class="hero-art-orbit"></span><span class="hero-art-icon"><i data-lucide="bell-ring"></i></span><span class="hero-art-chip">HORANET24</span></div></article>';
  }).join("");
  dots.innerHTML=slides.length>1?slides.map((_,i)=>'<button type="button" class="hero-dot '+(i===index?"active":"")+'" data-slide="'+i+'" aria-label="رفتن به اسلاید '+(i+1)+'"></button>').join(""):"";
  dots.querySelectorAll("[data-slide]").forEach(b=>b.addEventListener("click",()=>go(Number(b.dataset.slide))));
  if(arrows)arrows.hidden=slides.length<2;
  if(window.refreshH24Icons)window.refreshH24Icons();else window.lucide?.createIcons?.({attrs:{"stroke-width":1.8}});
 }
 function stop(){if(timer){clearTimeout(timer);timer=null;}}
 function restart(){stop();if(slides.length>1&&!document.hidden)timer=setTimeout(()=>go(index+1),6500);}
 function go(n){if(!slides.length)return;index=(n+slides.length)%slides.length;paint();restart();}
 async function init(db){
  if(initialized)return;initialized=true;
  $("heroPrev")?.addEventListener("click",()=>go(index-1));
  $("heroNext")?.addEventListener("click",()=>go(index+1));
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else restart();});
  const [sr,settings]=await Promise.all([
   db.from("hero_slides").select("id,eyebrow,title,description,badge_label,button_text,button_url,image_url,sort_order,is_active").eq("is_active",true).order("sort_order",{ascending:true}),
   db.from("site_settings").select("setting_value").eq("setting_key","premium_channel").maybeSingle()
  ]);
  if(sr.error){console.error("Horanet slider load failed:",sr.error);slides=[];paint();}
  else{slides=sr.data||[];index=0;paint();restart();}
  const cfg=settings.data?.setting_value||{},link=$("premiumChannelLink");
  if(link){link.href=safeLink(cfg.url||bot);link.textContent=cfg.url?"ورود به کانال ویژه":"دریافت شرایط عضویت";}
 }
 window.initHoranetSlider=init;
})();