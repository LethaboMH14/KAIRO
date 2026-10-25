"""Read-only exported OOXML check; no spreadsheet authoring library."""
import json, math, zipfile, xml.etree.ElementTree as ET
from model import ROOT, OUT
book=ROOT/'outputs/01a1663f-fa9a-7fa2-b28a-70ffbb1a7c00/KAIRO-business-model.xlsx'
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(book) as z:
    assert z.testzip() is None
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    names=[s.attrib['name'] for s in wb.findall('s:sheets/s:sheet',NS)]
    assert names==['Summary','Assumptions','Forecast','Unit costs']
    formulas=0;error_cells=[]
    for name in z.namelist():
        if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
            tree=ET.fromstring(z.read(name))
            formulas+=len(tree.findall('.//s:f',NS))
            error_cells.extend((name,c.attrib['r']) for c in tree.findall('.//s:c',NS) if c.attrib.get('t')=='e')
    assert not error_cells,error_cells
    tree=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    cells={c.attrib['r']:c.findtext('s:v',namespaces=NS) for c in tree.findall('.//s:c',NS)}
    result=json.loads((OUT/'model-results.json').read_text())['cases']['Base']['summary']
    refs={'D6':'year1_revenue','D7':'year2_revenue','D8':'month24_revenue','D9':'month24_operating',
          'D10':'funding_need','D11':'funding_with_20pct_buffer','D12':'month24_paid','D13':'month24_seats',
          'D14':'receivables24','D15':'deferred24'}
    for addr,k in refs.items():assert abs(float(cells[addr])-result[k])<.02,(addr,cells[addr],result[k])
    assert formulas>850
    dt=ET.fromstring(z.read('xl/worksheets/sheet4.xml')).findall('.//s:f',NS)
    assert any(f.attrib.get('t')=='dataTable' for f in dt),'Missing native sensitivity data table'
check=dict(zip_integrity='PASS',sheets=names,formula_cells=formulas,error_cells=error_cells,
           ten_cached_base_outputs_vs_python='PASS',native_two_input_table='PRESENT',
           native_excel_interaction='NOT OBSERVED',authoring_process_exit='1 after successful export/check/render; unexplained warning retained')
(OUT/'export-verification.json').write_text(json.dumps(check,indent=2),encoding='utf-8')
print(json.dumps(check,indent=2))
