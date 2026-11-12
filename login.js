(() => {
  "use strict";
  const SUPABASE_URL="https://iqrgqkluuhbyphtihsls.supabase.co";
  const SUPABASE_KEY="sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
  const HOME_URL=new URL("./",window.location.href).href;
  const $=id=>document.getElementById(id);
  const area=$("loginFormArea"),state=$("loginState"),message=$("loginMessage");
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  function showMessage(text,kind="error"){message.textContent=text;message.className="login-message"+(kind==="success"?" success":"");message.hidden=false;}
  function clearMessage(){message.hidden=true;message.textContent="";}
  function busy(button,label){button.disabled=true;button.dataset.original=button.innerHTML;button.innerHTML='<span>'+label+'</span><i data-lucide="loader-circle"></i>';window.lucide?.createIcons?.();}
  function restore(button){button.disabled=false;button.innerHTML=button.dataset.original||button.innerHTML;window.lucide?.createIcons?.();}
  function authError(error){
    const raw=String(error?.message||"");
    if(/rate limit|too many requests/i.test(raw))return "درخواست‌های ورود بیش از حد تکرار شده است. کمی بعد دوباره تلاش کنید.";
    if(/provider is not enabled|unsupported provider/i.test(raw))return "ورود با گوگل هنوز در تنظیمات احراز هویت فعال نیست.";
    if(/redirect|url.*not allowed/i.test(raw))return "نشانی بازگشت ورود در تنظیمات احراز هویت مجاز نشده است.";
    if(/network|fetch/i.test(raw))return "اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
    return "ورود انجام نشد. لطفاً دوباره تلاش کنید.";
  }
  function showSignedIn(user){
    area.hidden=true;state.hidden=false;
    state.innerHTML='<h3>ورود شما با موفقیت انجام شده است</h3><p>'+escapeHtml(user?.email||"حساب کاربری شما")+'<br>اکنون می‌توانید به فضای شخصی خود در حورانت۲۴ بروید.</p><button type="button" id="goAccount">ورود به سایت و مشاهده حساب</button>';
    $("goAccount").addEventListener("click",()=>window.location.replace(HOME_URL));
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function init(){
    window.lucide?.createIcons?.();
    if(!client){showMessage("ارتباط با سامانه ورود برقرار نشد. صفحه را تازه‌سازی کنید.");return;}
    const {data,error}=await client.auth.getSession();
    if(error){showMessage(authError(error));return;}
    if(data.session){showSignedIn(data.session.user);return;}
    const params=new URLSearchParams(window.location.search);
    const hash=new URLSearchParams(window.location.hash.replace(/^#/,""));
    const authErrorText=params.get("error_description")||hash.get("error_description");
    if(authErrorText)showMessage("ورود تکمیل نشد. دوباره روش ورود را انتخاب کنید.");
    $("emailForm").addEventListener("submit",async event=>{
      event.preventDefault();clearMessage();
      const email=$("email").value.trim();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showMessage("یک نشانی ایمیل معتبر وارد کنید.");$("email").focus();return;}
      const button=$("emailSubmit");busy(button,"در حال ارسال لینک...");
      const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:HOME_URL,shouldCreateUser:true}});
      restore(button);
      if(error){showMessage(authError(error));return;}
      area.hidden=true;state.hidden=false;
      state.innerHTML='<h3>لینک ورود ارسال شد</h3><p>پیام ارسال‌شده به <b>'+escapeHtml(email)+'</b> را باز کنید و روی لینک ورود بزنید. پس از تأیید، به حورانت۲۴ بازمی‌گردید.</p><button type="button" id="editEmail">تغییر ایمیل</button>';
      $("editEmail").addEventListener("click",()=>{state.hidden=true;area.hidden=false;$("email").focus();});
    });
    $("googleLogin").addEventListener("click",async()=>{
      clearMessage();const button=$("googleLogin");busy(button,"در حال اتصال به گوگل...");
      const {error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo:HOME_URL,queryParams:{prompt:"select_account"}}});
      if(error){restore(button);showMessage(authError(error));}
    });
    client.auth.onAuthStateChange((event,session)=>{if(session&&["SIGNED_IN","INITIAL_SESSION"].includes(event))showSignedIn(session.user);});
  }
  init().catch(()=>showMessage("بارگذاری صفحه ورود با مشکل روبه‌رو شد. دوباره تلاش کنید."));
})();