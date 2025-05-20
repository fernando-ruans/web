const Joi = require('joi');

exports.register = Joi.object({
  nome: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required(),
  tipo: Joi.string().valid('cliente').required() // Aceita apenas registro como cliente
});

exports.login = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required()
});

exports.restaurant = Joi.object({
  nome: Joi.string().required(),
  cidade: Joi.string().required(),
  taxa_entrega: Joi.number().required(),
  tempo_entrega: Joi.number().required(),
  status: Joi.string().optional(),
  imagem: Joi.string().optional()
});

exports.lojistaProfile = Joi.object({
  nome: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  avatarUrl: Joi.string().optional(),
  telefone: Joi.string().optional(),
  endereco: Joi.string().optional(),
  address: Joi.object({
    rua: Joi.string().min(2).max(255).optional(),
    numero: Joi.string().max(20).optional(),
    complemento: Joi.string().max(255).allow(null, '').optional(),
    bairro: Joi.string().min(2).max(100).optional(),
    cidade: Joi.string().min(2).max(100).optional(),
    estado: Joi.string().length(2).optional(),
    cep: Joi.string().pattern(/^\d{5}-?\d{3}$|^\d{8}$/).optional(),
  }).optional()
});
