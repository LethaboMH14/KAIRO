export type Gesture='idle'|'explain'|'point'|'listen';
export type Expression='warm'|'focused'|'curious';
export type AudioSignal={energy:number;time:number;duration:number};
export const CLOUD_VOICES=[{id:'en-GB-Chirp3-HD-Aoede',language:'en-GB',label:'Aoede · English (UK)'},{id:'en-US-Chirp3-HD-Kore',language:'en-US',label:'Kore · English (US)'},{id:'en-GB-Chirp3-HD-Puck',language:'en-GB',label:'Puck · English (UK)'}];
export function speechChunks(text:string,max=1200){
 const result:string[]=[];let remaining=text.trim();
 while(remaining.length>max){let end=remaining.lastIndexOf(' ',max);if(end<max/2)end=max;result.push(remaining.slice(0,end));remaining=remaining.slice(end).trimStart();}if(remaining)result.push(remaining);return result;
}
export function blendAmount(delta:number){return 1-Math.exp(-8*Math.min(.1,Math.max(0,delta)));}
export function mouthEnergy(samples:Uint8Array){let sum=0;for(const value of samples){const x=(value-128)/128;sum+=x*x;}return Math.min(.8,Math.sqrt(sum/Math.max(1,samples.length))*3);}
export const BOARD_STEPS=[{id:'opening',title:'Start with what you have.',formula:'20 notebooks',caption:'The shop starts the day with twenty notebooks.'},{id:'delivery',title:'A delivery adds to stock.',formula:'20 + 12 = 32',caption:'A delivery adds twelve notebooks. There are now thirty two.'},{id:'sales',title:'Sales reduce the balance.',formula:'32 − 9 = 23',caption:'Customers buy nine. Thirty two minus nine leaves twenty three notebooks.'}];
