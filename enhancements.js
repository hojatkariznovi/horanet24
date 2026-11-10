(() => {
 "use strict";
 const $ = id => document.getElementById(id);
 const bot = "https://eitaa.com/huranet24_app";
 const fallbackSlides = [
  {eyebrow:"خدمات خودرو",badge_label:"راهنمای آنلاین",title:"کارهای خودرویی، روشن و ساده",description:"نوبت تعویض پلاک، کارت سوخت و خدمات مرتبط با خودرو را با مدارک و مراحل مشخص دنبال کن.",button_text:"دریافت راهنمایی",button_url:bot,icon:"car-front"},
  {eyebrow:"بیمه",badge_label:"نقدی و اقساطی",title:"برای بیمه، انتخاب آگاهانه‌تری داشته باش",description:"راهنمای بیمه شخص ثالث، بیمه بدنه و سایر خدمات بیمه‌ای را از حورانت۲۴ دریافت کن.",button_text:"مشاهده خدمات بیمه",button_url:bot,icon:"shield-check"},
  {eyebrow:"خدمات اداری و کسب‌وکار",badge_label:"همراه دیجیتال شما",title:"از امور اداری تا خدمات کسب‌وکار",description:"مدارک، مراحل و راهنمای خدماتی مثل مجوز کسب و امور مالیاتی را یک‌جا بررسی کن.",button_text:"شروع از پشتیبانی",button_url:bot,icon:"briefcase-business"}
 ];
 let slides = fallbackSlides.slice(), current = 0, timer = null, pointerStart = null, pauseReasons = new Set(), moveToken = 0;
 const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const safeUrl = value => { try { const u = new URL(value || bot, location.origin); return (u.protocol === "http:" || u.protocol === "https:") ? u.href : bot; } catch (_) { return bot; } };
 function render() {
  const root = $("heroSlides"), dots = $("heroDots"), arrows = document.querySelector("#heroSlider .hero-arrows");
  if (!root || !dots) return;
  root.innerHTML = slides.map((s,i) => '<article class="hero-slide'+(i===current?' active':'')+'" data-slide-index="'+i+'" aria-hidden="'+(i===current?'false':'true')+'"><div class="hero-slide-copy"><span class="hero-kicker">'+esc(s.eyebrow || "اطلاعیه حورانت۲۴")+'</span>'+(s.badge_label?'<span class="hero-pill">'+esc(s.badge_label)+'</span>':'')+'<h2>'+esc(s.title || "همراه دیجیتال شما")+'</h2><p>'+esc(s.description || "برای دریافت جزئیات و راهنمایی، از مسیر رسمی حورانت۲۴ اقدام کنید.")+'</p><a class="hero-slide-cta" href="'+esc(safeUrl(s.button_url))+'" target="_blank" rel="noopener">'+esc(s.button_text || "مشاهده جزئیات")+' <i data-lucide="arrow-up-left"></i></a></div><div class="hero-slide-art"><span class="hero-art-orbit"></span><span class="hero-art-icon"><i data-lucide="'+esc(s.icon || "sparkles")+'"></i></span><span class="hero-art-chip">HORANET24</span></div></article>').join("");
  dots.innerHTML = slides.length > 1 ? slides.map((_,i)=>'<button type="button" class="hero-dot'+(i===current?' active':'')+'" data-slide="'+i+'" aria-label="رفتن به اسلاید '+(i+1)+'" aria-current="'+(i===current?'true':'false')+'"></button>').join("") : "";
  if (arrows) arrows.hidden = slides.length < 2;
  root.querySelectorAll(".hero-slide").forEach((el,i)=>{el.style.zIndex=i===current?"2":"1";});
  try { if (window.refreshH24Icons) window.refreshH24Icons(); else window.lucide?.createIcons?.(); } catch (_) {}
 }
 function go(next, direction) {
  if (slides.length < 2 || next === current) return;
  const oldIndex = current, newIndex = (next + slides.length) % slides.length;
  const dir = direction || (newIndex > oldIndex ? 1 : -1);
  const root = $("heroSlides"), oldSlide = root?.querySelector('[data-slide-index="'+oldIndex+'"]'), newSlide = root?.querySelector('[data-slide-index="'+newIndex+'"]');
  if (!oldSlide || !newSlide) { current = newIndex; render(); return; }
  moveToken++;
  const token = moveToken;
  root.querySelectorAll(".hero-slide").forEach(el=>el.classList.remove("h24-flip-in-next","h24-flip-in-prev","h24-flip-out-next","h24-flip-out-prev"));
  oldSlide.classList.remove("active");
  oldSlide.setAttribute("aria-hidden","true");
  newSlide.classList.add("active");
  newSlide.setAttribute("aria-hidden","false");
  oldSlide.classList.add(dir > 0 ? "h24-flip-out-next" : "h24-flip-out-prev");
  newSlide.classList.add(dir > 0 ? "h24-flip-in-next" : "h24-flip-in-prev");
  current = newIndex;
  $("heroDots")?.querySelectorAll("[data-slide]").forEach((dot,i)=>{dot.classList.toggle("active",i===current);dot.setAttribute("aria-current",i===current?"true":"false");});
  window.setTimeout(()=>{if(token!==moveToken)return;oldSlide.classList.remove("h24-flip-out-next","h24-flip-out-prev");newSlide.classList.remove("h24-flip-in-next","h24-flip-in-prev");},760);
 }
 function stop(){if(timer!==null){window.clearInterval(timer);timer=null;}}
 function start(){stop();if(slides.length<2 || pauseReasons.size || document.hidden)return;timer=window.setInterval(()=>go(current+1,1),4500);}
 function pause(reason){pauseReasons.add(reason);stop();}
 function resume(reason){pauseReasons.delete(reason);start();}
 function bind() {
  const slider=$("heroSlider"); if(!slider || slider.dataset.h24SliderBound==="1")return;
  slider.dataset.h24SliderBound="1";
  slider.addEventListener("click",event=>{
   const prev=event.target.closest("#heroPrev"), next=event.target.closest("#heroNext"), dot=event.target.closest("[data-slide]");
   if(prev){event.preventDefault();go(current-1,-1);start();return;}
   if(next){event.preventDefault();go(current+1,1);start();return;}
   if(dot){event.preventDefault();const target=Number(dot.dataset.slide);go(target,target>=current?1:-1);start();}
  });
  slider.addEventListener("pointerdown",event=>{if(event.pointerType==="mouse" && event.button!==0)return;pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId};},{passive:true});
  slider.addEventListener("pointerup",event=>{
   if(!pointerStart || pointerStart.id!==event.pointerId)return;
   const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;pointerStart=null;
   if(Math.abs(dx)>42 && Math.abs(dx)>Math.abs(dy)*1.15){go(current+(dx>0?-1:1),dx>0?-1:1);start();}
  },{passive:true});
  slider.addEventListener("pointercancel",()=>{pointerStart=null;},{passive:true});
  slider.addEventListener("mouseenter",()=>pause("hover"));
  slider.addEventListener("mouseleave",()=>resume("hover"));
  slider.addEventListener("focusin",()=>pause("focus"));
  slider.addEventListener("focusout",event=>{if(!slider.contains(event.relatedTarget))resume("focus");});
  document.addEventListener("visibilitychange",()=>document.hidden?pause("hidden"):resume("hidden"));
  document.addEventListener("keydown",event=>{if(!slider.contains(document.activeElement))return;if(event.key==="ArrowLeft"){go(current+1,1);start();}else if(event.key==="ArrowRight"){go(current-1,-1);start();}});
 }
 async function init(db) {
  bind();
  if(db?.from){
   try {
    const result=await db.from("hero_slides").select("id,eyebrow,title,description,badge_label,button_text,button_url,sort_order,is_active").eq("is_active",true).order("sort_order",{ascending:true});
    const rows=result.error?[]:(result.data||[]);
    if(rows.length>=2){slides=rows;current=0;render();start();}
   } catch(error){console.warn("Slider database fallback:",error);}
  }
 }
 window.initHoranetSlider=init;
 bind();
 render();
 start();
})();