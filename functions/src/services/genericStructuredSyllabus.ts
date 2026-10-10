import * as crypto from 'crypto';

export type VerifiedPage = { pageNumber:number; text:string; verified:boolean; sourceSha256:string; missionId:string; documentId:string; documentType:string };
export type ScopeNode = { title:string; type:'paper'|'subject'|'unit'|'group'|'topic'; children?:ScopeNode[]; sourcePages:number[]; sourceTextAnchor:string };
export type B3Input = { missionId:string; documentId:string; sourceSha256:string; pages:VerifiedPage[]; scopeAuthorized:boolean; scope:ScopeNode[]; runId:string; workerRevision:string };

const idFor = (missionId:string, documentId:string, path:string) =>
  `b3_${crypto.createHash('sha256').update(`${missionId}\0${documentId}\0${path}`).digest('hex').slice(0,24)}`;

export function materializeGenericStructure(input:B3Input) {
  if (!input.scopeAuthorized) throw new Error('B3_SCOPE_AUTHORITY_REQUIRED');
  if (!/^[a-f0-9]{64}$/.test(input.sourceSha256)) throw new Error('B3_SOURCE_SHA_INVALID');
  if (!input.pages.length) throw new Error('B3_EMPTY_VERIFIED_CORPUS');
  for (const page of input.pages) {
    if (!page.verified) throw new Error('B3_UNVERIFIED_PAGE');
    if (page.sourceSha256 !== input.sourceSha256) throw new Error('B3_WRONG_SOURCE');
    if (page.missionId !== input.missionId) throw new Error('B3_WRONG_MISSION');
    if (page.documentId !== input.documentId) throw new Error('B3_WRONG_DOCUMENT');
    if (page.documentType !== 'official_syllabus') throw new Error('B3_NON_SYLLABUS_SOURCE');
  }
  const pageSet = new Set(input.pages.map(p=>p.pageNumber));
  const nodes:any[]=[];
  const walk=(items:ScopeNode[], parentId:string|null, ancestors:string[], path:string)=>{
    items.forEach((item,index)=>{
      if (!item.title.trim() || !item.sourcePages.length || !item.sourceTextAnchor.trim()) throw new Error('B3_SOURCELESS_NODE');
      if (item.sourcePages.some(p=>!pageSet.has(p))) throw new Error('B3_SOURCE_PAGE_NOT_VERIFIED');
      const order=nodes.length;
      const currentPath=`${path}/${index}:${item.type}:${item.title.trim()}`;
      const nodeId=idFor(input.missionId,input.documentId,currentPath);
      nodes.push({nodeId,missionId:input.missionId,documentId:input.documentId,sourceSha256:input.sourceSha256,paperId:item.type==='paper'?nodeId:(nodes.find(n=>ancestors.includes(n.nodeId)&&n.nodeType==='paper')?.nodeId||null),subjectId:item.type==='subject'?nodeId:(nodes.find(n=>ancestors.includes(n.nodeId)&&n.nodeType==='subject')?.nodeId||null),nodeType:item.type,canonicalTitle:item.title.trim(),parentId,ancestorIds:[...ancestors],sourcePages:[...new Set(item.sourcePages)].sort((a,b)=>a-b),sourceTextAnchor:item.sourceTextAnchor,sourceOrder:order,materializationVersion:'generic-b3-v1',verificationState:'machine_verified_structure',workerRevision:input.workerRevision,runId:input.runId});
      walk(item.children||[],nodeId,[...ancestors,nodeId],currentPath);
    });
  };
  walk(input.scope,null,[],'mission');
  const ids=new Set(nodes.map(n=>n.nodeId));
  if(nodes.some(n=>n.parentId&&!ids.has(n.parentId))) throw new Error('B3_ORPHAN_NODE');
  return nodes;
}
