import {GoogleAuth} from 'google-auth-library';
import {createHostedApi} from './app.mjs';
import {createOwnerRepository} from './firestore.mjs';
import {createFirebaseVerifier} from './firebase-verifier.mjs';
const projectId=process.env.KAIRO_GOOGLE_PROJECT;
const auth=new GoogleAuth({scopes:['https://www.googleapis.com/auth/datastore']});
async function getToken(){const client=await auth.getClient();const {token}=await client.getAccessToken();if(!token)throw new Error('Runtime identity unavailable.');return token;}
const repository=createOwnerRepository({projectId,getToken});
const verifyToken=createFirebaseVerifier({projectId});
const app=createHostedApi({projectId,verifyToken,repository,allowedOrigin:process.env.KAIRO_ALLOWED_ORIGIN});
// One bounded startup read proves the attached runtime identity can reach durable storage.
// No learner record or document content is accessed by this readiness check.
await repository.get('kairo-foundation-health','progress','readiness');
app.locals.persistenceVerified=true;
const server=app.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('KAIRO authenticated progress foundation ready.'));
function shutdown(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
