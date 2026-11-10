(() => {
 "use strict";
 const bot="https://eitaa.com/huranet24_app", $=id=>document.getElementById(id);
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const fallbackSlides=[
  {eyebrow:"خدمات خودرو",badge_label:"راهنمای آنلاین",title:"کارهای خودرویی، روشن و ساده",description:"نوبت تعویض پلاک، کارت سوخت و خدمات مرتبط با خودرو را با مدارک و مراحل مشخص دنبال کن.",button_text:"دریافت راهنمایی",button_url:bot,icon:"car-front"},
  {eyebrow:"بیمه",badge_label:"نقدی و اقساطی",title:"برای بیمه، انتخاب آگاهانه‌تری داشته باش",description:"راهنمای بیمه شخص ثالث، بیمه بدنه و سایر خدمات بیمه‌ای را از حورانت۲۴ دریافت کن.",button_text:"مشاهده خدمات بیمه",button_url:bot,icon:"shield-check"},
  {eyebrow:"خدمات اداری و کسب‌وکار",badge_label:"همراه دیجیتال شما",title:"از امور اداری تا خدمات کسب‌وکار",description:"مدارک، مراحل و راهنمای خدماتی مثل مجوز کسب و امور مالیاتی را یک‌جا بررسی کن.",button_text:"شروع از پشتیبانی",button_url:bot,icon:"briefcase-business"}
 ];
 let slides=fallbackSlides.slice(),index=0,interval=null,touchX=null,initialized=false;
 const safeLink=value=>{try{const u=new URL(value||bot,location.origin);return /^https?:$/.test(u.protocol)?u.href:bot;}catch{return bot;}};
 function paint(){
  const root=$("heroSlides"),dots=$("heroDots");if(!root||!dots)return;
  root.innerHTML=slides.map((s,i)=>{
   const image=s.image_url?' data-slide-image="'+esc(safeLink(s.image_url))+'"':"";
   return '<article class="hero-slide"'+image+' data-slide-index="'+i+'" aria-hidden="'+(i===index?"false":"true")+'"><div class="hero-slide-copy"><span class="hero-kicker">'+esc(s.eyebrow||"اطلاعیه حورانت۲۴")+'</span>'+(s.badge_label?'<span class="hero-pill">'+esc(s.badge_label)+'</span>':"")+'<h2>'+esc(s.title)+'</h2><p>'+esc(s.description||"برای دریافت جزئیات و راهنمایی، از مسیر رسمی حورانت۲۴ اقدام کنید.")+'</p><a class="hero-slide-cta" href="'+esc(safeLink(s.button_url))+'" target="_blank" rel="noopener">'+esc(s.button_text||"مشاهده جزئیات")+' <i data-lucide="arrow-up-left"></i></a></div><div class="hero-slide-art"><span class="hero-art-orbit"></span><span class="hero-art-icon"><i data-lucide="'+esc(s.icon||"bell-ring")+'"></i></span><span class="hero-art-chip">HORANET24</span></div></article>';
  }).join("");
  root.querySelectorAll("[data-slide-image]").forEach(el=>{el.style.backgroundImage='linear-gradient(90deg,#102c43ed,#153f56a8),url("'+el.dataset.slideImage+'")';el.style.backgroundSize="cover";el.style.backgroundPosition="center";});
  dots.innerHTML=slides.length>1?slides.map((_,i)=>'<button type="button" class="hero-dot" data-slide="'+i+'" aria-label="رفتن به اسلاید '+(i+1)+'" aria-current="'+(i===index?"true":"false")+'"></button>').join(""):"";
  const arrows=document.querySelector(".hero-arrows");if(arrows)arrows.hidden=slides.length<2;
  applySlide();
  try{if(window.refreshH24Icons)window.refreshH24Icons();else window.lucide?.createIcons?.({attrs:{"stroke-width":1.8}});}catch(error){console.warn("Horanet slider icons:",error);}
 }
 function applySlide(){
  const root=$("heroSlides"),dots=$("heroDots");if(!root)return;
  root.querySelectorAll(".hero-slide").forEach((el,i)=>{
   const active=i===index;el.classList.toggle("active",active);el.setAttribute("aria-hidden",active?"false":"true");
   el.style.position="absolute";el.style.inset="0";el.style.display="flex";el.style.height="100%";el.style.width="100%";
   el.style.opacity=active?"1":"0";el.style.visibility=active?"visible":"hidden";
   el.style.transform=active?"translateX(0)":"translateX("+(i<index?"-24px":"24px")+")";
   el.style.pointerEvents=active?"auto":"none";el.style.zIndex=active?"2":"1";el.style.transition="opacity .42s ease,transform .42s ease";
  });
  dots?.querySelectorAll("[data-slide]").forEach((el,i)=>{const active=i===index;el.classList.toggle("active",active);el.setAttribute("aria-current",active?"true":"false");});
 }
 function go(next){if(slides.length<2)return;index=(next+slides.length)%slides.length;applySlide();}
 function bind(){
  if(initialized)return;initialized=true;
  $("heroPrev")?.addEventListener("click",()=>go(index-1));$("heroNext")?.addEventListener("click",()=>go(index+1));
  $("heroDots")?.addEventListener("click",e=>{const b=e.target.closest("[data-slide]");if(b)go(Number(b.dataset.slide));});
  const slider=$("heroSlider");
  slider?.addEventListener("touchstart",e=>{touchX=e.changedTouches?.[0]?.clientX??null;},{passive:true});
  slider?.addEventListener("touchend",e=>{if(touchX===null)return;const delta=(e.changedTouches?.[0]?.clientX??touchX)-touchX;if(Math.abs(delta)>35)go(index+(delta>0?-1:1));touchX=null;},{passive:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){if(interval!==null){clearInterval(interval);interval=null;}}else start();});
 }
 function start(){if(interval!==null)clearInterval(interval);interval=setInterval(()=>{if(!document.hidden)go(index+1);},4200);}
 async function init(db){
  bind();
  if(db?.from){
   try{
    const sr=await db.from("hero_slides").select("id,eyebrow,title,description,badge_label,button_text,button_url,image_url,sort_order,is_active").eq("is_active",true).order("sort_order",{ascending:true});
    const rows=sr.error?[]:(sr.data||[]);if(rows.length>=2){slides=rows;index=0;paint();}
   }catch(error){console.warn("Horanet slider database fallback:",error);}
  }
 }
 window.initHoranetSlider=init;bind();paint();start();
})();