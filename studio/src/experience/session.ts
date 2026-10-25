/** Authored lesson semantics; no generative answers, inferred mastery or credential. */
export const STOCK_LESSON = [
 {title:'Start with the record',formula:'20',speech:'The shop opens with twenty notebooks. That is our opening stock.',hint:'Start with what the shop had before the delivery. There were twenty notebooks.'},
 {title:'Add the delivery',formula:'20 + 12 = 32',speech:'Twelve notebooks arrive. Twenty plus twelve gives thirty two notebooks before any sales.',hint:'Keep the sales aside for a moment. Add twenty and twelve first.'},
 {title:'Account for the sales',formula:'32 − 9 = 23',speech:'Nine notebooks are sold. Thirty two minus nine leaves twenty three. That is the expected closing stock.',hint:'We had thirty two after delivery. Take away the nine sold. That leaves twenty three.'},
] as const;
export type Anchor = 20 | 12 | 32 | 9 | 23 | 22;
const anchors:Record<Anchor,string>={20:'Twenty units is the opening stock, before deliveries and sales.',12:'Twelve units is the delivery. Add it to the opening stock.',32:'Thirty two units is the amount after delivery: twenty plus twelve. Sales have not yet been taken away.',9:'Nine units were sold. Subtract them from the thirty two available.',23:'Twenty three units is the expected closing stock: twenty plus twelve minus nine.',22:'Twenty two units is the observed shelf count. It is one below the expected twenty three. Check the records before deciding why.'};
export function explainAnchor(value:number):string|null{return Object.hasOwn(anchors,value)?anchors[value as Anchor]:null;}
export function checkedStep(value:number){return Number.isInteger(value)?Math.max(0,Math.min(STOCK_LESSON.length-1,value)):0;}
export function checkStockAnswer(value:string){if(!value.trim())return {correct:false,message:'Enter the expected number of notebooks.'};return Number(value)===23?{correct:true,message:'Yes. 20 + 12 − 9 = 23 expected notebooks. The observed count of 22 is separate.'}:{correct:false,message:'Try 20 + 12 first, then take away 9. We are calculating the expected count, not copying the shelf count.'};}
export function preparedAnswer(question:string):string{
 const q=question.toLowerCase();
 if(/\b(22|difference|different|short|observed)\b/.test(q))return anchors[22];
 if(/\b(32|deliver|delivery|arrive)\b/.test(q))return anchors[32];
 if(/\b(9|sold|sales)\b/.test(q))return anchors[9];
 if(/\b(23|closing|expected)\b/.test(q))return anchors[23];
 if(/\b(20|opening|start)\b/.test(q))return anchors[20];
 return 'This prepared example covers opening stock, deliveries, sales and the observed count. Choose a number or check the record below. A new answer about your own material is available through My material, where it can keep its source reference.';
}
