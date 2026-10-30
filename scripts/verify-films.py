"""Re-verify the films catalogue. Offline by default; --live re-checks each post anonymously.

  python scripts/verify-films.py            # local integrity only, no network
  python scripts/verify-films.py --live     # also re-check every post is still public
  python scripts/verify-films.py --live --stamp   # on a clean --live pass, set verifiedAt to today

Exits non-zero if anything fails, so it is safe to wire into a check.
Only --stamp writes, and only the manifest's verifiedAt field.
"""
import argparse,datetime,hashlib,json,re,subprocess,sys,time
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'films.json'
ACCOUNTS={'thetruegentile','truepilgrimm'}
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

def check_local(videos):
    """Every claim the manifest makes about itself and its local stills."""
    problems=[]
    def bad(v,msg): problems.append(f"{v.get('id','?')}: {msg}")
    seen=set()
    for v in videos:
        if v['id'] in seen: bad(v,'duplicate id')
        seen.add(v['id'])
        if not re.fullmatch(r'\d{19}',v['id']): bad(v,'malformed id')
        if v['handle'] not in ACCOUNTS: bad(v,f"unknown account {v['handle']}")
        if v['url']!=f"https://www.tiktok.com/@{v['handle']}/video/{v['id']}": bad(v,'url does not match handle/id')
        for flag in ['publicAccessVerified','dateVerified','videoVerified','ownerVerified']:
            if not v.get(flag): bad(v,f'{flag} is not true')
        still=v['still']
        if still['src']!=f"assets/film-stills/{v['id']}.webp": bad(v,'still src does not match id')
        asset=ROOT/still['src']
        if not asset.is_file():
            bad(v,'still file missing'); continue
        data=asset.read_bytes()
        if data[:4]!=b'RIFF' or data[8:12]!=b'WEBP': bad(v,'still is not a webp')
        if hashlib.sha256(data).hexdigest()!=still['sha256']: bad(v,'STILL CONTENT CHANGED since verification')
        if not (0<still['width']<=960 and 0<still['height']<=960): bad(v,'still dimensions out of range')
        if not str(still.get('alt','')).strip(): bad(v,'still has no alt text')
        src=still['source']
        if src['videoId']!=v['id'] or src['url']!=v['url']: bad(v,'still provenance mismatch')
        if not re.fullmatch(r'[a-f0-9]{64}',src.get('originalSha256','')): bad(v,'missing source fingerprint')
    try:
        published=[datetime.datetime.fromisoformat(v['published']) for v in videos]
        if published!=sorted(published,reverse=True): problems.append('ORDER: videos are not newest-first')
    except ValueError as exc:
        problems.append(f'ORDER: unreadable published date ({exc})')
    on_disk={p.name for p in (ROOT/'assets/film-stills').iterdir()}
    expected={v['id']+'.webp' for v in videos}
    for extra in sorted(on_disk-expected): problems.append(f'orphan still not in manifest: {extra}')
    for missing in sorted(expected-on_disk): problems.append(f'manifest still absent from disk: {missing}')
    return problems

def check_live(videos,pause):
    """Anonymous re-check that each post is still public. Network, read-only."""
    problems=[];unknown=[]
    for i,v in enumerate(videos,1):
        out=subprocess.run(['curl','-sL','--max-time','30','-A',UA,v['url']],
                           capture_output=True,text=True,encoding='utf-8',errors='ignore').stdout or ''
        blob=re.search(r'id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>',out,re.S)
        if not blob:
            unknown.append(f"{v['id']}: no page data (blocked or rate limited) — not proof of removal")
        else:
            try:
                detail=json.loads(blob.group(1))['__DEFAULT_SCOPE__']['webapp.video-detail']
                item=(detail.get('itemInfo') or {}).get('itemStruct') or {}
                if detail.get('statusCode')!=0: problems.append(f"{v['id']}: statusCode {detail.get('statusCode')} — gone or restricted")
                elif item.get('privateItem'): problems.append(f"{v['id']}: now private")
                elif item.get('id')!=v['id']: problems.append(f"{v['id']}: served a different video")
            except Exception as exc:
                unknown.append(f"{v['id']}: unreadable page data ({exc.__class__.__name__}) — not proof of removal")
        print(f'  {i}/{len(videos)} {v["id"]}',end='\r',flush=True)
        time.sleep(pause)
    print(' '*40,end='\r')
    return problems,unknown

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--live',action='store_true',help='re-check every post anonymously over the network')
    ap.add_argument('--stamp',action='store_true',help='on a clean --live pass, set verifiedAt to today')
    ap.add_argument('--pause',type=float,default=0.7,help='seconds between live requests')
    args=ap.parse_args()
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
    videos=manifest['videos']
    counts={h:sum(v['handle']==h for v in videos) for h in sorted(ACCOUNTS)}
    print(f"{len(videos)} entries · "+' · '.join(f'{n} {h}' for h,n in counts.items())+f" · manifest verifiedAt {manifest['verifiedAt']}")

    problems=check_local(videos)
    print(('FAIL' if problems else 'OK  ')+f'  local integrity ({len(videos)} stills hashed)')
    unknown=[]
    if args.live:
        live_problems,unknown=check_live(videos,args.pause)
        problems+=live_problems
        print(('FAIL' if live_problems else 'OK  ')+f'  live public access ({len(videos)-len(unknown)} of {len(videos)} conclusive)')

    for u in unknown: print('  inconclusive:',u)
    for p in problems: print('  problem:',p)

    if problems:
        print(f'\n{len(problems)} problem(s). Nothing was written.'); return 1
    if args.stamp:
        if not args.live:
            print('\n--stamp needs --live: the date must mean every entry was re-checked.'); return 2
        if unknown:
            print(f'\nNot stamping: {len(unknown)} entry(s) inconclusive. Re-run before stamping.'); return 3
        today=datetime.date.today().isoformat()
        manifest['verifiedAt']=today
        MANIFEST.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(f'\nverifiedAt set to {today}. Run scripts/build-films.py to refresh the page label.')
    elif not unknown:
        print('\nAll checks passed.')
    return 0

if __name__=='__main__':
    sys.exit(main())
