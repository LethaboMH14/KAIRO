
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

const s11=S(11,'Learning linked to opportunity');
s11.fills=[{type:'SOLID',color:C.sage}];
const st=[['Choose a role','Understand sourced requirements'],['Link your working','Show what you attempted'],['Find the gap','Choose targeted practice'],['Take the next step','Review an official opportunity']];
st.forEach((v,i)=>{const x=100+i*440;T(s11,'0'+(i+1),x,340,390,70,C.moss,'ExtraBold');B(s11,v[0],v[1],x,490,370);});
T(s11,'NSFAS and bursaries. Internships and hackathons.\nA learner-owned profile employers can view with consent.',100,760,1720,44,C.ink,'Bold');
foot(s11,'Roadmap: fresh official-source feeds, explainable role alignment and consented employer sharing. No partner secured.');
note(s11,'Full agreed vision includes course/goals, CV-confirmed facts, skill evidence, sourced role requirements, targeted practice, funding and opportunities, and optional employer sharing. Current direction notes/manual role preparation/CV draft are partial and separate. No real-time feed, automated application, employment prediction or verified skill exists. Freshness must include source, checkedAt, closesAt/unknown and withdrawal. NSFAS eligibility remains an official decision. No reward or FNB partnership is secured.');
const s12=S(12,'More ways to learn');
B(s12,'Available foundation','Reading and keyboard controls\nEditable source-linked lessons\nShared narration and cancellation\nDraft translation for selected languages',100,320,780);
B(s12,'Next validation','Listening and speech input\nLanguage quality with native speakers\nSigner-reviewed SASL learning support\nPhone, assistive technology and data use',1030,320,790);
line(s12,100,720,1720);
T(s12,'A learner should have a useful path\nwhen 3D, audio or a camera is unsuitable.',100,776,1650,56,C.moss,'Bold');
foot(s12,'Hand tracking is not SASL translation. Draft translation is not validated multilingual teaching.');
note(s12,'Current source translation drafts include English/Afrikaans/isiZulu/isiXhosa/Sesotho/Setswana; quality validation is open. Current Google Chirp3HD voice is English, not South-African-language synthesis. No listening model is mounted. MediaPipe landmarks are not SASL recognition. Continuous SASL requires Deaf/signer involvement, datasets/rights, nonmanual grammar and held-out evaluation. No camera activation performed.');
const s13=S(13,'Strong alternatives. A connected KAIRO focus.');
const cols=[100,560,1190];['Product','What it brings','Our design response'].forEach((v,i)=>T(s13,v,cols[i],300,[400,560,620][i],28,C.moss,'Bold'));
const rows=[['NotebookLM / Gemini Notebook','Source-based answers and study formats','Keep source review central'],['PhET','Research-informed interactive simulations','Join exploration to a personal lesson'],['Labster','Virtual labs and curriculum mapping','Begin with a small prepared catalogue'],['Khanmigo','Guided AI tutoring and teacher support','Ask for reasoning before showing help'],['Coursera Campus','Career learning and portfolios','Connect course working to role gaps'],['KAIRO','Own material, KAIRO, studio, saved working','Course-to-practice-to-opportunity vision']];
rows.forEach((r,i)=>{const y=370+i*85;line(s13,100,y-12,1720);r.forEach((v,j)=>T(s13,v,cols[j],y,[410,570,620][j],28,i===5?C.moss:C.ink,i===5?'Bold':'Regular'));});
foot(s13,'Official product documentation, checked 24 Oct 2026. Comparison of focus, not exhaustive feature scoring.');
note(s13,'Source-based study: https://support.google.com/gemininotebook/answer/16215270?hl=en . PhET: https://phet.colorado.edu/en/research . Labster: https://www.labster.com/simulations . Guided tutoring: https://khanmigo.ai/ . Role and portfolio learning: https://www.coursera.org/campus . Competitors may also offer overlapping capabilities. KAIRO differentiation is the connected workflow and local relevance hypothesis; no first/only claim, comparative efficacy evidence or proven moat.');
const s14=S(14,'A focused first market');
T(s14,'Context',100,330,500,32,C.muted,'Bold');T(s14,'1.43m',100,390,600,120,C.moss,'ExtraBold');T(s14,'SA higher-education enrolments\nNational context, not paying demand',110,556,650,34);
B(s14,'First user','Adults in supported engineering modules who need to practise an idea from their own material.',850,330,940);
B(s14,'First buyer','A department, tutoring/support programme or sponsor that can approve a bounded cohort pilot.',850,560,940);
B(s14,'Reachable test','20–40 consenting learners, one module and one subject reviewer. Recruitment target only.',850,790,940);
foot(s14,'DHET PSET 2024. Exact supported-module market, willingness to pay and procurement timing remain unknown.');
note(s14,'Do not multiply all students by R49 as revenue. Serviceable market depends on module support, content rights, device fit and a named buyer. No institutional agreement or roster acquired. Validate 8–12 learner interviews and 3–5 buyer/tutor conversations before larger pilot. BCom Information Systems/computing is adjacent, company training later.');
const s15=S(15,'Technical architecture',true);
box(s15,'Learner web app','React + TypeScript\nThree.js / React Three Fiber',100,330,450,205,true);
box(s15,'Account + API','Firebase Authentication\nCloud Run / Node.js',720,330,480,205,true);
box(s15,'Durable imports','Cloud Tasks\nBounded Python extraction',1390,330,430,205,true);
line(s15,550,430,170,C.sage);line(s15,1200,430,190,C.sage);
box(s15,'Private records','Firestore\nSource, lesson and progress',100,690,450,205,true);
box(s15,'Private originals','Cloud Storage\nOwner-scoped material',720,690,480,205,true);
box(s15,'Teaching services','Vertex AI generation\nGoogle Text-to-Speech',1390,690,430,205,true);
line(s15,550,790,170,C.sage);line(s15,1200,790,190,C.sage);
R(s15,940,535,2,155,C.sage);
foot(s15,'Cloud Run, Firestore and storage: Johannesburg. Tasks: europe-west1. Vertex: global. IAM-private service.',true);
note(s15,'Repository evidence docs/security-submission-20261024/RELEASE-STATUS.json and docs/connected-release-20261024. Private Cloud Run service kairo-app, project kairo-access-20261021. Node backend, Firebase sessions, Firestore owner-scoped repository, GCS originals and Tasks worker. Diagram is logical grouping, not a literal network topology. Current one-instance cap is pilot capacity. Tasks in Europe and Vertex global mean this is not an all-data-SA-resident deployment. No keys in slides. Judge access and human acceptance remain gates.');
return {createdNodeIds:created,mutatedNodeIds:mutated,slideIds:slides,assets};
