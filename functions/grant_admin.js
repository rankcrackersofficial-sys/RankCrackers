const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

/**
 * 🔱 SOVEREIGN ESCALATION SCRIPT (Administrative Override)
 *
 * INSTRUCTIONS:
 * 1. Go to Firebase Console -> Settings -> Service Accounts.
 * 2. Generate new private key and download the JSON.
 * 3. Place it in this folder as 'service-account.json'.
 */

const serviceAccountPath = path.join(__dirname, "service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("🔱 CRITICAL ERROR: 'service-account.json' NOT FOUND.");
  console.log("Please download your service account key from Firebase Console and place it in this folder.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "rankcrackers-55"
});

async function mobilizeFounder() {
  const targetUid = "6TdzjpBr6Zdx1ag3LbMmjJ0DY312";

  console.log(`🔱 SOVEREIGN: Mobilizing claims for target: ${targetUid}`);

  try {
    await admin.auth().setCustomUserClaims(targetUid,
      admin: true,
      founder: true,
      accessLevel: 9 // 🔱 Supreme Authority
    });

    // Verify the forge
    const user = await admin.auth().getUser(targetUid);
    console.log("🔱 SUCCESS: Sovereign Claims physically attached.");
    console.log("Physical Claims Registry:", user.customClaims);
    console.log("🔱 ACTION REQUIRED: Logout and Login again on your device to manifest authority.");
  } catch (error) {
    console.error("🔱 CRITICAL ERROR during Forge:", error);
  }
}

mobilizeFounder();
