const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔱 FOUNDER CRITICAL ALERT
 */
exports.founderCriticalAlert = functions.firestore
  .document("sentinel_drafts/{draftId}")
  .onCreate(async (snapshot, context) => {
    const draft = snapshot.data();
    if (draft.audit && draft.audit.impactLevel === 'CRITICAL') {
      console.log(`🔱 ALERT: Critical discovery detected! ${draft.id}`);

      const foundersSnap = await admin.firestore().collection('users').where('role', '==', 'founder').get();

      const tokens = [];
      foundersSnap.forEach(doc => {
        if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
      });

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: "🔱 CRITICAL DISCOVERY",
            body: `Sentinel has detected a critical mission: ${draft.rawData.title || 'Unknown'}`
          },
          data: {
            type: "critical_discovery",
            draftId: draft.id
          },
          tokens: tokens
        };

        await admin.messaging().sendEachForMulticast(message);
      }
    }
  });
