from html.parser import HTMLParser
from pathlib import Path
import datetime, hashlib, json, os, re, shutil, struct, sys, tempfile, unittest, subprocess

root=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.tags=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag,dict(attrs)))
        if tag=='a': self.links.append(dict(attrs).get('href',''))
class SiteContract(unittest.TestCase):
    def test_independent_paths(self):
        for page in ['index.html','music.html','films.html']:
            links=Links((root/page).read_text(encoding='utf-8')).links
            for destination in ['index.html','music.html','films.html','index.html#about']:
                self.assertIn(destination,links,page)
    def test_public_catalogue_and_fallback(self):
        manifest=json.loads((root/'films.json').read_text(encoding='utf-8'))
        videos=manifest['videos']; self.assertTrue(videos)
        self.assertEqual(len({v['id'] for v in videos}),len(videos))
        for handle in ['thetruegentile','truepilgrimm']:
            self.assertGreater(sum(v['handle']==handle for v in videos),0)
        published=[datetime.datetime.fromisoformat(v['published']) for v in videos]
        self.assertEqual(published,sorted(published,reverse=True),'Newest first')
        links=Links((root/'films.html').read_text(encoding='utf-8')).links
        actual={u for u in links if '/video/' in u}
        self.assertEqual(actual,{v['url'] for v in videos})
        for v in videos:
            self.assertTrue(v['publicAccessVerified'] and v['dateVerified'] and v['videoVerified'] and v['ownerVerified'])
            self.assertEqual(v['url'],f"https://www.tiktok.com/@{v['handle']}/video/{v['id']}")
            self.assertIn(v['url'],links)
    def test_music_preserved(self):
        music=(root/'music.html').read_text(encoding='utf-8')
        for identity in ['featuredRelease','albumList','singlesGrid','about']:
            self.assertIn('id="'+identity+'"',music)
        self.assertTrue((root/'lyrics/i-am-talking-to-you.txt').is_file())
    def test_album_youtube_links_and_order(self):
        music=(root/'music.html').read_text(encoding='utf-8')
        self.assertLess(music.index('id="singles"'),music.index('id="album"'))
        self.assertNotIn('After the Album',music)
        album=json.loads((root/'releases.json').read_text(encoding='utf-8'))['albums'][0]
        expected_ids='Tq-izfJzmK4 UPWuQ7P5wU8 S4wsAvwGNDg cF-J2KUMsoE yec8Fdag9XI ym9wqnlgNnU 0IlOX-MNEX8 pWLgWU0JzNY BxkBe4PvNpk 2L-Je9qW9Is 21WqOnmgfp4 3VdUy3uIBNQ sYBwBfOYYTM o-cQqwaRb94 s8cCNQxf3P0 Vb2MV8jkBD0 KFFcH1i5o5Q uLGbjexIarc'.split()
        from urllib.parse import urlparse, parse_qs
        self.assertEqual([parse_qs(urlparse(t['youtubeUrl']).query)['v'][0] for t in album['tracks']],expected_ids)
        script=r"""
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const catalogue=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const wrap={innerHTML:''};
const context={URL,console,document:{addEventListener(){},getElementById:id=>id==='albumList'?wrap:null},fetch:async()=>({ok:true,json:async()=>catalogue})};
vm.createContext(context);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),context);
(async()=>{
 context.initAlbums();await new Promise(resolve=>setImmediate(resolve));
 assert.equal((wrap.innerHTML.match(/class="album-track-title album-track-link"/g)||[]).length,18);
 for(const track of catalogue.albums[0].tracks){
  const html=context.albumTrackTitle(track);assert.ok(html.includes(track.youtubeUrl.replace(/&/g,'&amp;')));
  assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));assert.ok(html.includes('on YouTube (opens in a new tab)'));
 }
 for(const youtubeUrl of [undefined,'javascript:alert(1)','https://evil.example/watch?v=Tq-izfJzmK4','https://www.youtube.com/watch?v=bad','https://user:pass@www.youtube.com/watch?v=Tq-izfJzmK4']){
  const html=context.albumTrackTitle({title:'<unsafe> & "title"',youtubeUrl});assert.ok(!html.includes('<a '));assert.ok(html.includes('&lt;unsafe&gt; &amp; &quot;title&quot;'));
 }
 context.fetchCatalogue=()=>Promise.reject(new Error('controlled fetch failure'));context.initAlbums();await new Promise(resolve=>setImmediate(resolve));
 assert.ok(wrap.innerHTML.includes('https://www.youtube.com/watch?v=Tq-izfJzmK4&amp;list='));
})().catch(e=>{console.error(e);process.exitCode=1});
"""
        result=subprocess.run(['node','-e',script,str(root/'script.js'),str(root/'releases.json')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_local_still_mapping(self):
        videos=json.loads((root/'films.json').read_text(encoding='utf-8'))['videos']
        tags=Links((root/'films.html').read_text(encoding='utf-8')).tags
        images=[attrs for tag,attrs in tags if tag=='img' and attrs.get('class')=='film-still-image']
        self.assertEqual(len(images),len(videos))
        hashes=set()
        for index,(video,image) in enumerate(zip(videos,images,strict=True)):
            still=video['still'];source=still['source']
            self.assertEqual(still['src'],f"assets/film-stills/{video['id']}.webp")
            self.assertEqual(image['src'],still['src'])
            self.assertEqual(image['alt'],still['alt'])
            self.assertTrue(still['alt'].strip())
            for key in ['width','height']:self.assertEqual(int(image[key]),still[key])
            self.assertEqual(image['loading'],'eager' if index<3 else 'lazy')
            self.assertEqual(image['decoding'],'async')
            self.assertNotIn('onerror',image)
            self.assertEqual(source['videoId'],video['id'])
            self.assertEqual(source['url'],video['url'])
            data=(root/still['src']).read_bytes()
            self.assertEqual(data[:4],b'RIFF');self.assertEqual(data[8:12],b'WEBP')
            digest=hashlib.sha256(data).hexdigest()
            self.assertEqual(digest,still['sha256']);hashes.add(digest)
        self.assertEqual(len(hashes),len(videos),'No placeholder reuse')
        self.assertEqual({p.name for p in (root/'assets/film-stills').iterdir()},{v['id']+'.webp' for v in videos})
    def test_gallery_build_validation(self):
        with tempfile.TemporaryDirectory() as folder:
            copy=Path(folder)
            for name in ['films.json','films.html','scripts/build-films.py']:
                (copy/name).parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(root/name,copy/name)
            shutil.copytree(root/'assets/film-stills',copy/'assets/film-stills')
            before=(copy/'films.html').read_bytes()
            result=subprocess.run([sys.executable,str(copy/'scripts/build-films.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual((copy/'films.html').read_bytes(),before,'Gallery generation must be reproducible')
            manifest=json.loads((copy/'films.json').read_text(encoding='utf-8'))
            manifest['videos'][0]['still']['src']=manifest['videos'][1]['still']['src']
            (copy/'films.json').write_text(json.dumps(manifest),encoding='utf-8')
            result=subprocess.run([sys.executable,str(copy/'scripts/build-films.py')],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertEqual((copy/'films.html').read_bytes(),before,'Invalid provenance must not rewrite the gallery')
    def test_page_motion_modes(self):
        for page,mode in [('index.html','fire'),('music.html','sparks'),('films.html','sparks')]:
            tags=Links((root/page).read_text(encoding='utf-8')).tags
            body=next(attrs for tag,attrs in tags if tag=='body')
            self.assertEqual(body.get('data-ambient'),mode,page)
            self.assertEqual(sum(tag=='canvas' and attrs.get('id')=='ambientSparks' for tag,attrs in tags),1,page)
            self.assertEqual(sum(tag=='button' and attrs.get('id')=='ambientToggle' for tag,attrs in tags),1,page)
            videos=[attrs for tag,attrs in tags if tag=='video']
            self.assertEqual(len(videos),int(mode=='fire'),page)
            if videos:
                self.assertEqual(videos[0].get('data-src'),'assets/hero-loop.mp4')
                self.assertNotIn('src',videos[0])
                for attr in ['muted','loop','playsinline']: self.assertIn(attr,videos[0])
    def test_ambient_lifecycle(self):
        script = r"""
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[1],'utf8');
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()};
function setup({mode='fire',reduced=false,stored='false',blocked=false,noContext=false,noStorage=false}={}) {
  const events={},windowEvents={},mediaEvents={},buttonEvents={},videoEvents={};
  const attrs={};let rafId=0,frames=new Map(),plays=0,clears=0,observer;
  const ctx={clearRect(){clears++},setTransform(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  const canvas={dataset:{},getContext:()=>noContext?null:ctx};
  const button={hidden:true,disabled:false,textContent:'',addEventListener(k,f){buttonEvents[k]=f},setAttribute(k,v){attrs[k]=v}};
  const status={textContent:''};
  const video={dataset:{src:'assets/hero-loop.mp4'},paused:true,muted:false,addEventListener(k,f){videoEvents[k]=f},getAttribute:k=>attrs['video:'+k],setAttribute(k,v){attrs['video:'+k]=v},pause(){this.paused=true},play(){plays++;if(blocked)return Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'}));this.paused=false;return Promise.resolve()}};
  const hero={getBoundingClientRect:()=>({top:96,height:650})},fire={style:{}};
  const media={matches:reduced,addEventListener(k,f){mediaEvents[k]=f}};
  const document={body:{dataset:{ambient:mode}},hidden:false,addEventListener(k,f){events[k]=f},getElementById:id=>({ambientSparks:canvas,ambientToggle:button,ambientStatus:status,ambientFireVideo:video}[id]),querySelector:sel=>({'.ambient-fire':fire,'.portal-hero':hero,'.portfolio-header':{}}[sel])};
  const window={innerWidth:375,innerHeight:812,devicePixelRatio:3,scrollY:0,matchMedia:()=>media,addEventListener(k,f){windowEvents[k]=f},IntersectionObserver:true,ResizeObserver:true};
  class IntersectionObserver{constructor(f){observer=f}observe(){}}
  class ResizeObserver{constructor(f){}observe(){}}
  const storage={getItem(){if(noStorage)throw Error();return stored},setItem(k,v){if(noStorage)throw Error();stored=v}};
  const context={document,window,sessionStorage:storage,IntersectionObserver,ResizeObserver,requestAnimationFrame:f=>{frames.set(++rafId,f);return rafId},cancelAnimationFrame:id=>frames.delete(id),Math};
  vm.createContext(context);vm.runInContext(source,context);context.initAmbientBackground();
  return {canvas,button,status,video,media,document,frames,attrs,events,windowEvents,mediaEvents,videoEvents,click:()=>buttonEvents.click(),intersect:visible=>observer([{isIntersecting:visible}]),get plays(){return plays},get clears(){return clears},get stored(){return stored},unblock(){blocked=false}};
}
(async()=>{
  let s=setup();await flush();assert.equal(s.frames.size,1);assert.equal(s.video.paused,false);assert.equal(s.attrs['video:src'],'assets/hero-loop.mp4');assert.equal(s.video.muted,true);assert.equal(s.canvas.width,563);
  s.click();assert.equal(s.frames.size,0);assert.equal(s.video.paused,true);assert.equal(s.stored,'true');assert.equal(s.button.textContent,'Play background');
  s.click();await flush();assert.equal(s.frames.size,1);assert.equal(s.video.paused,false);
  s.document.hidden=true;s.events.visibilitychange();assert.equal(s.frames.size,0);assert.equal(s.video.paused,true);
  s.document.hidden=false;s.events.visibilitychange();await flush();assert.equal(s.frames.size,1);assert.equal(s.video.paused,false);
  s.intersect(false);assert.equal(s.video.paused,true);assert.equal(s.frames.size,1);s.intersect(true);await flush();assert.equal(s.video.paused,false);
  s.media.matches=true;s.mediaEvents.change();assert.equal(s.frames.size,0);assert.equal(s.video.paused,true);assert.equal(s.button.disabled,true);
  s.media.matches=false;s.mediaEvents.change();await flush();assert.equal(s.frames.size,1);
  s.click();s.document.hidden=true;s.events.visibilitychange();s.document.hidden=false;s.events.visibilitychange();assert.equal(s.frames.size,0);assert.equal(s.video.paused,true);
  s.windowEvents.pagehide();assert.equal(s.frames.size,0);s.windowEvents.pageshow();assert.equal(s.frames.size,0);
  s=setup({mode:'sparks',stored:'true'});assert.equal(s.frames.size,0);assert.equal(s.plays,0);s.click();assert.equal(s.frames.size,1);assert.equal(s.plays,0);
  s=setup({reduced:true});assert.equal(s.frames.size,0);assert.equal(s.plays,0);assert.equal(s.attrs['video:src'],undefined);assert.equal(s.button.disabled,true);
  s=setup({blocked:true});await flush();assert.equal(s.frames.size,0);assert.equal(s.button.textContent,'Play background');assert.match(s.status.textContent,/blocked/);s.unblock();s.click();await flush();assert.equal(s.frames.size,1);assert.equal(s.video.paused,false);
  s=setup({noStorage:true,mode:'sparks'});s.click();assert.equal(s.frames.size,0);s.click();assert.equal(s.frames.size,1);
  s=setup({noContext:true,mode:'sparks'});assert.equal(s.button.hidden,true);assert.equal(s.frames.size,0);
  s=setup();s.videoEvents.error();assert.match(s.status.textContent,/unavailable/);assert.equal(s.frames.size,1);assert.equal(s.video.paused,true);
  console.log('Ambient behavior: pause/resume, navigation preference, hidden tab, offscreen fire, live reduced motion, autoplay rejection, missing canvas/storage, media failure and DPR cap passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
"""
        result = subprocess.run(['node','-e',script,str(root/'portfolio.js')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
PAGES=['index.html','music.html','films.html']
# 404.html is served for any missing path at any depth, so it uses root-relative asset
# paths and is deliberately noindex - it is checked for links and alt text, not listed
# in the sitemap.
ALL_PAGES=PAGES+['404.html']
# Lower this whenever alt text is improved. Never raise it: it is a ratchet, not a target.
GENERIC_ALT_CEILING=0

class SiteHygiene(unittest.TestCase):
    """Invariants that hold today, so they cannot regress unnoticed."""

    def test_one_main_heading_per_page(self):
        for page in PAGES:
            tags=Links((root/page).read_text(encoding='utf-8')).tags
            self.assertEqual(sum(1 for tag,_ in tags if tag=='h1'),1,f'{page} must have exactly one h1')

    def test_internal_references_resolve(self):
        missing=[]
        for page in ALL_PAGES:
            html=(root/page).read_text(encoding='utf-8')
            for ref in re.findall(r'(?:href|src)="([^"]+)"',html):
                if ref.startswith(('http://','https://','mailto:','data:','//','#')): continue
                clean=ref.split('#')[0].split('?')[0]
                if not clean: continue
                target=root/clean.lstrip('/')   # root-relative paths resolve from the site root
                if not target.exists(): missing.append(f'{page} -> {ref}')
        self.assertEqual(missing,[],'internal references that do not resolve')

    def test_every_image_has_an_alt_attribute(self):
        # Only presence is asserted. Whether an empty alt is correct depends on whether an
        # ancestor is aria-hidden, which this flat parser cannot see - asserting it here
        # produces false positives on the brand emblem, so it is deliberately not checked.
        missing=[]
        for page in ALL_PAGES:
            for tag,attrs in Links((root/page).read_text(encoding='utf-8')).tags:
                if tag=='img' and 'alt' not in attrs:
                    missing.append(f"{page} -> {attrs.get('src','?')}")
        self.assertEqual(missing,[],'images with no alt attribute')

    def test_catalogue_alt_text_does_not_regress(self):
        videos=json.loads((root/'films.json').read_text(encoding='utf-8'))['videos']
        generic=[v['id'] for v in videos if v['still']['alt'].startswith('Cover frame from the video')]
        self.assertLessEqual(len(generic),GENERIC_ALT_CEILING,
            f'{len(generic)} generic alt texts, ceiling is {GENERIC_ALT_CEILING}. '
            'Write a real description rather than raising the ceiling.')

    def test_contact_address_is_not_in_page_source(self):
        # The address is assembled from data attributes by portfolio.js so it never appears
        # literally in the served HTML. A readable <noscript> fallback keeps the page usable
        # without JavaScript. This only defeats regex harvesters, not scrapers running JS.
        # GitHub Pages serves every tracked file - README, JSON, lyrics, legacy pages - so
        # all of them are scanned, not just the four pages people navigate to.
        # -z: unquoted, NUL-separated names, so an unusual filename is scanned, not skipped.
        listing=subprocess.run(['git','ls-files','-z'],cwd=root,capture_output=True,text=True,check=True).stdout
        tracked=[name for name in listing.split('\0') if name]
        self.assertGreater(len(tracked),len(ALL_PAGES),'git ls-files returned too little to trust')
        exposed=[name for name in tracked if (root/name).is_file()
                 and re.search(rb'[A-Za-z0-9._%+-]+@pilgrimsnest\.org',(root/name).read_bytes())]
        self.assertEqual(exposed,[],f'served files expose a literal address: {exposed}')
        index=(root/'index.html').read_text(encoding='utf-8')
        self.assertIn('id="contactJs"',index,'contact line must be present for the script to fill')
        self.assertIn('data-u=',index,'contact address parts must be in data attributes')
        self.assertIn('<noscript>',index,'contact needs a no-JavaScript fallback')
        self.assertIn('initContactEmail',(root/'portfolio.js').read_text(encoding='utf-8'))

    def test_discovery_files(self):
        for name in ['robots.txt','sitemap.xml','404.html']:
            self.assertTrue((root/name).is_file(),f'{name} must exist')
        robots=(root/'robots.txt').read_text(encoding='utf-8')
        self.assertIn('Sitemap: https://pilgrimsnest.org/sitemap.xml',robots,'robots.txt must point at the sitemap')
        sitemap=(root/'sitemap.xml').read_text(encoding='utf-8')
        for page in PAGES:
            self.assertIn(f'https://pilgrimsnest.org/{page}'.replace('/index.html','/'),sitemap,
                          f'{page} must appear in sitemap.xml')
        self.assertEqual(sitemap.count('<url>'),sitemap.count('</url>'),'sitemap.xml is malformed')

    def test_no_inline_onerror_and_delegated_fallback(self):
        for page in ALL_PAGES:
            html=(root/page).read_text(encoding='utf-8')
            self.assertIsNone(re.search(r'\bonerror\s*=',html,re.I),f'{page} must not contain inline onerror handlers')
        script=r"""
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const listeners={};
const document={addEventListener(type,fn,capture){if(type==='error'&&capture)listeners.error=fn}};
const context={document};
vm.createContext(context);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),context);
context.initFilmStillFallback();
assert.equal(typeof listeners.error,'function');
const has=(set)=>({contains:c=>set.has(c)});
const img={classList:has(new Set(['film-still-image'])),hidden:false};
const backdrop={classList:has(new Set(['film-still-backdrop'])),hidden:false};
const other={classList:has(new Set(['brand-face'])),hidden:false};
listeners.error({target:img});listeners.error({target:backdrop});listeners.error({target:other});
assert.equal(img.hidden,true);assert.equal(backdrop.hidden,true);assert.equal(other.hidden,false);
"""
        result=subprocess.run(['node','-e',script,str(root/'portfolio.js')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_film_links_label_in_name_and_backdrop_skip(self):
        videos=json.loads((root/'films.json').read_text(encoding='utf-8'))['videos']
        tags=Links((root/'films.html').read_text(encoding='utf-8')).tags
        film_links=[attrs for tag,attrs in tags if tag=='a' and '/video/' in attrs.get('href','')]
        self.assertEqual(len(film_links),len(videos))
        for attrs in film_links:
            self.assertTrue(attrs.get('aria-label','').startswith('Watch on TikTok: '),attrs.get('aria-label'))
        backdrops=[attrs for tag,attrs in tags if tag=='img' and attrs.get('class')=='film-still-backdrop']
        expected_backdrops=sum((v['still']['width']/v['still']['height'])<1.7 for v in videos)
        self.assertEqual(len(backdrops),expected_backdrops)

    def test_music_build_validation(self):
        with tempfile.TemporaryDirectory() as folder:
            copy=Path(folder)
            for name in ['releases.json','music.html','scripts/build-music.py']:
                (copy/name).parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(root/name,copy/name)
            shutil.copytree(root/'lyrics',copy/'lyrics')
            before=(copy/'music.html').read_bytes()
            result=subprocess.run([sys.executable,str(copy/'scripts/build-music.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
            self.assertEqual((copy/'music.html').read_bytes(),before,'Music generation must be reproducible')
            bad=json.loads((copy/'releases.json').read_text(encoding='utf-8'))
            bad['releases'][0]['lyrics']='lyrics/missing.txt'
            (copy/'releases.json').write_text(json.dumps(bad),encoding='utf-8')
            result=subprocess.run([sys.executable,str(copy/'scripts/build-music.py')],capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0)
            self.assertEqual((copy/'music.html').read_bytes(),before,'Invalid lyrics must not rewrite music.html')
        catalogue=json.loads((root/'releases.json').read_text(encoding='utf-8'))
        music=(root/'music.html').read_text(encoding='utf-8')
        tags=Links(music).tags
        static_lyrics={attrs['href'] for tag,attrs in tags if tag=='a' and 'data-lyrics' in attrs}
        expected_lyrics={r['lyrics'] for r in catalogue['releases'] if r.get('lyrics')}
        self.assertEqual(static_lyrics,expected_lyrics)
        for rel in catalogue['releases']:
            self.assertIn(rel['title'],music)
        track_links=[attrs for tag,attrs in tags if tag=='a' and 'album-track-link' in attrs.get('class','')]
        self.assertEqual(len(track_links),len(catalogue['albums'][0]['tracks']))
        self.assertNotIn('release-loading',music)

    def test_script_utc_and_safety(self):
        script=r"""
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const catalogue=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const wrap={innerHTML:''};
const context={URL,console,document:{addEventListener(){},getElementById:id=>id==='albumList'?wrap:null},fetch:async()=>({ok:true,json:async()=>({...catalogue,albums:[{...catalogue.albums[0],appleUrl:''}]})})};
vm.createContext(context);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),context);
assert.equal(context.formatReleaseDate('2026-05-01'),'May 2026');
const lyr=context.lyricsButton({title:'Test Song',lyrics:'lyrics/test.txt'});
assert.ok(lyr.startsWith('<a ')&&lyr.includes('href="lyrics/test.txt"')&&lyr.includes('aria-label="Lyrics for Test Song"'));
const noApple=context.coverImage({title:'Demo',cover:'x.webp'},'feature-cover',600,600,false);
assert.ok(noApple.startsWith('<img ')&&!noApple.includes('<a '));
const baseSig=context.releaseSignature(catalogue.releases[0]);
const updatedSig=context.releaseSignature({...catalogue.releases[0],spotifyUrl:'https://open.spotify.com/album/abc'});
assert.notEqual(baseSig,updatedSig);
(async()=>{
  context.initAlbums();await new Promise(resolve=>setImmediate(resolve));
  assert.ok(!wrap.innerHTML.includes('href=""')&&!wrap.innerHTML.includes('href="undefined"'));
})().catch(e=>{console.error(e);process.exitCode=1});
"""
        env={**os.environ,'TZ':'America/New_York'}
        result=subprocess.run(['node','-e',script,str(root/'script.js'),str(root/'releases.json')],capture_output=True,text=True,env=env)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def test_img_aspect_ratios(self):
        def image_size(path):
            data=path.read_bytes()
            if data[:8]==b'\x89PNG\r\n\x1a\n':
                return struct.unpack('>II',data[16:24])
            if data[:4]==b'RIFF' and data[8:12]==b'WEBP':
                chunk=data[12:16]
                if chunk==b'VP8X':
                    return int.from_bytes(data[24:27],'little')+1,int.from_bytes(data[27:30],'little')+1
                if chunk==b'VP8 ':
                    w,h=struct.unpack('<HH',data[26:30])
                    return w&0x3fff,h&0x3fff
                if chunk==b'VP8L':
                    bits=int.from_bytes(data[21:25],'little')
                    return (bits&0x3fff)+1,((bits>>14)&0x3fff)+1
            return None
        for page in ['index.html','music.html','404.html']:
            for tag,attrs in Links((root/page).read_text(encoding='utf-8')).tags:
                if tag!='img': continue
                src=attrs.get('src','')
                if src.startswith(('http://','https://','data:')): continue
                target=root/src.lstrip('/')
                dims=image_size(target)
                if not dims or 'width' not in attrs or 'height' not in attrs: continue
                aw,ah=dims; dw,dh=int(attrs['width']),int(attrs['height'])
                self.assertAlmostEqual(aw/ah,dw/dh,delta=0.02,msg=f'{page} {src}: declared {dw}x{dh} vs actual {aw}x{ah}')

    def test_css_isolation_and_404_footer(self):
        for page in ['index.html','films.html','404.html']:
            html=(root/page).read_text(encoding='utf-8')
            self.assertNotIn('styles.css',html,f'{page} must not load styles.css')
        music=(root/'music.html').read_text(encoding='utf-8')
        self.assertLess(music.index('portfolio.css'),music.index('styles.css'))
        not_found=(root/'404.html').read_text(encoding='utf-8')
        self.assertIn('<footer class="portfolio-footer',not_found)

    def test_self_hosted_covers_and_geo_apple_links(self):
        rel_text=(root/'releases.json').read_text(encoding='utf-8')
        music=(root/'music.html').read_text(encoding='utf-8')
        script_js=(root/'script.js').read_text(encoding='utf-8')
        for label,text in [('releases.json',rel_text),('music.html',music)]:
            self.assertNotIn('mzstatic.com',text,f'{label} must not hotlink Apple CDN covers')
        for label,text in [('releases.json',rel_text),('music.html',music),('script.js',script_js)]:
            self.assertNotIn('https://music.apple.com/bw/',text,f'{label} must use geo-neutral Apple Music URLs')
        catalogue=json.loads(rel_text)
        for item in catalogue['albums']+catalogue['releases']:
            cover=item['cover']
            self.assertFalse(cover.startswith(('http://','https://')),cover)
            path=root/cover
            self.assertTrue(path.is_file(),f'Missing cover {cover}')
            data=path.read_bytes()
            self.assertEqual(data[:4],b'RIFF');self.assertEqual(data[8:12],b'WEBP')
            self.assertIn(cover,music)

    def test_structured_data_jsonld(self):
        def parse_jsonld(page):
            html=(root/page).read_text(encoding='utf-8')
            blocks=re.findall(r'<script type="application/ld\+json">(.*?)</script>',html,re.S)
            self.assertEqual(len(blocks),1,f'{page} must have exactly one JSON-LD script')
            return json.loads(blocks[0].replace(r'<\/','</'))
        idx=parse_jsonld('index.html')
        self.assertEqual(idx['@context'],'https://schema.org')
        self.assertEqual({n['@type'] for n in idx['@graph']},{'WebSite','MusicGroup'})
        mus=parse_jsonld('music.html')
        self.assertEqual(mus['@context'],'https://schema.org')
        by_type={n['@type']:n for n in mus['@graph']}
        self.assertIn('MusicGroup',by_type)
        self.assertEqual(len(by_type['MusicAlbum']['track']),18)
        self.assertEqual(len(by_type['ItemList']['itemListElement']),8)
        flm=parse_jsonld('films.html')
        self.assertEqual(flm['@context'],'https://schema.org')
        self.assertEqual(flm['@type'],'CollectionPage')
        self.assertEqual(flm['mainEntity']['numberOfItems'],227)

    def test_social_cards_favicons_and_italic_font(self):
        og=(root/'assets/og-card.jpg').read_bytes()
        self.assertEqual(og[:2],b'\xff\xd8','og-card.jpg must be JPEG')
        i=2; dims=None
        while i+8<len(og):
            if og[i]!=0xff: break
            marker=og[i+1]; i+=2
            if marker in (0xc0,0xc1,0xc2):
                h,w=struct.unpack('>HH',og[i+3:i+7]); dims=(w,h); break
            seg_len=struct.unpack('>H',og[i:i+2])[0]
            i+=seg_len
        self.assertEqual(dims,(1200,630))
        ico=(root/'favicon.ico').read_bytes()
        self.assertEqual(ico[:4],b'\x00\x00\x01\x00')
        self.assertTrue((root/'assets/fonts/cormorant-italic.woff2').is_file())
        pcss=(root/'portfolio.css').read_text(encoding='utf-8')
        self.assertIn('cormorant-italic.woff2',pcss)
        self.assertIn('font-style:italic',pcss)
        for page in PAGES:
            html=(root/page).read_text(encoding='utf-8')
            self.assertNotIn('property="twitter:',html,f'{page} must use name="twitter:..."')
            tags=Links(html).tags
            metas={(attrs.get('property') or attrs.get('name')):attrs.get('content') for tag,attrs in tags if tag=='meta'}
            self.assertEqual(metas.get('og:image'),'https://pilgrimsnest.org/assets/og-card.jpg',page)
            self.assertEqual(metas.get('og:image:width'),'1200',page)
            self.assertEqual(metas.get('og:image:height'),'630',page)
            self.assertEqual(metas.get('twitter:card'),'summary_large_image',page)
            self.assertEqual(metas.get('twitter:image'),'https://pilgrimsnest.org/assets/og-card.jpg',page)
        for page in ALL_PAGES:
            hrefs=[attrs.get('href','') for tag,attrs in Links((root/page).read_text(encoding='utf-8')).tags if tag=='link']
            self.assertTrue(any(h.endswith('favicon.ico') for h in hrefs),page)
            self.assertTrue(any(h.endswith('favicon.png') for h in hrefs),page)

    def test_no_orphan_root_assets(self):
        corpus='\n'.join((root/name).read_text(encoding='utf-8') for name in ALL_PAGES+['portfolio.css','styles.css','portfolio.js','script.js','releases.json'])
        orphans=[]
        for p in (root/'assets').rglob('*'):
            if not p.is_file(): continue
            rel=p.relative_to(root).as_posix()
            if rel.startswith('assets/film-stills/') or rel.endswith('-OFL.txt'): continue
            if rel not in corpus: orphans.append(rel)
        self.assertEqual(orphans,[],f'Orphan assets found: {orphans}')

    def test_films_discovery_controls_and_years(self):
        videos=json.loads((root/'films.json').read_text(encoding='utf-8'))['videos']
        films=(root/'films.html').read_text(encoding='utf-8')
        tags=Links(films).tags
        cards=[attrs for tag,attrs in tags if tag=='article' and 'film-card' in attrs.get('class','')]
        self.assertEqual(len(cards),len(videos))
        for video,card in zip(videos,cards,strict=True):
            self.assertEqual(card.get('data-year'),str(datetime.datetime.fromisoformat(video['published']).year))
        self.assertIn('id="filmSearch"',films)
        self.assertIn('id="filmYear"',films)
        self.assertIn('id="filmEmpty"',films)
        self.assertIn('class="film-reset"',films)
        self.assertIn('class="back-to-top"',films)
        expected_years={str(datetime.datetime.fromisoformat(v['published']).year) for v in videos}
        year_options={attrs.get('value') for tag,attrs in tags if tag=='option' and attrs.get('value')!='all'}
        self.assertEqual(year_options,expected_years)
        result=subprocess.run(['node','--check',str(root/'scripts/check-rendered.mjs')],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_csp_and_referrer_meta(self):
        for page in ALL_PAGES:
            html=(root/page).read_text(encoding='utf-8')
            tags=Links(html).tags
            csp=[attrs.get('content','') for tag,attrs in tags if tag=='meta' and attrs.get('http-equiv','').lower()=='content-security-policy']
            self.assertEqual(len(csp),1,f'{page} must declare one CSP meta tag')
            policy=csp[0]
            for req in ["default-src 'self'","script-src 'self'","style-src 'self'","object-src 'none'","base-uri 'self'","form-action 'self'"]:
                self.assertIn(req,policy,f'{page} CSP missing {req}')
            for bad in ["'unsafe-inline'","'unsafe-eval'",'frame-ancestors','upgrade-insecure-requests']:
                self.assertNotIn(bad,policy,f'{page} CSP must not include {bad}')
            ref=[attrs.get('content','') for tag,attrs in tags if tag=='meta' and attrs.get('name','').lower()=='referrer']
            self.assertEqual(ref,['strict-origin-when-cross-origin'],f'{page} must set referrer policy')
            self.assertIsNone(re.search(r'<style\b|\bstyle\s*=|\bon[a-z]+\s*=',html,re.I),f'{page} must not contain inline styles or handlers')

    def test_ci_workflow_hygiene(self):
        wf=root/'.github/workflows/pages.yml'
        self.assertTrue(wf.is_file(),'pages.yml workflow must exist')
        text=wf.read_text(encoding='utf-8').replace('\r\n','\n')
        uses=re.findall(r'^\s*-?\s*uses:\s*([^\s#]+)',text,re.M)
        self.assertGreaterEqual(len(uses),6)
        for ref in uses:
            self.assertRegex(ref,r'^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+@[0-9a-f]{40}$',f'Action must be SHA-pinned: {ref}')
        head,sep,deploy=text.partition('\n  deploy:')
        self.assertTrue(sep,'Workflow must define a deploy job')
        self.assertIn('contents: read',head)
        self.assertNotIn('pages: write',head)
        self.assertNotIn('id-token: write',head)
        for req in ['scripts/test-site.py','scripts/verify-films.py','node --check','scripts/check-rendered.mjs',"['git', 'ls-files', '-z']","'CNAME'","'scripts/'","'README.md'"]:
            self.assertIn(req,head,f'verify job missing {req}')
        for req in ['needs: verify',"refs/heads/main",'pages: write','id-token: write','name: github-pages']:
            self.assertIn(req,deploy,f'deploy job missing {req}')

if __name__=='__main__': unittest.main()
