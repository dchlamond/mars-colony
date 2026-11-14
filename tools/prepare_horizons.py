"""Validate and package the checked-in JPL response. No network requests."""
from pathlib import Path
import csv, datetime, json, math
root=Path(__file__).resolve().parents[1]
raw=(root/'research/horizons-earth-mars.txt').read_text()
meta=json.loads((root/'research/horizons-query.json').read_text())
assert meta['signature']=={'version':'1.2','source':'NASA/JPL Horizons API'}, 'Review a changed API schema before updating.'
rows=[]
for fields in csv.reader(raw.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines()):
    date=datetime.datetime.strptime(fields[0].strip(),'%Y-%b-%d %H:%M').date().isoformat()
    au=float(fields[3]); minutes=float(fields[5]); assert 0<au<4 and 0<minutes<35
    assert abs(au*149597870.7/299792.458/60-minutes)<.001
    if rows: assert datetime.date.fromisoformat(date)-datetime.date.fromisoformat(rows[-1]['date'])==datetime.timedelta(days=1)
    rows.append({'date':date,'au':round(au,8),'minutes':round(minutes,5)})
assert len(rows)>800
obj={'source':'NASA/JPL Horizons','target':'Mars center (499)','observer':'Earth center (500@399)','quantity':'20: range (au); 21: one-way down-leg light time (minutes)','retrieved':meta['retrieved'],'query':meta['query'],'rows':rows}
(root/'game/horizons-snapshot.js').write_text('// NASA/JPL calculated ephemeris; cached, not live. See research/horizons-query.json.\nwindow.MARS_EPHEMERIS='+json.dumps(obj,separators=(',',':'))+';\n')
print(f'Validated {len(rows)} daily samples; first {rows[0]}; last {rows[-1]}')
