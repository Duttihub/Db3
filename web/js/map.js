const fetch = require('node-fetch');
const utils = require('../../../../code-node/lib/utils');


async function constructPolygon() {
    const liniendaten = await fetch(`http://localhost:3001/coords?lines=U5`)
        .then(res => res.json())
    let linedata = [];
    let linesdata = [];

    for (let i = 0; i < liniendaten.result.length; i++) {
        hid_a = liniendaten.result[i].HID_A;
        hid_b = liniendaten.result[i].HID_B;
        linien = liniendaten.result[i].LINIEN;
        lat_hid_a = liniendaten.result[i].LAT;
        lng_hid_a = liniendaten.result[i].LNG;

        for (let j = 0; j < liniendaten.result.length; j++) {
            if (hid_b == liniendaten.result[j].HID) {
                lat_hid_b = liniendaten.result[j].LAT;
                lng_hid_b = liniendaten.result[j].LNG;
            }
        }

        geo_a = [parseFloat(lat_hid_a), parseFloat(lng_hid_a)];

        linesdata.push(geo_a);
    }
    console.log(linesdata);
    return linesdata;
}


constructPolygon().catch(console.log);