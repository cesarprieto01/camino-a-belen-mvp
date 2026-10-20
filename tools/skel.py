import sys,re
from html.parser import HTMLParser
VOID={'img','br','input','path','rect','circle','stop','meta','link'}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.d=0; s.out=[]; s.skip=0
    def handle_starttag(s,t,a):
        a=dict(a)
        if s.skip or t=='svg':
            if t=='svg': s.skip+=1
            if t=='svg': s.out.append('  '*s.d+'<svg>')
            return
        st=a.get('style','')
        keep=[]
        for k in ['left','top','right','bottom','width','height','background','transform','opacity']:
            m=re.search(r'(?:^|;)\s*'+k+r':\s*([^;]{1,40})',st)
            if m: keep.append(f'{k[0:3]}={m.group(1).strip()}')
        info=' '.join(f'{k}="{v[:50]}"' for k,v in a.items() if k in('aria-label','href','alt','role'))
        src=a.get('src','')
        if src: info+=' src='+src.split('/')[-1][:6]
        s.out.append('  '*s.d+f'<{t} {info} [{",".join(keep)}]')
        if t not in VOID: s.d+=1
    def handle_endtag(s,t):
        if s.skip:
            if t=='svg': s.skip-=1
            return
        if t not in VOID: s.d-=1
    def handle_data(s,d):
        if s.skip: return
        d=d.strip()
        if d: s.out.append('  '*s.d+'"'+d[:70]+'"')
p=P(); p.feed(open(sys.argv[1]).read()); print('\n'.join(p.out))
