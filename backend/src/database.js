const mysql = require("mysql2/promise");
const { logger } = require("./logger");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  database: process.env.MYSQL_DB || "concierge",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "juan102030",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.on("error", connect);

pool.once("connection", async () => {
  try {
    logger.info(`database.js: Connected  to db `);
    logger.info(`Creating tables if not exists`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pessoas(
      cod_pessoa INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      cpf_cnpj VARCHAR(14) NOT NULL,
      telefone VARCHAR(15) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )  
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS condominios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      endereco VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS unidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proprietario INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    condominio INT NOT NULL,
    FOREIGN KEY (condominio) REFERENCES condominios(id),
    FOREIGN KEY (proprietario) REFERENCES pessoas(cod_pessoa)
    );`
    );

    await pool.query(`
    CREATE TABLE IF NOT EXISTS areas (
     id INT PRIMARY KEY AUTO_INCREMENT,
     nome VARCHAR(255) NOT NULL,
     dia_inteiro BOOLEAN NOT NULL,
     hora_inicio TIME,
     hora_fim TIME,
     valor DOUBLE NOT NULL,
     descricao VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`

    );
    await pool.query(`CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cod_area INT NOT NULL,
    cod_unidade INT NOT NULL,
    data_solicitacao DATETIME NOT NULL,
    data_reserva DATETIME NOT NULL,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    valor DOUBLE NOT NULL,
    veiculo_id INT,
    FOREIGN KEY (cod_area) REFERENCES areas(id),
    FOREIGN KEY (cod_unidade) REFERENCES unidades(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS veiculos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      marca VARCHAR(50) NOT NULL,
      modelo VARCHAR(50) NOT NULL,
      placa VARCHAR(50) NOT NULL,
      cor VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`
    );
    await pool.query(`
   CREATE TABLE IF NOT EXISTS liberacao_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unidade INT NOT NULL,
    cpf_cnpj VARCHAR(14) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    veiculo INT, 
    FOREIGN KEY (unidade) REFERENCES unidades(id),
    FOREIGN KEY (veiculo) REFERENCES veiculos(id)
);`
    );
  } catch (err) {
    logger.error(`${process.pid} - ${err.message}`);
  } finally {
  }
});

async function connect() {
  try {
    await pool.getConnection();
    logger.info(`Connected to database!`);
  } catch (err) {
    setTimeout(() => {
      connect();
      logger.error(
        `database.js: an error occured when connecting ${err} retrying connection on 3 secs`
      );
    }, 3000);
  }
}

connect();

module.exports.getReservas = async () => {
  const [rows] = await pool.query(`SELECT * FROM reservas`);
  return rows;
};

module.exports.getAreas = async () => {
  const [rows] = await pool.query(`SELECT * FROM areas`);
  return rows;
};

module.exports.getLiberacoes = async () => {
  const [rows] = await pool.query(`SELECT * FROM liberacao_acesso`);
  return rows;
}

module.exports.postReserva = async ({
  area,
  unidade,
  data_solicitacao,
  data_reserva,
  data_inicio,
  data_fim,
  valor,
  veiculo_id,
}) => {
  const [result] = await pool.query(`
    INSERT INTO reservas (cod_area, cod_unidade, data_solicitacao, data_reserva, data_inicio,data_fim, valor, veiculo_id) Values (
    ?, ?, ?, ?, ?, ?, ?, ?
    )
    `, [area, unidade, data_solicitacao, data_reserva, data_inicio, data_fim, valor, veiculo_id]);
  return result;
};

module.exports.postVeiculo = async ({ marca, modelo, placa, cor }) => {
  const [result] = await pool.query(`
    INSERT INTO veiculos (marca, modelo, placa, cor) Values (
    ?, ?, ?, ?
    )
    `, [marca, modelo, placa, cor]);
  return result;
}


