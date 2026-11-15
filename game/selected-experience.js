/* Student-selected release: Cinematic Expedition / Field Scientist / Two Futures. */
(function(){
  'use strict';
  const available=true,url=path=>window.INLINE?.[path]||path;
  const film=document.createElement('dialog');film.id='missionFilm';
  film.setAttribute('aria-labelledby','missionFilmTitle');
  film.innerHTML='<header><div><h2 id="missionFilmTitle">DEAD RECKONING: BLACKOUT</h2><p>Hades narration · <span lang="ar" dir="rtl">ترجمة عربية فصحى</span></p></div><div class="film-actions"><button id="missionFilmSound" type="button">Turn sound on</button><button id="skipMissionFilm" type="button">Skip to game</button></div></header><video controls playsinline preload="metadata" tabindex="0" aria-label="Two Futures introduction, English narration with Modern Standard Arabic subtitles"></video><p id="missionFilmStatus" role="status">Starting the introduction. You can skip to the game at any time.</p>';
  document.body.append(film);
  const video=film.querySelector('video'),skip=film.querySelector('#skipMissionFilm'),sound=film.querySelector('#missionFilmSound'),status=film.querySelector('[role=status]');
  video.poster=url('assets/selected/cinematic-expedition.png');
  let afterFilm=null,previousFocus=null,previousModal=false,previousSpeed=0,openingShown=false,playback=0;
  function updateSound(){
    const quiet=video.muted||video.volume===0;
    sound.textContent=quiet?'Turn sound on':'Mute sound';
    sound.setAttribute('aria-label',quiet?'Turn narration sound on':'Mute narration sound');
    if(film.open&&!video.error)status.textContent=quiet?'Sound is muted. Turn sound on for Hades narration. Arabic subtitles are included.':'English narration · Modern Standard Arabic subtitles · Pause, volume and fullscreen are in the player controls.';
  }
  function closeFilm(){
    if(!film.open)return;
    playback++;video.pause();
    if(document.fullscreenElement&&(document.fullscreenElement===video||film.contains(document.fullscreenElement)))document.exitFullscreen?.().catch(()=>{});
    if(video.webkitDisplayingFullscreen)video.webkitExitFullscreen?.();
    film.close();modalOpen=previousModal;
    if(previousSpeed)setSpeed(previousSpeed);
    const done=afterFilm;afterFilm=null;
    if(previousFocus?.isConnected)previousFocus.focus();
    done?.();
  }
  function showFilm(done,options={}){
    if(film.open)return;
    const attempt=++playback;
    afterFilm=done;previousFocus=document.activeElement;previousModal=modalOpen;previousSpeed=S?.speed||0;
    clearWalkInput();if(document.pointerLockElement)document.exitPointerLock?.();
    if(previousSpeed)setSpeed(0);modalOpen=true;
    skip.textContent=options.opening?'Skip to game':'Back to game';
    // Native controls retain play/pause, seeking, volume and fullscreen. Autoplay
    // begins muted on entry; a user gesture enables the existing Hades narration.
    video.muted=options.opening===true;video.src=window.INLINE?'https://dead-reckoning-blackout.vercel.app/assets/intro/two-futures-hades-ar.mp4':'assets/intro/two-futures-hades-ar.mp4';
    status.textContent=video.muted?'The introduction starts muted. Turn sound on, use the player controls, or skip to the game.':'Use the player controls to pause, change volume or go fullscreen. You can return to the game at any time.';
    updateSound();film.showModal();video.currentTime=0;skip.focus();
    try{Promise.resolve(video.play()).catch(()=>{
      if(!film.open||attempt!==playback)return;
      status.textContent=video.error?'The video could not load. Skip to the game to keep playing.':'Press Play in the video controls to watch, or skip to the game.';
    });}catch(_){status.textContent='Press Play in the video controls to watch, or skip to the game.';}
  }
  sound.onclick=()=>{const quiet=video.muted||video.volume===0;video.muted=!quiet;if(quiet&&video.volume===0)video.volume=1;updateSound();};
  skip.onclick=closeFilm;film.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});
  video.addEventListener('ended',closeFilm);
  video.addEventListener('volumechange',updateSound);
  video.addEventListener('playing',()=>{if(film.open)status.textContent=video.muted?'Playing muted · Turn sound on for Hades narration. Arabic subtitles are included.':'English narration · Modern Standard Arabic subtitles · Pause, volume and fullscreen are in the player controls.';});
  video.addEventListener('error',()=>{if(film.open)status.textContent='The video could not load. Skip to the game to keep playing.';});
  // Native media owns Space and its other keys; Tab stays inside the native dialog.
  film.addEventListener('keydown',e=>{if(e.key!=='Tab')e.stopPropagation();});
  function decorateWelcome(el){
    el.querySelector('h2').innerHTML='<span class="selected-kicker">DEAD RECKONING</span><span class="selected-title">BLACKOUT</span>';
    el.querySelector('.ares-welcome-mark').outerHTML='<div class="cinematic-welcome"><p>Earth goes quiet.<br>You take command.</p><button id="watchSelectedFilm" type="button">Watch the introduction <span>Hades · العربية</span></button></div>';
    el.querySelector('.ares-welcome-intro').textContent='Six crew. A new world. Your next decision changes their future.';
    const nameField=document.createElement('div');nameField.className='colony-name-field';
    nameField.append(el.querySelector('label[for="aresColonyName"]'),el.querySelector('#aresColonyName'));
    el.querySelector('#aresLanding').prepend(nameField);
    const code=el.querySelector('#aresMissionCode');if(code)code.placeholder='Shared challenge';
    el.style.setProperty('--welcome-art',`url("${url('assets/selected/cinematic-expedition.png')}")`);
    el.querySelector('#watchSelectedFilm').onclick=()=>showFilm();
    el.scrollTop=0;
    // Once per page visit, before choosing a mission. Starting another mission
    // or loading a save must never insert a second, unexpected film.
    if(!openingShown){openingShown=true;if(!window.INLINE)queueMicrotask(()=>showFilm(null,{opening:true}));}
  }
  window.SelectedExperience={available,decorateWelcome,showFilm,closeFilm};
})();
