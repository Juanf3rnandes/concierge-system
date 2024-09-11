const { getAreas } = require("./database");
const { logger } = require("./logger");

module.exports.validateReserva = async function validate(req, res, next) {
  const { area, data_solicitacao, data_reserva, data_inicio, data_fim, valor, veiculo_id } = req.body;
  const areas = await getAreas();

  if (!areas.find(a => a.id == area || typeof area !== "number")) {
    return res.status(422).json({
      error: "Área inválida",
    });
  }

  if (!area || typeof area !== "number") {
    return res.status(422).json({
      error: "Área inválida",
    });
  }

  if (
    !data_solicitacao ||
    typeof data_solicitacao !== "string" ||
    !Date.parse(data_solicitacao)
  ) {
    return res.status(422).json({
      error: "Data de solicitação inválida",
    });
  }

  if (!valor || typeof valor !== "number") {
    return res.status(422).json({
      error: "Campo valor deve ser um número",
    });
  }

  if (data_solicitacao < new Date().toISOString().split('T')[0]) {

    return res.status(422).json({
      error: "Data da solicitação deve ser maior ou igual a data atual",
    });
  }
  next();
};

module.exports.validateLiberacaoAcesso = function validate(req, res, next) {
  const { nome, cpf_cnpj, unidade } = req.body;

  if (
    (!nome && !cpf_cnpj) ||
    typeof nome !== "string" ||
    typeof cpf_cnpj !== "string"
  ) {
    return res.status(422).json({
      error: "Nome e/ou CPF/CNPJ inválidos",
    });
  }

  if (!unidade || typeof unidade !== "string") {
    return res.status(422).json({
      error: "Unidade inválida",
    });
  }

  next();
};

module.exports.validateVeiculo = function validate(req, res, next) {
  const { placa, modelo, cor } = req.body;
  const validaPlaca = new RegExp("^[a-zA-Z]{3}[0-9][A-Za-z0-9][0-9]{2}$");

  if (!placa || typeof placa !== "string" || !validaPlaca.test(placa)) {
    return res.status(422).json({
      error: "Placa inválida",
    });
  }
  if (!modelo || typeof modelo !== "string") {
    return res.status(422).json({
      error: "Modelo inválido",
    });
  }

  if (!cor || typeof cor !== "string") {
    return res.status(422).json({
      error: "Cor inválida",
    });
  }

  next();
};

module.exports.errorHandler = function clientErrorHandler(err, req, res, next) {
  logger.error(`Something failed`, err);
  res.status(err.status || 500).json({ error: err.message || "Something failed" });
};
