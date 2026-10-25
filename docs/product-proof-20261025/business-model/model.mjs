/** Transparent scenario calculator. All adoption, workload, FX and offer inputs are assumptions. */
const finite=(v,name,min=0)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min)throw new TypeError('Invalid '+name);return v;};
export function estimateOffer(config,usage,options={}) {
  const price=finite(config.priceZar,'priceZar'),seats=finite(config.seats,'seats');
  if(!Number.isInteger(seats))throw new TypeError('seats must be integral');
  const vat=finite(options.vatRate??0.15,'vatRate'),fx=finite(options.fxZarPerUsd??20,'fxZarPerUsd');
  if(vat>1)throw new TypeError('vatRate too large');
  const active=finite(config.activeFraction,'activeFraction');if(active>1)throw new TypeError('activeFraction too large');
  const tasks=finite(config.completedTasksPerActive,'completedTasksPerActive');
  const retry=finite(usage.duplicateFactor,'duplicateFactor',1);
  const calls=finite(usage.generationCallsPerTask,'generationCallsPerTask');
  const input=finite(usage.inputTokensPerCall,'inputTokensPerCall');
  const output=finite(usage.outputTokensPerCall,'outputTokensPerCall');
  const inPrice=finite(usage.modelUsdPerMillionInput,'modelUsdPerMillionInput');
  const outPrice=finite(usage.modelUsdPerMillionOutput,'modelUsdPerMillionOutput');
  const voice=finite(usage.premiumSpeechCharactersPerTask,'premiumSpeechCharactersPerTask');
  const voiceRate=finite(usage.premiumSpeechUsdPerMillionCharacters,'premiumSpeechUsdPerMillionCharacters');
  const ocrPages=finite(usage.paidOcrPagesPerTask,'paidOcrPagesPerTask');
  const ocrRate=finite(usage.ocrUsdPer1000Pages,'ocrUsdPer1000Pages');
  const sttMins=finite(usage.transcriptionMinutesPerTask,'transcriptionMinutesPerTask');
  const sttRate=finite(usage.transcriptionUsdPerMinute,'transcriptionUsdPerMinute');
  const localTask=finite(usage.otherVariableZarPerTask,'otherVariableZarPerTask');
  const monthlyPerSeat=finite(usage.otherVariableZarPerLicensedSeat,'otherVariableZarPerLicensedSeat');
  const support=finite(usage.supportMinutesPerActiveMonth,'supportMinutesPerActiveMonth');
  const supportRate=finite(usage.supportZarPerHour,'supportZarPerHour');
  const platformOverhead=finite(options.fixedMonthlyZar??0,'fixedMonthlyZar');
  const taxReserve=finite(options.foreignTaxReserveRate??0.15,'foreignTaxReserveRate');
  const refund=finite(config.refundRate??0,'refundRate');if(refund>1)throw new TypeError('refundRate too large');
  const charge=finite(config.paymentPercentage??0,'paymentPercentage');if(charge>1)throw new TypeError('paymentPercentage too large');
  const fixedFee=finite(config.paymentFixedZar??0,'paymentFixedZar');
  const bill=seats*price;
  const grossNet= config.priceIncludesVat ? bill/(1+vat) : bill;
  const revenue=grossNet*(1-refund);
  const activeSeats=seats*active,completedTasks=activeSeats*tasks;
  const usdModel= calls*(input*inPrice+output*outPrice)/1e6;
  const usdVoice=voice*voiceRate/1e6;
  const usdOcr=ocrPages*ocrRate/1000;
  const usdStt=sttMins*sttRate;
  const aiPerTaskZar=(usdModel+usdVoice+usdOcr+usdStt)*retry*fx*(1+taxReserve);
  const usageCost=completedTasks*(aiPerTaskZar+localTask);
  const seatCost=seats*monthlyPerSeat;
  const supportCost=activeSeats*support/60*supportRate;
  const payments= config.paymentCollection==='individual' ? seats*((price*charge+fixedFee)*(1+vat)) : 0;
  const variableCosts=usageCost+seatCost+supportCost+payments;
  const contribution=revenue-variableCosts;
  const perSeatContribution=seats?contribution/seats:0;
  return {label:config.label,modelType:'ILLUSTRATIVE_NOT_A_FORECAST',seats,activeSeats,completedTasks,priceZar:price,priceIncludesVat:!!config.priceIncludesVat,revenueZar:revenue,modelUsdPerTask:usdModel,premiumVoiceUsdPerTask:usdVoice,ocrUsdPerTask:usdOcr,transcriptionUsdPerTask:usdStt,aiPerTaskZar,usageCostZar:usageCost,seatCostZar:seatCost,supportCostZar:supportCost,paymentFeesZar:payments,variableCostsZar:variableCosts,contributionZar:contribution,contributionPerLicensedSeatZar:perSeatContribution,fixedMonthlyZar:platformOverhead,monthlyResultZar:contribution-platformOverhead,breakEvenLicensedSeats:perSeatContribution>0?Math.ceil(platformOverhead/perSeatContribution):null};
}
export function compareScenarios(config,usage,{cases,financial={}}={}){
 if(!Array.isArray(cases)||!cases.length)throw new TypeError('cases required');
 return cases.map(c=>{
  if(!c||typeof c!=='object')throw new TypeError('Invalid case');
  const n={...usage,duplicateFactor:usage.duplicateFactor*(c.retryMultiplier??1),premiumSpeechCharactersPerTask:usage.premiumSpeechCharactersPerTask*(c.voiceMultiplier??1),otherVariableZarPerTask:usage.otherVariableZarPerTask*(c.otherTaskCostMultiplier??1)};
  const offer={...config,completedTasksPerActive:config.completedTasksPerActive*(c.taskMultiplier??1),activeFraction:config.activeFraction*(c.activityMultiplier??1)};
  return {...estimateOffer(offer,n,financial),scenario:c.label};
 });
}
