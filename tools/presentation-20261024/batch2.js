
const C={chalk:{r:.961,g:.941,b:.902},moss:{r:.243,g:.318,b:.267},sage:{r:.655,g:.686,b:.569},ink:{r:.145,g:.169,b:.157},copper:{r:.682,g:.459,b:.333},muted:{r:.39,g:.43,b:.39},line:{r:.79,g:.80,b:.74}};
await Promise.all(['Regular','Medium','Bold','ExtraBold'].map(style=>figma.loadFontAsync({family:'Manrope',style})));
const created=[],mutated=[],slides=[],assets=[];
function T(p,txt,x,y,w,size=38,color=C.ink,style='Regular'){const n=figma.createText();p.appendChild(n);created.push(n.id);n.fontName={family:'Manrope',style};n.fontSize=size;n.characters=txt;n.fills=[{type:'SOLID',color}];n.textAutoResize='HEIGHT';n.resize(w,10);n.x=x;n.y=y;n.name=txt.slice(0,65);return n;}
function R(p,x,y,w,h,color){const n=figma.createRectangle();p.appendChild(n);created.push(n.id);n.resize(w,h);n.x=x;n.y=y;n.fills=[{type:'SOLID',color}];return n;}
function F(p,x,y,w,h,color){const n=figma.createFrame();p.appendChild(n);created.push(n.id);n.resize(w,h);n.x=x;n.y=y;n.fills=color?[{type:'SOLID',color}]:[];return n;}
function B(p,head,body,x,y,w,dark=false){const n=figma.createAutoLayout();p.appendChild(n);created.push(n.id);n.name=head;n.layoutMode='VERTICAL';n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.resize(w,100);n.itemSpacing=18;n.fills=[];n.x=x;n.y=y;const h=T(n,head,0,0,w,40,dark?C.chalk:C.moss,'Bold');const b=T(n,body,0,0,w,32,dark?C.chalk:C.ink);return n;}
function S(num,title,dark=false,section='KAIRO ACCESS'){const s=figma.createSlide();s.name=String(num).padStart(2,'0')+' / '+title;s.fills=[{type:'SOLID',color:dark?C.ink:C.chalk}];created.push(s.id);slides.push(s.id);T(s,section,100,64,1300,24,dark?C.sage:C.moss,'Bold');T(s,title,100,144,1720,76,dark?C.chalk:C.ink,'Bold');T(s,'KAIRO',100,1008,130,22,dark?C.sage:C.moss,'ExtraBold');T(s,String(num).padStart(2,'0'),1740,1008,80,22,dark?C.sage:C.moss);return s;}
function foot(s,txt,dark=false){T(s,txt,280,1005,1400,20,dark?C.sage:C.muted);}
function img(p,key,x,y,w,h){const n=R(p,x,y,w,h,C.sage);n.name='ASSET / '+key;assets.push({key,nodeId:n.id});return n;}
function bar(p,label,val,max,x,y,w,color=C.moss,suffix='%'){T(p,label,x,y,620,32);R(p,x,y+56,w,32,C.line);R(p,x,y+56,w*val/max,32,color);T(p,String(val)+suffix,x+w+24,y+36,170,40,C.moss,'Bold');}
function line(p,x,y,w,color=C.line){return R(p,x,y,w,2,color);}
function note(s,txt){s.speakerNotes=txt;}
function box(p,head,body,x,y,w,h,dark=false){const f=F(p,x,y,w,h,dark?C.moss:{r:.91,g:.92,b:.87});B(f,head,body,28,24,w-56,dark);return f;}
function link(s,txt,url,x,y,w){const t=T(s,txt,x,y,w,22,C.moss);t.setRangeHyperlink(0,t.characters.length,{type:'URL',value:url});return t;}

const s6=S(6,'Meet KAIRO',true);
img(s6,'avatar-teacher',100,270,600,670);
B(s6,'Teaches from your material','Source-linked explanations you can check and edit.',860,320,900,true);
B(s6,'Helps you work through a concept','Explore a prepared model, make a prediction and explain what you observe.',860,530,900,true);
B(s6,'Keeps the learner in control','Pause, ask for help, switch to reading and keep your working.',860,780,900,true);
foot(s6,'Actual KAIRO avatar render. Voice and reading foundation implemented; behaviour quality needs learner testing.',true);
note(s6,'Actual KAIRO GLB rendered offline by Claude. KAIRO is the teacher name; Rain refers only to rig provenance. Current source-grounded generation and shared speech controls are implemented. Do not imply unrestricted world generation, validated pedagogy or full conversation/listening.');
const s7=S(7,'Your learning space, across devices');
B(s7,'Phone / a clear next step','Choose your module. Add material. Review the extraction. Continue a lesson.',100,322,720);
B(s7,'Laptop / room to explore','Read alongside the motor, change a supported variable and keep your explanation.',100,560,720);
B(s7,'Same learning goal','The intended experience follows the learner. Real-device usability still needs testing.',100,800,720);
const clip=F(s7,930,285,890,680);clip.clipsContent=true;
img(clip,'devices-selected-C',0,0,1780,1114);
foot(s7,'Selected C brand/device concept, not a screenshot. Current browser application requires separate phone acceptance.');
note(s7,'Image is the existing generated brand comparison, clipped to the selected Continuous Path / C direction only. This is a design reference, not proof of implemented mobile responsiveness, native apps, offline support or tested cross-device transfer. Current app is web based.');
const s8=S(8,'A motor lesson you can work through');
B(s8,'Predict','What happens to the rotating field speed when the supply frequency changes?',100,310,760);
B(s8,'Explore','Inspect the stator and rotor. Change a supported control. Observe the model.',100,532,760);
B(s8,'Explain','Write what changed and why. Check the supporting source and save your working.',100,754,760);
img(s8,'motor',910,310,910,640);
foot(s8,'Prepared educational motor model. Uploaded notes do not automatically create a validated equipment simulation.');
note(s8,'Actual induction motor GLB rendered offline from design/kairo-ad-20261024/build/motor. Prepared studio supports inspect/explode/operate and bounded educational controls. Example lesson sequence is KAIRO authored. Practice must reference the current reviewed source and use domain-reviewed questions. A simulation does not certify equipment operation.');
const s9=S(9,'Different concepts. Relevant environments.',true);
const env=[['Motor studio','See the rotor and stator.\nConnect field, motion and explanation.'],['Pump lab','Explore components and flow.\nReason about a supported pump scenario.'],['API explorer','Trace a request through a system.\nExplain what happens at each step.']];
env.forEach((v,i)=>{const x=100+i*590;T(s9,'0'+(i+1),x,330,500,140,C.sage,'ExtraBold');B(s9,v[0],v[1],x,550,520,true);});
T(s9,'A student sees activities relevant to their modules.',100,850,1690,46,C.chalk,'Bold');
foot(s9,'Three prepared activity routes. Synthetic engineering/informatics profiles use selected public curriculum facts.',true);
note(s9,'Current routes: /engineering motor, /pump-lab pump, /computer-science request trace. Course-to-activity mappings are KAIRO-authored enrichment, not university-prescribed labs or a complete curriculum. Broader law/health/industrial studios remain vision.');
const s10=S(10,'The teaching method has a research basis');
T(s10,'225',100,330,650,180,C.moss,'ExtraBold');
T(s10,'undergraduate STEM studies\nin an active-learning meta-analysis',112,550,720,44,C.ink,'Medium');
T(s10,'Research supports the design.\nKAIRO must earn its own evidence.',112,780,730,42,C.copper,'Bold');
B(s10,'Attempt before the answer','Retrieval practice motivates recall and prediction before revealing help.',1000,310,800);
B(s10,'Feedback, then another try','Explain the error and ask the learner to apply the idea again.',1000,530,800);
B(s10,'Coordinate words and exploration','Show the relevant part, remove distraction and let the learner set the pace.',1000,750,800);
foot(s10,'Freeman et al. (2014); Karpicke & Roediger (2008); Butler et al. (2008); PhET design research.');
note(s10,'Freeman et al., PNAS 2014, meta-analysis of225 undergraduate STEM studies: https://doi.org/10.1073/pnas.1319030111 . This supports studying active learning, not the claim that KAIRO replicates the reported effect. Karpicke/Roediger2008 retrieval experiment involved vocabulary: https://doi.org/10.1126/science.1152408 . Feedback study https://pubmed.ncbi.nlm.nih.gov/18605878/ . PhET https://phet.colorado.edu/en/research emphasises iterative learner testing and limits of simulations for physical equipment skills. KAIRO has no measured learning gain; plan equivalent pre/post/delayed transfer with a comparator.');
return {createdNodeIds:created,mutatedNodeIds:mutated,slideIds:slides,assets};
