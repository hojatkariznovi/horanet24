const SUPABASE_URL = "https://iqrgqkluuhbyphtihsls.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
const fallbackServices = [
 {title:"نقل و انتقال خودرو",summary:"راهنمایی و ثبت درخواست نقل‌وانتقال",category:"vehicle",icon:"🚘"},
 {title:"نوبت تعویض پلاک",summary:"دریافت نوبت و پیگیری مراحل",category:"vehicle",icon:"🔢"},
 {title:"استعلام و پرداخت خلافی",summary:"بررسی خلافی و مالیات خودرو",category:"vehicle",icon:"🧾"},
 {title:"بیمه شخص ثالث",summary:"صدور نقدی و اقساطی بیمه",category:"insurance",icon:"🛡"},
 {title:"بیمه بدنه",summary:"مشاوره و درخواست بیمه بدنه",category:"insurance",icon:"🚗"},
 {title:"صدور و تمدید مجوز کسب",summary:"راهنمای مدارک و مراحل مجوز",category:"business",icon:"▣"},
 {title:"خدمات مالیاتی",summary:"پرونده، اظهارنامه و امور مالیاتی",category:"business",icon:"📊"},
 {title:"کارت‌خوان و پشتیبانی",summary:"درخواست دستگاه و خدمات پس از فروش",category:"business",icon:"▤"},
 {title:"خدمات اداری و هویتی",summary:"ثبت درخواست خدمات منتخب اداری",category:"government",icon:"◈"}
];
const categoryMap = {"خودرو":"vehicle","بیمه":"insurance","کسب‌وکار":"business","اداری":"government"};
let allServices = fallbackServices;
let activeCategory = "all";
const grid = document.getElementById("serviceGrid");
const statusLine = document.getElementById("serviceStatus");
const toast = document.getElementById("toast");
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
function renderServices(){
 const q=document.getElementById("serviceSearch").value.trim().toLocaleLowerCase("fa");
 const filtered=allServices.filter(s=>(activeCategory==="all"||s.category===activeCategory)&&(!q||((s.title||"")+" "+(s.summary||"")).toLocaleLowerCase("fa").includes(q)));
 grid.innerHTML="";
 if(!filtered.length){grid.innerHTML='<div class="empty-state">خدمتی با این عبارت پیدا نشد.</div>';return}
 filtered.forEach((s)=>{const card=document.createElement("article");card.className="service-card";const icon=document.createElement("span");icon.className="service-icon";icon.textContent=s.icon||"✦";const info=document.createElement("div");const title=document.createElement("b");title.textContent=s.title;const summary=document.createElement("small");summary.textContent=s.summary||"برای اطلاعات بیشتر انتخاب کنید";info.append(title,summary);const arrow=document.createElement("span");arrow.className="card-arrow";arrow.textContent="↗";card.append(icon,info,arrow);card.addEventListener("click",()=>notify("جزئیات و ثبت درخواست این خدمت در مرحله بعد فعال می‌شود."));grid.append(card)});
}
async function loadServices(){
 if(!window.supabase?.createClient){statusLine.textContent="نمایش نسخه آزمایشی خدمات";renderServices();return}
 try{
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  const {data,error}=await client.from("services").select("title,summary,slug,category_id,is_featured,sort_order,service_categories(title)").eq("is_active",true).order("sort_order");
  if(error)throw error;
  if(data?.length){allServices=data.map(s=>({title:s.title,summary:s.summary,category:categoryMap[s.service_categories?.title]||"government",icon:iconFor(s.title)}));statusLine.textContent="فهرست خدمات از پایگاه داده دریافت شد."}
  else statusLine.textContent="فهرست اولیه خدمات نمایش داده می‌شود.";
 }catch(err){console.warn("Supabase service catalog unavailable:",err.message);statusLine.textContent="نسخه آزمایشی فعال است؛ اتصال داده در حال تکمیل است."}
 renderServices();
}
function iconFor(title){if(/بیمه/.test(title))return"🛡";if(/خودرو|پلاک|خلافی/.test(title))return"🚘";if(/کسب|مجوز|مالیات|کارت/.test(title))return"▣";return"◈"}
document.getElementById("serviceSearch").addEventListener("input",renderServices);
document.querySelectorAll(".chip").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));btn.classList.add("active");activeCategory=btn.dataset.category;renderServices()}));
document.getElementById("exploreServices").addEventListener("click",()=>document.getElementById("servicesSection").scrollIntoView({behavior:"smooth"}));
document.getElementById("allServices").addEventListener("click",()=>{activeCategory="all";document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x.dataset.category==="all"));renderServices()});
document.getElementById("searchToggle").addEventListener("click",()=>{document.getElementById("serviceSearch").focus();document.getElementById("servicesSection").scrollIntoView({behavior:"smooth"})});
document.getElementById("assistantBtn").addEventListener("click",()=>notify("پشتیبانی آنلاین در مرحله بعد فعال می‌شود."));
document.getElementById("profileBtn").addEventListener("click",()=>notify("ورود و ساخت حساب کاربری به‌زودی فعال می‌شود."));
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");const tab=btn.dataset.tab;if(tab==="home")window.scrollTo({top:0,behavior:"smooth"});else if(tab==="services")document.getElementById("servicesSection").scrollIntoView({behavior:"smooth"});else notify("این بخش در حال توسعه است.")}));
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
loadServices();
