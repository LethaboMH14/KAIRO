const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
require('./lesson.js');const M=globalThis.KAIRO_MOTION;
test('linear market equilibrium satisfies both equations after demand shifts',()=>{for(const shift of [-30,0,30,60]){const m=M.market(shift);assert.equal(m.quantity,m.a-m.price);assert.equal(m.quantity,20+m.price);}assert.equal(M.market(0).price,40);});
test('cash purchase creates no profit and sales preserve the accounting equation',()=>{for(const q of [0,10,50])for(const sold of [0,5,60]){const r=M.ledger(q,sold);assert.equal(r.assets,r.equity);assert(r.stock>=0);assert.equal(r.profit,r.revenue-r.costOfSales);}assert.equal(M.ledger(30,0).profit,0);});
test('replayed stock change differs from reusing one recorded result',()=>{assert.equal(M.reservation(true,true).stock,0);assert.equal(M.reservation(true,false).stock,-1);assert.equal(M.reservation(false,false).stock,0);});
test('invalid model parameters remain bounded',()=>{assert.equal(M.market(Infinity).a,70);assert.equal(M.ledger(-10,999).bought,0);assert.equal(M.ledger(10,999).sales,10);});
test('all module views render under a DOM stub without browser observation',()=>{
 const events={},els={};const el=id=>els[id]||(els[id]={innerHTML:'',textContent:'',value:'',options:[],style:{},addEventListener:(name,fn)=>events[id+':'+name]=fn,querySelectorAll:()=>[]});
 const c={globalThis:null,KAIRO_MOTION:M,document:{getElementById:el,addEventListener:(name,fn)=>events['document:'+name]=fn,hidden:false},window:{speechSynthesis:{getVoices:()=>[],addEventListener(){},cancel(){}},addEventListener(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},matchMedia:()=>({matches:false}),setTimeout,console};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/app.js','utf8'),c);
 for(const module of ['economics','accounting','systems']){events['document:click']({target:{closest:()=>({dataset:{module}})}});for(const t of [0,10,20]){el('scrub').oninput({target:{value:t}});assert(el('visual').innerHTML.includes('visual-title'));assert(el('caption').textContent.length>40);}}
 assert(el('speak').disabled);assert(!fs.readFileSync(__dirname+'/app.js','utf8').includes('fetch('));
});
