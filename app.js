/* Horanet24 web app — public showcase + Supabase content */
const SUPABASE_URL = "https://iqrgqkluuhbyphtihsls.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
const $ = (id) => document.getElementById(id);
// Lightweight UI sounds: resume the audio context before scheduling notes.
let h24UiAudio=null,h24UiSoundsEnabled=true;
function h24UiSound(kind="tap"){
 if(!h24UiSoundsEnabled)return;
 try{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;
  if(!h24UiAudio)h24UiAudio=new AudioCtx();
  const ctx=h24UiAudio;
  const play=()=>{
   if(!h24UiSoundsEnabled||ctx.state!=="running")return;
   const patterns={
    tap:[[740,0,.055,.012],[990,.018,.06,.008]],
    open:[[523,0,.09,.011],[659,.045,.09,.009],[784,.09,.12,.008]],
    close:[[784,0,.075,.009],[659,.045,.075,.008],[523,.09,.10,.007]]
   };
   const now=ctx.currentTime+.025;
   (patterns[kind]||patterns.tap).forEach(([hz,offset,duration,volume])=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type="sine";osc.frequency.setValueAtTime(hz,now+offset);
    gain.gain.setValueAtTime(.0001,now+offset);
    gain.gain.exponentialRampToValueAtTime(volume,now+offset+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(now+offset);osc.stop(now+offset+duration+.015);
   });
  };
  if(ctx.state==="suspended")ctx.resume().then(play).catch(()=>{});
  else play();
 }catch(_){}
}
const state = { client:null, session:null, services:[], products:[], categories:[], productCategories:[], favorites:new Set(), serverOffsetMs:0, activeCategory:"all", activeProductCategory:"all", productSearch:"", productSort:"featured", selectedService:null, profileCache:null };
const toast = (message) => { const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.classList.remove("show"),3000); };
const esc = (value="") => String(value).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LUCIDE_ICON_MAP={"car-front":"car-front","receipt":"receipt-text","fuel":"fuel","car-document":"file-text","shield-car":"shield-check","shield-check":"shield-check","shield-calendar":"calendar-check","heart-chart":"heart-pulse","briefcase-check":"briefcase-business","calculator":"calculator","folder":"folder","certificate":"award","passport":"passport","user-card":"contact","users":"users","bank":"landmark","credit-card":"credit-card","wrench":"wrench"};
const iconSvg=(name="sparkles")=>'<i data-lucide="'+(LUCIDE_ICON_MAP[name]||name)+'" aria-hidden="true"></i>';
const SERVICE_ICONS={"plate-appointment":"car-front","vehicle-fines":"receipt","fuel-card":"fuel","vehicle-transfer-followup":"car-document","vehicle-insurance-tax":"shield-car","third-party-insurance":"shield-check","car-body-insurance":"shield-car","third-party-installments":"shield-calendar","life-investment-insurance":"heart-chart","business-license":"briefcase-check","tax-accounting":"calculator","administrative-services":"folder","inheritance-certificate":"certificate","passport-request":"passport","civil-registry-services":"user-card","subsidy-household":"users","bank-account-opening":"bank","pos-device":"credit-card","pos-install-support":"wrench"};
const categoryIcon=(categorySlug="",serviceSlug="")=>iconSvg(SERVICE_ICONS[serviceSlug]||({vehicle:"car-front",insurance:"shield-check",business:"briefcase-check",administrative:"folder",pos:"credit-card"})[categorySlug]||"sparkles");

const H24_FALLBACK_PATHS={
 house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 "grid-2x2":'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
 "shopping-bag":'<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
 "user-round":'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
 "arrow-left":'<path d="M19 12H5m7 7-7-7 7-7"/>',
 "external-link":'<path d="M13 5h6v6M19 5l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
 "badge-check":'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 sparkles:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1z"/>',
 "bell-ring":'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4M2 8l2-2m18 2-2-2"/>',
 "chevron-right":'<path d="m15 18-6-6 6-6"/>',
 "chevron-left":'<path d="m9 18 6-6-6-6"/>',
 send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
 "message-circle":'<path d="M21 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.2-4.3A8.5 8.5 0 1 1 21 11.5Z"/>',
 "clipboard-list":'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6m-6 4h6m-6 4h3"/>',
 crown:'<path d="m2 7 5 4 5-7 5 7 5-4-2 13H4L2 7Z"/>',
 "car-front":'<path d="m5 11 2-6h10l2 6 2 2v6h-2v-2H5v2H3v-6z"/><path d="M7 11h10M7 15h.01M17 15h.01"/>',
 fuel:'<path d="M4 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M3 21h14M7 6h6v5H7z"/><path d="M16 8h2l2 2v7a2 2 0 0 0 4 0v-5l-2-2"/>',
 "receipt-text":'<path d="M4 2v20l3-2 3 2 2-2 3 2 3-2 2 2V2l-3 2-3-2-2 2-3-2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 "file-text":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
 "shield-check":'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
 "calendar-check":'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18m-12 5 2 2 4-4"/>',
 "heart-pulse":'<path d="M20.8 8.8c0 5.5-8.8 11-8.8 11S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/><path d="M3 12h5l2-3 3 6 2-3h6"/>',
 "briefcase-business":'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2"/>',
 calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
 folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 award:'<circle cx="12" cy="8" r="6"/><path d="m8 13-1 9 5-3 5 3-1-9"/>',
 passport:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="5"/><path d="M7 12h10"/>',
 contact:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M5.5 16a4 4 0 0 1 7 0m2-7h3m-3 4h3"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.9"/>',
 landmark:'<path d="m3 10 9-7 9 7M4 10h16M5 10v9m5-9v9m4-9v9m5-9v9M3 21h18"/>',
 "credit-card":'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20m-15 5h4"/>',
 wrench:'<path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 12l-3-3z"/>',
 play:'<path d="m8 5 12 7-12 7z"/>',
 "book-open-check":'<path d="M12 7v14m0-14C9 4 5 4 3 5v14c3-1 6-1 9 2m0-14c3-3 7-3 9-2v9"/><path d="m15 16 2 2 4-4"/>',
 "arrow-up-left":'<path d="M7 17 17 7M7 7h10v10"/>'
};
function renderH24FallbackIcons(){
 document.querySelectorAll("i[data-lucide]").forEach(node=>{
  const name=node.getAttribute("data-lucide")||"sparkles";
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("width","18");svg.setAttribute("height","18");
  svg.setAttribute("class",((node.getAttribute("class")||"")+" lucide h24-fallback").trim());
  svg.setAttribute("aria-hidden","true");svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");
  svg.setAttribute("stroke-width","1.8");svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");
  svg.innerHTML=H24_FALLBACK_PATHS[name]||H24_FALLBACK_PATHS.sparkles;node.replaceWith(svg);
 });
}

const refreshIcons=()=>{
 document.querySelectorAll("img.nav-3d-icon[data-fallback-icon]").forEach(img=>{
  if(img.dataset.fallbackBound)return;
  img.dataset.fallbackBound="1";
  img.addEventListener("error",()=>{
   const fallback=document.createElement("i");
   fallback.setAttribute("data-lucide",img.dataset.fallbackIcon);
   fallback.setAttribute("aria-hidden","true");
   img.replaceWith(fallback);
   refreshIcons();
  },{once:true});
 });
 document.querySelectorAll("[data-icon]").forEach(node=>{
  const name=node.dataset.icon||"sparkles";
  node.setAttribute("data-lucide",LUCIDE_ICON_MAP[name]||name);
  node.removeAttribute("data-icon");
  node.classList.add("icon-host");
  node.setAttribute("aria-hidden","true");
 });
 if(window.lucide?.createIcons) window.lucide.createIcons({attrs:{'stroke-width':1.8}}); else renderH24FallbackIcons();
};
function showContactOptions(mode="contact",serviceTitle=""){
 const headings={request:"ثبت درخواست در:",contact:"ارتباط در:",membership:"درخواست عضویت در:",alerts:"دریافت اطلاع‌رسانی در:",product:"ادامه دریافت محصول در:"};
 const heading=headings[mode]||"ادامه در:";
 const intro=serviceTitle?'<p class="request-context">موضوع انتخاب‌شده: <b>'+esc(serviceTitle)+'</b></p>':"";
 const eitaaSub=mode==="request"?"ادامه ثبت درخواست در ایتا":mode==="membership"?"ارسال درخواست عضویت در ایتا":mode==="alerts"?"عضویت در اطلاع‌رسانی ایتا":mode==="product"?"پیگیری دریافت محصول در ایتا":"ادامه در ایتا";
 const telegramSub=mode==="request"?"ادامه ثبت درخواست در تلگرام":mode==="membership"?"ارسال درخواست عضویت در تلگرام":mode==="alerts"?"دریافت اطلاع‌رسانی در تلگرام":mode==="product"?"پیگیری دریافت محصول در تلگرام":"ادامه در تلگرام";
 openModal('<span class="eyebrow">حورانت۲۴ · همراه دیجیتال شما</span><h2 id="modalTitle">'+heading+'</h2>'+intro+'<div class="contact-options"><a class="contact-choice contact-eitaa" href="https://eitaa.com/huranet24_app" target="_blank" rel="noopener"><span class="contact-choice-icon"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 12.5A7.5 7.5 0 0 1 15.5 5h17A7.5 7.5 0 0 1 40 12.5v14a7.5 7.5 0 0 1-7.5 7.5H20l-9 8v-8.5A7.5 7.5 0 0 1 8 27Z" fill="currentColor" opacity=".18"/><path d="M15 17h18M15 24h12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span><span><b>ایتا</b><small>'+eitaaSub+'</small></span><i data-lucide="arrow-up-left"></i></a><a class="contact-choice contact-telegram" href="https://t.me/hojat_k82" target="_blank" rel="noopener"><span class="contact-choice-icon"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="m5 22 36-14-8 33-11-9-7 6-1-12Z" fill="currentColor"/><path d="m14 26 20-13-13 18" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span><b>تلگرام</b><small>'+telegramSub+'</small></span><i data-lucide="arrow-up-left"></i></a></div>');
}
function openModal(html){ h24UiSound("open"); $("modalContent").innerHTML=html; refreshIcons(); $("modalBackdrop").hidden=false; document.body.classList.add("modal-open"); }
function closeModal(){ if(!$("modalBackdrop").hidden)h24UiSound("close"); $("modalBackdrop").hidden=true; $("modalContent").innerHTML=""; document.body.classList.remove("modal-open"); }
function openTelegram(text){ showContactOptions("contact",text||"پشتیبانی حورانت۲۴"); }
function showMembershipInfo(kind="premium"){
 if(kind==="alerts"){
  openModal('<span class="eyebrow">اطلاع‌رسانی حورانت۲۴</span><h2 id="modalTitle">عضویت در اطلاع‌رسانی رایگان</h2><p>با عضویت در کانال یا ربات اطلاع‌رسانی، خبر فعال‌شدن ثبت‌نام‌ها، طرح‌های مهم و اطلاعیه‌های خدماتی را دریافت می‌کنی.</p><div class="detail-block"><b>پیش از عضویت بدانید</b><ul><li>عضویت برای دریافت خبرها و اطلاعیه‌ها رایگان است.</li><li>برای ادامه، پیام‌رسان دلخواهت را انتخاب می‌کنی.</li><li>هر زمان بخواهی می‌توانی عضویت را لغو کنی.</li></ul></div><button class="primary-btn full" id="alertsJoin">عضویت در اطلاع‌رسانی</button>');
  $("alertsJoin").onclick=()=>showContactOptions("alerts","اطلاع‌رسانی حورانت۲۴");return;
 }
 openModal('<span class="eyebrow">باشگاه ویژه حورانت۲۴</span><h2 id="modalTitle">شرایط عضویت در کانال ویژه</h2><p>کانال ویژه برای دسترسی به آموزش‌های کاربردی، تحلیل خدمات روز، نکته‌های اجرایی و اطلاعیه‌های منتخب در نظر گرفته شده است.</p><div class="detail-block membership-terms"><b>شرایط و روند عضویت</b><ul><li>ابتدا درخواست عضویت خود را ثبت می‌کنی.</li><li>هزینه عضویت، مدت دسترسی و روش پرداخت پیش از پرداخت به‌صورت شفاف اعلام می‌شود.</li><li>عضویت پس از تأیید شرایط و تکمیل فرایند اعلام‌شده فعال خواهد شد.</li><li>قبل از آگاهی از شرایط و هزینه، هیچ پرداختی انجام نده.</li></ul></div><p class="micro-note">با انتخاب پیام‌رسان، فقط وارد گفت‌وگوی پشتیبانی می‌شوی؛ عضویت یا پرداخت به‌صورت خودکار انجام نمی‌شود.</p><button class="primary-btn full" id="premiumJoin">درخواست عضویت</button>');
 $("premiumJoin").onclick=()=>showContactOptions("membership","عضویت در کانال ویژه حورانت۲۴");
}
async function ensureProfile(user){ if(!user)return; try{ const {error}=await state.client.from("profiles").upsert({id:user.id,full_name:user.user_metadata?.full_name||user.email?.split("@")[0]||"کاربر حورانت"},{onConflict:"id",ignoreDuplicates:true}); if(error)console.warn("Profile bootstrap:",error.message); }catch(e){console.warn(e);} }
function renderCategories(){ const row=$("categoryRow"); const icons={all:"layers-3",vehicle:"car-front",insurance:"shield-check",business:"briefcase-business",administrative:"folder-open",pos:"credit-card"}; const labels={vehicle:"خدمات خودرو",insurance:"بیمه",business:"خدمات کسب‌وکار",administrative:"خدمات اداری",pos:"کارت‌خوان"}; row.innerHTML='<button class="chip active" data-category="all"><span data-icon="'+icons.all+'"></span><b>همه</b></button>'+state.categories.map(c=>'<button class="chip" data-category="'+esc(c.slug)+'"><span data-icon="'+(icons[c.slug]||"grid-2x2")+'"></span><b>'+esc(labels[c.slug]||c.title)+'</b></button>').join(""); row.querySelectorAll(".chip").forEach(btn=>btn.addEventListener("click",()=>{state.activeCategory=btn.dataset.category;row.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===btn));renderServices();}));refreshIcons();}
function serviceNow(){return Date.now()+(state.serverOffsetMs||0);}
function serviceExpired(s){return !!(s?.is_time_limited&&s.registration_deadline&&new Date(s.registration_deadline).getTime()<=serviceNow());}
function formatServiceRemaining(ms){const total=Math.max(0,Math.floor(ms/1000));const d=Math.floor(total/86400),h=Math.floor(total%86400/3600),m=Math.floor(total%3600/60),s=total%60;return (d?d.toLocaleString("fa-IR")+" روز و ":"")+[h,m,s].map(n=>String(n).padStart(2,"0")).join(":").replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);}
function updateServiceCountdowns(){document.querySelectorAll("[data-service-deadline]").forEach(el=>{const deadline=new Date(el.dataset.serviceDeadline).getTime(),expired=!Number.isFinite(deadline)||deadline<=serviceNow(),strong=el.querySelector("strong");if(expired){el.classList.add("is-expired");el.querySelector("span").textContent="وضعیت ثبت‌نام";if(strong)strong.textContent="موقتاً غیرفعال";}else{el.classList.remove("is-expired");if(strong)strong.textContent=formatServiceRemaining(deadline-serviceNow());}});const s=state.selectedService;if(s&&serviceExpired(s)){const btn=$("serviceRequest");if(btn){btn.disabled=true;btn.classList.add("service-request-expired");btn.querySelector(".service-request-label").textContent="ثبت‌نام موقتاً غیرفعال";} }else{const btn=$("serviceRequest");if(btn){btn.disabled=false;btn.classList.remove("service-request-expired");btn.querySelector(".service-request-label").textContent="ثبت درخواست";}}}
setInterval(updateServiceCountdowns,1000);
function renderServices(){
 const q=$("serviceSearch").value.trim().toLocaleLowerCase("fa");
 const items=state.services.filter(s=>(state.activeCategory==="all"||s.category?.slug===state.activeCategory)&&(!q||(s.title+" "+(s.summary||"")).toLocaleLowerCase("fa").includes(q)));
 const grid=$("serviceGrid");
 grid.innerHTML=items.length?items.map(s=>'<article class="service-card service-live" data-id="'+s.id+'"><div class="service-card-main"><span class="service-icon">'+categoryIcon(s.category?.slug,s.slug)+'</span><span class="service-copy"><b>'+esc(s.title)+'</b><small>'+esc(s.summary||"برای آشنایی با مدارک و مراحل انتخاب کنید")+'</small></span></div><button type="button" class="service-card-action" aria-label="مشاهده جزئیات '+esc(s.title)+'">مشاهده جزئیات <span data-icon="arrow-left"></span></button></article>').join(""):'<div class="empty-state">خدمتی با این عبارت پیدا نشد.</div>';
 grid.querySelectorAll(".service-live").forEach(card=>{card.addEventListener("click",()=>showService(card.dataset.id));card.querySelector(".service-card-action").addEventListener("click",e=>{e.stopPropagation();showService(card.dataset.id);});});
 refreshIcons();
 $("serviceStatus").textContent=items.length+" خدمت در دسترس است.";
}

function showService(id){ const s=state.services.find(x=>x.id===id); if(!s)return; state.selectedService=s; const docs=Array.isArray(s.required_documents)?s.required_documents:[]; const steps=Array.isArray(s.steps)?s.steps:[]; const fav=state.favorites.has(id); const timer=s.is_time_limited?'<div class="service-deadline service-deadline-modal" data-service-deadline="'+esc(s.registration_deadline)+'"><span>مهلت باقی‌مانده برای ثبت‌نام</span><strong>در حال محاسبه…</strong></div>':""; openModal('<span class="eyebrow">جزئیات خدمت</span><h2 id="modalTitle">'+esc(s.title)+'</h2><p>'+esc(s.description||s.summary||"برای دریافت راهنمایی بیشتر، درخواست خود را از طریق پشتیبانی ثبت کنید.")+'</p>'+timer+'<div class="detail-block"><b>مدارک و اطلاعات موردنیاز</b><ul>'+ (docs.length?docs.map(x=>'<li>'+esc(x)+'</li>').join(""):'<li>پس از بررسی نوع درخواست اعلام می‌شود.</li>')+'</ul></div><div class="detail-block"><b>مراحل انجام</b><ol>'+(steps.length?steps.map(x=>'<li>'+esc(x)+'</li>').join(""):'<li>ارسال درخواست در پیام‌رسان انتخابی</li><li>بررسی و اعلام مراحل</li>')+'</ol></div><div class="modal-actions"><button class="primary-btn" id="serviceRequest" type="button"><span class="service-request-label">ثبت درخواست</span><span data-icon="send"></span></button><button class="secondary-btn" id="favoriteBtn"><span data-icon="heart"></span> '+(fav?"★ حذف از علاقه‌مندی‌ها":"☆ افزودن به علاقه‌مندی‌ها")+'</button></div><p class="micro-note">پس از انتخاب ایتا یا تلگرام، درخواست خود را در پیام‌رسان انتخابی ارسال کن؛ این وب‌سایت اطلاعات یا مدارک شما را دریافت نمی‌کند.</p>'); $("serviceRequest").onclick=()=>{if(serviceExpired(s)){updateServiceCountdowns();return;}showContactOptions("request",s.title);}; $("favoriteBtn").onclick=()=>toggleFavorite(id);updateServiceCountdowns(); }
async function toggleFavorite(id){ if(!state.session){toast("برای ذخیره علاقه‌مندی ابتدا وارد حساب شوید.");showLogin();return;} const exists=state.favorites.has(id); try{if(exists){const {error}=await state.client.from("favorites").delete().eq("user_id",state.session.user.id).eq("service_id",id);if(error)throw error;state.favorites.delete(id);}else{const {error}=await state.client.from("favorites").insert({user_id:state.session.user.id,service_id:id});if(error)throw error;state.favorites.add(id);} if(state.selectedService?.id===id)showService(id);toast(exists?"از علاقه‌مندی‌ها حذف شد.":"به علاقه‌مندی‌ها اضافه شد.");}catch(e){toast("ذخیره انجام نشد: "+e.message);} }
function renderProductCategories(){
 const root=$("productCategoryFilters");if(!root)return;
 const buttons=[{id:"all",title:"همه محصولات"},...state.productCategories.map(c=>({id:c.id,title:c.title}))];
 root.innerHTML=buttons.map(c=>'<button type="button" class="product-filter-chip'+(String(state.activeProductCategory)===String(c.id)?" active":"")+'" data-product-category="'+esc(c.id)+'">'+esc(c.title)+'</button>').join("");
 refreshIcons();
}
const productStockLabel=status=>({in_stock:"موجود",out_of_stock:"ناموجود",preorder:"پیش‌سفارش",inquiry:"استعلام موجودی"}[status]||"استعلام موجودی");
const productTypeLabel=type=>type==="digital"?"فایل و ابزار دیجیتال":type==="physical"?"کالای فیزیکی":"محصول";
const productPriceLabel=p=>p.price!==null&&p.price!==undefined&&p.price!==""?Number(p.price).toLocaleString("fa-IR")+" تومان":(p.price_label||"استعلام قیمت");
function renderProducts(){
 const grid=$("productGrid");if(!grid)return;
 const query=(state.productSearch||"").trim().toLocaleLowerCase("fa");
 let items=state.products.filter(p=>{
  const categoryOk=state.activeProductCategory==="all"||String(p.category_id||"")===String(state.activeProductCategory);
  const hay=[p.title,p.summary,p.description,p.category?.title,p.sku].filter(Boolean).join(" ").toLocaleLowerCase("fa");
  return categoryOk&&(!query||hay.includes(query));
 });
 const sort=state.productSort||"featured";
 items.sort((a,b)=>{
  if(sort==="price-asc")return (Number(a.price)||Number.MAX_SAFE_INTEGER)-(Number(b.price)||Number.MAX_SAFE_INTEGER);
  if(sort==="price-desc")return (Number(b.price)||0)-(Number(a.price)||0);
  if(sort==="newest")return Number(b.is_new)-Number(a.is_new)||new Date(b.created_at||0)-new Date(a.created_at||0);
  if(sort==="name")return String(a.title).localeCompare(String(b.title),"fa");
  return Number(b.is_featured)-Number(a.is_featured)||Number(b.is_new)-Number(a.is_new)||Number(a.sort_order||0)-Number(b.sort_order||0);
 });
 const count=$("productResultsCount");if(count)count.textContent=items.length.toLocaleString("fa-IR")+" محصول";
 if(!items.length){grid.innerHTML='<div class="empty-state">محصولی با این جست‌وجو پیدا نشد. عبارت دیگری امتحان کن.</div>';return;}
 const glyph=p=>/pos|pax|centerm|anfu|morefun/i.test(p.slug||"")?iconSvg("credit-card"):/modem|router|neterbit|dlink|tp-link/i.test(p.slug||"")?iconSvg("router"):p.product_type==="digital"?iconSvg("file-spreadsheet"):iconSvg("package");
 grid.innerHTML=items.map(p=>{
  const badge=p.badge|| (p.is_new?"جدید":p.is_featured?"پیشنهاد حورانت":"");
  const visual=p.image_url?'<img src="'+esc(p.image_url)+'" alt="'+esc(p.title)+'" loading="lazy">':'<div class="product-art"><span>'+glyph(p)+'</span><small>HORANET24</small></div>';
  const oldPrice=p.compare_at_price?'<del>'+Number(p.compare_at_price).toLocaleString("fa-IR")+' تومان</del>':"";
  return '<article class="product-card'+(p.is_featured?" product-card-featured":"")+'"><div class="product-visual">'+visual+(badge?'<span class="product-badge">'+esc(badge)+'</span>':"")+'</div><div class="product-copy"><div class="product-card-kicker"><span>'+esc(p.category?.title||productTypeLabel(p.product_type))+'</span><span class="product-stock '+esc(p.stock_status||"inquiry")+'">'+productStockLabel(p.stock_status)+'</span></div><b>'+esc(p.title)+'</b><p>'+esc(p.summary||"برای مشاهده مشخصات و شرایط تهیه، جزئیات محصول را بررسی کن.")+'</p><div class="product-price-line"><strong>'+esc(productPriceLabel(p))+'</strong>'+oldPrice+'</div><button class="secondary-btn product-cta" data-id="'+p.id+'">مشاهده مشخصات و شرایط <span data-icon="arrow-left"></span></button></div></article>';
 }).join("");
 grid.querySelectorAll(".product-cta").forEach(b=>b.onclick=()=>showProduct(b.dataset.id));refreshIcons();
}
function showProduct(id){
 const p=state.products.find(x=>x.id===id);if(!p)return;
 const specs=p.specifications&&typeof p.specifications==="object"?Object.entries(p.specifications):[];
 const specHtml=specs.length?'<div class="product-spec-grid">'+specs.map(([k,v])=>'<div><small>'+esc(k)+'</small><b>'+esc(v)+'</b></div>').join("")+'</div>':"";
 const image=p.image_url?'<div class="product-detail-visual"><img src="'+esc(p.image_url)+'" alt="'+esc(p.title)+'"></div>':'';
 const oldPrice=p.compare_at_price?'<del>'+Number(p.compare_at_price).toLocaleString("fa-IR")+' تومان</del>':"";
 openModal('<span class="eyebrow">فروشگاه حورانت۲۴ · '+esc(p.category?.title||productTypeLabel(p.product_type))+'</span><h2 id="modalTitle">'+esc(p.title)+'</h2>'+image+'<p>'+esc(p.description||p.summary||"برای دریافت اطلاعات بیشتر پیام دهید.")+'</p><div class="product-detail-price"><b>'+esc(productPriceLabel(p))+'</b>'+oldPrice+'<span class="product-stock '+esc(p.stock_status||"inquiry")+'">'+productStockLabel(p.stock_status)+'</span></div>'+specHtml+'<div class="notice-box">قیمت و موجودی کالا پیش از سفارش تأیید می‌شود. برای محصولات فیزیکی، شرایط ارسال و گارانتی نیز استعلام خواهد شد. فایل‌های دیجیتال پس از هماهنگی از پشتیبانی دریافت می‌شوند؛ پرداخت و ثبت سفارش در این سایت انجام نمی‌شود.</div><button class="primary-btn full" id="productRequest">استعلام و درخواست دریافت</button>');
 $("productRequest").onclick=()=>showContactOptions("product",p.title);
}
async function loadContent(){
 try{
  const [cats,services,productCats,products]=await Promise.all([
   state.client.from("service_categories").select("id,title,slug,icon").eq("is_active",true).order("sort_order"),
   state.client.from("services").select("id,title,slug,summary,description,required_documents,steps,price_label,is_time_limited,registration_deadline,category:service_categories(title,slug)").eq("is_active",true).order("sort_order"),
   state.client.from("product_categories").select("id,title,slug,description,icon").eq("is_active",true).order("sort_order"),
   state.client.from("products").select("id,title,slug,summary,description,price,price_label,compare_at_price,image_url,product_type,category_id,category:product_categories(title,slug),stock_quantity,stock_status,badge,specifications,is_featured,is_new,sort_order,created_at").eq("is_active",true).order("sort_order")
  ]);
  if(cats.error)throw cats.error;if(services.error)throw services.error;if(productCats.error)throw productCats.error;if(products.error)throw products.error;
  state.categories=cats.data||[];state.services=services.data||[];state.productCategories=productCats.data||[];state.products=products.data||[];
  renderCategories();renderServices();renderProductCategories();renderProducts();
  const grid=$("serviceGrid");if(grid)grid.setAttribute("aria-busy","false");
 }catch(e){console.error(e);$("serviceStatus").textContent="دریافت فهرست خدمات با خطا روبه‌رو شد. لطفاً کمی بعد دوباره تلاش کنید.";$("serviceGrid").innerHTML='<div class="empty-state">اتصال به فهرست خدمات برقرار نشد.</div>';const products=$("productGrid");if(products)products.innerHTML='<div class="empty-state">فروشگاه موقتاً در دسترس نیست. کمی بعد دوباره تلاش کن.</div>';}
}
let optionalHomeContentLoaded=false;
async function loadOptionalHomeContent(){
 if(optionalHomeContentLoaded||!state.client)return;
 optionalHomeContentLoaded=true;
 const [stories,posts,challenges]=await Promise.all([
  state.client.from("stories").select("id,title,media_url,media_type,link_url").eq("is_published",true).order("sort_order"),
  state.client.from("explore_posts").select("id,title,caption,media_url,media_type,category").eq("is_published",true).order("published_at",{ascending:false}),
  state.client.from("challenges").select("id,title,description,points_reward,ends_at").eq("is_active",true).order("created_at",{ascending:false})
 ]);
 if(!stories.error)renderStories(stories.data||[]);
 if(!posts.error)renderExplore(posts.data||[]);
 if(!challenges.error)renderChallenges(challenges.data||[]);
}
function observeOptionalContent(){
 const targets=[$("storyRow"),$("exploreGrid"),$("challengeList")].filter(Boolean);
 if(!("IntersectionObserver"in window)||!targets.length){loadOptionalHomeContent();return;}
 const observer=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();loadOptionalHomeContent();}
 },{rootMargin:"250px 0px"});
 targets.forEach(target=>observer.observe(target));
}
function renderStories(items){const row=$("storyRow"); if(!items.length){row.innerHTML='<span class="section-note">استوری تازه‌ای منتشر نشده است.</span>';return;} row.innerHTML=items.map(s=>'<button class="story-item" data-link="'+esc(s.link_url||"")+'"><span class="story-ring">'+(s.media_type==="video"?iconSvg("play"):iconSvg("sparkles"))+'</span><small>'+esc(s.title)+'</small></button>').join("");row.querySelectorAll(".story-item").forEach(b=>b.onclick=()=>b.dataset.link?showContactOptions("contact",b.querySelector("small")?.textContent||"مشاهده استوری"):toast("جزئیات این استوری در حال آماده‌سازی است."));refreshIcons();}
function renderExplore(items){const grid=$("exploreGrid");if(!items.length){grid.innerHTML='<div class="empty-state">محتوای آموزشی و ویدئویی هنوز منتشر نشده است.</div>';return;}grid.innerHTML=items.map(p=>'<article class="explore-card">'+(p.media_url?'<img src="'+esc(p.media_url)+'" alt="'+esc(p.title)+'" loading="lazy">':'<div class="explore-placeholder">'+iconSvg("book-open-check")+'</div>')+'<div><b>'+esc(p.title)+'</b><p>'+esc(p.caption||"")+'</p></div></article>').join("");refreshIcons();}
function renderChallenges(items){const el=$("challengeList");if(!items.length){el.innerHTML='<div class="empty-state">چالش فعالی وجود ندارد.</div>';return;}el.innerHTML=items.map(c=>'<article class="challenge-card"><div><b>'+esc(c.title)+'</b><p>'+esc(c.description||"")+'</p></div><strong>'+Number(c.points_reward||0).toLocaleString("fa-IR")+' امتیاز</strong></article>').join("");}
const AUTH_SITE_URL="https://horanet24.ir/";
function showLogin(){window.location.href="./login.html?next=account";}
async function loadAccount(){
 const card=$("accountCard");
 if(!state.session){
  state.profileCache=null;
  card.innerHTML='<div class="account-welcome"><span class="account-welcome-icon"><i data-lucide="user-round"></i></span><div><b>فضای شخصی حورانت۲۴</b><p>برای ساخت پروفایل، ذخیره علاقه‌مندی‌ها و دریافت کد مشتری وارد حساب خود شوید.</p></div><button class="primary-btn" id="loginBtn">ورود / عضویت</button></div>';
  $("loginBtn").onclick=showLogin;refreshIcons();return;
 }
 const user=state.session.user;let profile=state.profileCache;
 if(!profile){
  const {data,error}=await state.client.from("profiles").select("full_name,phone,birth_date,customer_code,points_balance,referral_code,created_at").eq("id",user.id).maybeSingle();
  if(error)console.warn("Profile load:",error.message);
  profile=data||null;
  if(!profile){await ensureProfile(user);const retry=await state.client.from("profiles").select("full_name,phone,birth_date,customer_code,points_balance,referral_code,created_at").eq("id",user.id).maybeSingle();profile=retry.data||null;}
  state.profileCache=profile;
 }
 const name=profile?.full_name||user.user_metadata?.full_name||user.email?.split("@")[0]||"کاربر حورانت";
 const joined=new Date(profile?.created_at||user.created_at).toLocaleDateString("fa-IR",{year:"numeric",month:"long",day:"numeric"});
 const points=Number(profile?.points_balance||0).toLocaleString("fa-IR");
 const customerCode=profile?.customer_code||"در حال تخصیص";
 const phone=profile?.phone||"ثبت نشده";
 const birth=profile?.birth_date?new Date(profile.birth_date+"T12:00:00").toLocaleDateString("fa-IR"):"ثبت نشده";
 const favorites=state.services.filter(s=>state.favorites.has(s.id));
 const completion=[!!(profile?.full_name||user.user_metadata?.full_name),!!profile?.phone,!!profile?.birth_date].filter(Boolean).length;
 const percent=Math.round(completion/3*100);
 const avatarLetter=Array.from(name.trim())[0]||"ح";
 const favoriteMarkup=favorites.length?favorites.map(s=>'<button class="profile-favorite-item" data-service-id="'+esc(s.id)+'"><span class="profile-favorite-icon">'+categoryIcon(s.category_slug||s.category?.slug||"",s.slug||"")+'</span><span class="profile-favorite-copy"><b>'+esc(s.title)+'</b><small>'+esc(s.summary||"مشاهده جزئیات خدمت")+'</small></span><i data-lucide="chevron-left"></i></button>').join(""):'<div class="profile-empty"><i data-lucide="bookmark"></i><b>هنوز موردی ذخیره نکرده‌اید</b><p>در صفحه خدمات، موارد دلخواهتان را با علامت نشانک ذخیره کنید.</p><button class="secondary-btn" id="browseServicesBtn">مشاهده خدمات</button></div>';
 const referral=profile?.referral_code?'<div class="profile-referral-code" dir="ltr">'+esc(profile.referral_code)+'</div><button class="profile-copy-btn" id="copyReferralBtn"><i data-lucide="copy"></i> کپی کد دعوت</button>':'<span class="profile-muted">کد دعوت پس از فعال‌سازی این قابلیت نمایش داده می‌شود.</span>';
 card.innerHTML=
 '<div class="profile-dashboard">'+
  '<section class="profile-hero-card"><div class="profile-hero-glow"></div><div class="profile-hero-top"><span class="profile-status"><i></i> حساب کاربری فعال</span><button class="profile-edit-quick" id="editProfileTop"><i data-lucide="pencil"></i> ویرایش پروفایل</button></div>'+
   '<div class="profile-main-identity"><span class="profile-avatar">'+esc(avatarLetter)+'</span><div><span class="profile-hello">خوش آمدید</span><h3>'+esc(name)+'</h3><p dir="ltr">'+esc(user.email||"ایمیل ثبت نشده")+'</p></div></div>'+
   '<div class="profile-member-line"><span><i data-lucide="calendar-days"></i> عضویت از '+esc(joined)+'</span><span><i data-lucide="shield-check"></i> حساب امن</span></div></section>'+
  '<div class="profile-stats-grid"><article class="profile-stat"><span class="profile-stat-icon points"><i data-lucide="medal"></i></span><div><strong>'+points+'</strong><small>امتیاز مشتری</small></div></article><article class="profile-stat"><span class="profile-stat-icon saved"><i data-lucide="bookmark"></i></span><div><strong>'+favorites.length.toLocaleString("fa-IR")+'</strong><small>علاقه‌مندی‌ها</small></div></article><article class="profile-stat"><span class="profile-stat-icon complete"><i data-lucide="user-round-check"></i></span><div><strong>'+percent.toLocaleString("fa-IR")+'٪</strong><small>تکمیل پروفایل</small></div></article></div>'+
  '<div class="profile-content-grid"><section class="profile-panel profile-personal"><div class="profile-panel-head"><div><span class="eyebrow">اطلاعات حساب</span><h3>مشخصات شخصی</h3></div><button class="profile-icon-action" id="editProfileBtn" aria-label="ویرایش مشخصات"><i data-lucide="pencil"></i></button></div>'+
   '<div class="profile-info-list"><div><small>نام و نام خانوادگی</small><b>'+esc(profile?.full_name||"تکمیل نشده")+'</b></div><div><small>شماره همراه</small><b dir="ltr">'+esc(phone)+'</b></div><div><small>تاریخ تولد</small><b>'+esc(birth)+'</b></div><div><small>ایمیل حساب</small><b dir="ltr">'+esc(user.email||"ثبت نشده")+'</b></div></div>'+
   '<div class="profile-completion"><div><span>تکمیل اطلاعات پروفایل</span><b>'+percent.toLocaleString("fa-IR")+'٪</b></div><span class="profile-progress"><i style="width:'+percent+'%"></i></span><small>با تکمیل شماره همراه و تاریخ تولد، اطلاعات حساب شما کامل‌تر می‌شود.</small></div></section>'+
  '<section class="profile-panel profile-customer"><div class="profile-panel-head"><div><span class="eyebrow">شناسه اختصاصی</span><h3>کد مشتری شما</h3></div><span class="profile-code-icon"><i data-lucide="fingerprint"></i></span></div><p>برای پیگیری سریع‌تر در ارتباط با پشتیبانی، این کد را همراه داشته باشید.</p><div class="profile-customer-code" dir="ltr">'+esc(customerCode)+'</div><button class="profile-copy-btn" id="copyCustomerBtn"><i data-lucide="copy"></i> کپی کد مشتری</button><div class="profile-referral"><div><b>کد دعوت دوستان</b><small>دعوت دوستان در حساب شما</small></div>'+referral+'</div></section></div>'+
  '<section class="profile-panel profile-favorites"><div class="profile-panel-head"><div><span class="eyebrow">انتخاب‌های شما</span><h3>علاقه‌مندی‌ها</h3></div><span class="profile-count">'+favorites.length.toLocaleString("fa-IR")+' مورد</span></div><div class="profile-favorite-list">'+favoriteMarkup+'</div></section>'+
  '<div class="profile-support-grid"><button class="profile-support-card" id="profileSupportBtn"><span><i data-lucide="headset"></i></span><div><b>پشتیبانی و راهنمایی</b><small>ارتباط از طریق ایتا یا تلگرام</small></div><i data-lucide="arrow-up-left"></i></button><div class="profile-support-card profile-request-note"><span><i data-lucide="clipboard-list"></i></span><div><b>پیگیری درخواست خدمات</b><small>ثبت و پیگیری درخواست از طریق پیام‌رسان انجام می‌شود؛ سابقه‌ای در سایت ثبت نمی‌شود.</small></div></div></div>'+
  '<div class="profile-footer-actions"><span><i data-lucide="lock-keyhole"></i> اطلاعات حساب شما فقط برای ارائه خدمات حورانت۲۴ استفاده می‌شود.</span><button id="logoutBtn"><i data-lucide="log-out"></i> خروج از حساب</button></div>'+
 '</div>';
 refreshIcons();
 $("editProfileBtn").onclick=()=>editAccountProfile(profile,user);
 $("editProfileTop").onclick=()=>editAccountProfile(profile,user);
 $("copyCustomerBtn").onclick=()=>{if(customerCode==="در حال تخصیص"){toast("کد مشتری هنوز تخصیص داده نشده است.");return;}navigator.clipboard?.writeText(customerCode).then(()=>toast("کد مشتری کپی شد.")).catch(()=>toast("کپی خودکار در این مرورگر در دسترس نیست."));};
 const referralBtn=$("copyReferralBtn");if(referralBtn)referralBtn.onclick=()=>navigator.clipboard?.writeText(profile.referral_code).then(()=>toast("کد دعوت کپی شد.")).catch(()=>toast("کپی خودکار در دسترس نیست."));
 $("profileSupportBtn").onclick=()=>showContactOptions("contact","پشتیبانی حساب کاربری");
 const browse=$("browseServicesBtn");if(browse)browse.onclick=()=>showView("services");
 document.querySelectorAll(".profile-favorite-item").forEach(btn=>btn.onclick=()=>showService(btn.dataset.serviceId));
 $("logoutBtn").onclick=async()=>{await state.client.auth.signOut();state.session=null;state.profileCache=null;state.favorites.clear();loadAccount();toast("از حساب خارج شدید.");};
}

function editAccountProfile(profile,user){
 const currentName=profile?.full_name||user.user_metadata?.full_name||"";
 const currentPhone=profile?.phone||"",currentBirth=profile?.birth_date||"";
 openModal('<span class="eyebrow">اطلاعات حساب</span><h2 id="modalTitle">ویرایش اطلاعات شخصی</h2><form id="profileEditForm" class="app-form"><label>نام و نام خانوادگی</label><input name="full_name" maxlength="100" value="'+esc(currentName)+'" required><label>شماره همراه</label><input name="phone" type="tel" inputmode="tel" maxlength="20" value="'+esc(currentPhone)+'" placeholder="09..."><label>تاریخ تولد</label><input name="birth_date" type="date" value="'+esc(currentBirth)+'"><button class="primary-btn full" type="submit">ذخیره اطلاعات</button><p id="profileSaveMessage" class="micro-note"></p></form>');
 $("profileEditForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="در حال ذخیره...";const payload={full_name:f.elements.full_name.value.trim(),phone:f.elements.phone.value.trim()||null,birth_date:f.elements.birth_date.value||null,updated_at:new Date().toISOString()};const {error}=await state.client.from("profiles").update(payload).eq("id",user.id);if(error){$("profileSaveMessage").textContent="ذخیره ناموفق: "+error.message;btn.disabled=false;btn.textContent="ذخیره اطلاعات";return;}state.profileCache=null;closeModal();await loadAccount();toast("اطلاعات حساب به‌روزرسانی شد.");};
}
async function loadFavorites(){if(!state.session)return;const {data,error}=await state.client.from("favorites").select("service_id").eq("user_id",state.session.user.id);if(!error)(data||[]).forEach(x=>state.favorites.add(x.service_id));}

function initContactChat(){
 const messages=$("faqChatMessages"),suggestions=$("faqChatSuggestions");
 if(!messages||!suggestions||messages.dataset.ready)return;
 messages.dataset.ready="1";
 const answers={
  services:{q:"چه خدماتی ارائه می‌کنید؟",a:"حورانت۲۴ راهنمای خدمات خودرو، بیمه، امور اداری، کسب‌وکار و کارت‌خوان است. فهرست خدمات و جزئیات هرکدام را از بخش «خدمات» ببین؛ خدمات قابل ارائه ممکن است با توجه به شرایط هر پرونده متفاوت باشد.",next:"مشاهده خدمات"},
  documents:{q:"مدارک لازم را از کجا ببینم؟",a:"وارد بخش «خدمات» شو و خدمت موردنظرت را انتخاب کن. در صفحه جزئیات هر خدمت، مدارک موردنیاز و مراحل انجام آن درج شده است. اگر شرایط پرونده‌ات خاص است، از پشتیبانی سؤال کن.",next:"پشتیبانی درباره مدارک"},
  request:{q:"چطور درخواست ثبت کنم؟",a:"پس از انتخاب خدمت و مطالعه مدارک و مراحل، دکمه «ثبت درخواست» را بزن و ایتا یا تلگرام را انتخاب کن. ادامه هماهنگی و ثبت درخواست در گفت‌وگوی پیام‌رسان انجام می‌شود؛ سایت فرم ثبت سفارش ندارد.",next:"شروع ثبت درخواست"},
  payment:{q:"هزینه و پرداخت چگونه است؟",a:"هزینه به نوع خدمت و شرایط پرونده بستگی دارد. مبلغ و روش پرداخت باید پیش از شروع کار و از طریق پشتیبانی اعلام و تأیید شود. تا پیش از دریافت اطلاعات روشن، پرداختی انجام نده.",next:"استعلام هزینه"},
  tracking:{q:"چطور پیگیری کنم؟",a:"برای پیگیری، از همان پیام‌رسانی که درخواستت را در آن مطرح کرده‌ای ادامه بده و در صورت امکان کد مشتری یا اطلاعات اولیه درخواست را برای پشتیبانی بفرست. سابقه درخواست‌ها در سایت ذخیره نمی‌شود.",next:"پیگیری با پشتیبانی"},
  online:{q:"خدمات در سراسر ایران ارائه می‌شود؟",a:"حورانت۲۴ راهنمای خدمات آنلاین را برای کاربران سراسر ایران فراهم می‌کند. امکان انجام هر خدمت به مقررات، شهر محل انجام و شرایط پرونده بستگی دارد؛ پیش از اقدام از پشتیبانی تأیید بگیر.",next:"بررسی امکان انجام خدمت"},
  account:{q:"کد مشتری و حساب کاربری چیست؟",a:"با ورود به حساب کاربری می‌توانی اطلاعات پروفایل، کد مشتری و علاقه‌مندی‌ها را ببینی. کد مشتری را هنگام ارتباط با پشتیبانی اعلام کن تا شناسایی و راهنمایی آسان‌تر شود.",next:"ورود به حساب کاربری"},
  human:{q:"می‌خواهم با پشتیبان صحبت کنم.",a:"حتماً. برای ارتباط مستقیم، یکی از دو راه ارتباطی ایتا یا تلگرام را از بخش کنار گفت‌وگو انتخاب کن. پیام تو مستقیماً در پیام‌رسان ارسال می‌شود.",next:"ارتباط با پشتیبانی"}
 };
 function addMessage(kind,html){
  const row=document.createElement("div");row.className="faq-chat-message "+kind;
  if(kind==="assistant"){const avatar=document.createElement("span");avatar.className="faq-message-avatar";avatar.innerHTML='<i data-lucide="sparkles"></i>';row.append(avatar);}
  const bubble=document.createElement("div");bubble.className="faq-bubble";bubble.innerHTML=html;row.append(bubble);messages.append(row);messages.scrollTop=messages.scrollHeight;refreshIcons();
 }
 function showFaq(key){
  const item=answers[key];if(!item)return;
  addMessage("user","<p>"+esc(item.q)+"</p>");
  addMessage("assistant","<p>"+esc(item.a)+"</p><small>راهنمای حورانت۲۴</small>");
  if(key==="human")return;
  const action=document.createElement("button");action.type="button";action.className="faq-answer-action";action.textContent=item.next;
  action.addEventListener("click",()=>{
   if(key==="account"){showView("account");return;}
   if(key==="services"){showView("services");return;}
   const context=({documents:"راهنمای مدارک",request:"ثبت درخواست",payment:"استعلام هزینه",tracking:"پیگیری درخواست",online:"بررسی امکان ارائه خدمت"}[key]||item.next);
   showContactOptions(key==="request"?"request":"contact",context);
  });
  const row=document.createElement("div");row.className="faq-chat-message assistant faq-action-row";const spacer=document.createElement("span");spacer.className="faq-message-avatar";row.append(spacer,action);messages.append(row);messages.scrollTop=messages.scrollHeight;
 }
 suggestions.addEventListener("click",event=>{const button=event.target.closest("[data-faq]");if(!button)return;showFaq(button.dataset.faq);});
 $("contactEitaaBtn")?.addEventListener("click",()=>showContactOptions("contact","پشتیبانی حورانت۲۴ در ایتا"));
 $("contactTelegramBtn")?.addEventListener("click",()=>showContactOptions("contact","پشتیبانی حورانت۲۴ در تلگرام"));
}

function showView(name){
 const allowed=["home","services","products","account","contact"];
 const view=allowed.includes(name)?name:"home";
 document.querySelectorAll("[data-app-view]").forEach(el=>{el.hidden=el.dataset.appView!==view;});
 document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("selected",el.dataset.view===view));
 document.querySelectorAll(".desktop-nav [data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
 document.body.dataset.activeView=view;
 if(view==="services")renderServices();
 if(view==="account")loadAccount();
 // Keep tab navigation in place; no page jump or anchor scrolling.
}
function initThemeAndMusic(){
 const themeButton=$("themeToggle"),soundButton=$("soundToggle"),musicButton=$("musicToggle"),root=document.documentElement;
 const applyTheme=theme=>{
  const mode=theme==="dark"?"dark":"light";
  root.dataset.theme=mode;
  if(themeButton){themeButton.innerHTML='<span data-icon="'+(mode==="dark"?"sun":"moon")+'"></span>';themeButton.setAttribute("aria-label",mode==="dark"?"فعال‌کردن حالت روشن":"فعال‌کردن حالت تاریک");themeButton.title=mode==="dark"?"حالت روشن":"حالت تاریک";}
  try{localStorage.setItem("h24-theme",mode);}catch(_){}
  refreshIcons();
 };
 let saved="light";try{saved=localStorage.getItem("h24-theme")||"light";}catch(_){}
 applyTheme(saved);
 if(themeButton)themeButton.onclick=()=>applyTheme(root.dataset.theme==="dark"?"light":"dark");
 try{h24UiSoundsEnabled=localStorage.getItem("h24-ui-sounds")!=="off";}catch(_){}
 function paintSoundButton(){
  if(!soundButton)return;
  soundButton.innerHTML='<span data-icon="'+(h24UiSoundsEnabled?"volume-2":"volume-x")+'"></span>';
  soundButton.setAttribute("aria-label",h24UiSoundsEnabled?"خاموش‌کردن صداهای لمس و کلیک":"روشن‌کردن صداهای لمس و کلیک");
  soundButton.title=h24UiSoundsEnabled?"صداهای رابط کاربری روشن":"صداهای رابط کاربری خاموش";
  soundButton.setAttribute("aria-pressed",String(h24UiSoundsEnabled));
  refreshIcons();
 }
 paintSoundButton();
 if(soundButton)soundButton.onclick=()=>{
  h24UiSoundsEnabled=!h24UiSoundsEnabled;
  try{localStorage.setItem("h24-ui-sounds",h24UiSoundsEnabled?"on":"off");}catch(_){}
  paintSoundButton();
 };
 let audio=null,musicTimer=null,musicOn=false,musicBusy=false,musicIndex=0;
 const musicNodes=new Set();
 const melody=[587.33,739.99,880,739.99,659.25,587.33,493.88,587.33,659.25,739.99,880,739.99,659.25,587.33,493.88,440,493.88,587.33,659.25,587.33,493.88,440,493.88,587.33,659.25,783.99,880,783.99,698.46,659.25,587.33,659.25,739.99,880,987.77,880,783.99,739.99,659.25,587.33,523.25,587.33,659.25,739.99,659.25,587.33,493.88,587.33];
 const chords=[[146.83,220,293.66,369.99],[123.47,185,246.94,293.66],[98,146.83,196,246.94],[110,164.81,220,293.66]];
 function note(freq,when,duration,volume,type="sine"){
  const osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,when);
  gain.gain.setValueAtTime(.0001,when);
  gain.gain.exponentialRampToValueAtTime(volume,when+.08);
  gain.gain.setValueAtTime(volume,when+Math.max(.09,duration-.12));
  gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(gain);gain.connect(audio.destination);
  musicNodes.add(osc);osc.onended=()=>musicNodes.delete(osc);
  osc.start(when);osc.stop(when+duration+.03);
 }
 function stopMusicNodes(){for(const node of musicNodes){try{node.stop();}catch(_){}}musicNodes.clear();}
 function playMusicStep(){
  if(!audio||!musicOn)return;
  const freq=melody[musicIndex];
  const when=audio.currentTime+.035;
  note(freq,when,.53,.018,"sine");
  note(freq,when,.48,.005,"triangle");
  if(musicIndex%6===0){
   const chord=chords[Math.floor(musicIndex/6)%chords.length];
   chord.forEach(hz=>note(hz,when,3.35,.0035,"sine"));
  }
  musicIndex=(musicIndex+1)%melody.length;
  musicTimer=setTimeout(()=>{musicTimer=null;playMusicStep();},620);
 }
 function paintMusicButton(){
  if(!musicButton)return;
  musicButton.innerHTML='<span data-icon="'+(musicOn?"pause":"play")+'"></span>';
  musicButton.setAttribute("aria-label",musicOn?"توقف موسیقی اختصاصی حورانت۲۴":"پخش موسیقی اختصاصی حورانت۲۴");
  musicButton.title=musicOn?"توقف موسیقی":"پخش موسیقی حورانت۲۴";
  musicButton.setAttribute("aria-pressed",String(musicOn));
  refreshIcons();
 }
 async function toggleMusic(){
  if(musicBusy)return;
  musicBusy=true;
  try{
   const Ctx=window.AudioContext||window.webkitAudioContext;
   if(!Ctx){toast("مرورگر شما پخش موسیقی را پشتیبانی نمی‌کند.");return;}
   if(!audio)audio=new Ctx();
   if(musicOn){
    musicOn=false;
    if(musicTimer!==null){clearTimeout(musicTimer);musicTimer=null;}
    stopMusicNodes();
    await audio.suspend();
   }else{
    await audio.resume();
    musicOn=true;
    playMusicStep();
   }
   paintMusicButton();
  }finally{musicBusy=false;}
 }
 paintMusicButton();
 if(musicButton)musicButton.onclick=()=>toggleMusic().catch(error=>{console.warn("H24 music:",error);toast("پخش موسیقی آغاز نشد.");});
}
function wire(){
 initThemeAndMusic();
 // Delegated listener covers mouse, touch and keyboard activation without per-control handlers.
 document.addEventListener("click",event=>{
  const control=event.target.closest('button,a,[role="button"],.service-live,.product-card,.nav-item,[data-home-category],[data-slide]');
  if(!control||control.disabled||control.getAttribute("aria-disabled")==="true")return;
  h24UiSound("tap");
 },{capture:true,passive:true});
 $("modalClose").onclick=closeModal;
 document.addEventListener("click",event=>{
  const infoLink=event.target.closest("[data-h24-info]");
  if(infoLink){event.preventDefault();showMembershipInfo(infoLink.dataset.h24Info);return;}
  const socialLink=event.target.closest('a[data-h24-title],a[href*="eitaa.com"],a[href*="t.me"]');
  if(socialLink&&!socialLink.closest(".contact-options")){event.preventDefault();showContactOptions("contact",socialLink.dataset.h24Title||socialLink.textContent.trim()||"ادامه در پیام‌رسان");}
 });
 $("navCoreBtn").onclick=()=>showView("contact");
 initContactChat();
 $("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
 $("serviceSearch").addEventListener("input",renderServices);
 $("productSearch")?.addEventListener("input",e=>{state.productSearch=e.target.value;renderProducts();});
 $("productSort")?.addEventListener("change",e=>{state.productSort=e.target.value;renderProducts();});
 $("productCategoryFilters")?.addEventListener("click",e=>{const b=e.target.closest("[data-product-category]");if(!b)return;state.activeProductCategory=b.dataset.productCategory;renderProductCategories();renderProducts();});
 document.querySelectorAll("[data-home-category]").forEach(btn=>btn.addEventListener("click",()=>{
  state.activeCategory=btn.dataset.homeCategory;
  $("serviceSearch").value="";
  document.querySelectorAll("#categoryRow .chip").forEach(chip=>chip.classList.toggle("active",chip.dataset.category===state.activeCategory));
  showView("services");
  $("servicesSection").scrollIntoView({behavior:"smooth",block:"start"});
 }));
 $("exploreServices").onclick=()=>showView("services");
 $("homeServicesCta")?.addEventListener("click",()=>showView("services"));
 $("homeAllServices")?.addEventListener("click",()=>{state.activeCategory="all";document.querySelectorAll("#categoryRow .chip").forEach(x=>x.classList.toggle("active",x.dataset.category==="all"));showView("services");});
 $("homeStoreCta")?.addEventListener("click",()=>showView("products"));
 $("allServices").onclick=()=>{state.activeCategory="all";document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x.dataset.category==="all"));showView("services");};
 $("searchToggle").onclick=()=>{showView("services");$("serviceSearch").focus();};
 $("assistantBtn").onclick=()=>window.openHoranetAssistant?window.openHoranetAssistant():showContactOptions("contact","پشتیبانی حورانت۲۴");
 $("profileBtn").onclick=()=>showView("account");
 document.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();showView(btn.dataset.view);}));
 $("loginBtn").onclick=showLogin;
}
async function init(){wire();refreshIcons();if(!window.supabase?.createClient){$("serviceStatus").textContent="کتابخانه ارتباط با پایگاه داده بارگذاری نشد.";return;}state.client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);window.h24Client=state.client;const {data}=await state.client.auth.getSession();state.session=data.session;if(state.session)await ensureProfile(state.session.user);await Promise.all([loadContent(),window.initHoranetSlider?window.initHoranetSlider(state.client):Promise.resolve()]);observeOptionalContent();if(state.session)await loadFavorites();loadAccount();state.client.auth.onAuthStateChange(async(_event,session)=>{state.session=session;state.profileCache=null;if(session){await ensureProfile(session.user);await loadFavorites();}else state.favorites.clear();loadAccount();});if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(console.warn);}
window.refreshH24Icons=refreshIcons;
document.addEventListener("DOMContentLoaded",init);