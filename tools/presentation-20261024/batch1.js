
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

const cover=await figma.getNodeByIdAsync('1:41');
await Promise.all(cover.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(v=>figma.loadFontAsync(v.fontName))));
for(const c of cover.children){c.visible=false;mutated.push(c.id);}
cover.name='01 / KAIRO';cover.fills=[{type:'SOLID',color:C.ink}];mutated.push(cover.id);slides.push(cover.id);
T(cover,'KAIRO',100,148,1120,230,C.chalk,'ExtraBold');
T(cover,'Put knowledge\nto work.',110,440,1050,100,C.chalk,'Bold');
T(cover,'Personalised learning. Practical exploration.\nEvidence you can explain.',116,735,1020,38,C.sage);
img(cover,'avatar-cover',1140,110,680,840);
T(cover,'FNB APP OF THE YEAR HACKATHON 2026',116,990,1300,24,C.sage,'Medium');
note(cover,'KAIRO Access is the education product. Actual KAIRO GLB rendered offline in Blender. This is a product presentation, not evidence of validated learning or employment outcomes. Preserve underlying Rain/Blender attribution in supporting credits.');
const s2=S(2,'“I can read it. Can I explain it?”');
T(s2,'The lecture has ended.\nThe lab is closed.\nThe motor still makes no sense.',100,310,850,58,C.moss,'Bold');
T(s2,'A student needs a way to practise, get feedback\nand show their own reasoning.',100,610,810,38);
T(s2,'Later, a job asks for practical skills.\nWhat can they show?',100,790,810,42,C.copper,'Bold');
img(s2,'student',1020,310,800,620);foot(s2,'Illustrative learner story and generated student. Local need and frequency require learner interviews.');
note(s2,'The persona is an illustrative adult engineering student, not a testimonial. Target situations: study between lectures, distance/off-campus learning, difficulty linking a diagram to physical behaviour, and explaining practical reasoning. Do not claim all students experience this or that KAIRO substitutes for a laboratory.');
const s3=S(3,'A large system. Unequal ways to connect.');
T(s3,'1.43m',100,326,850,176,C.moss,'ExtraBold');
T(s3,'Higher-education enrolments\nin South Africa in 2024',112,540,770,44,C.ink,'Medium');
T(s3,'1.116m public HEI enrolments\n313,186 private HEI enrolments',112,718,760,34);
bar(s3,'Households with mobile internet',75.6,100,1000,360,620,C.moss);
bar(s3,'Households with fixed internet at home',17.4,100,1000,530,620,C.copper);
T(s3,'Reading first. Optional 3D and voice.\nSave progress and recover after interruption.',1000,748,780,38,C.moss,'Bold');
foot(s3,'DHET PSET 2024; Stats SA GHS 2024, Table 14.1. Household access types overlap; not student affordability.');
note(s3,'DHET Statistics on Post-School Education and Training 2024, published 2026: total 1,428,766, public 1,115,580 and private 313,186 HEI enrolments. https://www.dhet.gov.za/Information%20Systems%20Management%20Documents/Statistical%20Reports%20and%20Data/Reports/Statistics%20on%20Post-School%20Education%20and%20Training%20in%20South%20Africa%2C%202024.pdf\nStats SA GHS 2024 Table14.1: mobile75.6%, fixed-at-home17.4%, any82.1%. https://www.statssa.gov.za/publications/P0318/P03182024.pdf\nThese are contextual denominators, not KAIRO demand, market share, individual student connectivity or affordable data. Bars are not mutually exclusive.');
const s4=S(4,'The learner has to join the gaps');
s4.fills=[{type:'SOLID',color:C.sage}];
B(s4,'01 / Study','Notes, slides and videos\nspread across places.',100,350,360);
B(s4,'02 / Understand','An explanation can feel clear\nuntil you try it alone.',560,350,360);
B(s4,'03 / Apply','Practical reasoning needs\nfeedback and another attempt.',1020,350,360);
B(s4,'04 / Show it','A CV needs meaningful\nexamples of your work.',1480,350,340);
line(s4,100,650,1720,C.moss);
T(s4,'“What should I do next,\nand how does it help my future?”',100,714,1600,70,C.ink,'Bold');
foot(s4,'Problem hypothesis: fragmented support across learning and career preparation. Validate with learners and buyers.');
note(s4,'These four pains describe the product hypothesis. Research supports active engagement and feedback mechanisms but does not quantify local prevalence or validate the commercial offer. Opportunity and employer-side services are staged expansion, not current verified placement.');
const s5=S(5,'One connected learning journey');
const steps=[['Your material','Upload and review'],['Your lesson','Choose a goal'],['Explore','Read, listen or try'],['Practise','Explain and check'],['Your working','Save your reasoning'],['Your direction','Choose the next step']];
steps.forEach((v,i)=>{const x=100+i*290;T(s5,String(i+1).padStart(2,'0'),x,342,240,76,i<5?C.moss:C.copper,'ExtraBold');line(s5,x,460,250,i<5?C.moss:C.copper);B(s5,v[0],v[1],x,510,250);});
T(s5,'The same source, lesson and learner context\nshould stay with you throughout.',100,770,1630,52,C.moss,'Bold');
foot(s5,'Connected learning foundation exists. Automatic role-gap learning and live opportunities remain in development.');
note(s5,'Current repository: account/modules, private source review, cited editable lesson, shared teacher/reading, prepared motor/pump/API activities, practice/saved working/resume. Role notes and manual preparation exist separately; automated evidence-to-current-role matching is not connected. Source/revision integrity and clear next actions are essential.');
return {createdNodeIds:created,mutatedNodeIds:mutated,slideIds:slides,assets};
