from PIL import Image,ImageOps,ImageDraw
import json
from pathlib import Path
p=Path(r'C:/Users/pdwea/Develop/digirouge/docs/validation/boss-variety-2026-10-09')
r=json.loads((p/'browser-checks.json').read_text(encoding='utf8'))
out=Image.new('RGB',(1920,1164),'#06121d')
d=ImageDraw.Draw(out)
for i,s in enumerate(r['shots']):
 im=Image.open(s['file']).convert('RGB').resize((640,360),Image.Resampling.LANCZOS)
 x=(i%3)*640;y=(i//3)*291
 im=im.crop((0,55,640,330))
 out.paste(im,(x,y+16))
 d.text((x+8,y+2),s['id'],fill='#a6e6f5')
out.save(p/'boss-scenes.jpg',quality=93)
print(json.dumps({'passed':True,'exitCode':0,'scenes':len(r['shots']),'file':str(p/'boss-scenes.jpg')}))
