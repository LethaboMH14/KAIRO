import {compareScenarios,estimateOffer} from './model.mjs';
// These are 24–25 Oct 2026 business hypotheses, NOT customers, revenue, usage telemetry or provider bills.
// Sources: docs/business-canvas-20261024/FULL-PLATFORM-COSTS.md and docs/canvas-cost-research-20261024/README.md
// Dollar rates are Google Gemini 3.5 Flash-Lite *Standard Global* assumptions; verify actual serving tier and SKU.
export const usage={duplicateFactor:1.1,generationCallsPerTask:7,inputTokensPerCall:7900/7,outputTokensPerCall:2780/7,modelUsdPerMillionInput:0.30,modelUsdPerMillionOutput:2.50,premiumSpeechCharactersPerTask:625,premiumSpeechUsdPerMillionCharacters:30,paidOcrPagesPerTask:0.2,ocrUsdPer1000Pages:1.50,transcriptionMinutesPerTask:0.1,transcriptionUsdPerMinute:0.016,otherVariableZarPerTask:0.3,otherVariableZarPerLicensedSeat:0.2,supportMinutesPerActiveMonth:2,supportZarPerHour:120};
export const financial={vatRate:0.15,fxZarPerUsd:20,foreignTaxReserveRate:0.15,fixedMonthlyZar:45000};
export const offers={
 personal:{label:'Personal Core',priceZar:49,seats:100,priceIncludesVat:true,activeFraction:0.6,completedTasksPerActive:4,refundRate:0.03,paymentCollection:'individual',paymentPercentage:0.032,paymentFixedZar:2},
 institution:{label:'Institution Connected',priceZar:59,seats:250,priceIncludesVat:false,activeFraction:0.6,completedTasksPerActive:4,refundRate:0,paymentCollection:'institution'},
 workforce:{label:'Workforce Learning',priceZar:149,seats:50,priceIncludesVat:false,activeFraction:0.6,completedTasksPerActive:4,refundRate:0,paymentCollection:'institution'}
};
export function report(){
 const risks=[{label:'light',taskMultiplier:0.5,voiceMultiplier:0.2},{label:'base'},{label:'heavy-usage-retry',taskMultiplier:3,voiceMultiplier:8,retryMultiplier:2}];
 return {notForecast:true,sourceDate:'2026-10-25',important:'Not a quote, measured billing, active contract or realised performance. Excludes setup/custom work, CAC, capital and enterprise integrations. Verify VAT, rates, contract terms, tax and actual usage.',
 cases:Object.fromEntries(Object.entries(offers).map(([key,offer])=>[key,compareScenarios(offer,usage,{cases:risks,financial:{...financial,fixedMonthlyZar:key==='personal'?45000:198000}})])),
 zeroCustomers:estimateOffer({...offers.personal,seats:0},usage,financial)};
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href)console.log(JSON.stringify(report(),null,2));
