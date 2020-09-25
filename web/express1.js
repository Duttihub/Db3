const updateVelocity = require('../node/updatevelocity');
const express = require('express')
const app = express()
const port = 3001
const hdbext = require('@sap/hdbext');
const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');
const Hdb = require('../../../code-node/lib/hdb');



app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.get('/segment_duration', async (req, res) => {
    const { velocity } = req.query;
    console.log(' i am velociy:' + velocity)
    updateVelocity.calculateVelocity(velocity)
    console.log('i am here')


});


//App Listen
app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`))

async function callDB(connectionparams, sql) {
    const result = await utils.dbOp(connectionparams, sql);
    return result;
}