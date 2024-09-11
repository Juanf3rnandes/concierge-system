const express = require("express");
const os = require("os");
const cluster = require("cluster");
const { logger } = require("./logger");
const { getReservas, getAreas, postReserva, postVeiculo, getLiberacoes } = require("./database");
const { validateReserva, validateVeiculo } = require("./middleware,");


const numsCPUS = Math.ceil(os.cpus().length / 2);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/reservas", async (req, res) => {
  try {
    const results = await getReservas();
    res.json(results)
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get("/areas", async (req, res) => {
  try {
    const results = await getAreas();
    res.json(results);
  } catch (err) {
    res.json({ error: err.message });
  }
})

app.get("/liberacao", async (req, res) => {
  try {
    const results = await getLiberacoes();
    res.json(results);
  } catch (err) {
    res.json({ error: err.message });
  }

})

app.post("/reservas", validateReserva, async (req, res) => {
  try {
    const reserva = await postReserva(req.body);
    res.json({ "códigoReserva": reserva.insertId });

  } catch (err) {
    res.json({ error: err.message });
  }
})

app.post("/veiculos", validateVeiculo, async (req, res) => {
  try {
    const veiculo = await postVeiculo(req.body);
    res.json({ "códigoVeiculo": veiculo.insertId });
  } catch (err) {
    res.json({ error: err.message });

  }
})

if (cluster.isMaster) {
  for (let i = 0; i < numsCPUS; i++) {
    cluster.fork();
  }
  app.listen(process.env.PORT || 8080, () => {
    logger.info(`${process.pid} ${process.env.PORT || 8080}`);
  });
}
