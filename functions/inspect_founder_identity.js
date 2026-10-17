const admin = require('firebase-admin');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'rankcrackers-55' });
admin.auth().getUser('CswjiDlFjrcdHyyEjQ8oGIPYv1h1')
  .then((user) => console.log(JSON.stringify({ uid: user.uid, email: user.email || null, claims: user.customClaims || {} })))
  .catch((error) => { console.error(error.code, error.message); process.exitCode = 1; });
