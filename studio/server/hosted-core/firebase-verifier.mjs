import {OAuth2Client} from 'google-auth-library';

const certUrl='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
// Allow a small issuer/server clock difference; expiry remains strict.
const clockSkewSeconds=30;
// Public signing certificates only. No user token, private key or credential is cached here.
export function createFirebaseVerifier({projectId,fetchFn=fetch,clock=()=>Date.now(),onFailure=()=>{}}={}){
  if(!/^[a-z][a-z0-9-]{4,62}$/.test(projectId||''))throw new TypeError('Invalid identity project.');
  const client=new OAuth2Client();let cached=null,expires=0,pending;
  async function certificates(){
    if(cached&&clock()<expires)return cached;
    if(pending)return pending;
    pending=(async()=>{
      const response=await fetchFn(certUrl,{signal:AbortSignal.timeout(10000),redirect:'error'});
      if(!response.ok)throw new Error('Identity verification is unavailable.');
      const raw=await response.text();if(Buffer.byteLength(raw)>100000)throw new Error('Identity verification is unavailable.');
      const certs=JSON.parse(raw);
      if(!certs||Array.isArray(certs)||Object.keys(certs).length<1||Object.keys(certs).length>20||Object.entries(certs).some(([key,value])=>!key||typeof value!=='string'||!value.includes('-----BEGIN CERTIFICATE-----')))throw new Error('Identity verification is unavailable.');
      const maxAge=Number(/(?:^|,)\s*max-age=(\d+)/i.exec(response.headers.get('cache-control')||'')?.[1]||0);
      cached=certs;expires=clock()+Math.min(maxAge,21600)*1000;return certs;
    })();try{return await pending;}finally{pending=null;}
  }
  return async token=>{
    let stage='format';
    try{
      if(typeof token!=='string'||token.length>16384)throw new Error();
      const parts=token.split('.');if(parts.length!==3||parts.some(x=>!/^[a-zA-Z0-9_-]+$/.test(x)))throw new Error();
      const header=JSON.parse(Buffer.from(parts[0],'base64url').toString());
      if(header.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>256)throw new Error();
      stage='certificates';const certs=await certificates();if(!Object.hasOwn(certs,header.kid))throw new Error();
      stage='signature-and-standard-claims';
      const ticket=await client.verifySignedJwtWithCertsAsync(token,certs,projectId,[`https://securetoken.google.com/${projectId}`],7200);
      const p=ticket.getPayload(),now=Math.floor(clock()/1000);
      stage='additional-claims';
      if(!p||p.aud!==projectId||p.iss!==`https://securetoken.google.com/${projectId}`||typeof p.sub!=='string'||!p.sub.length||p.sub.length>128||/[\x00-\x1f\x7f]/.test(p.sub)||!Number.isSafeInteger(p.exp)||p.exp<=now||!Number.isSafeInteger(p.iat)||p.iat<0||p.iat>now+clockSkewSeconds||p.iat>=p.exp||!Number.isSafeInteger(p.auth_time)||p.auth_time>now+clockSkewSeconds||p.auth_time<0||p.auth_time>p.iat+clockSkewSeconds){
        stage='additional-claims-rejected';throw new Error();
      }
      return {...p,uid:p.sub};
    }catch{try{onFailure({stage});}catch{}throw new Error('Identity could not be verified.');}
  };
}
