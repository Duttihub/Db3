const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');


module.exports = {

    anlegenFahrtenSpezifikation: async function (ulid, zpid, first, last, freq) {




        let entry = [ulid, zpid, first, last, freq]

        await insertFahrtenSpezinDB(entry).catch(console.log)
    }





}

async function insertFahrtenSpezinDB(entry) {
    console.log('I come here!')
    const insertFahrtenspezSQL = 'Insert into Fahrtenspez values (?,?,?,?,?,?)'
    await utils.dbOp(config.hdb, insertFahrtenspezSQL, entry);
}

async function validateFirst(first) {
    var valid = false

}