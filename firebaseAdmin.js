// Configuração do Firebase Admin
const admin = require('firebase-admin');
const path = require('path');

// Suporte para service account via variável de ambiente (Render) ou arquivo local (dev)
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim() !== "") {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
