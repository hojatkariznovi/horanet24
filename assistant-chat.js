/* Horanet24 AI assistant widget */
(() => {
  const ENDPOINT = "https://iqrgqkluuhbyphtihsls.supabase.co/functions/v1/horanet-assistant";
  const PUBLIC_KEY = "sb_publishable_jJeR9OBKSiQU4dBnQrGILA_I56-Npbf";
  const EITAA = "https://eitaa.com/huranet24_app";
  const history = [];
  let busy = false;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const root = document.createElement("div");
  root.id = "h24Assistant";
  root.innerHTML = `
    <button class="h24-launch" type="button" aria-label="گفت‌وگو با دستیار هوشمند"><span class="h24-launch-icon">✦</span><span>دستیار حورانت</span></button>
    <section class="h24-panel" role="dialog" aria-label="دستیار هوشمند حورانت۲۴" aria-modal="false" hidden>
      <header class="h24-head"><div class="h24-avatar">H<span>24</span></div><div class="h24-headcopy"><b>دستیار هوشمند حورانت۲۴</b><small><i></i> راهنمای خدمات و مدارک</small></div><button class="h24-close" type="button" aria-label="بستن">×</button></header>
      <div class="h24-intro">سلام. درباره مدارک، شرایط و انتخاب خدمت موردنظرت سؤال کن. اگر پاسخ نیاز به بررسی انسانی داشته باشد، راه ارتباط با پشتیبانی را نشانت می‌دهم.</div>
      <div class="h24-messages" aria-live="polite"><div class="h24-msg bot">برای شروع، نام خدمت یا سؤالت را بنویس.</div></div>
      <div class="h24-handoff" hidden>
        <b>درخواست پیگیری توسط پشتیبانی</b><p>با ثبت این فرم، متن گفت‌وگو برای پیگیری در پنل مدیریت ذخیره می‌شود. نام و شماره تماس اختیاری است؛ رمزها و شماره‌های حساس را ارسال نکن.</p>
        <input name="name" maxlength="80" placeholder="نام (اختیاری)">
        <input name="phone" maxlength="20" inputmode="tel" placeholder="شماره تماس (اختیاری)">
        <div class="h24-handoff-actions"><button class="h24-save" type="button">ثبت درخواست پیگیری</button><a href="${EITAA}" target="_blank" rel="noopener">گفت‌وگو در ایتا</a></div>
      </div>
      <form class="h24-compose"><input name="message" maxlength="1200" autocomplete="off" placeholder="سؤالت را اینجا بنویس..." aria-label="متن پیام" required><button type="submit" aria-label="ارسال پیام">↑</button></form>
      <footer class="h24-foot"><button class="h24-show-handoff" type="button">ارتباط با پشتیبانی انسانی</button><span>از ارسال رمز و اطلاعات بانکی خودداری کن.</span></footer>
    </section>`;
  document.body.appendChild(root);
  const panel=root.querySelector(".h24-panel"), launch=root.querySelector(".h24-launch"), messages=root.querySelector(".h24-messages"), form=root.querySelector(".h24-compose"), input=form.elements.message, handoff=root.querySelector(".h24-handoff");
  function addMessage(role, content) {
    const el=document.createElement("div"); el.className="h24-msg "+(role==="assistant"?"bot":"user"); el.textContent=content; messages.appendChild(el); messages.scrollTop=messages.scrollHeight;
  }
  function open(){panel.hidden=false;launch.hidden=true;input.focus();}
  function close(){panel.hidden=true;launch.hidden=false;}
  async function send(text){
    if(busy)return;
    busy=true; input.disabled=true; form.querySelector("button").disabled=true;
    history.push({role:"user",content:text}); addMessage("user",text);
    const wait=document.createElement("div");wait.className="h24-msg bot h24-wait";wait.textContent="در حال بررسی اطلاعات خدمات...";messages.appendChild(wait);messages.scrollTop=messages.scrollHeight;
    try{
      const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","apikey":PUBLIC_KEY},body:JSON.stringify({messages:history})});
      const data=await response.json(); wait.remove();
      if(!response.ok)throw new Error(data.message||"ارتباط برقرار نشد.");
      const answer=String(data.answer||"پاسخی دریافت نشد.");history.push({role:"assistant",content:answer});addMessage("assistant",answer);
    }catch(error){wait.remove();addMessage("assistant",error.message||"ارتباط برقرار نشد. از راه ایتا با پشتیبانی تماس بگیر.");}
    finally{busy=false;input.disabled=false;form.querySelector("button").disabled=false;input.focus();}
  }
  launch.addEventListener("click",open);root.querySelector(".h24-close").addEventListener("click",close);
  form.addEventListener("submit",e=>{e.preventDefault();const text=input.value.trim();if(text){input.value="";send(text);}});
  root.querySelector(".h24-show-handoff").addEventListener("click",()=>{handoff.hidden=!handoff.hidden;handoff.scrollIntoView({block:"nearest",behavior:"smooth"});});
  root.querySelector(".h24-save").addEventListener("click",async()=>{
    if(!history.length){addMessage("assistant","ابتدا موضوع موردنظرت را در گفت‌وگو مطرح کن.");return;}
    const btn=root.querySelector(".h24-save");btn.disabled=true;btn.textContent="در حال ثبت...";
    try{
      const r=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","apikey":PUBLIC_KEY},body:JSON.stringify({action:"handoff",messages:history,name:handoff.querySelector('[name="name"]').value,phone:handoff.querySelector('[name="phone"]').value,topic:history.find(m=>m.role==="user")?.content||"گفت‌وگوی دستیار"})});
      const data=await r.json();if(!r.ok)throw new Error(data.message||"ثبت انجام نشد.");
      addMessage("assistant","درخواست پیگیری در پنل پشتیبانی ثبت شد. همچنین می‌توانی برای گفت‌وگوی مستقیم از دکمه ایتا استفاده کنی.");
      handoff.hidden=true;
    }catch(error){addMessage("assistant",error.message||"ثبت درخواست انجام نشد.");}
    finally{btn.disabled=false;btn.textContent="ثبت درخواست پیگیری";}
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close();});
  window.openHoranetAssistant=open;
  const oldAssistant=document.getElementById("assistantBtn"); if(oldAssistant)oldAssistant.onclick=open;
  const nav=document.getElementById("navCoreBtn"); if(nav)nav.onclick=open;
})();