'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const { authorizeFounderExecutor }=require('../services/mission_force_pipeline_entrypoint');

function tx(user){return {get:async()=>({exists:!!user,data:()=>user})};}
const db={collection:()=>({doc:()=>({})})};

test('trusted entry requires authenticated founder authority',async()=>{
 await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:null}),/EXECUTOR_AUTHORITY_MISSING/);
 await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:{uid:'u',token:{founder:false}}}),/PERMISSION_DENIED/);
 await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'INACTIVE'}),auth:{uid:'u',token:{founder:true}}}),/ACCOUNT_INACTIVE/);
 const ok=await authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:{uid:'u',token:{founder:true}}});
 assert.equal(ok.operation,'INGEST_OFFICIAL_SOURCE');
});

test('payload authority claims are irrelevant to trusted authorization',async()=>{
 const ok=await authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:{uid:'founder',token:{founder:true}},request:{internal:true,actorType:'AUTHORIZED_AGENT',permission:'mission.source.ingest'}});
 assert.equal(ok.uid,'founder');
});

test('founder authorization rejects inactive accounts before trusted execution',async()=>{await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'INACTIVE'}),auth:{uid:'u',token:{founder:true}}}),/ACCOUNT_INACTIVE/);});
