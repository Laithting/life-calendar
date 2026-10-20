"""把 docs/ 的網站打包成單一檔案，給 Claude Artifact 版本（一生日歷.html）使用。

用法：python tools/build_artifact.py
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
docs = root / 'docs'
SITE = 'https://laithting.github.io/life-calendar/'

html = (docs / 'index.html').read_text(encoding='utf-8')
css = (docs / 'style.css').read_text(encoding='utf-8')
js = (docs / 'app.js').read_text(encoding='utf-8')

body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
body = re.sub(r'<script src="capacitor.js"></script>\s*', '', body)
body = body.replace('href="privacy.html"', f'href="{SITE}privacy.html"')
body = body.replace('<script src="app.js"></script>', '<script>\n' + js + '\n</script>')
body = body.replace('href="widget.html"', f'href="{SITE}widget.html"')

fonts = re.search(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]+>', html).group(0)
out = '\n'.join([
    '<title>一生日歷</title>',
    '<meta name="claude:viewport-fit-sides" content="cover">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    fonts,
    '<style>\n' + css + '\n</style>',
    '<script>try{var p=JSON.parse(localStorage.getItem("lc.prefs")||"{}");if(p.theme==="light"||p.theme==="dark")document.documentElement.setAttribute("data-theme",p.theme);}catch(e){}</script>',
    body.strip(),
    ''
])
(root / '一生日歷.html').write_text(out, encoding='utf-8')
print('wrote 一生日歷.html', len(out), 'chars')
