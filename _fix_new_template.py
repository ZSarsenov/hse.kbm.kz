"""
Fix the user's template:
1. Remove FF0000 (red) → 000000 (black) in document.xml
2. Remove VML watermarks from header1.xml and header3.xml
3. Fix duplicate m5_7 → second should be m5_6
4. Save to templates/docx/dangerous_permits_rus.docx
"""
import zipfile
import re
import os
import shutil

SRC = r'c:\Users\Zhasik\Downloads\dangerous_permits_rus.docx'
DST = 'templates/docx/dangerous_permits_rus.docx'

# Read all parts
z_in = zipfile.ZipFile(SRC, 'r')
parts = {}
for name in z_in.namelist():
    parts[name] = z_in.read(name)
z_in.close()

# ========== 1. Fix FF0000 in document.xml ==========
doc = parts['word/document.xml'].decode('utf-8')

# Count FF0000 occurrences
ff_count = doc.count('FF0000')
print(f"FF0000 occurrences in document.xml: {ff_count}")

# Replace all w:val="FF0000" with w:val="000000"
doc_fixed = re.sub(r'w:val="FF0000"', 'w:val="000000"', doc)
ff_after = doc_fixed.count('FF0000')
print(f"After fix: {ff_after} occurrences")

# ========== 2. Fix duplicate m5_7 → m5_6 ==========
# Find the FIRST m5_7 and leave it, change the SECOND m5_7 to m5_6
# But we need to be careful - in the Word XML the tags might be split
# Let's find all m5_7 in the text content
m57_positions = [(m.start(), m.group()) for m in re.finditer(r'm5_7', doc_fixed)]
print(f"\nm5_7 occurrences: {len(m57_positions)}")

# The second m5_7 should become m5_6
# Looking at the original tag order: m5_1, m5_2, m5_3, m5_4, m5_5, m5_7, m5_7, m5_8, m5_9, m5_10
# The first m5_7 should be m5_6, the second should stay m5_7
# Wait - in the list: {{ m5_5 }}, {{ m5_7 }}, {{ m5_7 }} - the FIRST m5_7 is where m5_6 should be
if len(m57_positions) >= 2:
    # Replace FIRST occurrence of m5_7 with m5_6
    first_pos = m57_positions[0][0]
    doc_fixed = doc_fixed[:first_pos] + 'm5_6' + doc_fixed[first_pos + 4:]
    print("Fixed: first m5_7 -> m5_6")

# Verify m5 tags
m5_tags = re.findall(r'm5_\d+', doc_fixed)
print(f"m5 tags after fix: {m5_tags}")

parts['word/document.xml'] = doc_fixed.encode('utf-8')

# ========== 3. Remove VML from header1.xml and header3.xml ==========
for hdr_name in ['word/header1.xml', 'word/header3.xml']:
    hdr = parts[hdr_name].decode('utf-8')
    
    has_vml_before = 'v:shape' in hdr
    has_draw_before = 'w:drawing' in hdr
    print(f"\n{hdr_name} before: VML={has_vml_before}, Drawing={has_draw_before}")
    
    if has_vml_before:
        # Remove <w:pict>...</w:pict> blocks (VML watermarks)
        hdr_fixed = re.sub(r'<w:pict>.*?</w:pict>', '', hdr, flags=re.DOTALL)
        
        # Also remove <mc:AlternateContent> blocks that contain VML
        hdr_fixed = re.sub(r'<mc:AlternateContent>.*?</mc:AlternateContent>', '', hdr_fixed, flags=re.DOTALL)
        
        has_vml_after = 'v:shape' in hdr_fixed
        has_draw_after = 'w:drawing' in hdr_fixed
        print(f"{hdr_name} after: VML={has_vml_after}, Drawing={has_draw_after}")
        
        parts[hdr_name] = hdr_fixed.encode('utf-8')

# ========== 4. Check header2 (should be fine) ==========
h2 = parts['word/header2.xml'].decode('utf-8')
print(f"\nword/header2.xml: VML={'v:shape' in h2}, Drawing={'w:drawing' in h2}")

# ========== 5. Fix header rels to point to correct image ==========
for rel_name in ['word/_rels/header1.xml.rels', 'word/_rels/header3.xml.rels']:
    if rel_name in parts:
        rel = parts[rel_name].decode('utf-8')
        print(f"\n{rel_name}:")
        # Show image references
        for m in re.finditer(r'Target="([^"]*image[^"]*)"', rel):
            print(f"  Image ref: {m.group(1)}")

# ========== 6. Save fixed template ==========
if os.path.exists(DST):
    os.remove(DST)

z_out = zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED)
# Write [Content_Types].xml first (important for OOXML)
if '[Content_Types].xml' in parts:
    z_out.writestr('[Content_Types].xml', parts['[Content_Types].xml'])
for name in sorted(parts.keys()):
    if name == '[Content_Types].xml':
        continue
    z_out.writestr(name, parts[name])
z_out.close()

print(f"\nSaved: {DST} ({os.path.getsize(DST)} bytes)")

# ========== 7. Verify with docxtpl ==========
import sys
sys.path.insert(0, '.venv/Lib/site-packages')
from docxtpl import DocxTemplate

d = DocxTemplate(DST)
ctx = {
    'qr_code': '',
    'permit_id': 'TEST-777',
    'department': 'ЦППН-3',
    'producer_name': 'Иванов И.И.', 'producer_job': 'Мастер', 'producer_date': '11.02.2026 08:00',
    'admitting_name': 'Петров П.П.', 'admitting_job': 'Инженер ОТ', 'admitting_date': '11.02.2026 09:00',
    'responsible_name': 'Сидоров С.С.', 'responsible_job': 'Начальник', 'responsible_date': '11.02.2026 08:30',
    'issuer_name': 'Козлов К.К.', 'issuer_job': 'Выдающий', 'issuer_date': '11.02.2026 07:00',
    'supervisor_name': 'Смирнов С.С.', 'supervisor_job': 'Координатор', 'supervisor_date': '11.02.2026 10:00',
    'work_place': 'Кустовая площадка №5',
    'work_name': 'Ремонт насосного агрегата',
    'work_content': 'Замена подшипников на насосе ЦНС-180',
    'date_start': '11.02.2026 08:00',
    'date_end': '11.02.2026 17:00',
    'm5_1': 'Остановить насос',
    'm5_2': 'Отключить питание',
    'm5_3': 'Установить заглушки',
    'm5_4': 'Взять пробу воздуха',
    'm5_5': 'Оградить зону',
    'm5_6': 'Страховочные пояса',
    'm5_7': 'Предупредить смежные участки',
    'm5_8': 'Не требуется',
    'm5_9': 'Маршрут №1',
    'm5_10': 'Дополнительных мер нет',
    'brigade_list': [
        {'i': 1, 'date': '11.02.2026', 'name': 'Рабочий А.А.', 'job': 'Слесарь 5р', 'instr_by': 'Иванов И.И.'},
        {'i': 2, 'date': '11.02.2026', 'name': 'Рабочий Б.Б.', 'job': 'Слесарь 4р', 'instr_by': 'Иванов И.И.'},
        {'i': 3, 'date': '11.02.2026', 'name': 'Рабочий В.В.', 'job': 'Электрик 5р', 'instr_by': 'Иванов И.И.'},
    ],
    'team_count': 3,
    'extension_list': [
        {'date': '12.02.2026', 'prod_out': 'Иванов И.И.', 'count': '3', 'prod_in': 'Козлов К.К.', 'admin': 'Петров П.П.'},
    ],
}
d.render(ctx)
d.save('templates/docx/_test_render.docx')

# Verify rendered output
zr = zipfile.ZipFile('templates/docx/_test_render.docx', 'r')
rdoc = zr.read('word/document.xml').decode('utf-8')

print(f"\n=== RENDER VERIFICATION ===")
print(f"Has FF0000: {'FF0000' in rdoc}")
print(f"Has 'TEST-777': {'TEST-777' in rdoc}")
print(f"Has 'ЦППН-3': {'ЦППН-3' in rdoc}")
print(f"Has 'Рабочий А.А.': {'Рабочий А.А.' in rdoc}")
print(f"Has 'Рабочий Б.Б.': {'Рабочий Б.Б.' in rdoc}")
print(f"Has 'Рабочий В.В.': {'Рабочий В.В.' in rdoc}")
print(f"Has 'Остановить насос': {'Остановить насос' in rdoc}")
print(f"Has 'Страховочные пояса': {'Страховочные пояса' in rdoc}")  # m5_6

# Check brigade count - should appear "3" somewhere for team_count
# Count occurrences of brigade member rows
brigade_a = rdoc.count('Рабочий А.А.')
brigade_b = rdoc.count('Рабочий Б.Б.')
brigade_c = rdoc.count('Рабочий В.В.')
print(f"\nBrigade rows: A={brigade_a}, B={brigade_b}, C={brigade_c}")

# Check extension
ext_check = rdoc.count('Козлов К.К.')
print(f"Extension rows with 'Козлов К.К.': {ext_check}")

# Unresolved tags
unresolved = re.findall(r'\{\{[^}]*\}\}|\{%[^%]*%\}', rdoc)
unresolved_clean = [re.sub(r'<[^>]+>', '', u).strip() for u in unresolved]
print(f"\nUnresolved tags: {len(unresolved_clean)}")
for u in unresolved_clean:
    print(f"  {u}")

# Check headers in rendered
for h in ['word/header2.xml']:
    c = zr.read(h).decode('utf-8')
    print(f"\nRendered {h}: VML={'v:shape' in c}, Drawing={'w:drawing' in c}")

zr.close()
print("\nDone!")
