'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {assertAccessMutationRequest,assertTargetClaimTransition} =
  require('../services/founder_access_mutation_guard');

const founder={uid:'founder',token:{founder:true,admin:true}};
const admin={uid:'admin',token:{admin:true}};

test('Admins and Students cannot elevate other accounts or revoke privileges',()=>{
  for(const auth of [admin,{uid:'student',token:{}},null]){
    for(const action of ['grant','revoke']){
      assert.throws(()=>assertAccessMutationRequest({
        auth,targetUid:'target',role:'admin',action,
      }),/ACCESS_FOUNDER_ONLY_MUTATION/);
    }
  }
});

test('Founder mutation requests require explicit role, action and safe target identity',()=>{
  for(const changed of [
    {role:'owner'},{role:'student'},{action:'delete'},{action:undefined},
    {targetUid:''},{targetUid:'../../other'},{targetUid:null},
  ]){
    assert.throws(()=>assertAccessMutationRequest({
      auth:founder,targetUid:'target',role:'admin',action:'grant',...changed,
    }),/ACCESS_ROLE_OR_ACTION_INVALID|ACCESS_TARGET_UID_INVALID/);
  }
  assert.equal(assertAccessMutationRequest({
    auth:founder,targetUid:'target',role:'admin',action:'grant',
  }),true);
});

test('a Founder cannot revoke their own Founder role through this callable',()=>{
  assert.throws(()=>assertAccessMutationRequest({
    auth:founder,targetUid:'founder',role:'founder',action:'revoke',
  }),/FOUNDER_SELF_REVOCATION_FORBIDDEN/);
});

test('role transitions cannot unintentionally downgrade Founders',()=>{
  for(const action of ['grant','revoke']){
    assert.throws(()=>assertTargetClaimTransition({
      role:'admin',action,targetClaims:{founder:true,admin:true},
    }),/FOUNDER_CLAIM_DOWNGRADE_FORBIDDEN/);
  }
  assert.throws(()=>assertTargetClaimTransition({
    role:'founder',action:'revoke',targetClaims:{admin:true},
  }),/TARGET_FOUNDER_CLAIM_MISSING/);
  assert.throws(()=>assertTargetClaimTransition({
    role:'admin',action:'revoke',targetClaims:{},
  }),/TARGET_ADMIN_CLAIM_MISSING/);
  assert.equal(assertTargetClaimTransition({
    role:'admin',action:'grant',targetClaims:{},
  }),true);
});
