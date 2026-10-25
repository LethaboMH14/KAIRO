"""Verify the bounded registry facts against the root-supplied original PDF."""

from hashlib import sha256
from pathlib import Path
import re

import fitz


ROOT = Path(__file__).resolve().parents[3]
PDF = ROOT / 'docs' / 'luna-unblock-20261023' / 'wits-ebe-original.pdf'
EXPECTED_SHA256 = '7feff6501eddc6a5e5925233c4fce41fad39885a513875e2b459d5caa3039dc3'
EXPECTED_SIZE = 2_054_987
EXPECTED_PAGES = 373
COURSES = [
    ('CHEM1051A', 'Engineering Chemistry'),
    ('FEBE1000A', 'Introduction to the Engineering Profession'),
    ('FEBE1002A', 'Engineering Analysis and Design IA'),
    ('FEBE1004A', 'Engineering Analysis and Design IB'),
    ('MATH1048A', 'Engineering Mathematics IA'),
    ('MATH1049A', 'Engineering Mathematics IB'),
    ('PHYS1032A', 'Engineering Physics IA'),
    ('PHYS1033A', 'Engineering Physics IB'),
    ('PHYS1034A', 'Applied Physics I'),
]
BRANCHES = [
    ('Aeronautical Engineering', 'EFA06', 42, 40),
    ('Civil Engineering', 'EFA01', 46, 44),
    ('Electrical Engineering', 'EFA03', 48, 46),
    ('Mechanical Engineering', 'EFA05', 52, 50),
    ('Metallurgy and Materials Engineering', 'EFA08', 54, 52),
]


def normalized(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def page_label(page_text: str) -> str:
    for line in page_text.splitlines()[1:5]:
        if line.strip().isdigit():
            return line.strip()
    raise AssertionError('Could not find the printed page label in extracted page header.')


def main() -> None:
    raw = PDF.read_bytes()
    actual_hash = sha256(raw).hexdigest()
    assert len(raw) == EXPECTED_SIZE, (len(raw), EXPECTED_SIZE)
    assert actual_hash == EXPECTED_SHA256, (actual_hash, EXPECTED_SHA256)

    document = fitz.open(PDF)
    assert len(document) == EXPECTED_PAGES, (len(document), EXPECTED_PAGES)
    assert '2026' in document[0].get_text()[:300]

    for branch, programme_code, first_page, printed_page in BRANCHES:
        page_text = document[first_page - 1].get_text()
        assert branch in page_text, (branch, first_page)
        assert f'Programme Code: {programme_code}' in page_text, (programme_code, first_page)
        assert page_label(page_text) == str(printed_page), (first_page, page_label(page_text), printed_page)
        spread = normalized('\n'.join(document[i - 1].get_text() for i in (first_page, first_page + 1)))
        start = spread.find('Year of Study I')
        end = spread.find('Year of Study II', start + 1)
        assert start >= 0 and end > start, (branch, 'Year I / II table boundary not found')
        year_one = spread[start:end]
        for code, title in COURSES:
            assert re.search(rf'{re.escape(code)}\s+{re.escape(title)}', year_one), (branch, code, title)
        assert 'MATH1042A' not in year_one and 'MATH1043A' not in year_one, branch
        print(f'{branch} ({programme_code}): PDF p.{first_page} / printed p.{printed_page}, 9 exact Year I rows verified')

    electrical = normalized('\n'.join((document[47].get_text(), document[48].get_text())))
    year_two_start = electrical.find('Year of Study II')
    year_three_start = electrical.find('Year of Study III', year_two_start + 1)
    assert year_two_start >= 0 and year_three_start > year_two_start
    electrical_year_two = electrical[year_two_start:year_three_start]
    assert re.search(r'ELEN2003A\s+Electric and Magnetic Systems', electrical_year_two)
    syllabus = normalized(document[293].get_text())
    syllabus_start = syllabus.find('Course Code: ELEN2003A')
    assert syllabus_start >= 0
    syllabus_section = syllabus[syllabus_start:syllabus_start + 1000]
    for topic in ('electro-magnetic induction', 'coupling', 'transformers', 'power and energy conversion', 'electrical fields'):
        assert topic in syllabus_section.lower(), topic
    assert page_label(document[293].get_text()) == '292'
    print('Electrical EFA03: ELEN2003A Year II at PDF p.48 / printed p.46; detailed syllabus p.294 / printed p.292 verified')
    print(f'PDF integrity: {EXPECTED_PAGES} pages, {len(raw)} bytes, SHA-256 {actual_hash}')


if __name__ == '__main__':
    main()
