const fs = require('fs');
const path = require('path');

function getMaintenanceStatus() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../maintenance.json'), 'utf-8');
    return JSON.parse(data).enabled;
  } catch {
    return false;
  }
}

module.exports = (req, res, next) => {
  // Permite sempre rotas de autenticação e status de manutenção
  if (
    req.path.startsWith('/api/auth') ||
    req.path.startsWith('/api/admin/maintenance')
  ) {
    return next();
  }

  const maintenance = getMaintenanceStatus();
  if (maintenance) {
    // Se não for admin, bloqueia
    if (!req.user || req.user.tipo !== 'admin') {
      return res.status(503).json({ maintenance: true, message: 'O sistema está em manutenção. Tente novamente mais tarde.' });
    }
  }
  next();
};
