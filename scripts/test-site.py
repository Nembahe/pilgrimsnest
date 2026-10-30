from html.parser import HTMLParser
from pathlib import Path
import datetime, hashlib, json, re, shutil, tempfile, unittest, subprocess

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
            self.assertEqual(image['onerror'],'this.hidden=true')
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
            result=subprocess.run(['python',str(copy/'scripts/build-films.py')],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertEqual((copy/'films.html').read_bytes(),before,'Gallery generation must be reproducible')
            manifest=json.loads((copy/'films.json').read_text(encoding='utf-8'))
            manifest['videos'][0]['still']['src']=manifest['videos'][1]['still']['src']
            (copy/'films.json').write_text(json.dumps(manifest),encoding='utf-8')
            result=subprocess.run(['python',str(copy/'scripts/build-films.py')],capture_output=True,text=True)
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
GENERIC_ALT_CEILING=179

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

if __name__=='__main__': unittest.main()
