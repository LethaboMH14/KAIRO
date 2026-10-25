
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

const s16=S(16,'Intelligence with a reason you can inspect');
const steps=[['Understand the request','Goal + current source revision'],['Select the evidence','Relevant reviewed passages'],['Generate a lesson','Bounded model call + structured output'],['Check the result','Citation anchors + safe actions']];
steps.forEach((v,i)=>{const x=100+i*440;T(s16,String(i+1),x,330,360,90,C.moss,'ExtraBold');B(s16,v[0],v[1],x,495,370);});
line(s16,100,730,1720);
B(s16,'Available','Source-conditioned generation and deterministic educational calculations.',100,775,760);
B(s16,'Next','Connect versioned practice events to adaptive choices, then evaluate ML against a simple baseline.',1000,775,800);
foot(s16,'No trained mastery predictor, hiring probability or automatic generation of validated simulations is claimed.');
note(s16,'Current server default gemini-3.5-flash-lite in Vertex global is a source configuration, not fresh deployed-model verification. Source text is untrusted data. Validate schema, anchors, owner/revision and action allowlist; bound retries/time/cost. Adaptive policy exists in isolation, not production-event integration. Groq/OpenRouter experiments and AIML adapter are not production fallback. Future ML needs consented labelled events, learner-level train/evaluation split and held-out comparison/calibration.');
const s17=S(17,'A working foundation. A clear validation gap.');
T(s17,'692',100,320,750,164,C.moss,'ExtraBold');
T(s17,'automated tests passed\nat the recorded release checkpoint',112,526,760,40);
T(s17,'18 synthetic live API checks\nIAM-private Google Cloud Run deployment',112,740,760,36);
B(s17,'Panel feedback / one response','Can use: Yes\nCan buy: No\nWould pay: Nothing',1000,330,800);
T(s17,'“You must provide more details\nabout the problem.”',1000,590,800,44,C.copper,'Bold');
T(s17,'Next proof: learner task success,\nsource quality and a buyer commitment.',1000,790,800,38,C.moss,'Bold');
foot(s17,'Recorded 24 Oct 2026: kairo-app-00006-885. Engineering checks are separate from user acceptance and demand.');
note(s17,'Evidence docs/security-submission-20261024/RELEASE-STATUS.json: 692tests,18live synthetic API checks, IAMprivate,0npm advisories; no independent pentest certification, no browser observation. This is dated repository evidence, not a new release check. Supplied Sonke feedback screenshot: one panel member says Can useYes,Can buyNo,Would payNothing; reason more problem detail. Purchase authority/value/budget unknown; not representative demand research. No paying customers or measured learning gains supplied.');
const s18=S(18,'Who pays, and what they receive');
const prices=[['Personal','R49','per month, incl VAT if applicable','Own material, lessons, prepared practice\nand a defined usage allowance.'],['Institution Connected','R59','per learner/month, ex VAT','A funded learner pathway with pooled\nservices and agreed support.'],['Workforce','R149','per employee/month, ex VAT','Private company learning from approved\nmaterials and role-based practice.']];
prices.forEach((v,i)=>{const x=100+i*590;T(s18,v[0],x,330,530,40,C.moss,'Bold');T(s18,v[1],x,412,530,112,C.ink,'ExtraBold');T(s18,v[2],x,570,530,28,C.muted);T(s18,v[3],x,655,530,32);});
line(s18,100,800,1720);
T(s18,'Sponsored access: learner pays R0 within funded scope.\nCustom training: separately scoped, reviewed and priced.',100,845,1690,34,C.moss,'Bold');
foot(s18,'Price hypotheses. Connected/workforce offers and payment entitlements are not delivered. Setup fees and limits apply.');
note(s18,'Full-platform costs memo: PersonalR49inclVATifregistered. InstitutionConnected R59/seat/moexVAT annuallyR708 +R15000setup;250seatsfirstyearR192000exVAT. WorkforceR149/employee/moexVAT R1788annual +R15000setup;50seatsfirstyearR104400exVAT. Distinct InstitutionCore R35/seat/moexVAT +R6000setup models a narrower offer. No double charging sponsored learners. No checkout/entitlement ledger/company tenant implemented. Custom illustrative reviewedmodule quoteR71429exVAT fromR40000direct×1.25risk/(1-.30margin). No agreed prices, invoices, rewards or FNB revenue share.');
const s19=S(19,'The R49 plan needs clear usage limits');
s19.fills=[{type:'SOLID',color:C.sage}];
const vals=[['Net revenue',41.33,C.moss],['Service + support',21.79,C.ink],['Payment + refunds',4.17,C.copper],['Contribution',15.37,C.moss]];
vals.forEach((v,i)=>{T(s19,v[0],100,330+i*126,540,34,C.ink,'Bold');R(s19,670,338+i*126,v[1]/45*840,48,v[2]);T(s19,'R'+v[1].toFixed(2),1560,330+i*126,260,40,C.ink,'Bold');});
T(s19,'Contribution pays shared costs. It is not profit.',100,882,1720,48,C.ink,'Bold');
foot(s19,'Expanded usage scenario. Net after VAT/refund assumptions. R20/USD +15% vendor-tax reserve. Credits excluded.');
note(s19,'Full-platform-results.json consumer_full_usage gross49/net41.3304347826/service21.790684/fees4.1722/contribution15.3675507826. Net revenue=(49/1.15)*.97 under model. Expandedmonth4lesson/helpbundles,20complexpages,10listeningminutes,5000translationchars1target,2500voicechars,smallinfra/retrieval/visionreserves,2supportmin. Hypotheses, not metered costs. Heavy200page scenario contribution-26.03. Current app caps do not implement these commercial entitlements. No free credits included. Google price pages and Payfast fees verified24Oct2026.');
const s20=S(20,'Scale has to cover the full delivery cost');
const sc=[{name:'Small paid footprint',r:82166,c:220090,result:'−R137,924 / month',people:'200 personal + 1,000 institution\n+ 100 workforce; 1,000 free'},{name:'Illustrative larger footprint',r:390165,c:291721,result:'+R98,444 / month',people:'500 personal + 5,000 institution\n+ 500 workforce; 2,000 free'}];
sc.forEach((a,i)=>{const x=100+i*910;T(s20,a.name,x,300,820,40,C.moss,'Bold');T(s20,a.people,x,375,820,31);T(s20,'Revenue',x,510,260,28);R(s20,x,565,a.r/400000*760,50,C.moss);T(s20,'R'+Math.round(a.r/1000)+'k',x+650,505,170,34,C.moss,'Bold');T(s20,'Costs',x,665,260,28);R(s20,x,720,a.c/400000*760,50,C.copper);T(s20,'R'+Math.round(a.c/1000)+'k',x+650,660,170,34,C.copper,'Bold');T(s20,a.result,x,835,840,48,a.r>a.c?C.moss:C.copper,'Bold');});
foot(s20,'Monthly run-rate scenarios, not sales forecasts. Includes R198k shared capacity/overheads. Before tax and growth shocks.');
note(s20,'Exact sources full-platform-results.json mixed_run_rates. Smaller revenue82166.0869565/expense220090.45664/op-137924.36968. Larger390165.2173913/291720.8412/98444.37619. Shared198000/mo includes168000loadedcapacity+30000overhead; marginalusage/supportseparate. Institution60%active,workforce80%active. EFTinstitution/company,consumerfeesmodelled. Not current users, demanded volumes, contracted revenue or sustainable profit proof. Excludes acquisition/onboarding shocks, paymentdelays, staffstepchanges, income tax/debt. Paid learner types overlap in audience but billing must never doublecount same sponsored entitlement.');
return {createdNodeIds:created,mutatedNodeIds:mutated,slideIds:slides,assets};
