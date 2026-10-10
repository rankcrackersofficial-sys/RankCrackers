'use strict';
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('node:fs');
const path = require('node:path');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-rankcrackers-55',firestore:{host:'127.0.0.1',port:8188,rules:fs.readFileSync(path.resolve(__dirname,'../../firestore.rules'),'utf8')}});
 const mission=`rules-canonical-${Date.now()}`; const slot=`mission_realms/${mission}/source_slots/slot_a`; const version=`${slot}/source_versions/v1`; const projection=`mission_realms/${mission}/current_syllabus_projection/topic_a`;
 await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await db.doc(slot).set({canonicalVersionId:'v1'});await db.doc(version).set({activationState:'CANONICAL'});});
 const founder=env.authenticatedContext('founder',{founder:true}).firestore(); const student=env.authenticatedContext('student',{student:true}).firestore(); const anon=env.unauthenticatedContext().firestore();
 await assertSucceeds(founder.doc(slot).get());
 await assertSucceeds(founder.doc(version).get());
 await assertFails(founder.doc(slot).set({canonicalVersionId:'hijack'},{merge:true}));
 await assertFails(founder.doc(version).set({activationState:'CANONICAL'},{merge:true}));
 await assertFails(founder.doc(projection).set({current:true}));
 await assertFails(student.doc(slot).get());
 await assertFails(anon.doc(version).get());
 console.log('CANONICAL_SOURCE_RULES=7/7 PASS; DIRECT_POINTER_WRITE=DENIED; STUDENT_READ=DENIED; ANON_READ=DENIED');
 await env.cleanup();
})().catch(e=>{console.error(e);process.exit(1)});
