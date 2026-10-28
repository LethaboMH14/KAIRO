import express from 'express';
import {createIdentityGuard} from '../hosted-auth/guard.mjs';
import {finalErrorHandler} from '../error-handler.mjs';

// This service never mounts the global, loopback-only legacy workspace routes.
// Progress is learner-authored, not independently verified skill evidence.
export function createHostedApi({projectId,verifyToken,repository,allowedOrigin}={}){
  if(!repository||!['get','put','remove'].every(key=>typeof repository[key]==='function'))throw new TypeError('A durable owner repository is required.');
  if(allowedOrigin&&(!/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?$/.test(allowedOrigin)))throw new TypeError('An exact HTTPS origin is required.');
  const app=express();app.disable('x-powered-by');
  app.use((_req,res,next)=>{res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});next();});
  app.get('/api/health',(_req,res)=>res.json({ok:true,scope:'authenticated-progress-foundation',persistenceVerified:app.locals.persistenceVerified===true}));
  app.use('/api/hosted',(req,res,next)=>{
    const origin=req.get('origin');if(origin&&origin!==allowedOrigin)return res.status(403).json({error:'Request origin is not allowed.'});next();
  },createIdentityGuard({projectId,verifyToken}),express.json({limit:'220kb',strict:true}));
  app.get('/api/hosted/me',(req,res)=>res.json({uid:req.kairoIdentity.uid,scope:'private learner-authored progress'}));
  const route=fn=>async(req,res)=>{try{await fn(req,res);}catch(error){const status=error.status===409?409:error instanceof TypeError?400:503;res.status(status).json({error:status===409?'This record changed. Reload before saving.':status===400?'Check the record ID, content and saved version.':'Your cloud record could not be accessed. Try again.'});}};
  app.get('/api/hosted/progress/:id',route(async(req,res)=>{
    const record=await repository.get(req.kairoIdentity.uid,'progress',req.params.id);
    if(!record)return res.status(404).json({error:'Record not found.'});res.json(record);
  }));
  app.put('/api/hosted/progress/:id',route(async(req,res)=>{
    const {value,version,create}=req.body||{};
    if(create!==true&&typeof version!=='string')throw new TypeError();
    res.json(await repository.put(req.kairoIdentity.uid,'progress',req.params.id,value,{version,create:create===true}));
  }));
  app.delete('/api/hosted/progress/:id',route(async(req,res)=>{
    res.json(await repository.remove(req.kairoIdentity.uid,'progress',req.params.id,{version:req.body?.version}));
  }));
  app.use((_req,res)=>res.status(404).json({error:'Route not found.'}));
  app.use(finalErrorHandler);
  return app;
}
