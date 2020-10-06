const updateVelocity = require('../node/updatevelocity');
const createTimeTable = require('../node/createTimeTable')
const anlegenFahrtenSpez = require('../node/fahrtenSpezifikationAnlegen')
const fahrtenErzeugen = require('../node/fahrtenErzeugen')
const deleteTrips = require('../node/deleteTrips')
const express = require('express')
const app = express()
const port = 3000
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
    try {
        updateVelocity.calculateVelocity(velocity)
        res.send("Update Tabel Segmentdauer erfolgreich")
    } catch (err) {
        res.send("Beim Updaten der Tabelle Segmentdauer ist etwas schief gegangen")
    }


});

app.get('/schedule', async (req, res) => {
    const { begin, end, days } = req.query;
    console.log(' i am begin:' + begin)
    console.log(' i am end:' + end)
    console.log(' i am days:' + days)

    createTimeTable.createTimeTabel(begin, end, days)
        .then(function (result) {
            res.send(result);
        })


});

app.get('/trip_spec', async (req, res) => {
    const { ulid, zpid, first, last, freq } = req.query;

    anlegenFahrtenSpez.anlegenFahrtenSpezifikation(ulid, zpid, first, last, freq)
        .then(function (result) {
            res.send(result);
        })


});

app.get('/gen_trips', async (req, res) => {
    const { fsid } = req.query;
    console.log(' i am fsid:' + fsid)

    fahrtenErzeugen.fahrtenErzeugen(fsid)
        .then(function (result) {
            res.send(result);
        })


});

app.get('/del_trips', async (req, res) => {
    const { fsid } = req.query;
    console.log(' i am fsid:' + fsid)

    deleteTrips.deleteTrips(fsid)
        .then(function (result) {
            res.send(result);
        })


});


//App Listen
app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`))

