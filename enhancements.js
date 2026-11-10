(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 let index=0,timer=null,paused=false,slides=[],dots=[];
 function refresh(){try{if(window.refreshH24Icons)window.refreshH24Icons();else window.lucide?.createIcons?.();}catch(_){}}
 function setSlide(next){
  if(slides.length<2)return;
  const previous=index;
  index=(next+slides.length)%slides.length;
  slides.forEach((slide,i)=>{
   const active=i===index;
   slide.classList.toggle("active",active);
   slide.setAttribute("aria-hidden",active?"false":"true");
   slide.style.zIndex=active?"2":(i===previous?"1":"0");
  });
  dots.forEach((dot,i)=>{const active=i===index;dot.classList.toggle("active",active);dot.setAttribute("aria-current",active?"true":"false");});
 }
 function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
 function start(){stop();if(slides.length>1&&!paused&&!document.hidden)timer=setInterval(()=>setSlide(index+1),4200);}
 function initSlider(){
  const slider=$("heroSlider"),root=$("heroSlides"),dotRoot=$("heroDots");
  if(!slider||!root||slider.dataset.h24Ready==="true")return;
  slider.dataset.h24Ready="true";
  slides=Array.from(root.querySelectorAll(".hero-slide"));
  if(slides.length<2)return;
  slides.forEach((slide,i)=>{slide.classList.toggle("active",i===0);slide.setAttribute("aria-hidden",i===0?"false":"true");});
  if(dotRoot){
   dots=Array.from(dotRoot.querySelectorAll("[data-slide]"));
   if(dots.length!==slides.length){
    dotRoot.innerHTML=slides.map((_,i)=>'<button type="button" class="hero-dot'+(i===0?' active':'')+'" data-slide="'+i+'" aria-label="رفتن به اسلاید '+(i+1)+'"></button>').join("");
    dots=Array.from(dotRoot.querySelectorAll("[data-slide]"));
    refresh();
   }
  }
  slider.querySelector("#heroPrev")?.addEventListener("click",e=>{e.preventDefault();setSlide(index-1);start();});
  slider.querySelector("#heroNext")?.addEventListener("click",e=>{e.preventDefault();setSlide(index+1);start();});
  dotRoot?.addEventListener("click",e=>{const dot=e.target.closest("[data-slide]");if(dot){setSlide(Number(dot.dataset.slide));start();}});
  let startX=0,startY=0;
  slider.addEventListener("touchstart",e=>{const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;},{passive:true});
  slider.addEventListener("touchend",e=>{const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){setSlide(index+(dx<0?1:-1));start();}},{passive:true});
  slider.addEventListener("mouseenter",()=>{paused=true;stop();});
  slider.addEventListener("mouseleave",()=>{paused=false;start();});
  slider.addEventListener("focusin",()=>{paused=true;stop();});
  slider.addEventListener("focusout",e=>{if(!slider.contains(e.relatedTarget)){paused=false;start();}});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();else start();});
  start();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initSlider,{once:true});else initSlider();
 window.initHoranetSlider=async()=>{initSlider();start();};
})();