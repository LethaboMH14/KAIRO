import {
  SCENARIOS, DIRECTIONS, SOURCES, EVIDENCE_STATUS, SOURCE_REVIEW_STATUS,
  newRecord, appendAttempt, replayRecord, importRecord, exportRecord
} from './model.mjs';

const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (cls) node.className = cls;
  return node;
};
const svgEl = (tag, attrs = {}) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
};
function directionChoices() {
  const fieldset = el('fieldset');
  fieldset.append(el('legend', 'Before revealing: how will gauge pressure change?'));
  for (const [value, label] of Object.entries(DIRECTIONS)) {
    const row = el('label', undefined, 'radio-row');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'direction';
    radio.value = value;
    radio.required = true;
    row.append(radio, document.createTextNode(label));
    fieldset.append(row);
  }
  return fieldset;
}
function comparisonChart(result) {
  const svg = svgEl('svg', {viewBox:'0 0 640 174', class:'chart', 'aria-hidden':'true', focusable:'false'});
  const entries = [
    {name:'Starting column', value:result.basePressureKpa, y:25, color:'#58a6ff'},
    {name:'Changed column', value:result.pressureKpa, y:90, color:'#74d9ae'}
  ];
  for (const item of entries) {
    const label = svgEl('text',{x:10,y:item.y+16,fill:'#eaf3ff','font-size':16});
    label.textContent=item.name;svg.append(label);
    svg.append(svgEl('rect',{x:180,y:item.y,width:420,height:32,rx:6,fill:'#20364d'}));
    svg.append(svgEl('rect',{x:180,y:item.y,width:(420*item.value/120).toFixed(2),
      height:32,rx:6,fill:item.color}));
    const value=svgEl('text',{x:185,y:item.y+23,fill:'#fff','font-size':16});
    value.textContent=item.value.toFixed(2)+' kPa';svg.append(value);
  }
  const footer=svgEl('text',{x:10,y:163,fill:'#eaf3ff','font-size':14});
  footer.textContent='Illustrative gauge pressure; chart scale 0–120 kPa.';
  svg.append(footer);
  return svg;
}
function resultCard(result, index) {
  const card=el('section',undefined,'card result');
  const heading=el('h2','Round '+(index+1)+' — '+SCENARIOS[index].title);
  heading.tabIndex=-1;
  heading.dataset.resultFocus=String(index);
  card.append(heading);
  card.append(el('p','You predicted '+DIRECTIONS[result.predictedDirection].toLowerCase()+
    ' and '+result.predictedKpa.toFixed(1)+' kPa. The static model gives '+
    result.pressureKpa.toFixed(2)+' kPa: '+DIRECTIONS[result.direction].toLowerCase()+'.','feedback'));
  card.append(el('p',(result.directionCorrect?'Your direction prediction matched.':'Your direction prediction differed.')+
    ' '+(result.pressureWithinOneKpa?'Your numeric estimate was within 1 kPa.':
      'Your numeric estimate was more than 1 kPa away.')+
    ' These checks are practice feedback, not verified achievement.'));
  card.append(comparisonChart(result));
  const table=el('table');
  table.append(el('caption','Reading alternative — starting and changed fictional columns'));
  const head=el('thead'),headRow=el('tr');
  for(const title of ['State','Depth (m)','Density (kg/m³)','Gauge pressure (kPa)']){
    const th=el('th',title);th.scope='col';headRow.append(th);
  }
  head.append(headRow);table.append(head);
  const body=el('tbody');
  for(const row of [
    ['Starting',result.baseDepthM,result.baseDensityKgM3,result.basePressureKpa.toFixed(2)],
    ['Changed',result.depthM,result.densityKgM3,result.pressureKpa.toFixed(2)]
  ]){
    const tr=el('tr');
    row.forEach((value,i)=>{
      const cell=el(i===0?'th':'td',value);
      if(i===0)cell.scope='row';
      tr.append(cell);
    });
    body.append(tr);
  }
  table.append(body);card.append(table);
  const details=el('details');
  details.append(el('summary','Read the checked formula and assumptions'));
  const steps=el('ol');
  result.trace.forEach(step=>steps.append(el('li',step)));
  details.append(steps);card.append(details);
  const explain=el('p','Your explanation: ');
  explain.append(el('strong',result.explanation));
  card.append(explain);
  card.append(el('p','A stationary open column is not a running pump. This activity does not calculate flow, dynamic head, cavitation, equipment limits or safe operating settings.','limit'));
  return card;
}

export function mount(root) {
  if (!(root instanceof HTMLElement)) throw new TypeError('A page root element is required');
  let record=newRecord(), message='', focusTarget=null;
  function render() {
    const completed=replayRecord(record);
    root.replaceChildren();
    const header=el('header',undefined,'hero');
    header.append(el('p','KAIRO · ENGINEERING STUDIO · STATIC FLUIDS','eyebrow'));
    header.append(el('h1','Head is not a pressure reading'));
    header.append(el('p','In a fictional open column, change one variable, predict the pressure, then inspect the maths. Complete two independent rounds.'));
    root.append(header);
    root.append(el('p','Source status: '+SOURCE_REVIEW_STATUS+'. Evidence: '+EVIDENCE_STATUS+
      '. Values are fictional and calculations are not validated against equipment.','notice'));
    completed.forEach((result,index)=>root.append(resultCard(result,index)));
    if (completed.length < SCENARIOS.length) {
      const s=SCENARIOS[completed.length];
      const form=el('form',undefined,'card');
      form.append(el('h2','Round '+(completed.length+1)+' of 2: '+s.title));
      form.append(el('p',s.prompt));
      form.append(el('p','Starting column: '+s.baseDepthM+' m; '+s.baseDensityKgM3+
        ' kg/m³. The column is stationary, open to the atmosphere, and constant density.','model-note'));
      const changeLabel=el('label',s.kind==='depth'?'Choose the changed vertical depth (m)':
        'Choose the changed fictional density (kg/m³)','field');
      const change=el('select');change.required=true;
      s.choices.forEach(value=>{
        const option=el('option',value+(s.kind==='depth'?' m':' kg/m³'));
        option.value=String(value);change.append(option);
      });
      changeLabel.append(change);form.append(changeLabel);
      form.append(directionChoices());
      const estimateLabel=el('label','Predict the changed gauge pressure in kPa (0–120, one decimal place)','field');
      const estimate=el('input');
      estimate.type='number';estimate.min='0';estimate.max='120';estimate.step='0.1';
      estimate.required=true;estimate.inputMode='decimal';
      estimateLabel.append(estimate);form.append(estimateLabel);
      const explanationLabel=el('label','Explain your prediction before reveal (20–500 characters)','field');
      const explanation=el('textarea');
      explanation.rows=3;explanation.minLength=20;explanation.maxLength=500;explanation.required=true;
      explanationLabel.append(explanation);form.append(explanationLabel);
      const submit=el('button','Reveal calculation and record local attempt');
      submit.type='submit';form.append(submit);
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const direction=form.querySelector('input[name="direction"]:checked')?.value;
        try {
          record=appendAttempt(record,{
            scenarioId:s.id,changeValue:Number(change.value),predictedDirection:direction,
            predictedKpa:estimate.value===''?NaN:Number(estimate.value),
            explanation:explanation.value.trim()
          });
          message='Round '+record.actions.length+' saved in this page only.';
          focusTarget='result-'+(record.actions.length-1);
          render();
        } catch(error) {
          const status=root.querySelector('[role="status"]');
          status.textContent='Attempt rejected: '+error.message;
          status.focus();
        }
      });
      root.append(form);
    } else {
      root.append(el('p','Both practice rounds complete. Review the explanations or export your unverified actions.','complete'));
    }
    const tools=el('section',undefined,'card');
    tools.append(el('h2','Local practice record'));
    tools.append(el('p','Only your choices and explanations can be copied as JSON. No score, identity, verified claim or calculated result is stored or sent.'));
    const json=el('textarea');json.rows=5;
    json.setAttribute('aria-label','Local practice action JSON');
    json.placeholder='Show your local record or paste a record to validate.';
    tools.append(json);
    const show=el('button','Show local JSON');show.type='button';
    show.addEventListener('click',()=>{json.value=exportRecord(record);json.focus();});
    const load=el('button','Validate and import JSON');load.type='button';
    load.addEventListener('click',()=>{
      try {
        record=importRecord(json.value);
        message='Imported actions validated; results were recalculated.';
        focusTarget='status';render();
      } catch(error) {
        const status=root.querySelector('[role="status"]');
        status.textContent='Import rejected: '+error.message;status.focus();
      }
    });
    const reset=el('button','Restart both rounds');reset.type='button';
    reset.addEventListener('click',()=>{
      record=newRecord();message='Both local rounds reset.';focusTarget='status';render();
    });
    tools.append(show,load,reset);root.append(tools);
    const sources=el('section',undefined,'card');
    sources.append(el('h2','Concept references — independent subject review pending'));
    const list=el('ul');
    SOURCES.forEach(source=>{
      const item=el('li'),link=el('a',source.title);
      link.href=source.url;link.rel='noopener noreferrer';
      item.append(link,document.createTextNode(' — '+source.concept));
      list.append(item);
    });
    sources.append(list);root.append(sources);
    const status=el('p',message,'status');
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    status.tabIndex=-1;root.append(status);
    if (focusTarget) {
      const target=focusTarget==='status'?status:
        root.querySelector('[data-result-focus="'+focusTarget.slice(7)+'"]');
      focusTarget=null;
      if (target) target.focus();
    }
  }
  render();
}
const root=document.getElementById('pump-head-pressure-app');
if(root)mount(root);
