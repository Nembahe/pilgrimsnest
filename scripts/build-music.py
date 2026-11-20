"""Refresh the static music catalogue in music.html from releases.json. No network calls."""
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import datetime, html, json, re

root = Path(__file__).resolve().parents[1]
catalogue = json.loads((root / 'releases.json').read_text(encoding='utf-8'))
releases = catalogue.get('releases') or []
albums = catalogue.get('albums') or []
assert releases, 'Expected at least one release in releases.json'
assert albums, 'Expected at least one album in releases.json'


def validate_iso_date(iso):
    assert isinstance(iso, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', iso), f'Invalid ISO date: {iso!r}'
    return datetime.date.fromisoformat(iso)


def format_release_date(iso):
    return f'{validate_iso_date(iso):%B %Y}'


def format_track_time(seconds):
    s = round(float(seconds or 0))
    return f'{s // 60}:{s % 60:02d}'


def iso_duration(seconds):
    s = round(float(seconds or 0))
    return f'PT{s // 60}M{s % 60}S'


def validate_youtube_url(raw):
    if not isinstance(raw, str) or not raw:
        return False
    parts = urlsplit(raw)
    v_vals = parse_qs(parts.query).get('v', [])
    return (
        parts.scheme == 'https'
        and parts.hostname == 'www.youtube.com'
        and parts.path == '/watch'
        and not parts.username
        and not parts.password
        and parts.port is None
        and len(v_vals) == 1
        and bool(re.fullmatch(r'[\w-]{11}', v_vals[0]))
    )


def validate_release_item(rel):
    assert isinstance(rel.get('title'), str) and rel['title'].strip(), 'Release missing title'
    assert isinstance(rel.get('cover'), str) and rel['cover'].strip(), f'Release missing cover: {rel["title"]}'
    validate_iso_date(rel.get('released'))
    lyrics = rel.get('lyrics')
    if lyrics:
        target = (root / lyrics).resolve()
        assert target.is_relative_to(root) and target.is_file(), f'Missing lyrics file: {lyrics}'


def release_sig(rel):
    return '|'.join([
        rel.get('appleId') or rel['title'],
        rel['title'],
        rel['released'],
        rel.get('appleUrl', ''),
        rel.get('spotifyUrl', ''),
        rel.get('youtubeUrl', ''),
        rel.get('lyrics', ''),
        rel.get('cover', ''),
    ])


def lyrics_link(rel):
    lyrics = rel.get('lyrics', '')
    if not lyrics:
        return ''
    title = html.escape(rel['title'], quote=True)
    href = html.escape(lyrics, quote=True)
    return f'<a class="release-link lyrics-btn" href="{href}" data-lyrics="{href}" data-lyrics-title="{title}" aria-label="Lyrics for {title}">Lyrics</a>'


def platform_links(rel, cls):
    title = html.escape(rel['title'], quote=True)
    links = []
    for key, label in [('appleUrl', 'Apple Music'), ('spotifyUrl', 'Spotify'), ('youtubeUrl', 'YouTube')]:
        url = rel.get(key)
        if url:
            links.append(
                f'<a class="{cls}" href="{html.escape(url, quote=True)}" target="_blank" '
                f'rel="noopener noreferrer" aria-label="{title} on {label}">{label}</a>'
            )
    return ''.join(links) + lyrics_link(rel)


def cover_image(rel, cls, width, height, lazy, alt_suffix='cover art'):
    title = html.escape(rel['title'], quote=True)
    attrs = ' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"'
    img = (
        f'<img class="{cls}"{attrs} width="{width}" height="{height}" '
        f'src="{html.escape(rel["cover"], quote=True)}" alt="{title} {alt_suffix}">'
    )
    apple_url = rel.get('appleUrl')
    if not apple_url:
        return img
    return (
        f'<a class="{cls}-link" href="{html.escape(apple_url, quote=True)}" '
        f'target="_blank" rel="noopener noreferrer" aria-label="Listen to {title} on Apple Music">{img}</a>'
    )


def album_track_title(track):
    assert isinstance(track.get('title'), str) and track['title'].strip(), 'Track missing title'
    assert 'seconds' in track, f'Track missing duration: {track["title"]}'
    title = html.escape(track['title'], quote=True)
    yt = track.get('youtubeUrl', '')
    assert validate_youtube_url(yt), f'Invalid YouTube URL for {track["title"]}: {yt!r}'
    return (
        f'<a class="album-track-title album-track-link" href="{html.escape(yt, quote=True)}" '
        f'target="_blank" rel="noopener noreferrer" aria-label="Listen to {title} on YouTube (opens in a new tab)">'
        f'{title}<span class="album-track-cue" aria-hidden="true"> ↗</span></a>'
    )


for rel in releases:
    validate_release_item(rel)

sorted_releases = sorted(releases, key=lambda r: r['released'], reverse=True)
latest = sorted_releases[0]
earlier = sorted_releases[1:]

latest_key = html.escape(latest.get('appleId') or latest['title'], quote=True)
latest_sig = html.escape(release_sig(latest), quote=True)
featured_html = '\n'.join([
    f'          <article class="feature" id="featuredRelease" data-release-id="{latest_key}" data-release-sig="{latest_sig}">',
    f'            {cover_image(latest, "feature-cover", 600, 600, False)}',
    '            <div class="feature-body">',
    '              <div class="feature-meta">',
    '                <span class="feature-label">Latest single</span>',
    f'                <h2 class="feature-title">{html.escape(latest["title"])}</h2>',
    f'                <p class="feature-date">{format_release_date(latest["released"])}</p>',
    '              </div>',
    f'              <div class="release-links">{platform_links(latest, "release-link")}</div>',
    '            </div>',
    '          </article>',
])

singles_cards = []
for rel in earlier:
    singles_cards.append('\n'.join([
        '          <article class="single-card">',
        f'            {cover_image(rel, "single-cover", 600, 600, True)}',
        '            <div class="single-meta">',
        f'              <h3 class="single-title">{html.escape(rel["title"])}</h3>',
        f'              <p class="single-date">{format_release_date(rel["released"])}</p>',
        '            </div>',
        f'            <div class="release-links">{platform_links(rel, "release-link")}</div>',
        '          </article>',
    ]))
singles_html = '\n'.join(singles_cards)

album_blocks = []
for album in albums:
    validate_release_item(album)
    tracks = album.get('tracks') or []
    assert tracks, f'Album missing tracks: {album["title"]}'
    minutes = round(sum(float(t.get('seconds') or 0) for t in tracks) / 60)
    track_items = []
    for t in tracks:
        track_items.append('\n'.join([
            '              <li class="album-track">',
            f'                {album_track_title(t)}',
            f'                <span class="album-track-time">{format_track_time(t.get("seconds"))}</span>',
            '              </li>',
        ]))
    album_blocks.append('\n'.join([
        '          <article class="album">',
        '            <div class="album-side">',
        f'              {cover_image(album, "feature-cover", 600, 600, True, "album cover")}',
        f'              <h3 class="album-title">{html.escape(album["title"])}</h3>',
        f'              <p class="album-facts">{len(tracks)} tracks &bull; {minutes} min &bull; {format_release_date(album["released"])}</p>',
        f'              <div class="platform-links">{platform_links(album, "platform-btn")}</div>',
        '            </div>',
        '            <ol class="album-tracks">',
        *track_items,
        '            </ol>',
        '          </article>',
    ]))
albums_html = '\n'.join(album_blocks)

page_path = root / 'music.html'
page = page_path.read_text(encoding='utf-8')

artist_links = catalogue.get('artistLinks') or {}
artist_node = {
    '@type': 'MusicGroup',
    '@id': 'https://pilgrimsnest.org/#artist',
    'name': catalogue.get('artist', 'Pilgrim'),
    'url': 'https://pilgrimsnest.org/music.html',
    'sameAs': [artist_links[k] for k in ('apple', 'spotify', 'youtube') if artist_links.get(k)],
}
album_nodes = []
for album in albums:
    tracks = album.get('tracks') or []
    album_nodes.append({
        '@type': 'MusicAlbum',
        'name': album['title'],
        'datePublished': album['released'],
        'numTracks': len(tracks),
        'byArtist': {'@id': 'https://pilgrimsnest.org/#artist'},
        'image': 'https://pilgrimsnest.org/' + album['cover'],
        'url': album.get('appleUrl', 'https://pilgrimsnest.org/music.html#album'),
        'sameAs': [u for u in (album.get('spotifyUrl'), album.get('youtubeUrl')) if u],
        'track': [
            {
                '@type': 'MusicRecording',
                'position': idx,
                'name': t['title'],
                'duration': iso_duration(t.get('seconds')),
                'url': t['youtubeUrl'],
            }
            for idx, t in enumerate(tracks, 1)
        ],
    })
singles_node = {
    '@type': 'ItemList',
    'name': 'Pilgrim Singles',
    'itemListElement': [
        {
            '@type': 'ListItem',
            'position': idx,
            'item': {
                '@type': 'MusicRecording',
                'name': rel['title'],
                'datePublished': rel['released'],
                'byArtist': {'@id': 'https://pilgrimsnest.org/#artist'},
                'image': 'https://pilgrimsnest.org/' + rel['cover'],
                'url': rel.get('appleUrl', 'https://pilgrimsnest.org/music.html'),
                **({'sameAs': [u for u in (rel.get('spotifyUrl'), rel.get('youtubeUrl')) if u]}
                   if any(rel.get(k) for k in ('spotifyUrl', 'youtubeUrl')) else {}),
            },
        }
        for idx, rel in enumerate(sorted_releases, 1)
    ],
}
jsonld_str = json.dumps(
    {'@context': 'https://schema.org', '@graph': [artist_node, *album_nodes, singles_node]},
    ensure_ascii=False,
    separators=(',', ':'),
).replace('</', r'<\/')


def replace_region(doc, name, body, inline=False):
    start = f'<!-- {name}:start -->'
    end = f'<!-- {name}:end -->'
    assert doc.count(start) == 1 and doc.count(end) == 1, f'Missing or duplicate markers for {name}'
    replacement = f'{start}{body}{end}' if inline else f'{start}\n{body}\n          {end}'
    return re.sub(
        re.escape(start) + r'.*?' + re.escape(end),
        lambda _: replacement,
        doc,
        flags=re.S,
    )


page = replace_region(page, 'jsonld', f'<script type="application/ld+json">{jsonld_str}</script>', inline=True)
page = replace_region(page, 'featured-release', featured_html)
page = replace_region(page, 'singles', singles_html)
page = replace_region(page, 'albums', albums_html)
page_path.write_text(page, encoding='utf-8')
print(f'Built music.html with {len(sorted_releases)} singles and {len(albums)} album(s) from releases.json')
