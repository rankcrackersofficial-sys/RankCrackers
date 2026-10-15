import re

with open('docs/rankcrackers_book/Rank_Cracker_Book_Complete_Master.html', 'r', encoding='utf-8') as f:
    html = f.read()

b64_imgs = re.findall(r'<img src="data:image/[^;]+;base64,([^"]+)"', html)
raw_src_imgs = re.findall(r'<img src="(?!data:)([^"]+)"', html)

print(f"Total base64 embedded images in HTML: {len(b64_imgs)}")
print(f"Un-embedded image references: {len(raw_src_imgs)}")
if raw_src_imgs:
    print(f"  Un-embedded paths: {raw_src_imgs}")
print(f"Has cover page insignia: {'Rank Crackers Official Insignia' in html}")
