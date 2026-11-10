(() => {
const ENDPOINT="https://iqrgqkluuhbyphtihsls.supabase.co/functions/v1/horanet-assistant";
const EITAA="https://eitaa.com/huranet24_app";
const $=id=>document.getElementById(id), panel=$("h24AiPanel"), history=[];
if(!panel)return;
function add(role,text,note=""){const n=document.createElement("div");n.className="h24-ai-message "+role;n.textContent=text;if(note){const s=document.createElement("small");s.textContent=note;n.appendChild(s);} $("h24AiMessages").appendChild(n);$("h24AiMessages").scrollTop=$("h24AiMessages").scrollHeight;return n;}
function open(){panel.hidden=false;$("h24AiInput").focus();}
function close(){panel.hidden=true;}
$("h24AiLaunch").onclick=()=>panel.hidden?open():close();
$("h24AiClose").onclick=close;
$("h24AiPrompts").onclick=e=>{const b=e.target.closest("button");if(b){$("h24AiInput").value=b.textContent;$("h24AiForm").requestSubmit();}};
$("h24AiHandoff").onclick=()=>{$("h24AiHandoffForm").hidden=!$("h24AiHandoffForm").hidden;};
$("h24AiForm").onsubmit=async e=>{e.preventDefault();const input=$("h24AiInput"),msg=input.value.trim(),btn=e.currentTarget.querySelector("button");if(!msg||btn.disabled)return;input.value="";history.push({role:"user",content:msg});add("user",msg);const pending=add("assistant","در حال بررسی سؤال شما…");btn.disabled=true;try{const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});const data=await res.json();pending.remove();if(!res.ok)throw new Error(data.message||"دستیار هنوز آماده پاسخ‌گویی نیست.");history.push({role:"assistant",content:data.reply});add("assistant",data.reply);}catch(err){pending.remove();add("assistant",err.message+" برای راهنمایی انسانی از دکمه ارتباط با پشتیبان استفاده کنید.");}finally{btn.disabled=false;}};
$("h24AiHandoffForm").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,v=Object.fromEntries(new FormData(f).entries()),btn=f.querySelector("button");if(!String(v.message||"").trim())return;btn.disabled=true;btn.textContent="در حال ثبت…";try{const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"handoff",name:v.name,phone:v.phone,service:v.service,message:v.message})});const data=await res.json();if(!res.ok)throw new Error(data.message||"ثبت درخواست انجام نشد.");add("assistant","درخواست شما در پنل مدیریت ثبت شد. اکنون به ربات رسمی ایتا منتقل می‌شوید.");f.reset();window.open(EITAA,"_blank","noopener");}catch(err){add("assistant",err.message+" لطفاً مستقیماً به ربات ایتا پیام دهید.");window.open(EITAA,"_blank","noopener");}finally{btn.disabled=false;btn.textContent="ثبت و ارتباط با ایتا";}};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close();});
})();