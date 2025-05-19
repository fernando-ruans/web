const morgan = require('morgan');

// Middleware de tratamento de erros global
function errorHandler(err, req, res, next) {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
}

module.exports = {
  morgan,
  errorHandler
};
