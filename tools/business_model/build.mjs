import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../..');
const out=path.join(root,'outputs/01a1663f-fa9a-7fa2-b28a-70ffbb1a7c00');
const docs=path.join(root,'docs/business-canvas-20261024');
await fs.mkdir(out,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(docs,'model-results.json'),'utf8'));
const wb=Workbook.create();
const sheets=Object.fromEntries(['Summary','Assumptions','Forecast','Unit costs'].map(n=>[n,wb.worksheets.add(n)]));
const money='"R"#,##0;("R"#,##0);"–"';
const money2='"R"#,##0.00;("R"#,##0.00);"–"';
const set=(s,a,v)=>s.getRange(a).values=[[v]];
const form=(s,a,f)=>{s.getRange(a).formulas=[[f]];s.getRange(a).format.font.color=f.includes('!')?'#008000':'#252b28';};
const band=(s,a,label)=>{s.mergeCells(a);set(s,a.split(':')[0],label);s.getRange(a).format={fill:'#3e5144',font:{name:'Arial',bold:true,color:'#ffffff',size:13}};};
for(const s of Object.values(sheets)){
 s.getRange('A1:AB85').format={font:{name:'Arial',size:10,color:'#252b28'},fill:'#f5f0e6',rowHeight:22,columnWidth:13};
 s.getRange('A:A').format.columnWidth=3;
 s.getRange('B:B').format.columnWidth=39;
 form(s,'C2',"=Assumptions!B3");set(s,'B2','Selected case');
 s.freezePanes.freezeRows(5);
}
const a=sheets.Assumptions;band(a,'B1:G1','KAIRO · editable planning assumptions · 24 Oct 2026');
set(a,'B3','Base');a.getRange('B3').dataValidation={rule:{type:'list',values:['Base','Downside','Upside']}};
set(a,'B4','Select Base / Downside / Upside above. All volumes, prices and labour are hypotheses.');a.mergeCells('B4:G4');
a.getRange('B5:G5').values=[['Driver','Active','Base','Downside','Upside','Units / evidence / boundary']];
const R={};
data.drivers.forEach((d,i)=>{
 const r=i+6;R[d.key]=r;
 a.getRange(`B${r}:G${r}`).values=[[d.key,null,d.base,d.downside,d.upside,d.note]];
 form(a,`C${r}`,`=IF($B$3="Downside",E${r},IF($B$3="Upside",F${r},D${r}))`);
 a.getRange(`D${r}:F${r}`).format.font.color='#0000FF';
});
a.getRange('C6:F45').setNumberFormat('0.0000');a.getRange('G:G').format.columnWidth=100;a.getRange('G6:G45').format.wrapText=true;a.getRange('B6:G45').format.rowHeight=36;
for(const k of ['reach_growth','activation','conversion','churn','free_retention','renewal','inst_active','refund_rate','vat','pay_pct','cloud_tax_reserve'])a.getRange(`C${R[k]}:F${R[k]}`).setNumberFormat('0.0%');
for(const k of ['reach_start','first_contract','contract_interval','payment_lag','seats','voice_chars'])a.getRange(`C${R[k]}:F${R[k]}`).setNumberFormat('#,##0');
a.getRange(`C${R.llm_bundle_usd}:F${R.llm_bundle_usd}`).setNumberFormat('0.00000');
const p=k=>`Assumptions!$C$${R[k]}`;
const u=sheets['Unit costs'];band(u,'B1:J1','KAIRO · unit economics before fixed costs');
const ul=[['B4','Consumer gross monthly price'],['B5','Premium characters / month'],['B7','Consumer net revenue after refunds'],['B8','Model lesson/help bundles'],['B9','Premium voice incl billable duplicates'],['B10','Infrastructure reserve'],['B11','Human support'],['B12','Card / refund fees incl VAT'],['B13','Total variable cost'],['B14','Consumer contribution'],['B16','Free active user variable cost'],['B17','Institution active learner cost'],['B18','Institution contribution / licensed seat'],['B20','Consumer-only break-even accounts'],['B21','Institution-only break-even seats']];
for(const [addr,label] of ul)set(u,addr,label);
form(u,'C4',`=${p('price')}`);form(u,'C5',`=${p('voice_chars')}`);
form(u,'C7',`=C4*(1-${p('refund_rate')})/(1+${p('vat')}*${p('vat_registered')})`);
form(u,'C8',`=${p('lessons')}*${p('llm_bundle_usd')}*${p('retry_multiplier')}*${p('fx')}*(1+${p('cloud_tax_reserve')})`);
form(u,'C9',`=C5/1000000*${p('tts_usd_million')}*${p('retry_multiplier')}*${p('fx')}*(1+${p('cloud_tax_reserve')})`);
form(u,'C10',`=${p('infra_paid_usd')}*${p('fx')}*(1+${p('cloud_tax_reserve')})`);
form(u,'C11',`=${p('support_minutes')}/60*${p('support_hour')}`);
form(u,'C12',`=(C4*${p('pay_pct')}+${p('pay_fixed')}+${p('refund_rate')}*${p('refund_fee')})*(1+${p('vat')})`);
form(u,'C13','=SUM(C8:C12)');form(u,'C14','=C7-C13');
form(u,'C16',`=(${p('free_lessons')}*${p('llm_bundle_usd')}*${p('retry_multiplier')}*${p('fx')}+${p('infra_free_usd')}*${p('fx')})*(1+${p('cloud_tax_reserve')})+0.25/60*${p('support_hour')}`);
form(u,'C17',`=2*${p('llm_bundle_usd')}*${p('retry_multiplier')}*${p('fx')}*(1+${p('cloud_tax_reserve')})+C9+C10+${p('support_hour')}/60`);
form(u,'C18',`=${p('seat_price')}-${p('inst_active')}*C17`);
form(u,'C20',`=IF(C14>0,ROUNDUP((${p('fixed_cash')}+${p('founder_replacement')}+${p('marketing')})/C14,0),0)`);
form(u,'C21',`=IF(C18>0,ROUNDUP((${p('fixed_cash')}+${p('founder_replacement')}+${p('marketing')})/C18,0),0)`);
u.getRange('C4:C18').setNumberFormat(money2);u.getRange('C5').setNumberFormat('#,##0');u.getRange('C20:C21').setNumberFormat('#,##0');
band(u,'E3:J3','Contribution sensitivity · price across / voice down');
form(u,'E4','=C14');u.getRange('F4:J4').values=[[29,39,49,59,79]];
u.getRange('E5:E9').values=[[0],[2500],[8000],[20000],[80000]];
u.dataTables.add('E4:J9',{rowInput:'C4',columnInput:'C5'});
u.getRange('E4').setNumberFormat(';;;');u.getRange('F4:J9').setNumberFormat(money2);u.getRange('E5:E9').setNumberFormat('#,##0');
u.getRange('F5:J9').conditionalFormats.add('colorScale',{colors:['#cf6f63','#f5f0e6','#a7af91'],thresholds:['min',{type:'percentile',value:50},'max']});
for(const [r,t] of [[12,'Sensitivity uses actual unit-model driver cells C4/C5; main inputs remain on Assumptions.'],[14,'Break-even excludes free users, new-cohort sales/onboarding and income tax. Zero means no positive margin.'],[16,'R49 and R35 are untested prices. Current app quotas are pilot limits; commercial packages are not implemented.'],[18,'Cloud infrastructure is a provisional reserve, NOT a verified Johannesburg invoice.'],[20,'Fee VAT/input credits are treated conservatively. Read ECONOMICS.md before using these figures.']]){u.mergeCells(`E${r}:K${r+1}`);set(u,`E${r}`,t);u.getRange(`E${r}:K${r+1}`).format.wrapText=true;}
const f=sheets.Forecast;band(f,'B1:H1','KAIRO · 24-month operating and cash forecast');
const labels={6:'Month index',7:'Reach',8:'Season factor',9:'New paid before sponsorship',10:'Retained paid',11:'Migrated to sponsored seats',12:'Closing consumer paid',13:'Closing free active',14:'New cohort contracts',15:'Expiring cohort contracts',16:'Renewed cohort contracts',17:'Licensed institution seats',18:'Institution monthly active',20:'Consumer revenue ex VAT / refunds',21:'Institution licence revenue earned',22:'Onboarding revenue earned',23:'Total revenue earned',25:'Consumer variable cost',26:'Free user variable cost',27:'Institution variable cost',28:'Total variable cost',29:'Acquisition / onboarding costs',30:'Fixed cost incl replacement labour',31:'Settlement fee',32:'Operating before income tax',34:'Institution annual invoices ex VAT',35:'Institution cash receipts ex VAT',36:'Closing receivables ex VAT',37:'Closing deferred licence revenue',38:'Fixed cash expense incl founder draw',39:'Institution VAT timing burden',40:'Net cash change incl initial setup',41:'Cumulative cash before funding',43:'Revenue reconciliation',44:'Receivables reconciliation',45:'Deferred revenue reconciliation',46:'Cash reconciliation'};
for(const [r,l] of Object.entries(labels))set(f,`B${r}`,l);
const col=i=>{let x=i,s='';while(x){x--;s=String.fromCharCode(65+x%26)+s;x=Math.floor(x/26)}return s;};
for(let m=1;m<=24;m++){
 const c=col(m+2),prev=col(m+1),lagold=m>12?col(m-10):null;
 const cell=r=>`${c}${r}`,pr=r=>m>1?`${prev}${r}`:'0';
 set(f,`${c}5`,new Date(Date.UTC(2026,9+m,1)).toISOString().slice(0,7));set(f,cell(6),m);
 const season=[1,.65,.65,1,1,1,1,.85,.85,1,1,1][(m-1)%12];set(f,cell(8),season);
 const ff={
 7:`=${p('reach_start')}*(1+${p('reach_growth')})^(${cell(6)}-1)`,
 9:`=${cell(7)}*${cell(8)}*${p('activation')}*${p('conversion')}`,
 10:`=${pr(12)}*(1-${p('churn')})`,
 14:`=IF(AND(${cell(6)}>=${p('first_contract')},MOD(${cell(6)}-${p('first_contract')},${p('contract_interval')})=0),1,0)`,
 15:lagold?`=${lagold}14`:'=0',16:`=${cell(15)}*${p('renewal')}`,
 11:`=MIN(${cell(10)}+${cell(9)},${cell(14)}*${p('seats')}*0.15)`,
 12:`=${cell(10)}+${cell(9)}-${cell(11)}`,
 13:`=MAX(0,${pr(13)}*${p('free_retention')}+${cell(7)}*${cell(8)}*${p('activation')}*(1-${p('conversion')})-${cell(14)}*${p('seats')}*0.5)`,
 17:`=${pr(17)}+${p('seats')}*(${cell(14)}-${cell(15)}+${cell(16)})`,
 18:`=${cell(17)}*${p('inst_active')}`,
 20:`=${cell(12)}*'Unit costs'!$C$7`,21:`=${cell(17)}*${p('seat_price')}`,22:`=${cell(14)}*${p('onboarding_price')}`,23:`=SUM(${c}20:${c}22)`,
 25:`=${cell(12)}*'Unit costs'!$C$13`,26:`=${cell(13)}*'Unit costs'!$C$16`,27:`=${cell(18)}*'Unit costs'!$C$17`,28:`=SUM(${c}25:${c}27)`,
 29:`=${p('marketing')}+${cell(14)}*(${p('sales_cost')}+${p('onboarding_cost')})`,30:`=${p('fixed_cash')}+${p('founder_replacement')}`,
 31:`=IF(${cell(12)}>0,${p('payout_fee')}*(1+${p('vat')}),0)`,32:`=${cell(23)}-${cell(28)}-${cell(29)}-${cell(30)}-${cell(31)}`,
 34:`=(${cell(14)}+${cell(16)})*${p('seats')}*${p('seat_price')}*12+${cell(22)}`,
 35:`=IF(${cell(6)}>${p('payment_lag')},INDEX($C$34:$Z$34,1,MAX(1,${cell(6)}-${p('payment_lag')})),0)`,
 36:`=${pr(36)}+${cell(34)}-${cell(35)}`,
 37:`=${pr(37)}+(${cell(14)}+${cell(16)})*${p('seats')}*${p('seat_price')}*12-${cell(21)}`,
 38:`=${p('fixed_cash')}+IF(${cell(6)}<=3,0,IF(${cell(6)}<=6,15000,IF(${cell(6)}<=12,25000,${p('founder_replacement')})))`,
 39:`=(${cell(35)}-${cell(34)})*${p('vat')}*${p('vat_registered')}`,
 40:`=${cell(20)}+${cell(35)}+${cell(39)}-${cell(28)}-${cell(29)}-${cell(38)}-${cell(31)}-IF(${cell(6)}=1,${p('initial_setup')},0)`,
 41:`=${pr(41)}+${cell(40)}`,
 43:`=${cell(23)}-SUM(${c}20:${c}22)`,44:`=${cell(36)}-${pr(36)}-${cell(34)}+${cell(35)}`,
 45:`=${cell(37)}-${pr(37)}-(${cell(14)}+${cell(16)})*${p('seats')}*${p('seat_price')}*12+${cell(21)}`,
 46:`=${cell(41)}-${pr(41)}-${cell(40)}`};
 for(const [r,expr] of Object.entries(ff))form(f,cell(r),expr);
}
f.getRange('C7:Z18').setNumberFormat('#,##0.0');f.getRange('C20:Z46').setNumberFormat(money);f.getRange('C8:Z8').setNumberFormat('0%');
f.freezePanes.freezeColumns(2);
for(const r of [23,28,32,41])f.getRange(`B${r}:Z${r}`).format={fill:'#a7af91',font:{bold:true}};
const s=sheets.Summary;band(s,'B1:J1','KAIRO · business economics · hypotheses, not sales forecasts');
s.mergeCells('B3:J4');set(s,'B3','Start with a 20–40 learner validation pilot. Commercial 250-seat cohorts and R49 subscriptions require buyer evidence, metering and delivery gates. No customers or revenue are claimed.');s.getRange('B3:J4').format.wrapText=true;
const summaryRows=[['Year 1 earned revenue','=SUM(Forecast!C23:N23)'],['Year 2 earned revenue','=SUM(Forecast!O23:Z23)'],['Month 24 revenue','=Forecast!Z23'],['Month 24 operating before income tax','=Forecast!Z32'],['Peak cash deficit','=MAX(0,-MIN(Forecast!C41:Z41))'],['Cash requirement +20% buffer','=D10*1.2'],['Month 24 consumer accounts','=Forecast!Z12'],['Month 24 licensed seats','=Forecast!Z17'],['Month 24 receivables','=Forecast!Z36'],['Month 24 deferred revenue','=Forecast!Z37']];
summaryRows.forEach(([l,expr],i)=>{set(s,`B${i+6}`,l);form(s,`D${i+6}`,expr)});
s.getRange('D6:D15').setNumberFormat(money);s.getRange('D12:D13').setNumberFormat('#,##0');s.getRange('D:D').format.columnWidth=20;
s.mergeCells('F6:J11');set(s,'F6','Decision: do not scale on enrolment statistics alone. Test a specific source → lesson → practice task, then a scoped paid offer. Annual upfront cash is NOT earned profit; deferred delivery still needs funding. All returns are pre-income-tax and pre-financing.');s.getRange('F6:J11').format.wrapText=true;
s.mergeCells('F13:J17');set(s,'F13','Model assumptions exclude free credits. Cash uses staged founder draw; operating includes replacement labour. Infrastructure reserve, demand and support minutes need real measurements. Scenario and 5,000-run stress results are in ECONOMICS.md / model-results.json, not live Excel forecasts.');s.getRange('F13:J17').format.wrapText=true;
s.getRange('B19:D19').values=[['Month','Revenue','Operating']];
for(let m=1;m<=24;m++){const c=col(m+2);form(s,`B${19+m}`,`=Forecast!${c}6`);form(s,`C${19+m}`,`=Forecast!${c}23`);form(s,`D${19+m}`,`=Forecast!${c}32`);}
s.getRange('C20:D43').setNumberFormat(money);
const chart=s.charts.add('line',s.getRange('B19:D43'));chart.title='Earned revenue and operating result';chart.hasLegend=true;chart.setPosition('F20','N35');chart.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:10}};chart.yAxis={numberFormatCode:'"R"#,##0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:10}};
// Sources are attached to the actual assumptions rather than buried in a separate list.
const sources={llm_bundle_usd:'https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing',tts_usd_million:'https://cloud.google.com/text-to-speech/pricing',vat:'https://www.sars.gov.za/tax-rates/other-taxes/',pay_pct:'https://payfast.io/fees/',pay_fixed:'https://payfast.io/fees/',refund_fee:'https://payfast.io/fees/',payout_fee:'https://payfast.io/fees/'};
set(a,'H5','Source / checked 2026-10-24');a.getRange('H:H').format.columnWidth=85;
for(const d of data.drivers)set(a,`H${R[d.key]}`,sources[d.key]||'Planning assumption; replace after pilot measurement / supplier quote');
wb.recalculate();
const checks=[];
for(const n of ['Base','Downside','Upside']){
 set(a,'B3',n);wb.recalculate();
 const vals=s.getRange('D6:D15').values.flat();const expected=data.cases[n].summary;
 const pairs=[[0,'year1_revenue'],[1,'year2_revenue'],[2,'month24_revenue'],[3,'month24_operating'],[4,'funding_need'],[5,'funding_with_20pct_buffer'],[6,'month24_paid'],[7,'month24_seats'],[8,'receivables24'],[9,'deferred24']];
 for(const [i,k] of pairs){const actual=Number(vals[i]);if(!Number.isFinite(actual)||Math.abs(actual-expected[k])>.02)throw Error(`${n} ${k}: ${actual} != ${expected[k]}`);}
 const reconciliation=f.getRange('C43:Z46').values.flat().map(Number);if(reconciliation.some(x=>!Number.isFinite(x)||Math.abs(x)>.001))throw Error(`Reconciliation failed ${n}`);
 checks.push({case:n,summary_comparison:'PASS',cash_revenue_deferred_receivable_checks:'PASS'});
}
set(a,'B3','Base');wb.recalculate();
const sensitivity=u.getRange('H6').values[0][0];if(Math.abs(sensitivity-data.cases.Base.units.consumer_contribution)>.001)throw Error(`Sensitivity base mismatch ${sensitivity}`);
await fs.writeFile(path.join(docs,'workbook-checks.json'),JSON.stringify({checks,sensitivity_base:sensitivity,native_excel_open_test:'Not performed; artifact calculation/export only'},null,2));
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(path.join(out,'KAIRO-business-model.xlsx'));
for(const [name,range] of [['Summary','B1:N35'],['Assumptions','B1:H17'],['Forecast','B1:I46'],['Unit costs','B1:K23']]){
 const img=await wb.render({sheetName:name,range,scale:1,format:'png'});await fs.writeFile(path.join(docs,`preview-${name.replace(' ','-')}.png`),new Uint8Array(await img.arrayBuffer()));
}
console.log(JSON.stringify({file:path.join(out,'KAIRO-business-model.xlsx'),checks,sensitivity}));
