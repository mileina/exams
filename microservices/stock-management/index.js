const express = require('express');
const app = express();
const PORT = 4003;
const { logger, auditLogger, httpLogger } = require('./logger');

app.use(express.json());
app.use(httpLogger);

app.post('/update-stock', (req, res) => {
    const { productId, quantity } = req.body;
    auditLogger.info('Mise à jour de stock demandée', { productId, quantity });
    res.send(`Stock mis à jour pour le produit de ID : ${productId}`);
});

app.listen(PORT, () => logger.info(`Service de gestion des stocks sur le port ${PORT}`));
