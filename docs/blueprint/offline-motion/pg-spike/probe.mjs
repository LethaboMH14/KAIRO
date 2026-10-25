import {PGlite} from '@electric-sql/pglite';
import {vector} from '@electric-sql/pglite-pgvector';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const data=fileURLToPath(new URL('./.probe-data',import.meta.url));
const open=()=>new PGlite(data,{extensions:{vector}});
let db;const start=performance.now();
try{
 db=open();await db.waitReady;
 await db.exec(`CREATE EXTENSION IF NOT EXISTS vector;
 CREATE TABLE IF NOT EXISTS probe_chunks (
 id text PRIMARY KEY, owner_id text NOT NULL, source_revision text NOT NULL,
 reviewed boolean NOT NULL, deleted boolean NOT NULL DEFAULT false,
 embedding_model text NOT NULL, embedding vector(3) NOT NULL
 ); DELETE FROM probe_chunks;`);
 for(const row of [['mine','learner-fixture',true,'fixture-3d','[1,0,0]'],['other-owner','different-learner',true,'fixture-3d','[1,0,0]'],['not-reviewed','learner-fixture',false,'fixture-3d','[1,0.01,0]']])await db.query('INSERT INTO probe_chunks(id,owner_id,source_revision,reviewed,embedding_model,embedding) VALUES ($1,$2,$3,$4,$5,$6::vector)',[row[0],row[1],'source-v1',row[2],row[3],row[4]]);
 const retrieve=()=>db.query(`SELECT id, embedding <=> $1::vector AS distance FROM probe_chunks WHERE owner_id=$2 AND reviewed=true AND deleted=false AND source_revision=$3 AND embedding_model=$4 ORDER BY embedding <=> $1::vector LIMIT 5`,['[1,0,0]','learner-fixture','source-v1','fixture-3d']);
 const hits=await retrieve();assert.deepEqual(hits.rows.map(r=>r.id),['mine']);assert.equal(hits.rows[0].distance,0);
 const mismatch=await db.query('SELECT id FROM probe_chunks WHERE embedding_model=$1',['different-model']);assert.equal(mismatch.rows.length,0);
 await db.close();db=open();await db.waitReady;
 assert.equal((await db.query('SELECT count(*)::int AS n FROM probe_chunks')).rows[0].n,3);
 assert.deepEqual((await retrieve()).rows.map(r=>r.id),['mine']);
 await db.query('UPDATE probe_chunks SET deleted=true WHERE id=$1',['mine']);assert.equal((await retrieve()).rows.length,0);
 const version=(await db.query('SELECT version() AS version')).rows[0].version;
 await db.close();db=null;
 const result={date:'2026-10-23',passed:true,packages:{'@electric-sql/pglite':'0.5.11','@electric-sql/pglite-pgvector':'0.0.12'},runtime:process.version,postgresReported:version,localProbeElapsedMs:Math.round(performance.now()-start),checks:['vector extension loads','cosine search returns expected fixture','owner/review/revision/model filters applied','filesystem persistence after close/reopen','deleted fixture excluded'],vectors:'synthetic 3D fixtures; not ML embeddings',networkAtRuntime:'none requested by probe; not an instrumented browser network audit',browserIndexedDbAcceptance:'not run',embeddingModelInstalled:false,offlineGenerativeTutor:false,productionIntegration:false};
 await writeFile(new URL('../pg-verification.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}catch(error){if(db)await db.close().catch(()=>{});console.error(error);process.exitCode=1;}
