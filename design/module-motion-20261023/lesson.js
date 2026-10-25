(function(root){
 const bound=(v,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):min;
 function market(shift){const a=100+bound(shift,-30,60),price=(a-20)/2;return {a,price,quantity:20+price};}
 function ledger(units,sold){const bought=bound(units,0,50),sales=bound(sold,0,bought),cash=1000-10*bought+15*sales,stock=10*(bought-sales),profit=5*sales;return {bought,sales,cash,stock,profit,revenue:15*sales,costOfSales:10*sales,assets:cash+stock,equity:1000+profit};}
 function reservation(retry,dedupe){const deliveries=retry?2:1,decrements=dedupe?1:deliveries;return {deliveries,decrements,stock:1-decrements,correct:decrements===1};}
 root.KAIRO_MOTION={bound,market,ledger,reservation};
})(globalThis);
