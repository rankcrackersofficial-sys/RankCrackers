const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { generateQrBuffer, generateCertificatePdf, computeHash } = require("../services/rendering_service");

/**
 * 🔱 CERTIFICATE RENDERING WORKER (v5.0 Hardened)
 * Physically renders assets, computes hashes, and generates signed download URLs.
 */
exports.certificateRenderWorker = functions.firestore
  .document("certificates/{certId}")
  .onUpdate(async (change, context) => {
    const data = change.after.data();
    const beforeData = change.before.data();
    const certId = context.params.certId;

    // 1. Transition Guard: Only process if status moved to RENDERING
    if (beforeData.status === data.status || data.status !== 'RENDERING') return;

    console.log(`🔱 RENDERER: Mobilizing for ${certId}`);

    try {
        // 2. Generate buffers
        const qrBuffer = await generateQrBuffer(data.verificationHash);
        const qrHash = computeHash(qrBuffer);

        const pdfBuffer = await generateCertificatePdf(data, qrBuffer);
        const pdfHash = computeHash(pdfBuffer);

        // 3. Upload to Sovereign Storage
        const bucket = admin.storage().bucket();
        const pdfPath = `certificates/${data.userId}/${data.realmId}/${certId}.pdf`;
        const qrPath = `certificates/${data.userId}/${data.realmId}/${certId}_qr.png`;

        const pdfFile = bucket.file(pdfPath);
        const qrFile = bucket.file(qrPath);

        await Promise.all([
            pdfFile.save(pdfBuffer, { contentType: 'application/pdf', metadata: { metadata: { sha256: pdfHash } } }),
            qrFile.save(qrBuffer, { contentType: 'image/png', metadata: { metadata: { sha256: qrHash } } })
        ]);

        // 🔱 Gap 2 Fix: Generate Signed URLs for user access (Valid for 7 days)
        const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const [pdfUrl] = await pdfFile.getSignedUrl({ action: 'read', expires: expiry });
        const [qrUrl] = await qrFile.getSignedUrl({ action: 'read', expires: expiry });

        console.log(`🔱 RENDERER: Assets uploaded for ${certId}. Signed URLs generated.`);

        // 4. Update Record (Triggering Worker A Audit)
        await admin.firestore().collection("certificates").doc(certId).update({
            status: 'UPLOADING',
            assets: {
                pdfPath,
                pdfUrl,
                pdfHash,
                qrPath,
                qrUrl,
                qrHash,
                generatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        console.log(`🔱 RENDERER SUCCESS: ${certId} assets ready for forensic audit.`);

    } catch (error) {
        console.error(`🔱 RENDERER ERROR for ${certId}:`, error);
        await admin.firestore().collection("certificates").doc(certId).update({
            status: 'FAILED',
            error: `Rendering failed: ${error.message}`
        });
    }
  });
