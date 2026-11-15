/* Student-selected release: Cinematic Expedition / Field Scientist / Two Futures. */
(function(){
  'use strict';
  const url=path=>window.INLINE?.[path]||path;
  const film=document.createElement('dialog');film.id='missionFilm';
  film.setAttribute('aria-labelledby','missionFilmTitle');
  film.innerHTML='<header><div><h2 id="missionFilmTitle">One mission. Two futures.</h2><p>Hades narration · <span lang="ar" dir="rtl">ترجمة عربية فصحى</span></p></div><button id="skipMissionFilm" type="button">Skip film</button></header><video controls playsinline preload="none" aria-label="Two Futures introduction, English narration with Modern Standard Arabic subtitles"></video><p id="missionFilmStatus" role="status">Loading the film. You can skip straight to the mission.</p>';
  document.body.append(film);
  const video=film.querySelector('video'),skip=film.querySelector('button'),status=film.querySelector('[role=status]');
  let afterFilm=null,previousFocus=null,previousModal=false,previousSpeed=0,seen=false;
  try{seen=sessionStorage.getItem('blackout-intro-hades-ar')==='seen';}catch(_){}
  function closeFilm(){
    if(!film.open)return;
    video.pause();film.close();modalOpen=previousModal;
    if(previousSpeed)setSpeed(previousSpeed);
    seen=true;try{sessionStorage.setItem('blackout-intro-hades-ar','seen');}catch(_){}
    const done=afterFilm;afterFilm=null;
    if(previousFocus?.isConnected)previousFocus.focus();
    done?.();
  }
  function showFilm(done){
    if(film.open)return;
    afterFilm=done;previousFocus=document.activeElement;previousModal=modalOpen;previousSpeed=S?.speed||0;
    clearWalkInput();if(document.pointerLockElement)document.exitPointerLock?.();
    if(previousSpeed)setSpeed(0);modalOpen=true;
    skip.textContent=done?'Skip film · begin mission':'Return to game';
    // Offline HTML remains fully playable without embedding a 26 MB optional film.
    video.src=window.INLINE?'https://mars-colony-tau.vercel.app/assets/intro/two-futures-hades-ar.mp4':'assets/intro/two-futures-hades-ar.mp4';
    status.textContent='Loading the film. You can skip straight to the mission.';
    film.showModal();video.currentTime=0;skip.focus();
    video.play().catch(()=>{status.textContent=video.error?'The film could not load. You can still play: select Skip film or Return to game.':'Press Play to watch, or skip to begin your mission.';});
  }
  skip.onclick=closeFilm;film.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});
  video.addEventListener('ended',closeFilm);
  video.addEventListener('playing',()=>{status.textContent='English voice · Modern Standard Arabic subtitles';});
  video.addEventListener('error',()=>{status.textContent='The film could not load. You can still play: select Skip film or Return to game.';});
  // The game has a separate modal focus trap; this native dialog owns its keys.
  film.addEventListener('keydown',e=>{if(e.key!=='Tab')e.stopPropagation();});
  function decorateWelcome(el){
    el.querySelector('h2').innerHTML='<span class="selected-kicker">DEAD RECKONING</span><span class="selected-title">BLACKOUT</span>';
    el.querySelector('.ares-welcome-mark').outerHTML='<div class="cinematic-welcome"><p>Earth goes quiet.<br>You take command.</p><button id="watchSelectedFilm" type="button">Watch the introduction <span>2:06 · Hades · العربية</span></button></div>';
    el.querySelector('.ares-welcome-intro').textContent='Six crew. A new world. Your next decision changes their future.';
    const nameField=document.createElement('div');nameField.className='colony-name-field';
    nameField.append(el.querySelector('label[for="aresColonyName"]'),el.querySelector('#aresColonyName'));
    el.querySelector('#aresLanding').prepend(nameField);
    const code=el.querySelector('#aresMissionCode');if(code)code.placeholder='Shared challenge';
    el.style.setProperty('--welcome-art',`url("${url('assets/selected/cinematic-expedition.png')}")`);
    el.querySelector('#watchSelectedFilm').onclick=()=>showFilm();
    const begin=el.querySelector('.btns button'),start=begin.onclick;
    begin.onclick=()=>{
      // First Begin is a user gesture, so sound is allowed; Continue never delays.
      if(!seen&&!window.INLINE)showFilm(()=>start());else start();
    };
    el.scrollTop=0;
  }
  window.SelectedExperience={decorateWelcome,showFilm,closeFilm};
})();
