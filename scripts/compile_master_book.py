import base64
import os
import re
import shutil

book_dir = r"G:\RankCrackers Project\RankCrackers-55\docs\rankcrackers_book"

ordered_files = [
    # --- Front Matter: Preliminary Architecture & Governance (P.1 - P.11) ---
    ("Preliminary Reference P.1: Editor's Note", "01_editor_note.md"),
    ("Preliminary Reference P.2: Canonical Index", "02_index.md"),
    ("Preliminary Reference P.3: Editorial Policy & Standards", "03_editorial_policy.md"),
    ("Preliminary Reference P.4: Audit Snapshot", "04_project_audit_snapshot.md"),
    ("Preliminary Reference P.5: Master Documentation Plan", "05_master_documentation_plan.md"),
    ("Preliminary Reference P.6: Architecture Entry & Trust", "06_architecture_entry_and_trust_model.md"),
    ("Preliminary Reference P.7: Route Inventory", "07_student_route_inventory.md"),
    ("Preliminary Reference P.8: Operating Handoff & Chief Author Directive", "12_handoff_to_antigravity_2_0.md"),
    ("Preliminary Reference P.9: Chapter 18 Chief Author Claim Register", "18_chapter_18_claim_register.md"),
    ("Preliminary Reference P.10: Cross-Chapter Source Reconciliation Register", "22_source_reconciliation_register_and_live_contracts.md"),
    ("Preliminary Reference P.11: Chief Author Audit & Antigravity Work Order", "21_chief_author_audit_and_antigravity_work_order.md"),

    # --- Core Canonical Volumes: Sequential Chapters 01 - 13 ---
    ("Volume A: Chapter 01 — Product Vision, Learning Philosophy & Journey", "17_product_vision_learning_philosophy_and_journey.md"),
    ("Volume B, Part 1: Chapter 02 — Identity Pipeline, Auth & Mission Gates", "08_identity_profile_and_mission_gates.md"),
    ("Volume B, Part 2: Chapter 03 — Dashboard Command Surface & Providers", "09_dashboard_and_learning_command_surface.md"),
    ("Volume B, Part 3: Chapter 04 — Crucible Protocol & 98-Day Modulo", "10_crucible_protocol_and_schedule_engine.md"),
    ("Volume B, Part 4: Chapter 05 — Syllabus Tree & DigiBook Bridge", "11_syllabus_hierarchy_and_digibook_bridge.md"),
    ("Volume B, Part 5: Chapter 06 — GitHub-Tracked Canonical Syllabus & Derived Decomposition Contract", "23_github_tracked_canonical_syllabus_contract.md"),
    ("Volume C, Part 1: Chapter 07 — Founder Web Operations & Mission Control", "13_founder_web_operations_and_mission_control.md"),
    ("Volume D, Part 1: Chapter 08 — Application Architecture & Design System", "18_application_architecture_and_design_system.md"),
    ("Volume E & G, Part 1: Chapter 09 — Firestore Collections & Security Rules", "14_firestore_collections_and_security_rules_dictionary.md"),
    ("Volume E, Part 2: Chapter 10 — Cloud Functions, Callables & AI Workers", "15_cloud_functions_and_callable_contracts.md"),
    ("Volume F, Part 1: Chapter 11 — Academic Intelligence, Math Models & Decay", "19_academic_intelligence_and_knowledge_engine.md"),
    ("Volume H, Part 1: Chapter 12 — Engineering Operations, Emulators & CI/CD", "16_engineering_operations_testing_and_deployment.md"),
    ("Volume I: Chapter 13 — Master Reference Appendices", "20_master_reference_appendices.md"),
]

def get_image_base64_src(img_path_rel):
    abs_path = os.path.normpath(os.path.join(book_dir, img_path_rel))
    if os.path.exists(abs_path):
        with open(abs_path, "rb") as img_file:
            b64_data = base64.b64encode(img_file.read()).decode("ascii")
            ext = os.path.splitext(abs_path)[1].lower().replace(".", "")
            mime = "image/png" if ext == "png" else f"image/{ext}"
            return f"data:{mime};base64,{b64_data}"
    return img_path_rel

logo_rel = "assets/images/logo_on_black.png"
logo_b64 = get_image_base64_src(logo_rel)

combined_md = []
combined_md.append("# RankCrackers — Living Technical Product & Architecture Book\n\n")
combined_md.append(f"![Rank Crackers Official Insignia]({logo_rel})\n\n")
combined_md.append("**आधिकारिक संदर्भ ग्रंथ — Rank Crackers Ecosystem**\n\n")
combined_md.append("*(Compiled Sovereign Technical Reference Manuscript — Front Matter P.1–P.11 & Core Volumes A–I, Chapters 01–13)*\n\n")
combined_md.append("---\n\n")

missing_files = []
total_source_bytes = 0

for label, filename in ordered_files:
    file_path = os.path.join(book_dir, filename)
    if os.path.exists(file_path):
        size = os.path.getsize(file_path)
        total_source_bytes += size
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            combined_md.append(f"\n\n<!-- ======================================================== -->\n")
            combined_md.append(f"<!-- SECTION BREAK: {label} ({filename}) -->\n")
            combined_md.append(f"<!-- ======================================================== -->\n\n")
            combined_md.append(content)
            combined_md.append("\n\n---\n\n")
    else:
        missing_files.append(filename)

if missing_files:
    print(f"ERROR: Missing source files: {missing_files}")
    exit(1)

full_md_text = "".join(combined_md)

# Write Master Markdown
output_md_path = os.path.join(book_dir, "Rank_Cracker_Book_Complete_Master.md")
with open(output_md_path, "w", encoding="utf-8") as f:
    f.write(full_md_text)

md_size = os.path.getsize(output_md_path)
word_count = len(full_md_text.split())
char_count = len(full_md_text)
line_count = len(full_md_text.splitlines())

print(f"Generated Master Markdown: {output_md_path}")
print(f"  Source Files: {len(ordered_files)} files ({total_source_bytes:,} bytes)")
print(f"  Master MD Size: {md_size:,} bytes")
print(f"  Character Count: {char_count:,}")
print(f"  Word Count: {word_count:,}")
print(f"  Line Count: {line_count:,}")

# Generate Master HTML with publication-grade light styling for Google Docs / browser / Word
cover_page_html = f"""
<div style="text-align: center; padding: 48px 20px 40px 20px; page-break-after: always;">
  <div style="display: inline-block; padding: 8px; background-color: #0A0C10; border-radius: 24px; box-shadow: 0 6px 24px rgba(0,0,0,0.25); margin-bottom: 24px;">
    <img src="{logo_b64}" alt="Rank Crackers Official Insignia" style="width: 140px; height: 140px; border-radius: 18px; display: block;">
  </div>
  <h1 style="font-size: 26pt; font-weight: 800; color: #0F172A; margin: 0 0 10px 0; border: none; letter-spacing: -0.5px; page-break-before: avoid;">RankCrackers</h1>
  <div style="font-size: 14pt; font-weight: 600; color: #B39B5D; margin-bottom: 8px;">Living Technical Product &amp; Architecture Book</div>
  <div style="font-size: 11pt; color: #475569; margin-bottom: 20px;">आधिकारिक संदर्भ ग्रंथ — Sovereign Technical Reference Edition</div>
  <div style="display: inline-block; width: 80px; height: 3px; background-color: #B39B5D; margin-bottom: 22px;"></div>
  <div style="font-size: 9.5pt; color: #64748B; line-height: 1.65; max-width: 600px; margin: 0 auto;">
    <strong>Ecosystem:</strong> RankCrackers Multiplatform Platform (Web &bull; Android &bull; Cloud)<br>
    <strong>Pedagogical Motto:</strong> तेजस्वि नावधीतमस्तु। (Truth Over Flattery)<br>
    <strong>Classification:</strong> Authoritative Technical Reference Manuscript<br>
    <strong>Structure:</strong> Front Matter P.1–P.11 &bull; Core Canonical Volumes A–I (Chapters 01–13)<br>
    <strong>Chief Author &amp; Engineering Trust:</strong> Verified Living Architecture
  </div>
</div>
"""

html_template = """<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8">
<title>Rank Cracker Book — Living Technical Reference</title>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 16mm 20mm 16mm;
  }
  body {
    font-family: 'Noto Sans Devanagari', 'Mangal', 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1E293B;
    text-align: justify;
    text-justify: inter-word;
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 20px;
    background-color: #FFFFFF;
    -webkit-font-smoothing: antialiased;
  }
  h1 {
    font-size: 20pt;
    font-weight: 800;
    color: #0F172A;
    border-bottom: 2.5px solid #B39B5D;
    padding-bottom: 8px;
    margin-top: 36px;
    margin-bottom: 12px;
    page-break-before: always;
    letter-spacing: -0.4px;
    line-height: 1.25;
  }
  h2 {
    font-size: 14.5pt;
    font-weight: 700;
    color: #0F172A;
    margin-top: 24px;
    margin-bottom: 8px;
    border-bottom: 1px solid #CBD5E1;
    padding-bottom: 4px;
    line-height: 1.3;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #1E293B;
    margin-top: 18px;
    margin-bottom: 6px;
    line-height: 1.35;
  }
  h4 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 4px;
    line-height: 1.4;
  }
  p {
    margin: 6px 0;
    text-align: justify;
    line-height: 1.55;
  }
  strong {
    font-weight: 700;
    color: #0F172A;
  }
  ul, ol {
    margin: 4px 0 8px 22px;
    padding: 0;
  }
  li {
    margin: 2px 0;
    line-height: 1.45;
    text-align: justify;
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    font-weight: 600;
    background-color: #F1F5F9;
    color: #0F172A;
    padding: 1px 4px;
    border: 1px solid #E2E8F0;
    border-radius: 3px;
  }
  pre {
    background-color: #F8FAFC;
    color: #0F172A;
    border: 1px solid #CBD5E1;
    border-left: 3.5px solid #2563EB;
    border-radius: 4px;
    padding: 8px 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.35;
    margin: 8px 0 12px 0;
    font-size: 8.5pt;
  }
  pre code {
    background-color: transparent;
    color: #0F172A;
    border: none;
    padding: 0;
    font-size: 8.5pt;
    font-weight: 400;
    font-family: 'Consolas', 'Courier New', monospace;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 14px 0;
    font-size: 8.5pt;
    background-color: #FFFFFF;
    border: 1px solid #CBD5E1;
    page-break-inside: avoid;
    table-layout: auto;
  }
  thead {
    background-color: #F1F5F9;
  }
  th {
    background-color: #F1F5F9;
    color: #0F172A;
    font-weight: 700;
    padding: 5px 8px;
    text-align: left;
    border: 1px solid #CBD5E1;
    font-size: 8.5pt;
    letter-spacing: 0.1px;
    line-height: 1.25;
  }
  td {
    border: 1px solid #E2E8F0;
    padding: 4px 8px;
    text-align: left;
    vertical-align: top;
    line-height: 1.35;
    font-size: 8.5pt;
  }
  tbody tr:nth-child(even) {
    background-color: #F8FAFC;
  }
  blockquote {
    border-left: 3.5px solid #B39B5D;
    background-color: #FDFBF7;
    margin: 10px 0;
    padding: 8px 14px;
    border-radius: 0 4px 4px 0;
    color: #334155;
    line-height: 1.5;
    font-size: 9.5pt;
  }
  hr {
    border: none;
    border-top: 1px solid #E2E8F0;
    margin: 20px 0;
  }
  a {
    color: #0284C7;
    text-decoration: none;
    font-weight: 500;
  }
  a:hover {
    text-decoration: underline;
    color: #0369A1;
  }
  .figure-container {
    text-align: center;
    margin: 20px 0;
    page-break-inside: avoid;
  }
  .figure-container img {
    max-width: 100%;
    height: auto;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  .figure-caption {
    font-size: 8.5pt;
    color: #64748B;
    margin-top: 6px;
    font-style: italic;
  }
  .book-section-anchor {
    scroll-margin-top: 20px;
  }
</style>
</head>
<body>
"""

def md_to_html(md_text):
    lines = md_text.split('\n')
    out = []
    in_code = False
    in_table = False
    table_header_done = False
    in_ul = False
    in_ol = False
    row_count = 0

    def replace_image(match):
        alt = match.group(1)
        src = match.group(2)
        b64_src = get_image_base64_src(src)
        return f'<div class="figure-container"><img src="{b64_src}" alt="{alt}"><div class="figure-caption"><strong>{alt}</strong></div></div>'

    for line in lines:
        section_match = re.match(r'^<!-- SECTION BREAK: .* \(([^)]+)\) -->$', line.strip())
        if section_match:
            if in_ul:
                out.append('</ul>')
                in_ul = False
            if in_ol:
                out.append('</ol>')
                in_ol = False
            if in_table:
                out.append('</tbody></table>')
                in_table = False
                table_header_done = False
            filename = section_match.group(1)
            anchor_slug = re.sub(r'[^a-zA-Z0-9_-]+', '-', filename).strip('-').lower()
            out.append(f'<div class="book-section-anchor" id="book-section-{anchor_slug}" aria-hidden="true"></div>')
            continue

        if line.startswith('```'):
            if in_code:
                out.append('</code></pre>')
                in_code = False
            else:
                lang = line[3:].strip()
                out.append(f'<pre style="background-color: #F8FAFC; color: #0F172A; border: 1px solid #CBD5E1; border-left: 3.5px solid #2563EB; border-radius: 4px; padding: 8px 12px; margin: 8px 0 12px 0; font-family: Consolas, \'Courier New\', monospace; font-size: 8.5pt; line-height: 1.35; white-space: pre-wrap; word-break: break-all;"><code style="background-color: transparent; color: #0F172A; font-family: Consolas, \'Courier New\', monospace; font-size: 8.5pt;">')
                in_code = True
            continue

        if in_code:
            out.append(line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))
            continue

        # Check list closures
        is_ul_item = re.match(r'^\s*[-*]\s+(.*)$', line)
        is_ol_item = re.match(r'^\s*(\d+)\.\s+(.*)$', line)

        if not is_ul_item and in_ul:
            out.append('</ul>')
            in_ul = False
        if not is_ol_item and in_ol:
            out.append('</ol>')
            in_ol = False

        if line.startswith('|') and line.endswith('|'):
            if not in_table:
                out.append('<table style="width: 100%; border-collapse: collapse; margin: 8px 0 14px 0; font-size: 8.5pt; background-color: #FFFFFF; border: 1px solid #CBD5E1;">')
                in_table = True
                table_header_done = False
                row_count = 0
            cols = [c.strip() for c in line.split('|')[1:-1]]
            if all(re.match(r'^:?-+:?$', c) for c in cols):
                table_header_done = True
                continue

            formatted_cols = []
            for c in cols:
                cell = c
                cell = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', cell)
                cell = re.sub(r'`(.+?)`', r'<code>\1</code>', cell)
                cell = re.sub(r'(?<!!)\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', cell)
                formatted_cols.append(cell)

            if not table_header_done:
                row = ''.join([f'<th style="background-color: #F1F5F9; color: #0F172A; font-weight: bold; padding: 5px 8px; text-align: left; border: 1px solid #CBD5E1; font-size: 8.5pt; line-height: 1.25;">{c}</th>' for c in formatted_cols])
                out.append(f'<thead><tr>{row}</tr></thead><tbody>')
                table_header_done = True
            else:
                row_count += 1
                bg = ' style="background-color: #F8FAFC;"' if row_count % 2 == 0 else ''
                row = ''.join([f'<td style="border: 1px solid #E2E8F0; padding: 4px 8px; text-align: left; vertical-align: top; line-height: 1.35; font-size: 8.5pt;">{c}</td>' for c in formatted_cols])
                out.append(f'<tr{bg}>{row}</tr>')
            continue
        else:
            if in_table:
                out.append('</tbody></table>')
                in_table = False
                table_header_done = False

        if is_ul_item:
            if not in_ul:
                out.append('<ul style="margin: 4px 0 8px 22px; padding: 0;">')
                in_ul = True
            item_text = is_ul_item.group(1)
            item_text = re.sub(r'!\[(.*?)\]\((.*?)\)', replace_image, item_text)
            item_text = re.sub(r'(?<!!)\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', item_text)
            item_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', item_text)
            item_text = re.sub(r'`(.+?)`', r'<code>\1</code>', item_text)
            out.append(f'<li style="margin: 2px 0; line-height: 1.45;">{item_text}</li>')
            continue

        if is_ol_item:
            if not in_ol:
                out.append('<ol style="margin: 4px 0 8px 22px; padding: 0;">')
                in_ol = True
            item_text = is_ol_item.group(2)
            item_text = re.sub(r'!\[(.*?)\]\((.*?)\)', replace_image, item_text)
            item_text = re.sub(r'(?<!!)\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', item_text)
            item_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', item_text)
            item_text = re.sub(r'`(.+?)`', r'<code>\1</code>', item_text)
            out.append(f'<li style="margin: 2px 0; line-height: 1.45;">{item_text}</li>')
            continue

        if line.startswith('# '):
            out.append(f'<h1>{line[2:].strip()}</h1>')
        elif line.startswith('## '):
            out.append(f'<h2>{line[3:].strip()}</h2>')
        elif line.startswith('### '):
            out.append(f'<h3>{line[4:].strip()}</h3>')
        elif line.startswith('#### '):
            out.append(f'<h4>{line[5:].strip()}</h4>')
        elif line.startswith('> '):
            quote_text = line[2:].strip()
            quote_text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', quote_text)
            quote_text = re.sub(r'`(.+?)`', r'<code>\1</code>', quote_text)
            out.append(f'<blockquote style="border-left: 3.5px solid #B39B5D; background-color: #FDFBF7; margin: 10px 0; padding: 8px 14px; border-radius: 0 4px 4px 0; color: #334155; line-height: 1.5; font-size: 9.5pt;">{quote_text}</blockquote>')
        elif line.startswith('---'):
            out.append('<hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">')
        elif line.strip() == '':
            # Natural paragraph separation without empty line bloat
            continue
        else:
            formatted = line
            # Format markdown images with Base64 embedding
            formatted = re.sub(r'!\[(.*?)\]\((.*?)\)', replace_image, formatted)
            # Format markdown links
            formatted = re.sub(r'(?<!!)\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', formatted)
            # Format bold and inline code
            formatted = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', formatted)
            formatted = re.sub(r'`(.+?)`', r'<code>\1</code>', formatted)
            out.append(f'<p style="margin: 6px 0; text-align: justify; line-height: 1.55;">{formatted}</p>')

    if in_code:
        out.append('</code></pre>')
    if in_table:
        out.append('</tbody></table>')
    if in_ul:
        out.append('</ul>')
    if in_ol:
        out.append('</ol>')

    return '\n'.join(out)

html_content = html_template + cover_page_html + md_to_html(full_md_text) + "\n</body>\n</html>"

# Rewrite links to source chapters in the compiled HTML so the continuous
# edition remains inside one readable book instead of opening separate files.
for _, filename in ordered_files:
    anchor_slug = re.sub(r'[^a-zA-Z0-9_-]+', '-', filename).strip('-').lower()
    html_content = re.sub(
        rf'href="{re.escape(filename)}"',
        f'href="#book-section-{anchor_slug}"',
        html_content,
    )

output_html_path = os.path.join(book_dir, "Rank_Cracker_Book_Complete_Master.html")
with open(output_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

html_size = os.path.getsize(output_html_path)
print(f"Generated Master HTML: {output_html_path} ({html_size:,} bytes)")

# Generate Master .doc (Word-compatible document recognized natively by Google Docs)
output_doc_path = os.path.join(book_dir, "Rank_Cracker_Book_Complete_Master.doc")
with open(output_doc_path, "w", encoding="utf-8") as f:
    f.write(html_content)
doc_size = os.path.getsize(output_doc_path)
print(f"Generated Master DOC:  {output_doc_path} ({doc_size:,} bytes)")

# Auto-sync to Google Drive desktop folder if available
gdrive_dir = r"I:\My Drive\Rank_Cracker_Book"
if os.path.exists(r"I:\My Drive"):
    try:
        os.makedirs(gdrive_dir, exist_ok=True)
        gdrive_md = os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.md")
        gdrive_html = os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.html")
        gdrive_doc = os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.doc")

        with open(gdrive_md, "w", encoding="utf-8") as f:
            f.write(full_md_text)
        with open(gdrive_html, "w", encoding="utf-8") as f:
            f.write(html_content)
        with open(gdrive_doc, "w", encoding="utf-8") as f:
            f.write(html_content)

        # Copy assets folder to Google Drive as well
        src_assets = os.path.join(book_dir, "assets")
        dst_assets = os.path.join(gdrive_dir, "assets")
        if os.path.exists(src_assets):
            if os.path.exists(dst_assets):
                shutil.rmtree(dst_assets)
            shutil.copytree(src_assets, dst_assets)

        print(f"  [Local Desktop Mirror] Master files (.md, .html, .doc) & assets copied to local drive path: {gdrive_dir}")
    except Exception as e:
        print(f"  [Local Desktop Mirror Notice] {e}")
