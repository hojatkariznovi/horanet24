(() => {
 "use strict";
 const $ = id => document.getElementById(id);
 const bot = "https://eitaa.com/huranet24_app";
 const fallbackSlides = [
  {eyebrow:"خدمات خودرو",badge_label:"راهنمای آنلاین",title:"کارهای خودرویی، روشن و ساده",description:"نوبت تعویض پلاک، کارت سوخت و خدمات مرتبط با خودرو را با مدارک و مراحل مشخص دنبال کن.",button_text:"دریافت راهنمایی",button_url:bot,icon:"car-front"},
  {eyebrow:"بیمه",badge_label:"نقدی و اقساطی",title:"برای بیمه، انتخاب آگاهانه‌تری داشته باش",description:"راهنمای بیمه شخص ثالث، بیمه بدنه و سایر خدمات بیمه‌ای را از حورانت۲۴ دریافت کن.",button_text:"مشاهده خدمات بیمه",button_url:bot,icon:"shield-check"},
  {eyebrow:"خدمات اداری و کسب‌وکار",badge_label:"همراه دیجیتال شما",title:"از امور اداری تا خدمات کسب‌وکار",description:"مدارک، مراحل و راهنمای خدماتی مثل مجوز کسب و امور مالیاتی را یک‌جا بررسی کن.",button_text:"شروع از پشتیبانی",button_url:bot,icon:"briefcase-business"}
 ];
 let slides=fallbackSlides.slice(), current=0, timer=null, pauseReasons=new Set(), touchStart=null, databaseLoaded=false;
 const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const safeUrl=value=>{try{const u=new URL(value||bot,location.origin);return /^https?:$/.test(u.protocol)?u.href:bot;}catch(_){return bot;}};
 function refreshIcons(){try{if(window.refreshH24Icons)window.refreshH24Icons();else window.lucide?.createIcons?.();}catch(_){}}
 function render(){
  const root=$("heroSlides"), dots=$("heroDots"), arrows=document.querySelector("#heroSlider .hero-arrows");
  if(!root||!dots)return;
  root.innerHTML=slides.map((s,i)=>'<article class="hero-slide'+(i===current?' active':'')+'" data-slide-index="'+i+'" aria-hidden="'+(i===current?'false':'true')+'"><div class="hero-slide-copy"><span class="hero-kicker">'+esc(s.eyebrow||"اطلاعیه حورانت۲۴")+'</span>'+(s.badge_label?'<span class="hero-pill">'+esc(s.badge_label)+'</span>':'')+'<h2>'+esc(s.title||"همراه دیجیتال شما")+'</h2><p>'+esc(s.description||"برای دریافت جزئیات و راهنمایی، از مسیر رسمی حورانت۲۴ اقدام کنید.")+'</p><a class="hero-slide-cta" href="'+esc(safeUrl(s.button_url))+'" target="_blank" rel="noopener">'+esc(s.button_text||"مشاهده جزئیات")+' <i data-lucide="arrow-up-left"></i></a></div><div class="hero-slide-art"><span class="hero-art-orbit"></span><span class="hero-art-icon"><i data-lucide="'+esc(s.icon||"sparkles")+'"></i></span><span class="hero-art-chip">HORANET24</span></div></article>').join("");
  dots.innerHTML=slides.length>1?slides.map((_,i)=>'<button type="button" class="hero-dot'+(i===current?' active':'')+'" data-slide="'+i+'" aria-label="رفتن به اسلاید '+(i+1)+'" aria-current="'+(i===current?'true':'false')+'"></button>').join(""):"";
  if(arrows)arrows.hidden=slides.length<2;
  refreshIcons();
 }
 function go(index){
  if(slides.length<2)return;
  current=(index+slides.length)%slides.length;
  const root=$("heroSlides");
  if(!root)return;
  root.querySelectorAll(".hero-slide").forEach((slide,i)=>{
   const active=i===current;
   slide.classList.toggle("active",active);
   slide.setAttribute("aria-hidden",active?"false":"true");
   slide.style.zIndex=active?"2":"1";
  });
  $("heroDots")?.querySelectorAll("[data-slide]").forEach((dot,i)=>{
   const active=i===current;
   dot.classList.toggle("active",active);
   dot.setAttribute("aria-current",active?"true":"false");
  });
 }
 function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
 function start(){stop();if(slides.length>1&&!pauseReasons.size&&!document.hidden)timer=setInterval(()=>go(current+1),4800);}
 function pause(reason){pauseReasons.add(reason);stop();}
 function resume(reason){pauseReasons.delete(reason);start();}
 function bind(){
  const slider=$("heroSlider");if(!slider||slider.dataset.h24SliderBound==="2")return;
  slider.dataset.h24SliderBound="2";
  $("heroPrev")?.addEventListener("click",event=>{event.preventDefault();go(current-1);start();});
  $("heroNext")?.addEventListener("click",event=>{event.preventDefault();go(current+1);start();});
  $("heroDots")?.addEventListener("click",event=>{const dot=event.target.closest("[data-slide]");if(!dot)return;event.preventDefault();go(Number(dot.dataset.slide));start();});
  slider.addEventListener("pointerdown",event=>{if(event.pointerType==="mouse"&&event.button!==0)return;touchStart={x:event.clientX,y:event.clientY,id:event.pointerId};},{passive:true});
  slider.addEventListener("pointerup",event=>{if(!touchStart||touchStart.id!==event.pointerId)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.2){go(current+(dx<0?1:-1));start();}},{passive:true});
  slider.addEventListener("pointercancel",()=>{touchStart=null;},{passive:true});
  slider.addEventListener("mouseenter",()=>pause("hover"));
  slider.addEventListener("mouseleave",()=>resume("hover"));
  slider.addEventListener("focusin",()=>pause("focus"));
  slider.addEventListener("focusout",event=>{if(!slider.contains(event.relatedTarget))resume("focus");});
  document.addEventListener("visibilitychange",()=>document.hidden?pause("hidden"):resume("hidden"));
 }
 async function init(db){
  bind();
  if(db?.from&&!databaseLoaded){
   databaseLoaded=true;
   try{
    const result=await db.from("hero_slides").select("id,eyebrow,title,description,badge_label,button_text,button_url,sort_order,is_active").eq("is_active",true).order("sort_order",{ascending:true});
    const rows=result.error?[]:(result.data||[]);
    if(rows.length>=2){slides=rows;current=0;render();start();}
   }catch(error){console.warn("Horanet24 slider uses local slides:",error);}
  }
  start();
 }
 window.initHoranetSlider=init;
 bind();
 render();
 start();
})();