const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.join(__dirname, "service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("🔱 CRITICAL ERROR: 'service-account.json' NOT FOUND.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "rankcrackers-55"
  });
}

const oldUid = "eDYJbwq9KeSF2s39wYv1ujFnjin2";

async function revoke() {
  console.log("🔱 SOVEREIGN: Revoking claims for OLD target: " + oldUid);
  try {
    await admin.auth().setCustomUserClaims(oldUid, {});

    // Verify revocation
    const user = await admin.auth().getUser(oldUid);
    console.log("🔱 SUCCESS: Claims revoked from OLD UID.");
    console.log("Current Registry (Expected {}):", user.customClaims || "{}");
  } catch (error) {
    console.error("🔱 REVOCATION FAILED:", error.message);
  }
}

revoke();
