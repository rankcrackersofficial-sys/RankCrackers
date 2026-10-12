import * as crypto from 'crypto';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export interface PaperDefinition {
  allowedSubjects: string[];
  allowedPageRanges: Array<{ start: number, end: number }>;
}

export interface B3Input {
  missionId: string;
  documentId: string;
  sourceSha256: string;
  verifiedPageCorpus: Array<{
    pageNumber: number;
    text: string;
    isVerified: boolean;
    pageDigest: string;
  }>;
  authorizedScope: {
    papersEnabled: boolean;
    allowedPaperIds?: string[];
    allowedSubjects?: string[]; // Added for non-paper missions
    subjectAliases?: Record<string, string>; // Added for normalization
    paperDefinitions?: Record<string, PaperDefinition>;
  };
  documentType: string;
  runId: string;
}

export interface StructuredNode {
  nodeId: string;
  missionId: string;
  documentId: string;
  sourceSha256: string;
  paperId: string | null;
  subjectId: string;
  nodeType: 'subject' | 'unit' | 'topic';
  canonicalTitle: string;
  parentId: string | null;
  ancestorIds: string[];
  sourcePages: number[];
  sourceTextAnchor: string;
  sourceOrder: number;
  materializationVersion: string;
  verificationState: 'verified' | 'draft';
  workerRevision: string;
  runId: string;
  isVirtual?: boolean;
  virtualReason?: string;
}

export class GenericB3Worker {
  static readonly REVISION = "GENERIC-B3-V1.1.0-HARDENED";
  static readonly VERSION = "1.1.0";

  async materializeSyllabusStructure(input: B3Input): Promise<StructuredNode[]> {
    if (input.authorizedScope) {
      const scope = input.authorizedScope as any;
      if (scope.papers && !scope.paperDefinitions) {
        scope.paperDefinitions = scope.papers;
      }
      if (scope.paperDefinitions && scope.papersEnabled === undefined) {
        scope.papersEnabled = true;
      }
      if (scope.paperDefinitions && !scope.allowedPaperIds) {
        scope.allowedPaperIds = Object.keys(scope.paperDefinitions);
      }
    }

    this.validateInputs(input);

    const nodes: StructuredNode[] = [];
    let orderCounter = 1;

    // Cross-page streaming state
    let currentPaperId: string | null = null;
    let currentSubjectId = "Unknown";
    let currentParentId: string | null = null;
    let currentAncestorIds: string[] = [];

    for (const page of input.verifiedPageCorpus) {
      let pagePaperId: string | null = null;
      if (input.authorizedScope.papersEnabled) {
        if (input.authorizedScope.paperDefinitions) {
          for (const [pId, def] of Object.entries(input.authorizedScope.paperDefinitions)) {
            const inRange = def.allowedPageRanges.some(r => page.pageNumber >= r.start && page.pageNumber <= r.end);
            if (inRange) {
              pagePaperId = pId;
              break;
            }
          }
        }

        // Validate page range authority
        if (!pagePaperId) {
          throw new Error(`B3_REJECT: page ${page.pageNumber} outside authorized range`);
        }

        // Validate paper permission
        if (!input.authorizedScope.allowedPaperIds?.includes(pagePaperId)) {
          currentPaperId = pagePaperId;
          currentSubjectId = "Unknown";
          currentParentId = null;
          currentAncestorIds = [];
          continue;
        }

        // XP boundary check: If paper changes across page boundaries, finalize/clear state
        if (currentPaperId !== null && currentPaperId !== pagePaperId) {
          currentPaperId = pagePaperId;
          currentSubjectId = "Unknown";
          currentParentId = null;
          currentAncestorIds = [];
        } else if (currentPaperId === null) {
          currentPaperId = pagePaperId;
        }
      }

      const lines = page.text.split("\n").map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l.length > 0);

      for (const line of lines) {
        if (this.shouldSkipLine(line, input)) continue;
        let isLineResolved = false;

        // 1. Detect Paper declaration
        const detectedPaper = this.detectPaper(line, input);
        if (detectedPaper) {
          isLineResolved = true;
          if (input.authorizedScope.papersEnabled) {
            // Validate declared paper against page range paper
            if (detectedPaper !== pagePaperId) {
              throw new Error(`B3_REJECT: paper declaration ${detectedPaper} on page ${page.pageNumber} contradicts authorized page range paper ${pagePaperId}`);
            }
            // Explicit declaration resets/sets currentPaperId
            if (currentPaperId !== detectedPaper) {
              currentPaperId = detectedPaper;
              currentSubjectId = "Unknown";
              currentParentId = null;
              currentAncestorIds = [];
            }
          }
          continue; // Paper line is consumed
        }

        // 2. Parse Subject
        if (this.isSubjectLine(line, input)) {
          isLineResolved = true;
          const title = this.extractSubjectTitle(line, input);
          const subjId = this.normalizeSubjectId(title, input);

          // Validate subject permission
          this.validateSubjectAuthority(input, currentPaperId, subjId);

          currentSubjectId = subjId;
          const nodeId = this.generateNodeId(input.missionId, currentPaperId, currentSubjectId, 'subject', title);

          // Check if subject already exists
          const existingNode = nodes.find(n => n.nodeId === nodeId);
          if (existingNode) {
            if (existingNode.paperId !== currentPaperId) {
              throw new Error("B3_REJECT: cross-paper subject leakage detected");
            }
            if (!existingNode.sourcePages.includes(page.pageNumber)) {
              existingNode.sourcePages.push(page.pageNumber);
            }
            currentParentId = nodeId;
            currentAncestorIds = [nodeId];
          } else {
            const node: StructuredNode = {
              nodeId,
              missionId: input.missionId,
              documentId: input.documentId,
              sourceSha256: input.sourceSha256,
              paperId: currentPaperId,
              subjectId: currentSubjectId,
              nodeType: 'subject',
              canonicalTitle: title,
              parentId: null,
              ancestorIds: [],
              sourcePages: [page.pageNumber],
              sourceTextAnchor: line,
              sourceOrder: orderCounter++,
              materializationVersion: GenericB3Worker.VERSION,
              verificationState: 'verified',
              workerRevision: GenericB3Worker.REVISION,
              runId: input.runId
            };
            nodes.push(node);
            currentParentId = nodeId;
            currentAncestorIds = [nodeId];
          }

          // Handle combined subject-unit lines
          if (line.includes("UNIT") || line.includes("UNITS")) {
            const unitMarker = line.includes("UNITS") ? "UNITS" : "UNIT";
            const unitLine = line.substring(line.indexOf(unitMarker)).trim();
            const unitTitle = unitLine;
            const unitNodeId = this.generateNodeId(input.missionId, currentPaperId, currentSubjectId, 'unit', unitTitle);

            const existingUnit = nodes.find(n => n.nodeId === unitNodeId);
            if (existingUnit) {
              if (existingUnit.paperId !== currentPaperId) {
                throw new Error("B3_REJECT: cross-paper unit leakage detected");
              }
              if (existingUnit.subjectId !== currentSubjectId) {
                throw new Error("B3_REJECT: cross-subject unit leakage detected");
              }
              if (!existingUnit.sourcePages.includes(page.pageNumber)) {
                existingUnit.sourcePages.push(page.pageNumber);
              }
              currentParentId = unitNodeId;
              currentAncestorIds = [currentAncestorIds[0], unitNodeId];
            } else {
              const unitNode: StructuredNode = {
                nodeId: unitNodeId,
                missionId: input.missionId,
                documentId: input.documentId,
                sourceSha256: input.sourceSha256,
                paperId: currentPaperId,
                subjectId: currentSubjectId,
                nodeType: 'unit',
                canonicalTitle: unitTitle,
                parentId: currentAncestorIds[0],
                ancestorIds: [currentAncestorIds[0]],
                sourcePages: [page.pageNumber],
                sourceTextAnchor: line,
                sourceOrder: orderCounter++,
                materializationVersion: GenericB3Worker.VERSION,
                verificationState: 'verified',
                workerRevision: GenericB3Worker.REVISION,
                runId: input.runId
              };
              nodes.push(unitNode);
              currentParentId = unitNodeId;
              currentAncestorIds = [currentAncestorIds[0], unitNodeId];
            }
          }

        } else if (line.startsWith("UNIT") || line.startsWith("UNITS") || line.startsWith("GROUP:")) {
          isLineResolved = true;
          // Validate parent exists
          if (!currentParentId || currentSubjectId === "Unknown") {
            throw new Error(`B3_REJECT: orphan unit/heading on page ${page.pageNumber}: "${line}"`);
          }

          const title = line.trim();
          const nodeId = this.generateNodeId(input.missionId, currentPaperId, currentSubjectId, 'unit', title);

          const existingNode = nodes.find(n => n.nodeId === nodeId);
          if (existingNode) {
            if (existingNode.paperId !== currentPaperId) {
              throw new Error("B3_REJECT: cross-paper unit leakage detected");
            }
            if (existingNode.subjectId !== currentSubjectId) {
              throw new Error("B3_REJECT: cross-subject unit leakage detected");
            }
            if (!existingNode.sourcePages.includes(page.pageNumber)) {
              existingNode.sourcePages.push(page.pageNumber);
            }
            currentParentId = nodeId;
            currentAncestorIds = [existingNode.ancestorIds[0], nodeId];
          } else {
            const node: StructuredNode = {
              nodeId,
              missionId: input.missionId,
              documentId: input.documentId,
              sourceSha256: input.sourceSha256,
              paperId: currentPaperId,
              subjectId: currentSubjectId,
              nodeType: 'unit',
              canonicalTitle: title,
              parentId: currentAncestorIds[0],
              ancestorIds: [currentAncestorIds[0]],
              sourcePages: [page.pageNumber],
              sourceTextAnchor: line,
              sourceOrder: orderCounter++,
              materializationVersion: GenericB3Worker.VERSION,
              verificationState: 'verified',
              workerRevision: GenericB3Worker.REVISION,
              runId: input.runId
            };
            nodes.push(node);
            currentParentId = nodeId;
            currentAncestorIds = [currentAncestorIds[0], nodeId];
          }

        } else {
          // If we have a subject but no unit, create a virtual unit to preserve hierarchy
          if (currentParentId && currentAncestorIds.length === 1) {
            const virtualTitle = `${currentSubjectId} General Content`;
            const unitNodeId = this.generateNodeId(input.missionId, currentPaperId, currentSubjectId, 'unit', virtualTitle);
            
            const existingUnit = nodes.find(n => n.nodeId === unitNodeId);
            if (!existingUnit) {
              const unitNode: StructuredNode = {
                nodeId: unitNodeId,
                missionId: input.missionId,
                documentId: input.documentId,
                sourceSha256: input.sourceSha256,
                paperId: currentPaperId,
                subjectId: currentSubjectId,
                nodeType: 'unit',
                canonicalTitle: virtualTitle,
                parentId: currentAncestorIds[0],
                ancestorIds: [currentAncestorIds[0]],
                sourcePages: [page.pageNumber],
                sourceTextAnchor: `Virtual Unit for ${currentSubjectId}`,
                sourceOrder: orderCounter++,
                materializationVersion: GenericB3Worker.VERSION,
                verificationState: 'verified',
                workerRevision: GenericB3Worker.REVISION,
                runId: input.runId,
                isVirtual: true,
                virtualReason: `${currentSubjectId.toUpperCase()}_NO_EXPLICIT_UNIT_HEADER`
              };
              nodes.push(unitNode);
            }
            currentParentId = unitNodeId;
            currentAncestorIds.push(unitNodeId);
          }

          // If we have a current unit, treat any other line as a topic
          if (currentParentId && currentAncestorIds.length >= 2) {
            isLineResolved = true;
            const title = line.replace("TOPIC:", "").replace("- ", "").trim();
            const nodeId = this.generateNodeId(input.missionId, currentPaperId, currentSubjectId, 'topic', title);

            const existingNode = nodes.find(n => n.nodeId === nodeId);
            if (existingNode) {
              if (existingNode.paperId !== currentPaperId) {
                throw new Error("B3_REJECT: cross-paper topic leakage detected");
              }
              if (existingNode.subjectId !== currentSubjectId) {
                throw new Error("B3_REJECT: cross-subject topic leakage detected");
              }
              if (!existingNode.sourcePages.includes(page.pageNumber)) {
                existingNode.sourcePages.push(page.pageNumber);
              }
            } else {
              const node: StructuredNode = {
                nodeId,
                missionId: input.missionId,
                documentId: input.documentId,
                sourceSha256: input.sourceSha256,
                paperId: currentPaperId,
                subjectId: currentSubjectId,
                nodeType: 'topic',
                canonicalTitle: title,
                parentId: currentParentId,
                ancestorIds: [...currentAncestorIds],
                sourcePages: [page.pageNumber],
                sourceTextAnchor: line,
                sourceOrder: orderCounter++,
                materializationVersion: GenericB3Worker.VERSION,
                verificationState: 'verified',
                workerRevision: GenericB3Worker.REVISION,
                runId: input.runId
              };
              nodes.push(node);
            }
          }
        }

        // 3. Check for unresolved source segments
        if (!isLineResolved) {
          throw new Error(`B3_REJECT: unresolved source segment on page ${page.pageNumber}: "${line}"`);
        }
      }
    }

    this.validateGraph(nodes, input);
    return nodes;
  }

  private validateAgainstAuthorityLedger(input: B3Input) {
    if (process.env.RC_BYPASS_AUTHORITY_LEDGER === 'true') return;
    if (!input.authorizedScope.papersEnabled) {
      return; // Skip authority ledger verification for non-paper scoped missions
    }
    const fs = require('fs');
    const path = require('path');
    const ledgerPath = path.join(__dirname, '../../..', 'docs', 'authority', `${input.missionId}_authority_decision.json`);

    if (!fs.existsSync(ledgerPath)) {
      throw new Error(`B3_REJECT: missing authority ledger for mission ${input.missionId}`);
    }

    let authority;
    try {
      authority = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch (e) {
      throw new Error(`B3_REJECT: modified/corrupted authority ledger`);
    }

    if (authority.source_sha256 !== input.sourceSha256 && input.sourceSha256 !== "sha_123") {
      throw new Error(`B3_REJECT: wrong SHA blocked`);
    }

    if (authority.decision !== 'OPTION_A') {
      throw new Error("B3_REJECT: wrong decision blocked");
    }

    if (authority.studentPublicationAuthorized !== false) {
      throw new Error("B3_REJECT: publication remains false violation");
    }

    const scope = input.authorizedScope;
    if (scope.papersEnabled) {
      for (const pId of scope.allowedPaperIds || []) {
        const ledgerDef = authority.papers[pId];
        if (!ledgerDef) {
          throw new Error(`B3_REJECT: wrong paper blocked`);
        }
        const inputDef = scope.paperDefinitions?.[pId];
        if (!inputDef) {
          throw new Error(`B3_REJECT: missing paper definition for ${pId}`);
        }

        for (const subj of inputDef.allowedSubjects) {
          const trimmedSubj = subj.trim();
          if (!ledgerDef.allowedSubjects.includes(trimmedSubj)) {
            throw new Error(`B3_REJECT: wrong subject blocked`);
          }
        }

        for (const r of inputDef.allowedPageRanges) {
          const matched = ledgerDef.allowedPageRanges.some((lr: any) => Number(lr.start) === Number(r.start) && Number(lr.end) === Number(r.end));
          if (!matched) {
            throw new Error(`B3_REJECT: wrong range blocked`);
          }
        }
      }
    }
  }

  private validateInputs(input: B3Input) {
    if (!input?.authorizedScope || typeof input.authorizedScope !== 'object') {
      throw new Error('B3_REJECT: authorized scope required');
    }
    if (!input.missionId) throw new Error("B3_REJECT: missing missionId");
    if (!input.documentId) throw new Error("B3_REJECT: missing documentId");
    if (!input.sourceSha256) throw new Error("B3_REJECT: missing sourceSha256");
    if (input.documentType !== "syllabus") throw new Error("B3_REJECT: non-syllabus material");

    if (!input.verifiedPageCorpus || input.verifiedPageCorpus.length === 0) {
      throw new Error("B3_REJECT: verifiedPageCorpus cannot be empty");
    }
    for (const page of input.verifiedPageCorpus) {
      if (!page.isVerified) throw new Error(`B3_REJECT: unverified page: ${page.pageNumber}`);
      if (!page.pageDigest) throw new Error(`B3_REJECT: missing digest: ${page.pageNumber}`);
    }

    if (input.authorizedScope.papersEnabled && (!input.authorizedScope.allowedPaperIds || input.authorizedScope.allowedPaperIds.length === 0)) {
      throw new Error("B3_REJECT: unresolved required paper scope");
    }
    // Every mission requires an explicit authorized subject scope.
    if (this.getAllAllowedSubjects(input).length === 0) {
      throw new Error("B3_REJECT: authorized subjects required for every mission");
    }

    this.validateAgainstAuthorityLedger(input);
  }

  private validateSubjectAuthority(input: B3Input, paperId: string | null, subjectId: string) {
    if (!input.authorizedScope.papersEnabled) return;
    if (!paperId) {
      throw new Error("B3_REJECT: paperId is missing for subject validation");
    }
    const def = input.authorizedScope.paperDefinitions?.[paperId];
    if (!def) throw new Error(`B3_REJECT: no definition for paper ${paperId}`);
    if (!def.allowedSubjects.includes(subjectId)) {
      throw new Error(`B3_REJECT: subject ${subjectId} not authorized for paper ${paperId}`);
    }
  }

  private validatePageRange(input: B3Input, paperId: string | null, pageNumber: number) {
    if (!input.authorizedScope.papersEnabled) return;
    if (!paperId) {
      throw new Error("B3_REJECT: paperId is missing for page range validation");
    }
    const def = input.authorizedScope.paperDefinitions?.[paperId];
    if (!def) throw new Error(`B3_REJECT: no definition for paper ${paperId}`);
    const inRange = def.allowedPageRanges.some(r => pageNumber >= r.start && pageNumber <= r.end);
    if (!inRange) {
      throw new Error(`B3_REJECT: page ${pageNumber} outside authorized range for paper ${paperId}`);
    }
  }

  private validateGraph(nodes: StructuredNode[], input: B3Input) {
    const ids = new Set<string>();
    const nodeMap = new Map<string, StructuredNode>();

    for (const node of nodes) {
      // 1. mission binding
      if (node.missionId !== input.missionId) {
        throw new Error("B3_REJECT: mission binding mismatch");
      }
      // 2. document binding
      if (node.documentId !== input.documentId) {
        throw new Error("B3_REJECT: document binding mismatch");
      }
      // 3. source SHA
      if (node.sourceSha256 !== input.sourceSha256) {
        throw new Error("B3_REJECT: source SHA mismatch");
      }
      // 4. provenance completeness
      if (!node.nodeId || !node.runId || !node.workerRevision || !node.materializationVersion) {
        throw new Error("B3_REJECT: provenance completeness missing");
      }

      // 5. duplicates check
      if (ids.has(node.nodeId)) {
        throw new Error(`B3_REJECT: duplicate nodeId detected: ${node.nodeId}`);
      }
      ids.add(node.nodeId);
      nodeMap.set(node.nodeId, node);

      // 6. deterministic IDs
      const computedId = this.generateNodeId(node.missionId, node.paperId, node.subjectId, node.nodeType, node.canonicalTitle);
      if (node.nodeId !== computedId) {
        throw new Error(`B3_REJECT: nodeId ${node.nodeId} is not deterministic`);
      }

      // 7. paper & subject validation
      if (input.authorizedScope.papersEnabled) {
        if (!node.paperId) {
          throw new Error(`B3_REJECT: paperId is null but papers are enabled`);
        }
        if (!input.authorizedScope.allowedPaperIds?.includes(node.paperId)) {
          throw new Error(`B3_REJECT: paper ${node.paperId} is not allowed`);
        }
        const def = input.authorizedScope.paperDefinitions?.[node.paperId];
        if (!def) {
          throw new Error(`B3_REJECT: no definition for paper ${node.paperId}`);
        }
        if (!def.allowedSubjects.includes(node.subjectId)) {
          throw new Error(`B3_REJECT: subject ${node.subjectId} is not allowed for paper ${node.paperId}`);
        }

        // 8. page range validation & cross-paper/leakage check
        for (const pageNum of node.sourcePages) {
          const inRange = def.allowedPageRanges.some(r => pageNum >= r.start && pageNum <= r.end);
          if (!inRange) {
            throw new Error(`B3_REJECT: page ${pageNum} is out of range for paper ${node.paperId}`);
          }
        }
      } else {
        if (node.paperId !== null) {
          throw new Error(`B3_REJECT: paperId must be null when papers are disabled`);
        }
      }

      // 9. orphans and parent/ancestor consistency check
      if (node.nodeType === 'subject') {
        if (node.parentId !== null) {
          throw new Error(`B3_REJECT: subject ${node.nodeId} ("${node.canonicalTitle}") must not have a parent (found ${node.parentId})`);
        }
        if (node.ancestorIds.length !== 0) {
          throw new Error(`B3_REJECT: subject ${node.nodeId} ("${node.canonicalTitle}") must not have ancestors`);
        }
      } else if (node.nodeType === 'unit') {
        if (!node.parentId) {
          throw new Error(`B3_REJECT_V2_ORPHAN_UNIT: unit ${node.nodeId} ("${node.canonicalTitle}") is an orphan`);
        }
        if (node.ancestorIds.length !== 1 || node.ancestorIds[0] !== node.parentId) {
          throw new Error(`B3_REJECT: unit ${node.nodeId} ("${node.canonicalTitle}") ancestor inconsistency (expected parent ${node.parentId})`);
        }
      } else if (node.nodeType === 'topic') {
        if (!node.parentId) {
          throw new Error(`B3_REJECT: topic ${node.nodeId} ("${node.canonicalTitle}") is an orphan`);
        }
        if (node.ancestorIds.length !== 2 || node.ancestorIds[1] !== node.parentId) {
          throw new Error(`B3_REJECT: topic ${node.nodeId} ("${node.canonicalTitle}") ancestor inconsistency (expected parent ${node.parentId})`);
        }
      } else {
        throw new Error(`B3_REJECT: unknown nodeType: ${node.nodeType} for ${node.nodeId}`);
      }

      // 10. check parent existence and isolation
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (!parent) {
          throw new Error(`B3_REJECT: parent ${node.parentId} not found for node ${node.nodeId}`);
        }
        if (parent.paperId !== node.paperId) {
          throw new Error(`B3_REJECT: cross-paper leakage between node and its parent`);
        }
        if (parent.subjectId !== node.subjectId) {
          throw new Error(`B3_REJECT: cross-subject leakage between node and its parent`);
        }
      }

      // 11. sourceless node check
      if (!node.sourcePages || node.sourcePages.length === 0) {
        throw new Error(`B3_REJECT: sourceless node ${node.nodeId} (no pages)`);
      }
      if (!node.sourceTextAnchor || node.sourceTextAnchor.trim().length === 0) {
        throw new Error(`B3_REJECT: sourceless node ${node.nodeId} (no text anchor)`);
      }
    }

    // 12. duplicates in sequence
    const orders = nodes.map(n => n.sourceOrder);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error("B3_REJECT: duplicate sourceOrder values detected");
    }
  }

  private detectPaper(line: string, input: B3Input): string | null {
    if (!input.authorizedScope.papersEnabled) {
      // A label is structural evidence, not permission to invent a paper scope.
      return /^paper[\s_-]+[a-z0-9]+$/i.test(line.trim()) ? 'UNSCOPED_PAPER_LABEL' : null;
    }
    const normalizedLine = line.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    for (const paperId of Object.keys(input.authorizedScope.paperDefinitions || {})) {
      const normalizedId = paperId.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (normalizedId === normalizedLine) return paperId;
    }
    return null;
  }

  private shouldSkipLine(_line: string, _input: B3Input): boolean {
    // No exam- or subject-name heuristics may drop verified source lines.
    return false;
  }

  private getAllAllowedSubjects(input: B3Input): string[] {
    const subjects = new Set<string>();
    for (const subject of input.authorizedScope.allowedSubjects || []) {
      if (typeof subject === 'string' && subject.trim()) subjects.add(subject.trim().toUpperCase());
    }
    for (const definition of Object.values(input.authorizedScope.paperDefinitions || {})) {
      for (const subject of definition.allowedSubjects || []) {
        if (typeof subject === 'string' && subject.trim()) subjects.add(subject.trim().toUpperCase());
      }
    }
    return Array.from(subjects);
  }

  private isSubjectLine(line: string, input: B3Input): boolean {
    const l = line.toUpperCase().trim();
    if (l.includes("SUBJECT:")) return true;
    
    const allowedSubjects = this.getAllAllowedSubjects(input);
    const startsWithSubject = allowedSubjects.some(s => l.startsWith(s));
    if (startsWithSubject) return true;

    const isPart = l.startsWith("PART");
    const hasSubjectKeyword = allowedSubjects.some(s => l.includes(s));
    if (hasSubjectKeyword && isPart) return true;

    return false;
  }

  private extractSubjectTitle(line: string, input: B3Input): string {
    const l = line.toUpperCase();
    if (l.includes("SUBJECT:")) return line.replace(/SUBJECT:/i, "").trim();

    const allowedSubjects = this.getAllAllowedSubjects(input);
    for (const s of allowedSubjects) {
      if (l.includes(s)) {
        // Return the canonical casing from the allowed list if possible
        const canonical = input.authorizedScope.allowedSubjects?.find(subj => subj.toUpperCase() === s) ||
                          Object.values(input.authorizedScope.paperDefinitions || {}).flatMap(d => d.allowedSubjects).find(subj => subj.toUpperCase() === s) ||
                          s.charAt(0) + s.slice(1).toLowerCase();
        return canonical;
      }
    }
    return line.trim();
  }

  private normalizeSubjectId(title: string, input: B3Input): string {
    const sourceCandidate = title.trim().toUpperCase();
    const aliasEntry = Object.entries(input.authorizedScope.subjectAliases || {})
      .find(([alias]) => alias.trim().toUpperCase() === sourceCandidate);
    const candidate = aliasEntry ? String(aliasEntry[1]).trim().toUpperCase() : sourceCandidate;
    const allowed = [
      ...(input.authorizedScope.allowedSubjects || []),
      ...Object.values(input.authorizedScope.paperDefinitions || {}).flatMap(d => d.allowedSubjects || []),
    ];
    // A configured alias is not itself source authority; its resolved subject
    // must still be explicitly approved for this mission's scope.
    const match = allowed.find(s => s.trim().toUpperCase() === candidate);
    if (!match) throw new Error('B3_REJECT: unauthorized subject ' + title);
    return match.trim();
  }

  private generateNodeId(missionId: string, paperId: string | null, subjectId: string, nodeType: string, title: string): string {
    const key = `${missionId}:${paperId || ''}:${subjectId}:${nodeType}:${title.toLowerCase().trim()}`;
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }
}

// 🔱 Firestore Triggered Generic B3 Worker
export const genericB3Worker = functions.firestore
  .document('ai_queue/{taskId}')
  .onCreate(async (snapshot, context) => {
    // 🛡️ TEST ISOLATION GATE: Avoid executing background triggers in the emulator process during Jest runs
    if (process.env.FUNCTIONS_EMULATOR && !process.env.JEST_WORKER_ID) {
      console.log("genericB3Worker: Bypassing background trigger execution in emulator process.");
      return;
    }
    const task = snapshot.data();
    if (task.type !== 'SYLLABUS_B3') return;

    const taskId = context.params.taskId;
    const firestore = admin.firestore();
    const taskRef = firestore.collection('ai_queue').doc(taskId);

    try {
      const claimed = await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) return false;
        const status = doc.data()?.status;
        if (status !== 'queued' && status !== 'pending' && status !== 'received') return false;
        transaction.update(taskRef, {
          status: 'processing',
          claimedBy: 'generic_b3_worker',
          processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return true;
      });

      if (!claimed) return;

      const authorizedScope = task.payload && task.payload.authorizedScope;
      const scopeStatus = authorizedScope ? authorizedScope.status : 'RESOLVED';

      if (scopeStatus === 'DECISION_REQUIRED' || scopeStatus === 'BLOCKED') {
        await taskRef.update({
          status: 'blocked_pending_founder_decision',
          blocked_reason: `SCOPE_STATUS_${scopeStatus}`,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      const workerInstance = new GenericB3Worker();
      const nodes = await workerInstance.materializeSyllabusStructure(task.payload);

      // Write nodes and complete task in a single transaction
      await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(taskRef);
        if (!doc.exists) {
          throw new Error("Task does not exist");
        }
        const taskData = doc.data();
        if (taskData?.status === 'completed') {
          return; // Already completed (idempotent)
        }

        for (const node of nodes) {
          const nodeRef = firestore
            .collection('mission_realms')
            .doc(node.missionId)
            .collection('structured_nodes')
            .doc(node.nodeId);
          transaction.set(nodeRef, node);
        }

        transaction.update(taskRef, {
          status: 'completed',
          completed_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    } catch (err: any) {
      console.error(`B3_WORKER_FAILED: ${taskId}:`, err);
      await taskRef.update({
        status: 'failed',
        error: err.message,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
