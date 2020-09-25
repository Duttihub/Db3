const fetch = require('node-fetch');
const utils = require('../../../../code-node/lib/utils');

async function getAdressesfromServer() {

    let adresses = [];

    await fetch(`http://localhost:3001/adresses?text=Von Marienstraße 18 möchte Daniela Scheid nach Kiefholzstraße 269 und in Schröderstraße 6`)
        .then(res => res.json())
        .then(json => utils.jsonRowsToArrayRows(json))
        .then(array => adresses.push(array))

    return adresses;

}

async function buildoutputadresses() {
    let adresses = await getAdressesfromServer();
    let tokens = [];
    var length = adresses[0].length;

    for (let i = 0; i < length; i++) {
        token = adresses[0][i][2];
        if (adresses[0][i][3] == 'ADDRESS1') {
            tokens.push(token);
        }

    }
    console.log(tokens);
    return tokens;
}

buildoutputadresses().catch(console.log);
