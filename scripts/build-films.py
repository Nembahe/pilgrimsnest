"""Refresh the no-JavaScript gallery from the verified public manifest. No network calls."""
from pathlib import Path
import datetime,hashlib,html,json,re

root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'films.json').read_text(encoding='utf-8'))
videos=manifest['videos']
assert len(videos)==40 and len({v['id'] for v in videos})==40, 'Expected 40 unique verified videos'
for handle in ['thetruegentile','truepilgrimm']:
    assert sum(v['handle']==handle for v in videos)==20, 'Expected 20 per account'
cards=[]
for index,v in enumerate(videos):
    assert all(v.get(k) for k in ['publicAccessVerified','dateVerified','videoVerified','ownerVerified']), 'Unverified video'
    assert re.fullmatch(r'\d{19}',v['id']), 'Invalid video ID'
    assert v['url']==f"https://www.tiktok.com/@{v['handle']}/video/{v['id']}", 'Unexpected owner URL'
    still=v['still']
    assert still['src']==f"assets/film-stills/{v['id']}.webp", 'Still must belong to this video ID'
    asset=root/still['src']
    assert asset.is_file(), 'Missing local still'
    assert hashlib.sha256(asset.read_bytes()).hexdigest()==still['sha256'], 'Still content changed without verification'
    assert all(type(still[key]) is int and 0<still[key]<=960 for key in ['width','height']), 'Invalid still dimensions'
    assert isinstance(still['alt'],str) and still['alt'].strip(), 'Missing still description'
    source=still['source']
    assert source['videoId']==v['id'] and source['url']==v['url'], 'Still provenance mismatch'
    assert source['type'] in ['public-video-selected-cover','public-video-origin-cover','public-video-cover','public-video-preview-frame','public-video-frame'], 'Unsupported still source'
    assert re.fullmatch(r'[a-f0-9]{64}',source['originalSha256']), 'Missing source fingerprint'
    if source['type']=='public-video-frame':
        assert 0<=source['frameTimestampSeconds']<=float(v['duration'])+1, 'Invalid frame timestamp'
    author='Pilgrim’s Nest' if v['handle']=='truepilgrimm' else 'Gentile Nembahe'
    title=re.split(r'\s#',v['title'],maxsplit=1)[0].strip() or 'Video by '+author
    title=title[:157]+'…' if len(title)>160 else title
    date=datetime.datetime.fromisoformat(v['published'])
    date_label=f'{date.day} {date:%B %Y}'
    duration=f"{int(v['duration'])//60}:{int(v['duration'])%60:02d}"
    loading='eager' if index<3 else 'lazy'
    image_attrs=f'src="{still["src"]}" width="{still["width"]}" height="{still["height"]}" loading="{loading}" decoding="async" onerror="this.hidden=true"'
    cards.append(f'''<article class="film-card" data-account="{v['handle']}" data-video-id="{v['id']}"><div class="film-still"><span class="film-still-fallback" aria-hidden="true">Still unavailable<br>Watch on TikTok below</span><img class="film-still-backdrop" {image_attrs} alt="" aria-hidden="true"><img class="film-still-image" {image_attrs} alt="{html.escape(still['alt'],quote=True)}"></div><p class="film-author">{author}</p><h2>{html.escape(title)}</h2><time datetime="{date.date().isoformat()}">{date_label} · {duration}</time><a class="gold-link" href="{v['url']}" target="_blank" rel="noopener noreferrer" aria-label="Watch {html.escape(title,quote=True)} on TikTok">Watch on TikTok <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a></article>''')
page_path=root/'films.html'
page=page_path.read_text(encoding='utf-8')
verified=datetime.date.fromisoformat(manifest['verifiedAt'])
verified_label=f'{verified.day} {verified:%B %Y}'
page=re.sub(r'<p class="film-count"[^>]*>.*?</p>',lambda _: f'<p class="film-count" role="status" data-verified-label="{verified_label}">40 videos · 20 from each account · verified {verified_label}</p>',page)
assert page.count('<!-- films:start -->')==1 and page.count('<!-- films:end -->')==1
page=re.sub(r'<!-- films:start -->.*?<!-- films:end -->',lambda _: '<!-- films:start -->\n'+'\n'.join(cards)+'\n<!-- films:end -->',page,flags=re.S)
page_path.write_text(page,encoding='utf-8')
print('Built 40 static video cards with verified local stills from films.json')
