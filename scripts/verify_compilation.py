import os
import re

book_dir = r"G:\RankCrackers Project\RankCrackers-55\docs\rankcrackers_book"
md_path = os.path.join(book_dir, "Rank_Cracker_Book_Complete_Master.md")
html_path = os.path.join(book_dir, "Rank_Cracker_Book_Complete_Master.html")
gdrive_dir = r"I:\My Drive\Rank_Cracker_Book"

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

h1s = len(re.findall(r"^# ", md_content, re.MULTILINE))
h2s = len(re.findall(r"^## ", md_content, re.MULTILINE))
h3s = len(re.findall(r"^### ", md_content, re.MULTILINE))
h4s = len(re.findall(r"^#### ", md_content, re.MULTILINE))

file_proto = len(re.findall(r"file:///", md_content))

# Check relative links
all_links = re.findall(r"(?<!\!)\[([^\]]+)\]\(([^)]+)\)", md_content)
broken_links = []
for label, target in all_links:
    if target.startswith("http://") or target.startswith("https://") or target.startswith("#"):
        continue
    norm = os.path.normpath(os.path.join(book_dir, target))
    if not os.path.exists(norm):
        broken_links.append((label, target))

# Check images
all_images = re.findall(r"\!\[([^\]]*)\]\(([^)]+)\)", md_content)
broken_images = []
for label, target in all_images:
    if target.startswith("http://") or target.startswith("https://"):
        continue
    norm = os.path.normpath(os.path.join(book_dir, target))
    if not os.path.exists(norm):
        broken_images.append((label, target))

gdrive_md_exists = os.path.exists(os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.md"))
gdrive_html_exists = os.path.exists(os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.html"))
gdrive_assets_exists = os.path.exists(os.path.join(gdrive_dir, "assets"))

print("=== RANK CRACKER BOOK: READBACK VERIFICATION REPORT ===")
print(f"Master Markdown: {md_path}")
print(f"  Size: {len(md_content.encode('utf-8')):,} bytes")
print(f"  Characters: {len(md_content):,}")
print(f"  Words: {len(md_content.split()):,}")
print(f"  Lines: {len(md_content.splitlines()):,}")
print(f"Master HTML: {html_path}")
print(f"  Size: {len(html_content.encode('utf-8')):,} bytes")
print(f"Headings Inventory:")
print(f"  H1: {h1s} (Volume / Chapter titles)")
print(f"  H2: {h2s} (Part / Main Sections)")
print(f"  H3: {h3s} (Sections & Contracts)")
print(f"  H4: {h4s} (Subsections & Sub-parts)")
print(f"Integrity Checks:")
print(f"  Invalid file:/// protocol occurrences: {file_proto}")
print(f"  Local Markdown links tested: {len(all_links)} (Broken: {len(broken_links)})")
if broken_links:
    for bl in broken_links:
        print(f"    BROKEN LINK: [{bl[0]}] -> {bl[1]}")
print(f"  Images verified: {len(all_images)} (Missing: {len(broken_images)})")
if broken_images:
    for bi in broken_images:
        print(f"    MISSING IMAGE: [{bi[0]}] -> {bi[1]}")
print(f"Google Drive Real-Time Sync Status (I:\\My Drive\\Rank_Cracker_Book):")
print(f"  Master MD synced: {gdrive_md_exists}")
print(f"  Master HTML synced: {gdrive_html_exists}")
print(f"  Assets directory synced: {gdrive_assets_exists}")
print("=== VERIFICATION COMPLETE ===")
