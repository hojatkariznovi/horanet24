const SUPABASE_URL="https://iqrgqkluuhbyphtihsls.supabase.co";
const SUPABASE_KEY="sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const state={session:null,admin:false,tab:"dashboard",customerPage:1,customerQuery:"",customers:[],selectedCustomer:null,categories:[],productCategories:[],items:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const el=$("adminToast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800);}
function show(id,on=true){$(id).hidden=!on;}
function values(){return Object.fromEntries(new FormData($("contentForm")).entries());}
function reset(){
 const f=$("contentForm");f.reset();f.elements.id.value="";f.elements.sort_order.value="0";f.elements.is_active.checked=true;
 if(f.elements.stock_quantity)f.elements.stock_quantity.value="0";
 if(f.elements.stock_status)f.elements.stock_status.value="inquiry";
  if(f.elements.is_time_limited)f.elements.is_time_limited.checked=false;if(f.elements.registration_deadline)f.elements.registration_deadline.value="";$("timeLimitFields").hidden=true;
 $("formTitle").textContent=state.tab==="services"?"افزودن خدمت":state.tab==="products"?"افزودن محصول":(state.tab==="product_categories"||state.tab==="service_categories")?"افزودن دسته‌بندی":"افزودن اسلاید";
 $("saveMessage").textContent="";
}
function setTab(tab){
 state.tab=tab;
 const dashboard=tab==="dashboard",customers=tab==="customers",referrals=tab==="referrals",customerAudit=tab==="customer_audit",customerDetail=tab==="customer_detail",leads=tab==="assistant_leads",slide=tab==="hero_slides",service=tab==="services",product=tab==="products",story=tab==="stories",explore=tab==="explore_posts",challenge=tab==="challenges",category=tab==="product_categories"||tab==="service_categories";
 show("adminOverview",dashboard);show("customersPanel",customers);show("referralsAdminPanel",referrals);show("customerAuditPanel",customerAudit);show("customerDetailPanel",customerDetail);show("assistantLeadsPanel",leads);
 document.querySelector(".admin-layout").hidden=leads||dashboard||customers||referrals||customerAudit||customerDetail;
 document.querySelector(".premium-settings").hidden=!dashboard;
 document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 show("serviceFields",service);show("timeLimitFields",false);show("productFields",product);show("slideFields",slide);show("categoryFields",category);show("storyFields",story);show("exploreFields",explore);show("challengeFields",challenge);
 const f=$("contentForm");
 const special=story||explore||challenge;
 ["title","slug"].forEach(n=>{f.elements[n].disabled=slide||leads||special;f.elements[n].required=!slide&&!leads&&!special;});
 ["summary","description"].forEach(n=>{f.elements[n].disabled=slide||category||leads||special;});
 ["is_time_limited","registration_deadline"].forEach(n=>{if(f.elements[n])f.elements[n].disabled=!service;});
 $("categorySelect").disabled=!service;$("productCategorySelect").disabled=!product;
 if(f.elements.slide_title){f.elements.slide_title.required=slide;f.elements.slide_title.disabled=!slide;}
 ["slide_description","eyebrow","badge_label","button_text","button_url","slide_image_url"].forEach(n=>{if(f.elements[n])f.elements[n].disabled=!slide;});
 ["price","compare_at_price","price_label","image_url","image_upload","file_upload","product_type","productCategorySelect","sku","stock_quantity","stock_status","badge","specifications_text","file_path","file_name","file_size","product_is_featured","product_is_new"].forEach(n=>{if(f.elements[n])f.elements[n].disabled=!product;});
 if(f.elements.category_icon)f.elements.category_icon.disabled=!category;
 if(f.elements.category_description)f.elements.category_description.disabled=!category;
 ["story_title","story_media_url","story_media_type","story_link_url","story_expires_at","story_published"].forEach(n=>{if(f.elements[n])f.elements[n].disabled=!story;});
 ["explore_title","explore_caption","explore_media_url","explore_media_type","explore_category","explore_published"].forEach(n=>{if(f.elements[n])f.elements[n].disabled=!explore;});
 ["challenge_title","challenge_description","points_reward","challenge_starts_at","challenge_ends_at","challenge_active"].forEach(n=>{if(f.elements[n])f.elements[n].disabled=!challenge;});
 if(category){f.elements.description.disabled=false;}
 $("formEyebrow").textContent=service?"مدیریت خدمات":product?"مدیریت محصولات":category?(tab==="product_categories"?"مدیریت دسته‌بندی فروشگاه":"مدیریت دسته‌بندی خدمات"):story?"مدیریت استوری‌ها":explore?"مدیریت اکسپلور":challenge?"مدیریت چالش‌ها":"مدیریت اسلایدر";
 $("listTitle").textContent=service?"فهرست خدمات":product?"فهرست محصولات":category?(tab==="product_categories"?"دسته‌بندی‌های فروشگاه":"دسته‌بندی‌های خدمات"):story?"فهرست استوری‌ها":explore?"فهرست اکسپلور":challenge?"فهرست چالش‌ها":"اسلایدها و بنرها";
 reset();if(!dashboard&&!leads&&!customers&&!customerAudit&&!customerDetail)loadItems();if(leads)loadAssistantLeads();if(dashboard)loadDashboard();if(customers)loadCustomers();if(referrals)loadReferralAdmin();if(customerAudit)loadCustomerAudit();
}
async function customerAdminCall(body){
 const {data,error}=await db.functions.invoke("horanet-customer-admin",{body});
 if(error)throw new Error(error.message||"ارتباط با سرویس مدیریت مشتری ناموفق بود.");
 if(data?.error)throw new Error(data.error);
 return data;
}
const faNum=n=>Number(n||0).toLocaleString("fa-IR");
function fmtDate(v){return v?new Date(v).toLocaleString("fa-IR"):"ثبت نشده";}
async function loadCustomers(){
 const list=$("customersList");list.innerHTML='<div class="empty-state">در حال دریافت کاربران...</div>';
 try{
  const data=await customerAdminCall({action:"list",page:state.customerPage,perPage:20,query:state.customerQuery});
  state.customers=data.users||[];
  $("customerTotal").textContent=faNum(data.total);$("customerVisible").textContent=faNum(state.customers.length);
  $("customerVerified").textContent=faNum(state.customers.filter(u=>u.email_confirmed_at||u.phone_confirmed_at).length);
  $("customerBanned").textContent=faNum(state.customers.filter(u=>u.banned_until&&new Date(u.banned_until)>new Date()).length);
  $("customerPageLabel").textContent="صفحه "+faNum(state.customerPage)+" · "+faNum(data.total)+" نتیجه";
  $("customerPrev").disabled=state.customerPage<=1;$("customerNext").disabled=state.customerPage*20>=data.total;
  $("customerStatus").textContent=data.searchLimited?"جست‌وجو در بیش از ۱۰۰۰ حساب به بخش‌های بعدی نیاز دارد.":"فهرست از اطلاعات احراز هویت و پروفایل همگام شده است.";
  if(!state.customers.length){list.innerHTML='<div class="empty-state">کاربری با این مشخصات پیدا نشد.</div>';return;}
  list.innerHTML=state.customers.map(u=>'<article class="customer-row"><div class="customer-avatar">'+esc((u.full_name||u.email||"؟").trim().slice(0,1))+'</div><div class="customer-row-main"><b>'+esc(u.full_name||"بدون نام")+'</b><small>'+esc(u.email||u.phone||"بدون راه ارتباطی")+' · '+esc(u.customer_code||"بدون کد مشتری")+'</small><small>عضویت: '+fmtDate(u.created_at)+' · امتیاز: '+faNum(u.points_balance)+'</small></div><div class="customer-row-tags">'+(u.is_admin?'<span class="customer-tag admin">مدیر</span>':"")+(u.banned_until&&new Date(u.banned_until)>new Date()?'<span class="customer-tag banned">مسدود</span>':'<span class="customer-tag">فعال</span>')+'</div><button class="secondary-btn" type="button" data-customer-detail="'+u.id+'">پرونده مشتری</button></article>').join("");
  list.querySelectorAll("[data-customer-detail]").forEach(b=>b.onclick=()=>openCustomerDetail(b.dataset.customerDetail));
 }catch(e){list.innerHTML='<div class="empty-state">دریافت کاربران ناموفق بود: '+esc(e.message)+'</div>';$("customerStatus").textContent="سرویس مدیریت مشتری در دسترس نیست.";}
}
async function openCustomerDetail(id){
 try{
  const d=await customerAdminCall({action:"detail",userId:id});state.selectedCustomer=d;
  const u=d.user,p=d.profile||{};
  $("customerDetailName").textContent=p.full_name||u.email||"پرونده مشتری";
  $("customerDetailMeta").textContent=(p.customer_code||"بدون کد مشتری")+" · "+(u.email||"بدون ایمیل");
  $("customerEditName").value=p.full_name||"";$("customerEditPhone").value=p.phone||u.auth_phone||"";
  $("customerDetailSummary").innerHTML='<div><small>کد مشتری</small><b>'+esc(p.customer_code||"—")+'</b></div><div><small>امتیاز فعلی</small><b>'+faNum(p.points_balance)+'</b></div><div><small>تاریخ عضویت</small><b>'+fmtDate(u.created_at)+'</b></div><div><small>آخرین ورود</small><b>'+fmtDate(u.last_sign_in_at)+'</b></div><div><small>دعوت‌شدگان</small><b>'+faNum(d.invitedCount)+'</b></div><div><small>دعوت‌شده توسط</small><b>'+faNum(d.inviterCount?"بله":"خیر")+'</b></div>';
  const banned=u.banned_until&&new Date(u.banned_until)>new Date();
  $("customerSecurityState").textContent=banned?"این حساب در حال حاضر مسدود است. تا: "+fmtDate(u.banned_until):"این حساب در حال حاضر مسدود نیست.";
  $("toggleCustomerBan").textContent=banned?"رفع مسدودی حساب":"مسدودسازی حساب";$("toggleCustomerBan").dataset.blocked=String(!banned);$("toggleCustomerBan").classList.toggle("danger-btn",!banned);
  $("customerNotes").innerHTML=(d.notes||[]).length?d.notes.map(n=>'<div class="customer-history-item"><p>'+esc(n.note)+'</p><small>'+fmtDate(n.created_at)+'</small></div>').join(""):'<p class="micro-note">هنوز یادداشتی ثبت نشده است.</p>';
  $("customerLedger").innerHTML=(d.ledger||[]).length?d.ledger.map(x=>'<div class="customer-history-item"><b class="'+(x.delta>0?"positive":"negative")+'">'+(x.delta>0?"+":"")+faNum(x.delta)+' امتیاز</b><p>'+esc(x.reason)+'</p><small>مانده: '+faNum(x.balance_after)+' · '+fmtDate(x.created_at)+'</small></div>').join(""):'<p class="micro-note">تراکنش امتیازی ثبت‌شده‌ای وجود ندارد.</p>';
  $("customersPanel").hidden=true;$("customerDetailPanel").hidden=false;document.querySelector(".admin-layout").hidden=true;
  document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab==="customers"));
 }catch(e){toast("دریافت پرونده ناموفق: "+e.message);}
}
async function loadReferralAdmin(){const el=$("referralsAdminList");el.innerHTML='<div class="empty-state">در حال دریافت دعوت‌ها...</div>';try{const d=await customerAdminCall({action:"referrals_list"}),rows=d.referrals||[];$("refAdminTotal").textContent=faNum(d.total);$("refAdminPending").textContent=faNum(d.pending);$("refAdminQualified").textContent=faNum(d.qualified);$("refAdminRewarded").textContent=faNum(d.rewarded);if(!rows.length){el.innerHTML='<div class="empty-state">هنوز دعوتی ثبت نشده است.</div>';return;}el.innerHTML=rows.map(x=>'<article class="customer-history-item referral-admin-row"><div><b>'+esc(x.inviter_name||"معرف بدون نام")+'</b><small>کد: '+esc(x.referral_code)+' · دعوت‌شده: '+esc(x.invited_name||"بدون نام")+' · '+fmtDate(x.created_at)+'</small><p>وضعیت: '+esc(({pending:"در انتظار بررسی",qualified:"تأییدشده",rewarded:"پاداش داده شده"}[x.status]||x.status))+(x.reward_points?" · پاداش: "+faNum(x.reward_points)+" امتیاز":"")+'</p></div><div class="referral-admin-actions">'+(x.status==="pending"?'<button class="secondary-btn" data-ref-qualify="'+x.id+'">تأیید دعوت</button>':"")+(x.status==="qualified"?'<input type="number" min="1" max="100000" value="50" aria-label="مقدار پاداش امتیاز" data-ref-points="'+x.id+'"><button class="primary-btn" data-ref-reward="'+x.id+'">اعطای پاداش</button>':"")+'</div></article>').join("");el.querySelectorAll("[data-ref-qualify]").forEach(b=>b.onclick=async()=>{b.disabled=true;try{await customerAdminCall({action:"referral_status",referralId:b.dataset.refQualify,status:"qualified"});toast("دعوت تأیید شد.");await loadReferralAdmin();}catch(e){toast("تأیید ناموفق: "+e.message);b.disabled=false;}});el.querySelectorAll("[data-ref-reward]").forEach(b=>b.onclick=async()=>{const id=b.dataset.refReward,points=Number(el.querySelector('[data-ref-points="'+id+'"]')?.value);if(!Number.isInteger(points)||points<1||points>100000){toast("مقدار پاداش باید بین ۱ تا ۱۰۰٬۰۰۰ باشد.");return;}b.disabled=true;try{await customerAdminCall({action:"referral_reward",referralId:id,points});toast("پاداش با موفقیت ثبت شد.");await loadReferralAdmin();}catch(e){toast("ثبت پاداش ناموفق: "+e.message);b.disabled=false;}});}catch(e){el.innerHTML='<div class="empty-state">دریافت دعوت‌ها ناموفق بود: '+esc(e.message)+'</div>';}}
async function loadCustomerAudit(){
 const el=$("customerAuditList");el.innerHTML='<div class="empty-state">در حال دریافت گزارش...</div>';
 try{const d=await customerAdminCall({action:"audit"});el.innerHTML=(d.logs||[]).length?d.logs.map(x=>'<div class="customer-history-item"><b>'+esc(({points_adjusted:"تغییر امتیاز",customer_note_added:"یادداشت مشتری",customer_blocked:"مسدودسازی حساب",customer_unblocked:"رفع مسدودی",customer_profile_updated:"ویرایش مشخصات"}[x.action]||x.action))+'</b><p>شناسه مشتری: '+esc(x.target_user_id||"—")+'</p><small>'+fmtDate(x.created_at)+' · '+esc(JSON.stringify(x.details||{}))+'</small></div>').join(""):'<div class="empty-state">هنوز فعالیت مدیریتی ثبت نشده است.</div>';}catch(e){el.innerHTML='<div class="empty-state">دریافت گزارش ناموفق: '+esc(e.message)+'</div>';}
}
async function checkAdmin(session){
 state.session=session;show("adminLogin",false);
 if(!session){state.admin=false;show("adminDenied",false);show("adminWorkspace",false);show("adminLogin",true);return;}
 $("adminEmail").textContent=session.user.email||"مدیر";
 const {data,error}=await db.from("site_admins").select("user_id").eq("user_id",session.user.id).maybeSingle();
 state.admin=!!data&&!error;
 if(!state.admin){show("adminDenied",true);show("adminWorkspace",false);return;}
 show("adminDenied",false);show("adminWorkspace",true);await loadCategories();await loadSettings();await loadDashboard();await setTab("dashboard");
}
async function loadCategories(){
 const [services,products]=await Promise.all([
  db.from("service_categories").select("id,title,parent_id").eq("is_active",true).order("sort_order"),
  db.from("product_categories").select("id,title").eq("is_active",true).order("sort_order")
 ]);
 if(services.error){toast("دریافت دسته‌بندی خدمات ناموفق بود.");return;}
 if(products.error){toast("دریافت دسته‌بندی فروشگاه ناموفق بود.");return;}
 state.categories=services.data||[];state.productCategories=products.data||[];
 $("categorySelect").innerHTML=state.categories.filter(c=>c.parent_id).map(c=>{const p=state.categories.find(x=>x.id===c.parent_id);return '<option value="'+c.id+'">'+esc(p?p.title:"")+" / "+esc(c.title)+'</option>';}).join("");
 $("productCategorySelect").innerHTML='<option value="">بدون دسته‌بندی</option>'+state.productCategories.map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join("");
}
let messengerChart=null;
async function loadMessengerAnalytics(){
 if(!state.admin)return;
 const days=Number($("messengerRange")?.value||30);
 const from=new Date();from.setDate(from.getDate()-days+1);from.setHours(0,0,0,0);
 const {data,error}=await db.from("messenger_click_events").select("platform,created_at,page_path,source_label").gte("created_at",from.toISOString()).order("created_at",{ascending:true}).limit(10000);
 if(error){$("messengerAnalyticsNote").textContent="دریافت آمار ممکن نشد: "+error.message;return;}
 const rows=data||[],labels=[],eitaa=Array(days).fill(0),telegram=Array(days).fill(0),counts={eitaa:0,telegram:0};
 for(let i=0;i<days;i++){const d=new Date(from);d.setDate(from.getDate()+i);labels.push(d.toLocaleDateString("fa-IR",{month:"numeric",day:"numeric"}));}
 rows.forEach(r=>{const d=new Date(r.created_at);const ix=Math.floor((new Date(d.getFullYear(),d.getMonth(),d.getDate())-new Date(from.getFullYear(),from.getMonth(),from.getDate()))/86400000);if(ix>=0&&ix<days){if(r.platform==="eitaa"){eitaa[ix]++;counts.eitaa++;}else if(r.platform==="telegram"){telegram[ix]++;counts.telegram++;}}});
 $("statEitaaClicks").textContent=faNum(counts.eitaa);$("statTelegramClicks").textContent=faNum(counts.telegram);$("statMessengerTotal").textContent=faNum(counts.eitaa+counts.telegram);
 if(window.Chart){if(messengerChart)messengerChart.destroy();messengerChart=new Chart($("messengerClicksChart"),{type:"line",data:{labels,datasets:[{label:"ایتا",data:eitaa,borderColor:"#24c9bd",backgroundColor:"rgba(36,201,189,.12)",tension:.35,fill:true},{label:"تلگرام",data:telegram,borderColor:"#438fff",backgroundColor:"rgba(67,143,255,.10)",tension:.35,fill:true}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{labels:{color:"#c5d7f3",font:{family:"Vazirmatn"}}}},scales:{x:{ticks:{color:"#91a9ce",maxTicksLimit:8},grid:{color:"rgba(125,160,205,.10)"}},y:{beginAtZero:true,ticks:{precision:0,color:"#91a9ce"},grid:{color:"rgba(125,160,205,.10)"}}}}});}
 $("messengerAnalyticsNote").textContent="مجموع "+faNum(rows.length)+" کلیک ثبت‌شده در "+faNum(days)+" روز اخیر؛ آمار بر اساس انتخاب لینک پیام‌رسان است، نه پیام ارسالی یا سفارش قطعی.";
}
async function loadDashboard(){
 if(!state.admin)return;
 const specs=[["services","is_active"],["products","is_active"],["hero_slides","is_active"],["assistant_leads",null]];
 const results=await Promise.all(specs.map(([table,field])=>{let q=db.from(table).select("id",{count:"exact",head:true});if(field)q=q.eq(field,true);else q=q.eq("status","new");return q;}));
 const ids=["statServices","statProducts","statSlides","statLeads"];
 results.forEach((r,i)=>{const el=$(ids[i]);if(el)el.textContent=r.error?"—":Number(r.count||0).toLocaleString("fa-IR");});
 const failed=results.some(r=>r.error);
 $("dashboardUpdated").textContent=(failed?"بخشی از آمار به‌دلیل محدودیت دسترسی دریافت نشد. ":"آخرین به‌روزرسانی: ")+new Date().toLocaleString("fa-IR");
 await loadMessengerAnalytics();
}
async function loadItems(){
 if(!state.admin)return;if(state.tab==="assistant_leads"){await loadAssistantLeads();return;}
 const cols=state.tab==="services"?"id,title,slug,summary,description,category_id,required_documents,steps,is_active,is_featured,is_time_limited,registration_deadline,sort_order":
 state.tab==="products"?"id,title,slug,summary,description,price,price_label,compare_at_price,image_url,product_type,category_id,sku,stock_quantity,stock_status,badge,specifications,file_path,file_name,file_size,is_active,is_featured,is_new,sort_order":
 (state.tab==="product_categories"||state.tab==="service_categories")?"id,title,slug,description,icon,is_active,sort_order":state.tab==="stories"?"id,title,media_url,media_type,link_url,is_published,expires_at,sort_order":state.tab==="explore_posts"?"id,title,caption,media_url,media_type,category,is_published,published_at,sort_order":state.tab==="challenges"?"id,title,description,points_reward,starts_at,ends_at,is_active":"id,eyebrow,title,description,badge_label,button_text,button_url,image_url,is_active,sort_order";
 const orderColumn=state.tab==="explore_posts"||state.tab==="challenges"?"created_at":"sort_order";const {data,error}=await db.from(state.tab).select(cols).order(orderColumn,{ascending:orderColumn==="sort_order"});
 if(error){$("contentList").innerHTML='<div class="empty-state">خطا در دریافت محتوا: '+esc(error.message)+'</div>';return;}
 state.items=data||[];renderList();
}
async function loadAssistantLeads(){
 const {data,error}=await db.from("assistant_leads").select("id,guest_name,guest_phone,topic,transcript,status,created_at").order("created_at",{ascending:false}).limit(100);
 const el=$("assistantLeadsList");if(error){el.innerHTML='<div class="empty-state">دریافت پیام‌ها ناموفق بود: '+esc(error.message)+'</div>';return;}
 if(!data?.length){el.innerHTML='<div class="empty-state">هنوز درخواست پیگیری ثبت نشده است.</div>';return;}
 el.innerHTML=data.map(x=>{const transcript=Array.isArray(x.transcript)?x.transcript:[];const preview=transcript.slice(-4).map(m=>(m.role==="assistant"?"دستیار: ":"کاربر: ")+String(m.content||"")).join("\n");return '<article class="admin-list-item assistant-lead-item"><div><b>'+esc(x.topic||"گفت‌وگوی دستیار")+'</b><small>'+esc(x.guest_name||"بدون نام")+' · '+esc(x.guest_phone||"بدون شماره")+' · '+new Date(x.created_at).toLocaleString("fa-IR")+' · '+esc(x.status)+'</small><p class="assistant-lead-preview">'+esc(preview)+'</p></div><div class="admin-item-actions">'+(x.guest_phone?'<a class="secondary-btn" href="tel:'+esc(x.guest_phone)+'">تماس</a>':'')+'<button class="secondary-btn" data-lead-done="'+x.id+'">علامت‌گذاری بررسی شد</button></div></article>';}).join("");
 el.querySelectorAll("[data-lead-done]").forEach(b=>b.onclick=async()=>{const {error}=await db.from("assistant_leads").update({status:"reviewed"}).eq("id",b.dataset.leadDone);if(error){toast("به‌روزرسانی وضعیت ناموفق بود.");return;}toast("درخواست بررسی‌شده علامت خورد.");loadAssistantLeads();});
}
function renderList(){
 const el=$("contentList");if(!state.items.length){el.innerHTML='<div class="empty-state">موردی ثبت نشده است.</div>';return;}
 el.innerHTML=state.items.map(x=>{
  const detail=state.tab==="stories"?(x.media_type==="video"?"ویدئو":"تصویر")+(x.expires_at?" · انقضا: "+new Date(x.expires_at).toLocaleString("fa-IR"):""):state.tab==="explore_posts"?(x.category||"محتوای اکسپلور")+" · "+(x.media_type==="video"?"ویدئو":"تصویر"):state.tab==="challenges"?(Number(x.points_reward||0).toLocaleString("fa-IR")+" امتیاز · "+(x.is_active?"فعال":"غیرفعال")):state.tab==="products"?(x.price?Number(x.price).toLocaleString("fa-IR")+" تومان":(x.price_label||"قیمت استعلامی"))+" · "+(x.stock_status==="in_stock"?"موجود":x.stock_status==="out_of_stock"?"ناموجود":x.stock_status==="preorder"?"پیش‌سفارش":"استعلام موجودی"):
  (state.tab==="product_categories"||state.tab==="service_categories")?(x.slug||"دسته‌بندی"):state.tab==="services"?(x.is_time_limited?(new Date(x.registration_deadline)<=new Date()?"مهلت پایان‌یافته · موقتاً غیرفعال":"زمان‌دار تا "+new Date(x.registration_deadline).toLocaleString("fa-IR")):(x.slug||"خدمت")):(x.badge_label||x.eyebrow||"اسلاید");
  const fileAction=state.tab==="products"&&x.file_path?'<button class="secondary-btn" data-file="'+esc(x.file_path)+'">دریافت فایل</button>':"";return '<article class="admin-list-item"><div><b>'+esc(x.title)+'</b><small>'+esc(detail)+(x.file_name?" · فایل: "+esc(x.file_name):"")+((x.is_published??x.is_active)?" · فعال":" · غیرفعال")+'</small></div><div class="admin-item-actions">'+fileAction+'<button class="secondary-btn" data-edit="'+x.id+'">ویرایش</button><button class="secondary-btn" data-toggle="'+x.id+'">'+((x.is_published??x.is_active)?"غیرفعال‌سازی":"فعال‌سازی")+'</button><button class="secondary-btn admin-delete-btn" data-delete="'+x.id+'">حذف</button></div></article>';
 }).join("");
 el.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editItem(b.dataset.edit));el.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>toggleItem(b.dataset.toggle));el.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteItem(b.dataset.delete));el.querySelectorAll("[data-file]").forEach(b=>b.onclick=()=>openPrivateProductFile(b.dataset.file));
}
function editItem(id){
 const x=state.items.find(i=>i.id===id);if(!x)return;const f=$("contentForm");
 const keys=["id","title","slug","summary","description","category_id","price","price_label","compare_at_price","image_url","product_type","sku","stock_quantity","stock_status","badge","file_path","file_name","file_size","sort_order","eyebrow","badge_label","button_text","button_url","icon","media_url","media_type","link_url","caption","category","points_reward","starts_at","ends_at","expires_at"];
 for(const key of keys)if(f.elements[key])f.elements[key].value=x[key]??"";
 if($("categorySelect"))$("categorySelect").value=x.category_id||"";if($("productCategorySelect"))$("productCategorySelect").value=x.category_id||"";
 if(f.elements.category_icon)f.elements.category_icon.value=x.icon||"";
 if(f.elements.slide_title)f.elements.slide_title.value=x.title||"";
 if(f.elements.slide_image_url)f.elements.slide_image_url.value=x.image_url||"";
 if(f.elements.slide_description)f.elements.slide_description.value=x.description||"";
 if(f.elements.specifications_text)f.elements.specifications_text.value=Object.entries(x.specifications||{}).map(([k,v])=>k+": "+v).join("\n");
 if(f.elements.required_documents)f.elements.required_documents.value=(x.required_documents||[]).join("\n");
 if(f.elements.steps)f.elements.steps.value=(x.steps||[]).join("\n");
 if(f.elements.is_active)f.elements.is_active.checked=!!x.is_active;
 if(f.elements.story_title)f.elements.story_title.value=x.title||"";if(f.elements.story_media_url)f.elements.story_media_url.value=x.media_url||"";if(f.elements.story_media_type)f.elements.story_media_type.value=x.media_type||"image";if(f.elements.story_link_url)f.elements.story_link_url.value=x.link_url||"";if(f.elements.story_published)f.elements.story_published.checked=!!x.is_published;if(f.elements.story_expires_at)f.elements.story_expires_at.value=x.expires_at?new Date(new Date(x.expires_at).getTime()-new Date(x.expires_at).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
 if(f.elements.explore_title)f.elements.explore_title.value=x.title||"";if(f.elements.explore_caption)f.elements.explore_caption.value=x.caption||"";if(f.elements.explore_media_url)f.elements.explore_media_url.value=x.media_url||"";if(f.elements.explore_media_type)f.elements.explore_media_type.value=x.media_type||"video";if(f.elements.explore_category)f.elements.explore_category.value=x.category||"";if(f.elements.explore_published)f.elements.explore_published.checked=!!x.is_published;
 if(f.elements.challenge_title)f.elements.challenge_title.value=x.title||"";if(f.elements.challenge_description)f.elements.challenge_description.value=x.description||"";if(f.elements.points_reward)f.elements.points_reward.value=x.points_reward??0;if(f.elements.challenge_active)f.elements.challenge_active.checked=!!x.is_active;
 if(f.elements.is_featured)f.elements.is_featured.checked=!!x.is_featured;
  if(f.elements.is_time_limited){f.elements.is_time_limited.checked=!!x.is_time_limited;$("timeLimitFields").hidden=!x.is_time_limited;}
  if(f.elements.registration_deadline)f.elements.registration_deadline.value=x.registration_deadline?(()=>{const d=new Date(x.registration_deadline);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);})():"";
 if(f.elements.challenge_starts_at)f.elements.challenge_starts_at.value=x.starts_at?new Date(new Date(x.starts_at).getTime()-new Date(x.starts_at).getTimezoneOffset()*60000).toISOString().slice(0,16):"";if(f.elements.challenge_ends_at)f.elements.challenge_ends_at.value=x.ends_at?new Date(new Date(x.ends_at).getTime()-new Date(x.ends_at).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
 if(f.elements.product_is_featured)f.elements.product_is_featured.checked=!!x.is_featured;
 if(f.elements.product_is_new)f.elements.product_is_new.checked=!!x.is_new;
 $("formTitle").textContent="ویرایش: "+x.title;window.scrollTo({top:0,behavior:"smooth"});
}
async function toggleItem(id){
 const x=state.items.find(i=>i.id===id);if(!x)return;
 const statusField=state.tab==="stories"||state.tab==="explore_posts"?"is_published":state.tab==="challenges"?"is_active":"is_active";const {error}=await db.from(state.tab).update({[statusField]:!x[statusField]}).eq("id",id);
 if(error){toast("تغییر وضعیت ذخیره نشد: "+error.message);return;}toast("وضعیت محتوا تغییر کرد.");await loadItems();
}
async function openPrivateProductFile(path){
 const {data,error}=await db.storage.from("product-files").createSignedUrl(path,3600);
 if(error||!data?.signedUrl){toast("ساخت لینک امن فایل ناموفق بود.");return;}
 window.open(data.signedUrl,"_blank","noopener");
}
async function deleteItem(id){
 const item=state.items.find(x=>x.id===id);if(!item)return;
 if(!window.confirm('مورد «'+item.title+'» برای همیشه حذف شود؟ اگر به سوابق یا موارد دیگر متصل باشد، پایگاه داده از حذف جلوگیری می‌کند.'))return;
 const {error}=await db.from(state.tab).delete().eq("id",id);
 if(error){toast("حذف انجام نشد؛ احتمالاً این مورد به اطلاعات دیگری متصل است. برای پنهان‌کردن، غیرفعالش کن.");return;}
 toast("مورد حذف شد.");if(state.tab==="product_categories"||state.tab==="service_categories")await loadCategories();await loadItems();
}
async function uploadFile(bucket,file,slug){
 const safeName=file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"file";
 const path=(slug||"product")+"/"+Date.now()+"-"+safeName;
 const {error}=await db.storage.from(bucket).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type||undefined});
 if(error)throw error;
 return path;
}
function parseSpecifications(text){
 const result={};String(text||"").split("\n").forEach(line=>{const i=line.indexOf(":");if(i>0){const key=line.slice(0,i).trim(),value=line.slice(i+1).trim();if(key&&value)result[key]=value;}});
 return result;
}
const AUTH_SITE_URL="https://horanet24.ir/";
const ADMIN_REDIRECT_URL=AUTH_SITE_URL+"admin.html";
$("adminLoginForm").onsubmit=async e=>{e.preventDefault();const email=new FormData(e.currentTarget).get("email").trim();$("loginMessage").textContent="در حال ارسال لینک ورود...";const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:ADMIN_REDIRECT_URL,shouldCreateUser:true}});$("loginMessage").textContent=error?"ارسال انجام نشد: "+error.message:"لینک ورود ارسال شد. پس از تأیید، به پنل مدیریت بازمی‌گردید.";};
$("adminGoogleLogin").onclick=async()=>{$("loginMessage").textContent="در حال انتقال به گوگل...";const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:ADMIN_REDIRECT_URL,queryParams:{prompt:"select_account"}}});if(error)$("loginMessage").textContent="ورود با گوگل انجام نشد: "+error.message;};
$("contentForm").onsubmit=async e=>{
 e.preventDefault();if(!state.admin)return;
 const f=e.currentTarget,v=values(),active=f.elements.is_active.checked;
 const payload={is_active:active,sort_order:Number(v.sort_order||0),updated_at:new Date().toISOString()};
 if(state.tab==="stories"){
  payload.title=(v.story_title||"").trim();payload.media_url=(v.story_media_url||"").trim();payload.media_type=v.story_media_type||"image";payload.link_url=(v.story_link_url||"").trim()||null;payload.is_published=f.elements.story_published.checked;
  payload.expires_at=v.story_expires_at?new Date(v.story_expires_at).toISOString():null;
  if(!payload.title||!payload.media_url){$("saveMessage").textContent="عنوان و نشانی رسانه را وارد کنید.";return;}
 }else if(state.tab==="explore_posts"){
  payload.title=(v.explore_title||"").trim();payload.caption=(v.explore_caption||"").trim();payload.media_url=(v.explore_media_url||"").trim();payload.media_type=v.explore_media_type||"video";payload.category=(v.explore_category||"").trim()||null;payload.is_published=f.elements.explore_published.checked;payload.published_at=payload.is_published?new Date().toISOString():null;
  if(!payload.title||!payload.media_url){$("saveMessage").textContent="عنوان و نشانی رسانه را وارد کنید.";return;}
 }else if(state.tab==="challenges"){
  payload.title=(v.challenge_title||"").trim();payload.description=(v.challenge_description||"").trim();payload.points_reward=Math.max(0,Number(v.points_reward||0));payload.starts_at=v.challenge_starts_at?new Date(v.challenge_starts_at).toISOString():null;payload.ends_at=v.challenge_ends_at?new Date(v.challenge_ends_at).toISOString():null;payload.is_active=f.elements.challenge_active.checked;
  if(!payload.title){$("saveMessage").textContent="عنوان چالش را وارد کنید.";return;}if(payload.starts_at&&payload.ends_at&&new Date(payload.ends_at)<=new Date(payload.starts_at)){$("saveMessage").textContent="زمان پایان باید بعد از زمان شروع باشد.";return;}
 }else if(state.tab==="hero_slides"){
  payload.eyebrow=(v.eyebrow||"").trim();payload.title=(v.slide_title||"").trim();payload.description=(v.slide_description||"").trim();
  if(!payload.title){$("saveMessage").textContent="عنوان اسلاید را وارد کنید.";return;}
  payload.badge_label=(v.badge_label||"").trim();payload.button_text=(v.button_text||"").trim();payload.button_url=(v.button_url||"").trim()||"https://eitaa.com/huranet24_app";payload.image_url=(v.slide_image_url||"").trim()||null;
 }else{
  payload.title=(v.title||"").trim();payload.slug=(v.slug||"").trim();
  if(!payload.title||!payload.slug){$("saveMessage").textContent="عنوان و شناسه انگلیسی را کامل کنید.";return;}
  if(state.tab==="services"){
   payload.summary=(v.summary||"").trim();payload.description=(v.description||"").trim();payload.category_id=v.category_id||null;
   payload.required_documents=(v.required_documents||"").split("\n").map(x=>x.trim()).filter(Boolean);payload.steps=(v.steps||"").split("\n").map(x=>x.trim()).filter(Boolean);payload.is_featured=f.elements.is_featured.checked;
    payload.is_time_limited=f.elements.is_time_limited.checked;
    if(payload.is_time_limited){const deadline=new Date(v.registration_deadline);if(!v.registration_deadline||!Number.isFinite(deadline.getTime())||deadline.getTime()<=Date.now()){$("saveMessage").textContent="برای خدمت زمان‌دار، تاریخ و ساعت آینده را وارد کنید.";return;}payload.registration_deadline=deadline.toISOString();}else payload.registration_deadline=null;
  }else if(state.tab==="product_categories"||state.tab==="service_categories"){
   payload.description=(v.description||"").trim();payload.icon=(v.category_icon||"").trim()||"package";
  }else{
   payload.summary=(v.summary||"").trim();payload.description=(v.description||"").trim();payload.category_id=v.category_id||null;
   payload.product_type=v.product_type||"physical";payload.price=v.price?Number(v.price):null;payload.compare_at_price=v.compare_at_price?Number(v.compare_at_price):null;
   payload.price_label=(v.price_label||"").trim()||null;payload.sku=(v.sku||"").trim()||null;payload.stock_quantity=Math.max(0,Number(v.stock_quantity||0));payload.stock_status=v.stock_status||"inquiry";
   payload.badge=(v.badge||"").trim()||null;payload.specifications=parseSpecifications(v.specifications_text);
   payload.is_featured=f.elements.product_is_featured.checked;payload.is_new=f.elements.product_is_new.checked;
   payload.image_url=(v.image_url||"").trim()||null;payload.file_path=(v.file_path||"").trim()||null;payload.file_name=(v.file_name||"").trim()||null;payload.file_size=(v.file_size||"").trim()||null;
   const imageFile=f.elements.image_upload.files?.[0],digitalFile=f.elements.file_upload.files?.[0];
   try{
    if(imageFile){if(imageFile.size>5*1024*1024)throw new Error("حجم تصویر بیشتر از ۵ مگابایت است.");const path=await uploadFile("catalog-images",imageFile,payload.slug);payload.image_url=db.storage.from("catalog-images").getPublicUrl(path).data.publicUrl;}
    if(digitalFile){if(digitalFile.size>20*1024*1024)throw new Error("حجم فایل دیجیتال بیشتر از ۲۰ مگابایت است.");const path=await uploadFile("product-files",digitalFile,payload.slug);payload.file_path=path;payload.file_name=digitalFile.name;payload.file_size=(digitalFile.size/1024/1024).toFixed(2)+" MB";}
   }catch(err){$("saveMessage").textContent="بارگذاری فایل ناموفق: "+err.message;return;}
  }
 }
 const id=v.id;const q=id?db.from(state.tab).update(payload).eq("id",id):db.from(state.tab).insert(payload);
 const {error}=await q;if(error){$("saveMessage").textContent="ذخیره ناموفق: "+error.message;return;}
 toast("محتوا با موفقیت ذخیره شد.");$("saveMessage").textContent="ذخیره شد و فهرست به‌روزرسانی شد.";reset();if(state.tab==="product_categories"||state.tab==="service_categories")await loadCategories();await loadItems();
};
$("timeLimitedToggle").addEventListener("change",e=>{$("timeLimitFields").hidden=!e.target.checked;});
$("refreshList").onclick=loadItems;$("refreshDashboard").onclick=loadDashboard;$("messengerRange")?.addEventListener("change",loadMessengerAnalytics);document.querySelectorAll("[data-go-tab]").forEach(b=>b.onclick=()=>{const tab=b.dataset.goTab;setTab(tab);});$("resetForm").onclick=reset;$("adminLogout").onclick=async()=>{await db.auth.signOut();};$("adminLogoutDenied").onclick=async()=>{await db.auth.signOut();};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));$("refreshAssistantLeads").onclick=loadAssistantLeads;$("refreshCustomers").onclick=()=>loadCustomers();$("customerSearchBtn").onclick=()=>{state.customerQuery=$("customerSearch").value.trim();state.customerPage=1;loadCustomers();};$("customerSearch").addEventListener("keydown",e=>{if(e.key==="Enter")$("customerSearchBtn").click();});$("customerClearBtn").onclick=()=>{$("customerSearch").value="";state.customerQuery="";state.customerPage=1;loadCustomers();};$("customerPrev").onclick=()=>{if(state.customerPage>1){state.customerPage--;loadCustomers();}};$("customerNext").onclick=()=>{state.customerPage++;loadCustomers();};$("closeCustomerDetail").onclick=()=>{setTab("customers");};$("refreshCustomerAudit").onclick=loadCustomerAudit;
$("saveCustomerProfile").onclick=async()=>{if(!state.selectedCustomer)return;try{await customerAdminCall({action:"profile",userId:state.selectedCustomer.user.id,full_name:$("customerEditName").value,phone:$("customerEditPhone").value});toast("مشخصات مشتری ذخیره شد.");await openCustomerDetail(state.selectedCustomer.user.id);await loadCustomers();}catch(e){toast("ذخیره مشخصات ناموفق: "+e.message);}};
$("adjustCustomerPoints").onclick=async()=>{if(!state.selectedCustomer)return;const delta=Number($("customerPointDelta").value),reason=$("customerPointReason").value.trim();if(!Number.isInteger(delta)||!delta||!reason){toast("مقدار امتیاز و دلیل را کامل وارد کن.");return;}if(!confirm((delta>0?"افزودن ":"کسر ")+Math.abs(delta)+" امتیاز؟"))return;try{await customerAdminCall({action:"points",userId:state.selectedCustomer.user.id,delta,reason});$("customerPointDelta").value="";$("customerPointReason").value="";toast("امتیاز مشتری به‌روزرسانی شد.");await openCustomerDetail(state.selectedCustomer.user.id);await loadCustomers();}catch(e){toast("تغییر امتیاز ناموفق: "+e.message);}};
$("addCustomerNote").onclick=async()=>{if(!state.selectedCustomer)return;const note=$("customerNoteInput").value.trim();if(!note){toast("متن یادداشت را وارد کن.");return;}try{await customerAdminCall({action:"note",userId:state.selectedCustomer.user.id,note});$("customerNoteInput").value="";toast("یادداشت داخلی ثبت شد.");await openCustomerDetail(state.selectedCustomer.user.id);}catch(e){toast("ثبت یادداشت ناموفق: "+e.message);}};
$("toggleCustomerBan").onclick=async()=>{if(!state.selectedCustomer)return;const blocked=$("toggleCustomerBan").dataset.blocked==="true",reason=$("customerBanReason").value.trim();if(blocked&&!reason){toast("برای ثبت اقدام، دلیل را وارد کن.");return;}if(!confirm(blocked?"حساب این مشتری مسدود شود؟":"مسدودی این حساب برداشته شود؟"))return;try{await customerAdminCall({action:"ban",userId:state.selectedCustomer.user.id,blocked,reason});$("customerBanReason").value="";toast(blocked?"حساب مسدود شد.":"مسدودی حساب برداشته شد.");await openCustomerDetail(state.selectedCustomer.user.id);await loadCustomers();}catch(e){toast("تغییر وضعیت حساب ناموفق: "+e.message);}};

async function loadSettings(){const {data,error}=await db.from("site_settings").select("setting_value").eq("setting_key","premium_channel").maybeSingle();if(error||!data)return;const v=data.setting_value||{};const f=$("premiumChannelForm");f.elements.title.value=v.title||"کانال ویژه حورانت۲۴";f.elements.description.value=v.description||"";f.elements.url.value=v.url||"";}
$("premiumChannelForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const setting_value={title:f.elements.title.value.trim(),description:f.elements.description.value.trim(),url:f.elements.url.value.trim()};const {error}=await db.from("site_settings").upsert({setting_key:"premium_channel",setting_value,updated_at:new Date().toISOString()},{onConflict:"setting_key"});$("premiumSaveMessage").textContent=error?"ذخیره ناموفق: "+error.message:"تنظیمات کانال ذخیره شد.";};
db.auth.getSession().then(({data})=>checkAdmin(data.session));db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>checkAdmin(session),0);});
