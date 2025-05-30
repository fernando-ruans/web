// Configuração do Firebase Admin
const admin = require('firebase-admin');
const path = require('path');

// Caminho para o arquivo de chave da conta de serviço
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
