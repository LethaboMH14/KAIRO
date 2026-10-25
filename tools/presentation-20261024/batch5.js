
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

const s21=S(21,'Value for the learner, buyer and a partner');
B(s21,'Learner','Useful practice from their own material, clearer next steps and working they can explain.',100,340,510);
B(s21,'Institution or company','A scoped learning service with reviewed tasks, agreed usage and measurable completion.',700,340,510);
B(s21,'Potential FNB partnership','Sponsor access or training, connect an approved pathway and evaluate consented outcomes.',1300,340,510);
line(s21,100,665,1720);
T(s21,'Test the value before promising the return.',100,740,1680,64,C.moss,'Bold');
T(s21,'Measure repeat use, learning tasks, buyer renewal and full delivery cost.',100,850,1680,36);
foot(s21,'Partnership hypothesis. No FNB agreement, reward, referral revenue or employment result is secured.');
note(s21,'Potential FNB roles: a sponsor funding a bounded learner cohort or a company training buyer. Candidate benefits are relevant access/support, reviewed training/evidence and legitimate opt-in services only. No customer-account data is available, no commercial conversion forecast, no inferred finance eligibility and no eBucks/rewards permission. Measure partner value separately from learning. Commercial terms and consent must precede integration.');
const s22=S(22,'The ask: one module, one serious pilot',true);
T(s22,'20–40',100,330,800,170,C.chalk,'ExtraBold');
T(s22,'adult learners\none subject reviewer\none accountable buyer',112,560,760,50,C.chalk);
B(s22,'Usability','Can learners finish the source-to-saved-working task on their own devices?',1000,320,800,true);
B(s22,'Learning','Can they explain and apply the concept immediately and later?',1000,530,800,true);
B(s22,'Commercial','Will a buyer fund a defined service at an acceptable measured cost?',1000,740,800,true);
foot(s22,'Proposed pilot, not an agreement. Scope, consent, content rights, budget and comparison plan precede recruitment.',true);
note(s22,'Ask for access to a willing department/support programme, one educator,20–40 consentingadultlearners and a namedbudgetowner. Discovery8–12learners/3–5buyers, formativeusability5–8adults, learningpilot20–40 is a stagedproposal. Exampleformativegate80%taskcompletion andzerounresolvedcriticalprivacy/sourcefailures, notstatisticalefficacyproof. Comparator/prior knowledge/delayedtransfer/attrition needed for causal claims. Budget quoted afterscope; no currentpilotfunding. RoughremainingbuildenvelopeR315000 is840personhours×R300×1.25, notthispilotprice, excludescontinuousSASL/broadcatalogue. Do notdoublecountmonthlypayroll.');
const s23=S(23,'Growth follows reviewed modules and evidence');
B(s23,'First / engineering','Motor and pump. One supported module, clear tasks, measured learner/device acceptance.',100,345,510);
B(s23,'Next / computing and workforce','Reuse the source, lesson and evidence contracts. Add approved role and company content.',700,345,510);
B(s23,'Later / wider studios','Law, health sciences, industrial/mining and further technical disciplines, with domain review.',1300,345,510);
T(s23,'Personalisation, language and SASL support grow\nwith validated content, rights and community review.',100,785,1700,48,C.moss,'Bold');
foot(s23,'Expansion stages depend on learning, security, buyer and unit-cost gates. No delivery date is promised.');
note(s23,'Sixstudio vision retained: adaptivelecture,engineering,law/anatomy-health/industrial-mining/computerscience. Commerce laterplatformdirection. Need reusable reviewedmodule descriptors, role/evidence contracts, contentrights, SMEapproval, datasetsandlanguage/communityvalidation, institutiontenancy/paymententitlements,observability/capsandoperationalstaffing. No broadcataloguealreadyimplemented or allmodels trained. Train/evaluate specialistMLonlyafterdefiningtask/data/legalrights; hostedmodels are no substitute for domain validation.');
const s24=S(24,'Make learning count',true);
img(s24,'worlds-closing',820,290,1000,565);
T(s24,'KAIRO',100,340,680,140,C.chalk,'ExtraBold');
T(s24,'Read it.\nSee it.\nTry it.',110,560,670,76,C.chalk,'Bold');
T(s24,'Help us test one real learner journey.',100,910,1720,44,C.sage,'Bold');
foot(s24,'Illustrative learning worlds. Pilot discussion requested; outcomes and partner commitments remain to be tested.',true);
note(s24,'Generated KAIRO brandedworlds image is conceptual, not screenshot or actualteacher-mesh render. The other teacher slides use actualGLBrenders. Ask for pilotpartner and educator access. Use actual user-approved demo recording later; current browserrestriction intact. No publicQR/link implies availability. KAIRO teacher rig attribution: basedonRainRig©BlenderFoundation/studio.blender.org,CCBY4.0, modifiedface/figure/textures/hair/clothes/animations. Fullassetcredits in assets/kairo-brand-hero-20261024/KAIRO-CREDITS.txt.');
return {createdNodeIds:created,mutatedNodeIds:mutated,slideIds:slides,assets};
