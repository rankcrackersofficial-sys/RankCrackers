import os
import re

book_dir = r"G:\RankCrackers Project\RankCrackers-55\docs\rankcrackers_book"

ordered_files = [
    # --- Preliminary Reference Section ---
    ("Preliminary Reference: Editor's Note", "01_editor_note.md"),
    ("Preliminary Reference: Canonical Index", "02_index.md"),
    ("Preliminary Reference: Editorial Policy & Standards", "03_editorial_policy.md"),
    ("Preliminary Reference: Audit Snapshot", "04_project_audit_snapshot.md"),
    ("Preliminary Reference: Master Documentation Plan", "05_master_documentation_plan.md"),
    ("Preliminary Reference: Architecture Entry & Trust", "06_architecture_entry_and_trust_model.md"),
    ("Preliminary Reference: Route Inventory", "07_student_route_inventory.md"),
    ("Preliminary Reference: Operating Handoff & Chief Author Directive", "12_handoff_to_antigravity_2_0.md"),
    ("Preliminary Reference: Chapter 18 Chief Author Claim Register", "18_chapter_18_claim_register.md"),
    ("Preliminary Reference: Cross-Chapter Source Reconciliation Register", "22_source_reconciliation_register_and_live_contracts.md"),
    ("Preliminary Reference: Chief Author Audit & Antigravity Work Order", "21_chief_author_audit_and_antigravity_work_order.md"),

    # --- Canonical Book Volumes ---
    ("Volume A: Product Vision, Learning Philosophy & Journey", "17_product_vision_learning_philosophy_and_journey.md"),
    ("Volume B, Part 1: Identity Pipeline, Auth & Mission Gates", "08_identity_profile_and_mission_gates.md"),
    ("Volume B, Part 2: Dashboard Command Surface & Providers", "09_dashboard_and_learning_command_surface.md"),
    ("Volume B, Part 3: Crucible Protocol & 98-Day Modulo", "10_crucible_protocol_and_schedule_engine.md"),
    ("Volume B, Part 4: Syllabus Tree & DigiBook Bridge", "11_syllabus_hierarchy_and_digibook_bridge.md"),
    ("Volume B, Part 5: GitHub-Tracked Canonical Syllabus & Derived Decomposition Contract", "23_github_tracked_canonical_syllabus_contract.md"),
    ("Volume C, Part 1: Founder Web Operations & Mission Control", "13_founder_web_operations_and_mission_control.md"),
    ("Volume D, Part 1: Application Architecture & Design System", "18_application_architecture_and_design_system.md"),
    ("Volume E & G, Part 1: Firestore Collections & Security Rules", "14_firestore_collections_and_security_rules_dictionary.md"),
    ("Volume E, Part 2: Cloud Functions, Callables & AI Workers", "15_cloud_functions_and_callable_contracts.md"),
    ("Volume F, Part 1: Academic Intelligence, Math Models & Decay", "19_academic_intelligence_and_knowledge_engine.md"),
    ("Volume H, Part 1: Engineering Operations, Emulators & CI/CD", "16_engineering_operations_testing_and_deployment.md"),
    ("Volume I: Master Reference Appendices", "20_master_reference_appendices.md"),
]

combined_md = []
combined_md.append("# Rank Cracker Book — Living Technical-Product Reference\n\n")
combined_md.append("**आधिकारिक संदर्भ ग्रंथ — Rank Crackers Ecosystem**\n\n")
combined_md.append("*(Compiled Living Reference Manuscript — Preliminary References & Canonical Volumes A–I)*\n\n")
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

# Generate Master HTML with styling for Google Docs / browser rendering
html_template = f"""<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8">
<title>Rank Cracker Book — Living Technical Reference</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 20mm;
  }}
  body {{
    font-family: 'Noto Sans Devanagari', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.35;
    color: #1a1a1a;
    text-align: justify;
    max-width: 860px;
    margin: 0 auto;
    padding: 24px;
    background-color: #FFFFFF;
  }}
  h1 {{
    font-size: 24pt;
    color: #0A0C10;
    border-bottom: 2.5px solid #B39B5D;
    padding-bottom: 8px;
    margin-top: 40px;
    page-break-before: always;
  }}
  h2 {{
    font-size: 17pt;
    color: #1E293B;
    margin-top: 28px;
    border-bottom: 1px solid #CBD5E1;
    padding-bottom: 5px;
  }}
  h3 {{
    font-size: 14pt;
    color: #334155;
    margin-top: 20px;
  }}
  h4 {{
    font-size: 11.5pt;
    color: #475569;
    font-weight: bold;
    margin-top: 16px;
  }}
  p {{
    margin: 10px 0;
  }}
  pre, code {{
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    background-color: #F8FAFC;
    color: #0F172A;
  }}
  pre {{
    padding: 12px;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.25;
    margin: 12px 0;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
  }}
  th, td {{
    border: 1px solid #CBD5E1;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #F1F5F9;
    font-weight: bold;
  }}
  blockquote {{
    border-left: 4px solid #B39B5D;
    background-color: #F8FAFC;
    margin: 14px 0;
    padding: 8px 16px;
    font-style: italic;
  }}
  hr {{
    border: none;
    border-top: 1px solid #CBD5E1;
    margin: 28px 0;
  }}
  a {{
    color: #1E40AF;
    text-decoration: none;
  }}
  a:hover {{
    text-decoration: underline;
  }}
</style>
</head>
<body>
"""

def md_to_html(md_text):
    lines = md_text.split('\n')
    out = []
    in_code = False
    in_table = False
    
    for line in lines:
        if line.startswith('```'):
            if in_code:
                out.append('</pre>')
                in_code = False
            else:
                out.append('<pre><code>')
                in_code = True
            continue
        
        if in_code:
            out.append(line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))
            continue
            
        if line.startswith('|') and line.endswith('|'):
            if not in_table:
                out.append('<table>')
                in_table = True
            cols = [c.strip() for c in line.split('|')[1:-1]]
            if all(re.match(r'^:?-+:?$', c) for c in cols):
                continue
            row = ''.join([f'<td>{c}</td>' for c in cols])
            out.append(f'<tr>{row}</tr>')
            continue
        else:
            if in_table:
                out.append('</table>')
                in_table = False
                
        if line.startswith('# '):
            out.append(f'<h1>{line[2:]}</h1>')
        elif line.startswith('## '):
            out.append(f'<h2>{line[3:]}</h2>')
        elif line.startswith('### '):
            out.append(f'<h3>{line[4:]}</h3>')
        elif line.startswith('#### '):
            out.append(f'<h4>{line[5:]}</h4>')
        elif line.startswith('> '):
            out.append(f'<blockquote>{line[2:]}</blockquote>')
        elif line.startswith('---'):
            out.append('<hr>')
        elif line.strip() == '':
            out.append('<br>')
        else:
            formatted = line
            # Format markdown images: ![alt](url)
            formatted = re.sub(
                r'!\[(.*?)\]\((.*?)\)',
                r'<div class="figure-container" style="text-align:center; margin:20px 0;"><img src="\2" alt="\1" style="max-width:100%; height:auto; border:1px solid #CBD5E1; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.06);"><div class="figure-caption" style="font-size:9.5pt; color:#475569; margin-top:6px; font-style:italic;"><strong>\1</strong></div></div>',
                formatted
            )
            # Format markdown links: [text](url) - ignore if preceded by !
            formatted = re.sub(
                r'(?<!!)\[(.*?)\]\((.*?)\)',
                r'<a href="\2">\1</a>',
                formatted
            )
            # Format bold and inline code
            formatted = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', formatted)
            formatted = re.sub(r'`(.+?)`', r'<code>\1</code>', formatted)
            out.append(f'<p>{formatted}</p>')
            
    if in_code:
        out.append('</pre>')
    if in_table:
        out.append('</table>')
        
    return '\n'.join(out)

html_content = html_template + md_to_html(full_md_text) + "\n</body>\n</html>"

output_html_path = os.path.join(book_dir, "Rank_Cracker_Book_Complete_Master.html")
with open(output_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

html_size = os.path.getsize(output_html_path)
print(f"Generated Master HTML: {output_html_path} ({html_size:,} bytes)")

# Auto-sync to Google Drive desktop folder if available
gdrive_dir = r"I:\My Drive\Rank_Cracker_Book"
if os.path.exists(r"I:\My Drive"):
    try:
        os.makedirs(gdrive_dir, exist_ok=True)
        gdrive_md = os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.md")
        gdrive_html = os.path.join(gdrive_dir, "Rank_Cracker_Book_Complete_Master.html")
        
        with open(gdrive_md, "w", encoding="utf-8") as f:
            f.write(full_md_text)
        with open(gdrive_html, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        # Copy assets folder to Google Drive as well
        import shutil
        src_assets = os.path.join(book_dir, "assets")
        dst_assets = os.path.join(gdrive_dir, "assets")
        if os.path.exists(src_assets):
            if os.path.exists(dst_assets):
                shutil.rmtree(dst_assets)
            shutil.copytree(src_assets, dst_assets)
            
        print(f"  [Google Drive Auto-Sync] Successfully synchronized master files & assets to: {gdrive_dir}")
    except Exception as e:
        print(f"  [Google Drive Auto-Sync Notice] {e}")
