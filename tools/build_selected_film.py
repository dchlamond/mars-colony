"""Student-selected film 6: intact Hades recording, MSA captions, retimed edit.
Source recordings and original six review cuts remain untouched.
"""
from pathlib import Path
import json, re, subprocess, shutil
ROOT=Path(__file__).resolve().parents[1]
MEDIA=ROOT.parent/'Video Intros'
REVIEW=MEDIA/'07 Review'
WORK=ROOT/'dist/selected-film'; WORK.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'game/assets/intro'; OUT.mkdir(parents=True,exist_ok=True)
FF='/opt/homebrew/bin/ffmpeg'; FP='/opt/homebrew/bin/ffprobe'
def run(args):
    subprocess.run([FF,'-y','-hide_banner','-loglevel','error',*map(str,args)],check=True)
def probe(p):
    return json.loads(subprocess.check_output([FP,'-v','error','-show_format','-show_streams','-of','json',str(p)]))
def esc(p):return str(p).replace(':','\\:').replace("'","\\'")
source=MEDIA/'04 Audio/03-Hades-master-intro.mp3'
duration=float(probe(source)['format']['duration'])
captions=json.loads((ROOT/'art/selected/arabic-captions.json').read_text())
blocks=(MEDIA/'04 Audio/transcripts/03-Hades-master-intro.srt').read_text().strip().split('\n\n')
assert len(captions)==len(blocks)==43
srt='\n\n'.join(f'{i+1}\n{b.splitlines()[1]}\n{t}' for i,(b,t) in enumerate(zip(blocks,captions)))+'\n'
(OUT/'two-futures-hades-ar.srt').write_text(srt)
(OUT/'two-futures-hades-ar.vtt').write_text('WEBVTT\n\n'+re.sub(r'(\d\d:\d\d:\d\d),(\d{3})',r'\1.\2',srt))
# Boundaries follow Hades's actual phrase timings, not Graham's pace.
names=['01-arrival','02-nasa','03-stakes','04-crew','05-choice','06-panels','07-shelter','08-systems','09-survey','10-instrument','11a-paired','11b-futures','12-learning','13-outcome','14-modes','15-hope','16-end']
ends=[11.88,21.76,24.52,32.4,39.48,43.5,49.28,55.76,64.6,67.16,73.28,84.48,92.64,102.6,111.72,116.56,duration]
paths=[]; start=0
for name,end in zip(names,ends):
    src=REVIEW/'cinematic-review/segments-06'/f'{name}.mp4'
    old=float(probe(src)['format']['duration']); length=end-start
    dst=WORK/f'{name}.mp4'
    replacement=(MEDIA/'06 Equipment/02-field-scientist.png') if name=='10-instrument' else (ROOT/'dist/verification/selected-welcome-local.png') if name=='14-modes' else None
    if replacement and replacement.exists():
        run(['-loop','1','-i',replacement,'-vf','scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x07131b,setsar=1,fps=30','-t',length,'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',dst])
    else:
        run(['-i',src,'-vf',f'setpts={(length/old):.9f}*PTS,fps=30,tpad=stop_mode=clone:stop_duration=0.1','-t',length,'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',dst])
    paths.append(dst);start=end
concat=WORK/'concat.txt';concat.write_text(''.join(f"file '{p}'\n" for p in paths))
silent=WORK/'retimed.mp4'
run(['-f','concat','-safe',0,'-i',concat,'-c','copy','-an',silent])
# One uninterrupted voice track; softly duck the original project score beneath it.
mix=WORK/'Hades-mix.wav';stems=MEDIA/'04 Audio/stems'
ratio=123.067/duration
run(['-i',source,'-i',stems/'blackout-original-ambient.wav','-i',stems/'blackout-original-effects.wav',
     '-filter_complex',f'[0:a]loudnorm=I=-16:TP=-2:LRA=11,aresample=48000,apad,asplit=2[v][sc];[1:a]atempo={ratio},volume=0.22[m];[m][sc]sidechaincompress=threshold=0.03:ratio=5:attack=35:release=600[duck];[2:a]atempo={ratio},volume=0.42[fx];[v][duck][fx]amix=inputs=3:duration=longest:normalize=0,alimiter=limit=0.94:level=0[a]',
     '-map','[a]','-t',duration,'-c:a','pcm_s16le',mix])
# libass performs Arabic shaping and RTL layout. Burn captions for reliable
# phone/full-screen playback; sidecars remain available for editing/accessibility.
caps=f"subtitles=filename='{esc(OUT/'two-futures-hades-ar.srt')}':fontsdir='/System/Library/Fonts':force_style='FontName=Geeza Pro,FontSize=23,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101519,BorderStyle=1,Outline=2,Shadow=1,MarginV=25,MarginL=48,MarginR=48,Alignment=2'"
font=esc(ROOT/'game/assets/fonts/BarlowCondensed-SemiBold.ttf')
title=f"drawbox=x=0:y=200:w=1280:h=250:color=0x07131b@0.55:t=fill:enable='between(t,9.72,11.88)',drawtext=fontfile='{font}':text='DEAD RECKONING':x=(w-text_w)/2:y=237:fontsize=36:fontcolor=0xeaf5f8:enable='between(t,9.72,11.88)',drawtext=fontfile='{font}':text='BLACKOUT':x=(w-text_w)/2:y=278:fontsize=108:fontcolor=0xc5e8f2:enable='between(t,9.72,11.88)'"
final=OUT/'two-futures-hades-ar.mp4'
run(['-i',silent,'-i',mix,'-map','0:v:0','-map','1:a:0','-vf',title+','+caps,'-t',duration,'-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',final])
manifest={'film':6,'treatment':'Two Futures','voice':'Hades','spokenLanguage':'en','subtitles':'ar (Modern Standard Arabic)','captionCount':43,'duration':duration,'audioSource':str(source.relative_to(ROOT.parent)),'timings':dict(zip(names,ends)),'media':probe(final)}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
delivery=MEDIA/'08 Selected Release';delivery.mkdir(exist_ok=True)
for p in (final,OUT/'two-futures-hades-ar.srt',OUT/'two-futures-hades-ar.vtt',OUT/'manifest.json'):
    shutil.copy2(p,delivery/p.name)
print('Selected Hades film complete',duration,final.stat().st_size,flush=True)
