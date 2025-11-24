const admin = require("firebase-admin");

let appInitialized = false;

function init() {
  if (appInitialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ Missing Firebase env variables");
    console.log({
      projectId,
      clientEmail,
      privateKey: privateKey ? "loaded" : "missing",
    });
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("🔥 Firebase initialized");
  appInitialized = true;

  return admin;
}

// Initialize immediately
init();

module.exports = admin;
