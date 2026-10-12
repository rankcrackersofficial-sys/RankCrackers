'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveStorageAssetPath, authorizeSecureAssetPath,
} = require('../services/secure_asset_scope');

const bucket='rankcrackers-55.firebasestorage.app';
const personal='users/alice/progress/report.pdf';
const realmAsset='assets/m_visible/digibook/chapter.pdf';
const visible={archived:false,cardVisible:true,visibilityGate:{studentVisible:true}};
const hidden={archived:false,cardVisible:false,userPanelVisible:false,visibilityGate:{studentVisible:false}};

test('only exact bucket and HTTPS Firebase Storage URLs can supply signed asset paths', () => {
  assert.equal(resolveStorageAssetPath(personal,bucket),personal);
  assert.equal(resolveStorageAssetPath('gs://'+bucket+'/'+personal,bucket),personal);
  assert.equal(resolveStorageAssetPath('https://firebasestorage.googleapis.com/v0/b/'+bucket+'/o/users%2Falice%2Fprogress%2Freport.pdf?alt=media',bucket),personal);
  for(const invalid of [
    'gs://attacker-bucket/'+personal,
    'http://firebasestorage.googleapis.com/v0/b/'+bucket+'/o/a',
    'https://firebasestorage.googleapis.com.attacker.test/v0/b/'+bucket+'/o/a',
    'https://firebasestorage.googleapis.com/v0/b/other-bucket/o/a',
    'https://attacker.test/hidden.pdf',
    'users/alice/../../mission_realms/private/source.pdf',
    '/mission_realms/m_hidden/official_documents/source.pdf',
    'assets//file.pdf',
    'assets/m_hidden/..',
  ]) assert.throws(() => resolveStorageAssetPath(invalid,bucket),/SECURE_ASSET_/);
});

test('student signed URLs are limited to self-owned files or visible mission assets',()=>{
  assert.equal(authorizeSecureAssetPath({filePath:personal,uid:'alice',claims:{}}),true);
  assert.equal(authorizeSecureAssetPath({
    filePath:'certificates/alice/completion.pdf',uid:'alice',claims:{},
  }),true);
  assert.equal(authorizeSecureAssetPath({
    filePath:realmAsset,uid:'alice',claims:{},realmId:'m_visible',realm:visible,
  }),true);
});

test('student cannot sign hidden official source, other user files or nonvisible assets',()=>{
  for (const filePath of [
    'mission_realms/m_hidden/official_documents/source.pdf',
    'ingestion/secret.pdf',
    'users/bob/report.pdf',
    'certificates/bob/certificate.pdf',
    realmAsset,
    'assets/m_hidden/chapter.pdf',
  ]) {
    assert.throws(()=>authorizeSecureAssetPath({
      filePath,uid:'alice',claims:{},realmId:filePath.includes('m_hidden')?'m_hidden':'m_visible',
      realm:hidden,
    }),/SECURE_ASSET_PATH_NOT_AUTHORIZED/,filePath);
  }
});

test('Founder can sign stored evidence; student cannot assert Founder role through assetType',()=>{
  assert.equal(authorizeSecureAssetPath({
    filePath:'mission_realms/m_hidden/official_documents/source.pdf',
    uid:'founder',claims:{founder:true},
  }),true);
  assert.throws(()=>authorizeSecureAssetPath({
    filePath:'mission_realms/m_hidden/official_documents/source.pdf',
    uid:'alice',claims:{},realmId:'m_hidden',realm:hidden,
  }),/NOT_AUTHORIZED/);
});
