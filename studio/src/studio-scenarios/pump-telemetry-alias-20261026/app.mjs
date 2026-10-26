import {
  SCENARIOS,SAMPLE_RATES_HZ,APPARENT_FREQUENCIES_HZ,NYQUIST_PREDICTIONS,
  SOURCES,EVIDENCE_STATUS,SOURCE_REVIEW_STATUS,newRecord,appendAttempt,
  replayRecord,importRecord,exportRecord
} from './model.mjs';
const el=(tag,text,cls)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  if(cls)node.className=cls;
  return node;
};
const svgEl=(tag,attributes={})=>{
  const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [name,value] of Object.entries(attributes))node.setAttribute(name,String(value));
  return node;
};
function choiceGroup(title,name,choices){
  const group=el('fieldset');
  group.append(el('legend',title));
  for(const [value,label] of Object.entries(choices)){
    const row=el('label',undefined,'choice');
    const radio=el('input');
    radio.type='radio';radio.name=name;radio.value=value;radio.required=true;
    row.append(radio,document.createTextNode(label));
    group.append(row);
  }
  return group;
}
function chart(result){
  const svg=svgEl('svg',{viewBox:'0 0 720 235',class:'trace-plot',
    'aria-hidden':'true',focusable:'false'});
  const background=svgEl('rect',{x:0,y:0,width:720,height:235,fill:'#071b2c'});
  svg.append(background);
  for(const [y,label] of [[35,'+1'],[115,'0'],[195,'−1']]){
    svg.append(svgEl('line',{x1:40,y1:y,x2:690,y2:y,stroke:'#45617a','stroke-width':1}));
    const tick=svgEl('text',{x:10,y:y+5,fill:'#e4f2ff','font-size':14});
    tick.textContent=label;svg.append(tick);
  }
  let d='';
  for(let i=0;i<=400;i++){
    const t=i/400;
    const x=40+650*t;
    const y=115-80*Math.sin(2*Math.PI*result.frequencyHz*t+Math.PI/6);
    d+=(i===0?'M':'L')+x.toFixed(2)+' '+y.toFixed(2)+' ';
  }
  svg.append(svgEl('path',{d,fill:'none',stroke:'#78e0c4','stroke-width':2.5}));
  for(const sample of result.samples){
    svg.append(svgEl('circle',{cx:40+650*sample.timeSec,cy:115-80*sample.value,
      r:4.5,fill:'#ffd18a',stroke:'#091727','stroke-width':1.5}));
  }
  const label=svgEl('text',{x:40,y:224,fill:'#e4f2ff','font-size':14});
  label.textContent='Fictional one-second signal and discrete samples → time (s)';
  svg.append(label);
  return svg;
}
function resultCard(result,index){
  const card=el('section',undefined,'card');
  const heading=el('h2','Round '+(index+1)+' — '+SCENARIOS[index].title+' result');
  heading.tabIndex=-1;heading.dataset.resultFocus=String(index);card.append(heading);
  card.append(el('p','You predicted '+result.apparentPredictionHz+
    ' Hz. The prepared samples have an apparent frequency of '+result.apparentFrequencyHz+
    ' Hz. '+(result.apparentCorrect?'Your frequency prediction matched.':'Your frequency prediction differed.'),'feedback'));
  const nyquist=result.meetsNyquist?'meets':'fails';
  card.append(el('p','You predicted: '+NYQUIST_PREDICTIONS[result.nyquistPrediction]+
    '. Calculated: '+NYQUIST_PREDICTIONS[nyquist]+'. '+
    (result.nyquistCorrect?'Your Nyquist prediction matched.':'Your Nyquist prediction differed.')));
  card.append(el('p','This chart shows the invented continuous signal (green) and its samples (yellow). It is revealed only after your prediction.','chart-note'));
  card.append(chart(result));
  const table=el('table');
  table.append(el('caption','Reading alternative: each fictional sample over one second'));
  const thead=el('thead'),tr=el('tr');
  for(const title of ['Sample #','Time (s)','Unitless sampled value']){
    const th=el('th',title);th.scope='col';tr.append(th);
  }
  thead.append(tr);table.append(thead);
  const tbody=el('tbody');
  for(const sample of result.samples){
    const row=el('tr');
    for(const value of [sample.index,sample.timeSec.toFixed(4),sample.value.toFixed(4)]){
      row.append(el('td',String(value)));
    }
    tbody.append(row);
  }
  table.append(tbody);card.append(table);
  const details=el('details');
  details.append(el('summary','Read the checked sampling and aliasing steps'));
  const list=el('ol');
  for(const step of result.trace)list.append(el('li',step));
  details.append(list);card.append(details);
  const explanation=el('p','Your explanation: ');
  explanation.append(el('strong',result.explanation));card.append(explanation);
  card.append(el('p','Ideal sampling math is not a fault diagnosis. A real pump signal may have noise, multiple frequencies and filtering; this fictional chart does not establish real equipment behaviour.','limit'));
  return card;
}
export function mount(root){
  if(!(root instanceof HTMLElement))throw new TypeError('An HTML root is required');
  let record=newRecord(),message='',focusTarget=null;
  function render(){
    const results=replayRecord(record);
    root.replaceChildren();
    const header=el('header',undefined,'hero');
    header.append(el('p','KAIRO · ENGINEERING STUDIO · SYNTHETIC TELEMETRY','eyebrow'));
    header.append(el('h1','When a pump sensor misses the rhythm'));
    header.append(el('p','Choose how often a fictional pressure ripple is sampled. Predict what the samples might seem to show, then inspect why.'));
    root.append(header);
    root.append(el('p','Evidence: '+EVIDENCE_STATUS+'. Source review: '+SOURCE_REVIEW_STATUS+
      '. All readings are invented for learning. No real equipment advice, diagnosis, account evidence or hosted model training.','notice'));
    for(let i=0;i<results.length;i++)root.append(resultCard(results[i],i));
    if(results.length<SCENARIOS.length){
      const scenario=SCENARIOS[results.length];
      const form=el('form',undefined,'card');
      form.append(el('h2','Round '+(results.length+1)+' of 2: '+scenario.title));
      form.append(el('p',scenario.prompt));
      form.append(el('p','Ideal single sine, known frequency '+scenario.frequencyHz+
        ' Hz, no noise or filtering. Sampling is uniform over one second.','model-note'));
      const rateLabel=el('label','Choose the fictional sample rate (samples per second)','field');
      const rate=el('select');rate.required=true;
      for(const value of SAMPLE_RATES_HZ){
        const option=el('option',value+' Hz');option.value=String(value);rate.append(option);
      }
      rate.value='8';rateLabel.append(rate);form.append(rateLabel);
      const freqChoices={};
      for(const f of APPARENT_FREQUENCIES_HZ)freqChoices[f]=f+' Hz';
      form.append(choiceGroup('Before reveal: what apparent frequency will the samples show?','apparent',freqChoices));
      form.append(choiceGroup('Before reveal: does the rate meet the strict ideal Nyquist condition?','nyquist',NYQUIST_PREDICTIONS));
      const explainLabel=el('label','Explain your prediction (20–500 characters)','field');
      const explanation=el('textarea');
      explanation.required=true;explanation.minLength=20;explanation.maxLength=500;explanation.rows=3;
      explainLabel.append(explanation);form.append(explainLabel);
      const submit=el('button','Reveal trace and record local attempt');
      submit.type='submit';form.append(submit);
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const apparent=form.querySelector('input[name="apparent"]:checked')?.value;
        const nyquist=form.querySelector('input[name="nyquist"]:checked')?.value;
        try{
          record=appendAttempt(record,{
            scenarioId:scenario.id,sampleRateHz:Number(rate.value),
            apparentPredictionHz:Number(apparent),nyquistPrediction:nyquist,
            explanation:explanation.value.trim()
          });
          message='Round '+record.actions.length+' recorded in this page only.';
          focusTarget='result-'+(record.actions.length-1);render();
        }catch(error){
          const status=root.querySelector('[role="status"]');
          status.textContent='Attempt rejected: '+error.message;status.focus();
        }
      });
      root.append(form);
    }else{
      root.append(el('p','Both fictional rounds complete. Review the traces or export your local-unverified actions.','complete'));
    }
    const tools=el('section',undefined,'card');
    tools.append(el('h2','Local practice only'));
    tools.append(el('p','Exported JSON contains choices and explanations only. It does not contain derived scores, identity or verified learner evidence. Nothing is sent to a server.'));
    const json=el('textarea');json.rows=6;
    json.setAttribute('aria-label','Local action record JSON to copy or import');
    json.placeholder='Show your local record, or paste a record to validate.';
    tools.append(json);
    const show=el('button','Show local JSON');show.type='button';
    show.addEventListener('click',()=>{json.value=exportRecord(record);json.focus();});
    const load=el('button','Validate and import JSON');load.type='button';
    load.addEventListener('click',()=>{
      try{
        record=importRecord(json.value);
        message='Imported actions validated; calculated results were recomputed.';
        focusTarget='status';render();
      }catch(error){
        const status=root.querySelector('[role="status"]');
        status.textContent='Import rejected: '+error.message;status.focus();
      }
    });
    const reset=el('button','Restart both rounds');reset.type='button';
    reset.addEventListener('click',()=>{
      record=newRecord();message='Both local rounds reset.';
      focusTarget='status';render();
    });
    tools.append(show,load,reset);root.append(tools);
    const sources=el('section',undefined,'card');
    sources.append(el('h2','Public sampling concepts — independent subject review pending'));
    const list=el('ul');
    for(const source of SOURCES){
      const li=el('li'),link=el('a',source.title);
      link.href=source.url;link.rel='noopener noreferrer';
      li.append(link,document.createTextNode(' — '+source.concept));
      list.append(li);
    }
    sources.append(list);root.append(sources);
    const status=el('p',message,'status');status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');status.tabIndex=-1;root.append(status);
    if(focusTarget){
      const target=focusTarget==='status'?status:
        root.querySelector('[data-result-focus="'+focusTarget.slice(7)+'"]');
      focusTarget=null;
      if(target)target.focus();
    }
  }
  render();
}
const root=document.getElementById('pump-telemetry-alias-app');
if(root)mount(root);
