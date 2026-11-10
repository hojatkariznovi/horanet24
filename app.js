/* Horanet24 web app — public showcase + Supabase content */
const SUPABASE_URL = "https://iqrgqkluuhbyphtihsls.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
const $ = (id) => document.getElementById(id);
// Lightweight synthesized UI sounds: no audio files, network requests, or startup work.
let h24UiAudio=null;
function h24UiSound(kind="tap"){
 try{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;
  if(!h24UiAudio)h24UiAudio=new AudioCtx();
  const ctx=h24UiAudio;
  if(ctx.state==="suspended")ctx.resume().catch(()=>{});
  const patterns={
   tap:[[740,0,.035,.010],[990,.012,.035,.006]],
   open:[[523,0,.075,.008],[659,.035,.075,.007],[784,.07,.095,.006]],
   close:[[784,0,.055,.006],[659,.035,.055,.006],[523,.07,.075,.005]]
  };
  const now=ctx.currentTime+.012;
  (patterns[kind]||patterns.tap).forEach(([hz,offset,duration,volume])=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type="sine";osc.frequency.setValueAtTime(hz,now+offset);
   gain.gain.setValueAtTime(.0001,now+offset);
   gain.gain.exponentialRampToValueAtTime(volume,now+offset+.008);
   gain.gain.exponentialRampToValueAtTime(.0001,now+offset+duration);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(now+offset);osc.stop(now+offset+duration+.01);
  });
 }catch(_){}
}
const state = { client:null, session:null, services:[], products:[], categories:[], favorites:new Set(), activeCategory:"all", selectedService:null, profileCache:null };
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
function renderServices(){
 const q=$("serviceSearch").value.trim().toLocaleLowerCase("fa");
 const items=state.services.filter(s=>(state.activeCategory==="all"||s.category?.slug===state.activeCategory)&&(!q||(s.title+" "+(s.summary||"")).toLocaleLowerCase("fa").includes(q)));
 const grid=$("serviceGrid");
 grid.innerHTML=items.length?items.map(s=>'<article class="service-card service-live" data-id="'+s.id+'"><div class="service-card-main"><span class="service-icon">'+categoryIcon(s.category?.slug,s.slug)+'</span><span class="service-copy"><b>'+esc(s.title)+'</b><small>'+esc(s.summary||"برای آشنایی با مدارک و مراحل انتخاب کنید")+'</small></span></div><button type="button" class="service-card-action" aria-label="مشاهده جزئیات '+esc(s.title)+'">مشاهده جزئیات <span data-icon="arrow-left"></span></button></article>').join(""):'<div class="empty-state">خدمتی با این عبارت پیدا نشد.</div>';
 grid.querySelectorAll(".service-live").forEach(card=>{card.addEventListener("click",()=>showService(card.dataset.id));card.querySelector(".service-card-action").addEventListener("click",e=>{e.stopPropagation();showService(card.dataset.id);});});
 refreshIcons();
 $("serviceStatus").textContent=items.length+" خدمت در دسترس است.";
}

function showService(id){ const s=state.services.find(x=>x.id===id); if(!s)return; state.selectedService=s; const docs=Array.isArray(s.required_documents)?s.required_documents:[]; const steps=Array.isArray(s.steps)?s.steps:[]; const fav=state.favorites.has(id); openModal('<span class="eyebrow">جزئیات خدمت</span><h2 id="modalTitle">'+esc(s.title)+'</h2><p>'+esc(s.description||s.summary||"برای دریافت راهنمایی بیشتر، درخواست خود را از طریق پشتیبانی ثبت کنید.")+'</p><div class="detail-block"><b>مدارک و اطلاعات موردنیاز</b><ul>'+ (docs.length?docs.map(x=>'<li>'+esc(x)+'</li>').join(""):'<li>پس از بررسی نوع درخواست اعلام می‌شود.</li>')+'</ul></div><div class="detail-block"><b>مراحل انجام</b><ol>'+(steps.length?steps.map(x=>'<li>'+esc(x)+'</li>').join(""):'<li>ارسال درخواست در پیام‌رسان انتخابی</li><li>بررسی و اعلام مراحل</li>')+'</ol></div><div class="modal-actions"><button class="primary-btn" id="serviceRequest" type="button"><span class="service-request-label">ثبت درخواست</span><span data-icon="send"></span></button><button class="secondary-btn" id="favoriteBtn"><span data-icon="heart"></span> '+(fav?"★ حذف از علاقه‌مندی‌ها":"☆ افزودن به علاقه‌مندی‌ها")+'</button></div><p class="micro-note">پس از انتخاب ایتا یا تلگرام، درخواست خود را در پیام‌رسان انتخابی ارسال کن؛ این وب‌سایت اطلاعات یا مدارک شما را دریافت نمی‌کند.</p>'); $("serviceRequest").onclick=()=>showContactOptions("request",s.title); $("favoriteBtn").onclick=()=>toggleFavorite(id); }
async function toggleFavorite(id){ if(!state.session){toast("برای ذخیره علاقه‌مندی ابتدا وارد حساب شوید.");showLogin();return;} const exists=state.favorites.has(id); try{if(exists){const {error}=await state.client.from("favorites").delete().eq("user_id",state.session.user.id).eq("service_id",id);if(error)throw error;state.favorites.delete(id);}else{const {error}=await state.client.from("favorites").insert({user_id:state.session.user.id,service_id:id});if(error)throw error;state.favorites.add(id);} if(state.selectedService?.id===id)showService(id);toast(exists?"از علاقه‌مندی‌ها حذف شد.":"به علاقه‌مندی‌ها اضافه شد.");}catch(e){toast("ذخیره انجام نشد: "+e.message);} }
function renderProducts(){
 const grid=$("productGrid");
 if(!state.products.length){grid.innerHTML='<div class="empty-state">محصولی برای نمایش ثبت نشده است.</div>';return;}
 const glyph=p=>/plate|vehicle/i.test(p.slug||"")?iconSvg("car-front"):/fuel/i.test(p.slug||"")?iconSvg("fuel"):/business/i.test(p.slug||"")?iconSvg("briefcase-business"):iconSvg("sparkles");
 grid.innerHTML=state.products.map(p=>'<article class="product-card"><div class="product-visual">'+(p.image_url?'<img src="'+esc(p.image_url)+'" alt="'+esc(p.title)+'" loading="lazy">':'<div class="product-art"><span>'+glyph(p)+'</span></div>')+'</div><div class="product-copy"><span class="product-tag">'+(p.product_type==="digital"?"فایل و محصول دیجیتال":"محصول حورانت")+'</span><b>'+esc(p.title)+'</b><p>'+esc(p.summary||"محصول کاربردی حورانت۲۴")+'</p><strong>'+esc(p.price_label||"استعلام شرایط از پیام‌رسان دلخواه")+'</strong><button class="secondary-btn product-cta" data-id="'+p.id+'">جزئیات و دریافت <span data-icon="arrow-left"></span></button></div></article>').join("");
 grid.querySelectorAll(".product-cta").forEach(b=>b.onclick=()=>showProduct(b.dataset.id));refreshIcons();
}
function showProduct(id){
 const p=state.products.find(x=>x.id===id);if(!p)return;
 openModal('<span class="eyebrow">محصول حورانت۲۴</span><h2 id="modalTitle">'+esc(p.title)+'</h2><p>'+esc(p.description||p.summary||"برای دریافت اطلاعات بیشتر پیام دهید.")+'</p><div class="notice-box">برای استعلام موجودی، شرایط تهیه و دریافت محصول، ابتدا پیام‌رسان دلخواهت را انتخاب کن. اطلاعات و پرداخت در این سایت انجام نمی‌شود.</div><button class="primary-btn full" id="productRequest">استعلام و درخواست دریافت</button>');
 $("productRequest").onclick=()=>showContactOptions("product",p.title);
}
async function loadContent(){
 try{
  const [cats,services,products]=await Promise.all([
   state.client.from("service_categories").select("id,title,slug,icon").eq("is_active",true).order("sort_order"),
   state.client.from("services").select("id,title,slug,summary,description,required_documents,steps,price_label,category:service_categories(title,slug)").eq("is_active",true).order("sort_order"),
   state.client.from("products").select("id,title,summary,description,price_label,image_url,product_type,slug").eq("is_active",true).order("sort_order")
  ]);
  if(cats.error)throw cats.error;if(services.error)throw services.error;if(products.error)throw products.error;
  state.categories=cats.data||[];state.services=services.data||[];state.products=products.data||[];
  renderCategories();renderServices();renderProducts();
  const grid=$("serviceGrid");if(grid)grid.setAttribute("aria-busy","false");
 }catch(e){console.error(e);$("serviceStatus").textContent="دریافت فهرست خدمات با خطا روبه‌رو شد. لطفاً کمی بعد دوباره تلاش کنید.";$("serviceGrid").innerHTML='<div class="empty-state">اتصال به فهرست خدمات برقرار نشد.</div>';}
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
function showLogin(){openModal('<span class="eyebrow">ورود امن</span><h2 id="modalTitle">ورود به حورانت۲۴</h2><p>با ایمیل یا حساب گوگل وارد شوید.</p><form id="loginForm" class="app-form"><label>آدرس ایمیل</label><input type="email" name="email" placeholder="name@example.com" required autocomplete="email"><button class="primary-btn full" type="submit">ارسال لینک ورود به ایمیل</button></form><button class="secondary-btn full" type="button" id="googleLoginBtn">ورود با گوگل</button><p class="micro-note">لینک ورود به دامنه اصلی حورانت۲۴ بازمی‌گردد.</p>');$("loginForm").onsubmit=async e=>{e.preventDefault();const email=new FormData(e.currentTarget).get("email").trim();const submit=e.currentTarget.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent="در حال ارسال...";const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:AUTH_SITE_URL,shouldCreateUser:true}});if(error){submit.disabled=false;submit.textContent="ارسال لینک ورود به ایمیل";toast("ارسال لینک انجام نشد: "+error.message);return;}openModal('<span class="eyebrow">بررسی ایمیل</span><h2 id="modalTitle">لینک ورود ارسال شد</h2><p>ایمیل را باز کنید و روی لینک ورود بزنید. پس از تأیید، به سایت اصلی حورانت۲۴ بازمی‌گردید.</p><button class="secondary-btn full" id="modalDone">متوجه شدم</button>');$("modalDone").onclick=closeModal;};$("googleLoginBtn").onclick=async()=>{const {error}=await state.client.auth.signInWithOAuth({provider:"google",options:{redirectTo:AUTH_SITE_URL,queryParams:{prompt:"select_account"}}});if(error)toast("ورود با گوگل انجام نشد: "+error.message);};}
async function loadAccount(){
 const card=$("accountCard");
 if(!state.session){state.profileCache=null;card.innerHTML='<div><b>به حورانت۲۴ بپیوندید</b><p>برای ساخت حساب، ذخیره علاقه‌مندی‌ها و دریافت کد مشتری وارد شوید.</p></div><button class="primary-btn" id="loginBtn">ورود / عضویت</button>';$("loginBtn").onclick=showLogin;return;}
 const user=state.session.user;let profile=state.profileCache;
 if(!profile){const {data,error}=await state.client.from("profiles").select("full_name,phone,birth_date,customer_code,points_balance,referral_code,created_at").eq("id",user.id).maybeSingle();if(error)console.warn("Profile load:",error.message);profile=data||null;if(!profile){await ensureProfile(user);const retry=await state.client.from("profiles").select("full_name,phone,birth_date,customer_code,points_balance,referral_code,created_at").eq("id",user.id).maybeSingle();profile=retry.data||null;}state.profileCache=profile;}
 const name=profile?.full_name||user.user_metadata?.full_name||user.email||"کاربر حورانت";
 const joined=new Date(profile?.created_at||user.created_at).toLocaleDateString("fa-IR",{year:"numeric",month:"long",day:"numeric"});
 const points=Number(profile?.points_balance||0).toLocaleString("fa-IR"),customerCode=profile?.customer_code||"در حال تخصیص",phone=profile?.phone||"ثبت نشده",birth=profile?.birth_date?new Date(profile.birth_date+"T12:00:00").toLocaleDateString("fa-IR"):"ثبت نشده";
 card.innerHTML='<div class="account-profile-head"><span class="account-avatar"><i data-lucide="user-round"></i></span><div class="account-identity"><b>'+esc(name)+'</b><p>عضو حورانت۲۴ از '+esc(joined)+'</p></div><div class="account-points"><strong>'+points+'</strong><small>امتیاز</small></div></div><div class="account-details-grid"><div class="account-detail customer-code-detail"><small>کد مشتری اختصاصی</small><b dir="ltr">'+esc(customerCode)+'</b></div><div class="account-detail"><small>ایمیل حساب</small><b dir="ltr">'+esc(user.email||"ثبت نشده")+'</b></div><div class="account-detail"><small>شماره همراه</small><b dir="ltr">'+esc(phone)+'</b></div><div class="account-detail"><small>تاریخ تولد</small><b>'+esc(birth)+'</b></div></div><div class="account-actions"><button class="secondary-btn" id="editProfileBtn">ویرایش اطلاعات</button><button class="secondary-btn" id="myFavorites">علاقه‌مندی‌ها</button><button class="secondary-btn" id="logoutBtn">خروج از حساب</button></div>';
 refreshIcons();$("editProfileBtn").onclick=()=>editAccountProfile(profile,user);
 $("myFavorites").onclick=()=>{const items=state.services.filter(s=>state.favorites.has(s.id));openModal('<span class="eyebrow">حساب من</span><h2 id="modalTitle">علاقه‌مندی‌ها</h2>'+(items.length?items.map(s=>'<button class="favorite-row" data-id="'+s.id+'">'+esc(s.title)+' <span>←</span></button>').join(""):'<p>هنوز خدمتی ذخیره نکرده‌اید.</p>'));document.querySelectorAll(".favorite-row").forEach(b=>b.onclick=()=>showService(b.dataset.id));};
 $("logoutBtn").onclick=async()=>{await state.client.auth.signOut();state.session=null;state.profileCache=null;state.favorites.clear();loadAccount();toast("از حساب خارج شدید.");};
}
function editAccountProfile(profile,user){
 const currentName=profile?.full_name||user.user_metadata?.full_name||"";
 const currentPhone=profile?.phone||"",currentBirth=profile?.birth_date||"";
 openModal('<span class="eyebrow">اطلاعات حساب</span><h2 id="modalTitle">ویرایش اطلاعات شخصی</h2><form id="profileEditForm" class="app-form"><label>نام و نام خانوادگی</label><input name="full_name" maxlength="100" value="'+esc(currentName)+'" required><label>شماره همراه</label><input name="phone" type="tel" inputmode="tel" maxlength="20" value="'+esc(currentPhone)+'" placeholder="09..."><label>تاریخ تولد</label><input name="birth_date" type="date" value="'+esc(currentBirth)+'"><button class="primary-btn full" type="submit">ذخیره اطلاعات</button><p id="profileSaveMessage" class="micro-note"></p></form>');
 $("profileEditForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="در حال ذخیره...";const payload={full_name:f.elements.full_name.value.trim(),phone:f.elements.phone.value.trim()||null,birth_date:f.elements.birth_date.value||null,updated_at:new Date().toISOString()};const {error}=await state.client.from("profiles").update(payload).eq("id",user.id);if(error){$("profileSaveMessage").textContent="ذخیره ناموفق: "+error.message;btn.disabled=false;btn.textContent="ذخیره اطلاعات";return;}state.profileCache=null;closeModal();await loadAccount();toast("اطلاعات حساب به‌روزرسانی شد.");};
}
async function loadFavorites(){if(!state.session)return;const {data,error}=await state.client.from("favorites").select("service_id").eq("user_id",state.session.user.id);if(!error)(data||[]).forEach(x=>state.favorites.add(x.service_id));}
function showView(name){
 const allowed=["home","services","products","account"];
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
 const themeButton=$("themeToggle"),musicButton=$("musicToggle"),root=document.documentElement;
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
 let audio=null,musicTimer=null,musicOn=false,musicBusy=false;
 const musicNodes=new Set();
 // Original calm ambient theme. A single scheduler and tracked oscillators prevent stacked playback.
 const melody=[587.33,739.99,880,739.99,659.25,587.33,493.88,587.33,659.25,739.99,880,739.99,659.25,587.33,493.88,440,493.88,587.33,659.25,587.33,493.88,440,493.88,587.33];
 const chords=[[146.83,220,293.66,369.99],[123.47,185,246.94,293.66],[98,146.83,196,246.94],[110,164.81,220,293.66]];
 function note(freq,when,duration,volume,type="sine"){
  const osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,when);
  gain.gain.setValueAtTime(.0001,when);
  gain.gain.exponentialRampToValueAtTime(volume,when+.16);
  gain.gain.setValueAtTime(volume,when+Math.max(.17,duration-.22));
  gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
  osc.connect(gain);gain.connect(audio.destination);
  musicNodes.add(osc);osc.onended=()=>musicNodes.delete(osc);
  osc.start(when);osc.stop(when+duration+.05);
 }
 function stopMusicNodes(){
  for(const node of musicNodes){try{node.stop();}catch(_){}}
  musicNodes.clear();
 }
 function scheduleMusicLoop(){
  if(!audio||!musicOn||musicTimer!==null)return;
  const start=audio.currentTime+.18,step=.62,loopSeconds=melody.length*step;
  melody.forEach((freq,i)=>{
   const t=start+i*step;
   note(freq,t,.54,.014,"sine");
   note(freq,t,.48,.004,"triangle");
   if(i%2===0)note(freq/2,t,.68,.003,"sine");
  });
  chords.forEach((ch,i)=>ch.forEach(freq=>note(freq,start+i*step*6,step*6-.18,.0038,"sine")));
  musicTimer=setTimeout(()=>{musicTimer=null;scheduleMusicLoop();},Math.max(1000,loopSeconds*1000-180));
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
    scheduleMusicLoop();
   }
   if(musicButton){musicButton.innerHTML='<span data-icon="'+(musicOn?"pause":"volume-2")+'"></span>';musicButton.setAttribute("aria-label",musicOn?"توقف موسیقی حورانت۲۴":"پخش موسیقی حورانت۲۴");musicButton.title=musicOn?"توقف موسیقی":"پخش موسیقی حورانت۲۴";}
   refreshIcons();
  }finally{musicBusy=false;}
 }
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
 $("navCoreBtn").onclick=showContactOptions;
 $("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
 $("serviceSearch").addEventListener("input",renderServices);
 document.querySelectorAll("[data-home-category]").forEach(btn=>btn.addEventListener("click",()=>{
  state.activeCategory=btn.dataset.homeCategory;
  $("serviceSearch").value="";
  document.querySelectorAll("#categoryRow .chip").forEach(chip=>chip.classList.toggle("active",chip.dataset.category===state.activeCategory));
  showView("services");
  $("servicesSection").scrollIntoView({behavior:"smooth",block:"start"});
 }));
 $("exploreServices").onclick=()=>showView("services");
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