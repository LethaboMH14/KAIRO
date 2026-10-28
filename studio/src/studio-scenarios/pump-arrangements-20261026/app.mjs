import {SCENARIOS,RESISTANCE_CHOICES,WINNERS,FLOW_BANDS,SOURCES,SOURCE_REVIEW_STATUS,
  EVIDENCE_STATUS,newRecord,appendAttempt,replayRecord,importRecord,exportRecord} from './model.mjs';
const el=(tag,text,cls)=>{
  const n=document.createElement(tag);
  if(text!==undefined)n.textContent=text;
  if(cls)n.className=cls;
  return n;
};
function fieldset(title,name,choices){
  const f=el('fieldset');f.append(el('legend',title));
  for(const [key,label] of Object.entries(choices)){
    const row=el('label',undefined,'radio'),radio=el('input');
    radio.type='radio';radio.name=name;radio.value=key;radio.required=true;
    row.append(radio,document.createTextNode(label));f.append(row);
  }
  return f;
}
function graphic(result){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 620 165');svg.setAttribute('class','flow-chart');
  svg.setAttribute('aria-hidden','true');
  const max=Math.max(result.single.flowLps,result.series.flowLps,result.parallel.flowLps)*1.1;
  for(const [i,name,flow,color] of [
    [0,'Single',result.single.flowLps,'#8bbed7'],
    [1,'Series',result.series.flowLps,'#7be7c7'],
    [2,'Parallel',result.parallel.flowLps,'#ffcb86']]){
    const y=15+i*52;
    const text=document.createElementNS(ns,'text');
    text.setAttribute('x','8');text.setAttribute('y',String(y+23));
    text.setAttribute('fill','#f2f6ff');text.setAttribute('font-size','16');
    text.textContent=name;svg.append(text);
    const bar=document.createElementNS(ns,'rect');
    for(const [key,value] of Object.entries({x:95,y,width:420*flow/max,height:32,rx:5,fill:color}))
      bar.setAttribute(key,String(value));
    svg.append(bar);
    const number=document.createElementNS(ns,'text');
    number.setAttribute('x',String(105+420*flow/max));number.setAttribute('y',String(y+23));
    number.setAttribute('fill','#f2f6ff');number.setAttribute('font-size','15');
    number.textContent=flow.toFixed(2)+' L/s';svg.append(number);
  }
  return svg;
}
function resultCard(result,index){
  const card=el('section',undefined,'card');
  const heading=el('h2','Round '+(index+1)+': '+SCENARIOS[index].title+' — results');
  heading.tabIndex=-1;heading.dataset.resultFocus=String(index);card.append(heading);
  card.append(el('p','Your prediction: '+WINNERS[result.prediction]+'. Calculated winner: '+
    WINNERS[result.winner]+'. '+(result.winnerCorrect?'Prediction matched.':'Prediction differed.'),'feedback'));
  card.append(el('p','Predicted higher-flow band: '+FLOW_BANDS[result.predictedFlowBand]+
    '. Calculated band: '+FLOW_BANDS[result.winningFlowBand]+'. '+
    (result.flowBandCorrect?'Band matched.':'Band differed.')));
  card.append(graphic(result));
  const table=el('table');
  table.append(el('caption','Reading alternative to the flow bars: fictional curve intersections'));
  const head=el('thead'),row=el('tr');
  for(const name of ['Arrangement','Total flow (L/s)','System head (m)','Flow per pump (L/s)']){
    const th=el('th',name);th.scope='col';row.append(th);
  }
  head.append(row);table.append(head);
  const body=el('tbody');
  for(const [name,point] of [['One pump',result.single],['Two in series',result.series],['Two in parallel',result.parallel]]){
    const tr=el('tr'),th=el('th',name);th.scope='row';tr.append(th);
    for(const value of [point.flowLps.toFixed(2),point.headM.toFixed(2),point.perPumpFlowLps.toFixed(2)])
      tr.append(el('td',value));
    body.append(tr);
  }
  table.append(body);card.append(table);
  const details=el('details');details.append(el('summary','Show the checked equations and intersection steps'));
  const steps=el('ol');for(const step of result.trace)steps.append(el('li',step));
  details.append(steps);card.append(details);
  const explanation=el('p','Your explanation: ');explanation.append(el('strong',result.explanation));
  card.append(explanation);
  card.append(el('p','At a fixed flow, series adds pump head; at a fixed head, parallel adds pump flow. Actual system flow is where the combined pump curve meets the system curve. These invented values cannot predict real equipment performance.','limit'));
  return card;
}
export function mount(root){
  if(!(root instanceof HTMLElement))throw new TypeError('A real HTML root is required');
  let record=newRecord(),message='',focusTarget=null;
  function render(){
    const results=replayRecord(record);root.replaceChildren();
    const hero=el('header',undefined,'hero');
    hero.append(el('p','KAIRO · ENGINEERING STUDIO · PREPARED MODEL','eyebrow'));
    hero.append(el('h1','Two pumps: series or parallel?'));
    hero.append(el('p','Change fictional pipe resistance, predict which arrangement moves more water, and inspect where the curves meet.'));
    root.append(hero);
    root.append(el('p','Status: '+EVIDENCE_STATUS+'. Source review: '+SOURCE_REVIEW_STATUS+
      '. Invented teaching coefficients, not equipment or operating advice. No real learner record is verified.','notice'));
    for(let i=0;i<results.length;i++)root.append(resultCard(results[i],i));
    if(results.length<SCENARIOS.length){
      const scenario=SCENARIOS[results.length],form=el('form',undefined,'card');
      form.append(el('h2','Round '+(results.length+1)+' of '+SCENARIOS.length+': '+scenario.title));
      form.append(el('p',scenario.prompt));
      form.append(el('p','Fictional fixed lift: '+scenario.staticHeadM+
        ' m. Single-pump curve: H = 24 - 0.1 Q², with Q in L/s and H in m.','model-note'));
      const label=el('label','Choose fictional pipe resistance k (m per (L/s)²)','field');
      const select=el('select');select.required=true;
      for(const k of RESISTANCE_CHOICES){const option=el('option',String(k));option.value=String(k);select.append(option);}
      select.value='0.08';label.append(select);form.append(label);
      form.append(fieldset('Before revealing: which two-pump arrangement has higher system flow?','winner',WINNERS));
      form.append(fieldset('Before revealing: which band contains the higher flow?','band',FLOW_BANDS));
      const explainLabel=el('label','Explain using fixed lift and resistance (16–500 characters)','field');
      const explain=el('textarea');explain.required=true;explain.minLength=16;explain.maxLength=500;explain.rows=3;
      explainLabel.append(explain);form.append(explainLabel);
      const submit=el('button','Reveal curves and record this local attempt');submit.type='submit';form.append(submit);
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const prediction=form.querySelector('input[name="winner"]:checked')?.value;
        const flowBand=form.querySelector('input[name="band"]:checked')?.value;
        try{
          record=appendAttempt(record,{scenarioId:scenario.id,resistance:Number(select.value),
            prediction,flowBand,explanation:explain.value.trim()});
          message='Round '+record.actions.length+' recorded in this page only.';
          focusTarget='result-'+(record.actions.length-1);render();
        }catch(error){
          const status=root.querySelector('[role="status"]');
          status.textContent='Attempt rejected: '+error.message;status.focus();
        }
      });
      root.append(form);
    }else root.append(el('p','Two rounds complete. Compare predictions or export your local-unverified record.','complete'));
    const tools=el('section',undefined,'card');
    tools.append(el('h2','Private local practice record'));
    tools.append(el('p','The JSON contains only your choices and explanations, not scores, account IDs or authenticated evidence. Nothing is sent.'));
    const json=el('textarea');json.rows=7;json.setAttribute('aria-label','Local record JSON for copying or importing');
    json.placeholder='Export to copy, or paste a local record to import.';tools.append(json);
    const exportButton=el('button','Show local JSON');exportButton.type='button';
    exportButton.addEventListener('click',()=>{json.value=exportRecord(record);json.focus();});
    const importButton=el('button','Validate and import local JSON');importButton.type='button';
    importButton.addEventListener('click',()=>{
      try{record=importRecord(json.value);message='Imported actions validated and results recomputed.';
        focusTarget='status';render();}
      catch(error){const status=root.querySelector('[role="status"]');
        status.textContent='Import rejected: '+error.message;status.focus();}
    });
    const resetButton=el('button','Start two rounds again');resetButton.type='button';
    resetButton.addEventListener('click',()=>{record=newRecord();message='Local rounds reset.';focusTarget='status';render();});
    tools.append(exportButton,importButton,resetButton);root.append(tools);
    const refs=el('section',undefined,'sources');
    refs.append(el('h2','Checked public concepts (independent engineering review pending)'));
    const list=el('ul');
    for(const source of SOURCES){
      const li=el('li'),link=el('a',source.title);
      link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';
      li.append(link,document.createTextNode(' — '+source.concept));list.append(li);
    }
    refs.append(list);root.append(refs);
    const status=el('p',message,'status');status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');status.tabIndex=-1;root.append(status);
    const target=focusTarget==='status'?status:focusTarget?.startsWith('result-')
      ?root.querySelector('[data-result-focus="'+focusTarget.slice(7)+'"]'):null;
    focusTarget=null;target?.focus();
  }
  render();
  return {getRecord:()=>importRecord(exportRecord(record))};
}
if(typeof document!=='undefined'){
  const root=document.getElementById('pump-arrangements-app');
  if(root)mount(root);
}
