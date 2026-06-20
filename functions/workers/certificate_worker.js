const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

/**
 * 🔱 CERTIFICATE REGISTRY & LIFECYCLE ORCHESTRATOR (Hardened v5.2)
 * Worker A: Forensic Integrity Audit & Governed Public Registry Sync.
 */
exports.certificateRegistryWorker = functions.firestore
  .document("certificates/{certId}")
  .onWrite(async (change, context) => {
    const certId = context.params.certId;
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    const baseUrl = process.env.VERIFICATION_BASE_URL || "https://verify.rankcrackers.com";

    // 1. Audit Trail: Mark as PURGED on delete
    if (!change.after.exists) {
        const oldData = change.before.data();
        if (oldData.verificationHash) {
            await db.collection("certificate_registry").doc(oldData.verificationHash).set({
                s: 'PURGED',
                purgedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        return;
    }

    const data = change.after.data();
    const beforeData = change.before.exists ? change.before.data() : null;
    const registryRef = db.collection("certificate_registry").doc(data.verificationHash);

    // Transition Guard
    if (beforeData && beforeData.status === data.status && beforeData.isRegistryApproved === data.isRegistryApproved) {
        if (data.status !== 'UPLOADING') return;
    }

    console.log(`🔱 CERT_LIFECYCLE: ${certId} transitioning [Status: ${data.status}, Approved: ${data.isRegistryApproved}]`);

    switch (data.status) {
        case 'GENERATING':
            if (data.renderLock) return;
            await db.collection("certificates").doc(certId).update({
                status: 'RENDERING',
                renderLock: true,
                renderStartedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            break;

        case 'UPLOADING':
            const assets = data.assets || {};
            if (assets.pdfPath && assets.qrPath && assets.pdfHash && assets.qrHash) {
                try {
                    const [pdfContent] = await bucket.file(assets.pdfPath).download();
                    const [qrContent] = await bucket.file(assets.qrPath).download();

                    const computedPdfHash = crypto.createHash('sha256').update(pdfContent).digest('hex');
                    const computedQrHash = crypto.createHash('sha256').update(qrContent).digest('hex');

                    if (computedPdfHash === assets.pdfHash && computedQrHash === assets.qrHash) {
                        console.log(`🔱 FORENSIC AUDIT: Byte integrity verified for ${certId}.`);
                        await db.collection("certificates").doc(certId).update({
                            status: 'ACTIVE',
                            renderLock: false,
                            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            publicUrl: `${baseUrl}/v/${data.verificationHash}`
                        });
                    } else {
                        console.error(`🔱 FORENSIC FAILURE: Hash mismatch for ${certId}.`);
                        await db.collection("certificates").doc(certId).update({ status: 'FAILED', error: 'INTEGRITY_MISMATCH' });
                    }
                } catch (e) {
                    console.error("🔱 AUDIT ERROR:", e);
                }
            }
            break;

        case 'ACTIVE':
            // 🔱 Gap 4 Fix: Registry Publication Lock (Mandatory Founder Approval)
            if (!data.isRegistryApproved) {
                console.log(`🔱 REGISTRY: Certificate ${certId} is ACTIVE but awaiting Founder approval for Registry sync.`);
                return;
            }

            await registryRef.set({
                v: data.verificationHash,
                i: data.certificateId,
                u: data.userId,
                r: data.realmId,
                t: data.certificateType,
                d: data.issueDate,
                m: {
                    examName: data.metadata.examName,
                    score: data.metadata.score,
                    rank: data.metadata.rank,
                    warriorName: data.metadata.warriorName
                },
                u_at: admin.firestore.FieldValue.serverTimestamp(),
                s: 'VALID',
                pdfUrl: data.assets.pdfUrl
            }, { merge: true });
            console.log(`🔱 REGISTRY: Certificate ${certId} is now PUBLICly verifiable.`);
            break;

        case 'REVOKED':
            await registryRef.set({
                s: 'REVOKED',
                reason: data.revocationReason || 'Manual discovery of fraud',
                revokedAt: data.revokedAt || admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            break;
    }
  });
