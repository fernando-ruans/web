const Joi = require('joi');

exports.register = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  tipo: Joi.string().valid('cliente', 'lojista').required()
});

exports.login = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required()
});

exports.restaurant = Joi.object({
  nome: Joi.string().required(),
  cnpj: Joi.string().required(),
  cidade: Joi.string().required(),
  taxa_entrega: Joi.number().required(),
  tempo_entrega: Joi.number().required(),
  status: Joi.string().optional(),
  imagem: Joi.string().optional()
});
