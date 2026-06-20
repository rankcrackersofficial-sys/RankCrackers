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
const newUid = "6TdzjpBr6Zdx1ag3LbMmjJ0DY312";

async function verify() {
  try {
    const oldUser = await admin.auth().getUser(oldUid);
    const newUser = await admin.auth().getUser(newUid);

    console.log("--- CLAIMS AUDIT ---");
    console.log("OLD UID (" + oldUid + "):", oldUser.customClaims || "{}");
    console.log("NEW UID (" + newUid + "):", newUser.customClaims || "{}");
    console.log("--------------------");
  } catch (error) {
    console.error("🔱 AUDIT FAILED:", error.message);
  }
}

verify();
