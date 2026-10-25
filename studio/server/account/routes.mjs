import {Router,json} from 'express';
import {createHash} from 'node:crypto';

const cookieName='kairo_session';
export function sessionToken(req){const raw=req.headers.cookie||'';if(raw.length>20000)return null;const part=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));return part?part.slice(cookieName.length+1):null;}
export function sessionGuard(auth){return async(req,res,next)=>{try{const token=sessionToken(req);if(!token)throw Error();const claims=await auth.verifySessionCookie(token,true);if(typeof claims.uid!=='string'||!claims.uid||claims.uid.length>128)throw Error();req.kairoIdentity={uid:claims.uid,email:typeof claims.email==='string'?claims.email:''};next();}catch{res.status(401).json({error:'Sign in again to open your account material.'});}};}
export function sameOrigin(origin){return(req,res,next)=>{if(req.headers.origin&&req.headers.origin!==origin)return res.status(403).json({error:'Open this action from KAIRO.'});if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==origin)return res.status(403).json({error:'Open this action from KAIRO.'});next();};}
export function createAccountRouter({auth,apiKey,origin,hostedUrl,secure=true,fetchFn=fetch,clock=()=>Date.now()}={}){
 const r=Router();const configured=!!(auth&&apiKey&&origin);const attempts=new Map();
 r.use((_req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});next();});
 r.use(sameOrigin(origin),json({limit:'8kb',strict:true}));
 const cookie=(res,value,clear=false)=>res.setHeader('Set-Cookie',`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:432000}${secure?'; Secure':''}`);
 const identity=async req=>{const token=sessionToken(req);return token&&configured?await auth.verifySessionCookie(token,true):null;};
 r.get('/status',async(req,res)=>{let claims=null;try{claims=await identity(req);}catch{cookie(res,'',true);}res.json({enabled:configured,...(typeof hostedUrl==='string'&&/^https:\/\/[a-zA-Z0-9.-]+$/.test(hostedUrl)?{hostedUrl}:{}),status:claims?'signed-in':'signed-out',email:claims?.email||'',...(claims?{storageKey:createHash('sha256').update(claims.uid).digest('hex')}:{ }),scopeLabel:configured?'Account material, lessons and cloud progress. Existing device work stays separate.':'Local preview. Open the hosted KAIRO app for private account material.'});});
 const rate=(req,res,next)=>{
  const now=clock(),windowMs=600000,email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';
  // Independent budgets prevent address rotation from resetting the total abuse allowance.
  // Socket identity deliberately ignores untrusted forwarding headers. Managed proxies may share it.
  for(const [key,value] of attempts)if(now-value.at>=windowMs)attempts.delete(key);
  const digest=value=>createHash('sha256').update(value).digest('hex');
  const budgets=[['process',240],['client:'+digest(req.socket.remoteAddress||'unknown'),60],['account:'+digest(email),12]];
  let blocked=attempts.size>=2000,retry=1;
  for(const [key,max] of budgets){const value=attempts.get(key)||{at:now,count:0};value.count++;if(attempts.has(key)||attempts.size<2000)attempts.set(key,value);if(value.count>max){blocked=true;retry=Math.max(retry,Math.ceil((value.at+windowMs-now)/1000));}}
  if(blocked){res.set('Retry-After',String(retry));return res.status(429).json({error:'Please wait before trying again.'});}
  next();
 };
 r.post('/authenticate',rate,async(req,res)=>{
  if(!configured)return res.status(503).json({error:'Account sign-in is not configured on this local preview.'});
  const {mode,password}=req.body||{},email=typeof req.body?.email==='string'?req.body.email.trim():'';
  if(!['signin','signup'].includes(mode)||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||typeof password!=='string'||password.length>128||!password.length||(mode==='signup'&&password.length<12))return res.status(400).json({error:'Check your email and password. New accounts need at least 12 password characters.'});
  try{
   const response=await fetchFn(`https://identitytoolkit.googleapis.com/v1/accounts:${mode==='signup'?'signUp':'signInWithPassword'}?key=${encodeURIComponent(apiKey)}`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
   if(!response.ok)throw Error();const data=await response.json();if(typeof data.idToken!=='string')throw Error();
   const claims=await auth.verifyIdToken(data.idToken,true);if(!Number.isFinite(claims.auth_time)||Math.abs(clock()/1000-claims.auth_time)>300)throw Error();
   cookie(res,await auth.createSessionCookie(data.idToken,{expiresIn:432000000}));res.json({signedIn:true,email:claims.email||email});
  }catch{res.status(401).json({error:'Sign-in could not finish. Check your details, or use password reset.'});}
 });
 r.post('/reset',rate,async(req,res)=>{if(!configured)return res.status(503).json({error:'Account recovery is not configured here.'});const email=typeof req.body?.email==='string'?req.body.email.trim():'';if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return res.status(400).json({error:'Enter your email address.'});try{await fetchFn(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({requestType:'PASSWORD_RESET',email})});}catch{}res.json({notice:'If this account can receive a reset email, instructions will arrive shortly.'});});
 r.post('/signout',async(req,res)=>{try{const claims=await identity(req);if(claims)await auth.revokeRefreshTokens(claims.uid);cookie(res,'',true);res.json({signedOut:true});}catch{cookie(res,'',true);res.status(503).json({error:'This browser signed out. Signing out other sessions could not be confirmed.'});}});
 return r;
}
