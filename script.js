/* FuturEyes: rows, in-page player, portfolio list (work/work.js), intro picker. No trackers. */
(function(){
  "use strict";
  var nav=document.getElementById('nav');
  function onScroll(){nav.classList.toggle('is-solid',window.scrollY>40)}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* row arrows (hidden when a row already fits) */
  var rowsAll=document.querySelectorAll('.row');
  function fit(){rowsAll.forEach(function(row){var t=row.querySelector('.row__track');row.classList.toggle('is-fit',t.scrollWidth<=t.clientWidth+2)})}
  window.addEventListener('resize',fit);window.addEventListener('load',fit);fit();
  rowsAll.forEach(function(row){
    var track=row.querySelector('.row__track');
    row.querySelectorAll('.arrow').forEach(function(b){
      b.addEventListener('click',function(){
        var d=parseInt(b.getAttribute('data-dir'),10);
        track.scrollBy({left:d*track.clientWidth*0.85,behavior:'smooth'});
      });
    });
  });

  /* in-page player: loads only on tap */
  var dlg=document.getElementById('player'),stage=document.getElementById('player-stage'),
      ptitle=document.getElementById('player-title'),pyt=document.getElementById('player-yt'),lastFocus=null;
  var canDialog=!!(dlg&&typeof dlg.showModal==='function');
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e}
  function showMsg(t){stage.textContent='';stage.appendChild(el('p','player__msg',t))}
  function openPlayer(kind,src,title,opts){
    opts=opts||{};lastFocus=document.activeElement;stage.textContent='';
    dlg.classList.toggle('is-short',!!opts.short);
    ptitle.textContent=title||'';
    dlg.classList.toggle('is-ig',kind==='instagram');
    pyt.href=opts.ytUrl||'https://www.youtube.com/@futureyes9955';pyt.hidden=!opts.ytUrl;pyt.textContent=opts.extLabel||'Open on YouTube \u2197';
    var m;
    if(kind==='youtube'){
      m=el('iframe');
      m.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(src)+'?autoplay=1&rel=0&playsinline=1&modestbranding=1';
      m.title=(title||'Video')+' (YouTube player)';
      m.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';m.allowFullscreen=true;
      m.referrerPolicy='strict-origin-when-cross-origin';
    }else if(kind==='instagram'){
      m=el('iframe');
      m.src='https://www.instagram.com/reel/'+encodeURIComponent(src)+'/embed/';
      m.title=(title||'Reel')+' (Instagram player)';
      m.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';m.allowFullscreen=true;
      m.referrerPolicy='strict-origin-when-cross-origin';m.setAttribute('scrolling','no');
    }else if(kind==='video'){
      m=el('video');m.src=src;m.controls=true;m.playsInline=true;m.preload='metadata';if(opts.poster)m.poster=opts.poster;
      m.addEventListener('error',function(){showMsg('This video could not be loaded.')});
    }else{
      m=el('img');m.src=src;m.alt=title||'Portfolio photo';
      m.addEventListener('error',function(){showMsg('This image could not be loaded.')});
    }
    stage.appendChild(m);dlg.showModal();document.getElementById('player-x').focus();
  }
  function closePlayer(){if(dlg&&dlg.open)dlg.close()}
  if(canDialog){
    dlg.addEventListener('close',function(){stage.textContent='';if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})});
    document.getElementById('player-x').addEventListener('click',closePlayer);
    dlg.addEventListener('click',function(e){if(e.target===dlg)closePlayer()});
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[data-yt],a[data-ig],a[data-img]');
      if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      e.preventDefault();
      if(a.hasAttribute('data-ig'))openPlayer('instagram',a.getAttribute('data-ig'),a.getAttribute('data-title'),{short:true,ytUrl:a.href,extLabel:'Open on Instagram \u2197'});
      else if(a.hasAttribute('data-img'))openPlayer('image',a.getAttribute('href'),a.getAttribute('data-title'),{});
      else openPlayer('youtube',a.getAttribute('data-yt'),a.getAttribute('data-title'),{short:a.hasAttribute('data-short'),ytUrl:a.href});
    });
  }

  /* portfolio: add items in work/work.js */
  var list=Array.isArray(window.WORK)?window.WORK.filter(function(w){return w&&w.type&&(w.src||w.id)}):[];
  var latest=document.getElementById('latest'),track=document.querySelector('[data-work]');
  if(latest&&track&&list.length){
    list.forEach(function(w){
      var b=el('button','card card--work');b.type='button';
      var img=el('img');img.loading='lazy';img.decoding='async';img.alt='';img.width=640;img.height=400;
      img.src=w.type==='youtube'?'https://i.ytimg.com/vi/'+encodeURIComponent(w.id)+'/hqdefault.jpg':(w.poster||w.src);
      if(w.type==='video'&&!w.poster){var v=el('video');v.src=w.src;v.muted=true;v.preload='metadata';v.style.width='100%';v.style.aspectRatio='16/10';v.style.objectFit='cover';b.appendChild(v)}else b.appendChild(img);
      if(w.type!=='image'){var p=el('span','play','\u25B6');p.setAttribute('aria-hidden','true');b.appendChild(p)}
      var info=el('span','card__info');info.appendChild(el('span','card__title',w.title||''));b.appendChild(info);
      b.setAttribute('aria-label',(w.type==='image'?'View photo: ':'Play video: ')+(w.title||''));
      b.addEventListener('click',function(){
        var yurl='https://www.youtube.com/watch?v='+encodeURIComponent(w.id||'');
        if(!canDialog){window.open(w.type==='youtube'?yurl:w.src,'_blank','noopener');return}
        if(w.type==='youtube')openPlayer('youtube',w.id,w.title,{ytUrl:yurl});
        else openPlayer(w.type,w.src,w.title,{poster:w.poster});
      });
      track.appendChild(b);
    });
    latest.hidden=false;fit();
  }

  /* "Who's visiting?" intro: first visit only, never on a deep link; Skip or Esc closes it */
  var who=document.getElementById('who'),seen=false;
  try{seen=sessionStorage.getItem('fe-who')==='1'}catch(e){}
  if(who&&!seen&&!location.hash){
    who.hidden=false;document.body.style.overflow='hidden';
    var first=who.querySelector('.who__p');if(first)first.focus({preventScroll:true});
  }
  function close(){
    if(!who||who.hidden)return;
    try{sessionStorage.setItem('fe-who','1')}catch(e){}
    who.classList.add('is-out');document.body.style.overflow='';
    setTimeout(function(){who.hidden=true},450);
  }
  if(who){
    who.querySelectorAll('[data-go]').forEach(function(x){x.addEventListener('click',close)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  }
})();
