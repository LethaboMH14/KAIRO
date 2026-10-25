import {runSample} from '../../tools/provider-lab/lab.mjs';
// Explicit single follow-up, synthetic fixture only. No automatic retry.
try{
 const result=await runSample('openrouter',{apiKey:process.env.OPENROUTER_API_KEY,model:'dots-studio/dots-3-note-preview:free',consent:true,maxOutputTokens:4000});
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(JSON.stringify({error:error.message,diagnostics:error.diagnostics||null}));process.exitCode=1;}
