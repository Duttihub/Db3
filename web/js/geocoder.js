const fetch = require('node-fetch');
const utils = require('../../../../code-node/lib/utils');
const config = require('../../../../code-node/config/config');


module.exports = {

    fetchGeocoder: async function (strasse) {
        let geometry = [];
        const geoencode = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${strasse},%20Berlin&apiKey=90925004097943b98e4a8d70a4967576`)
            .then(res => res.json())
        geometry.push(geoencode.features[1].geometry.coordinates); //Hier drinnen sind die Latitude/Longitude!
        return geometry;

    },

    getSourceandTarget: async function (textarray) {
        let usesourcetarget = [];
        sourcetext = textarray[0];
        targettext = textarray[1];
        sourcelatlng = await this.fetchGeocoder(sourcetext).catch(console.log);
        targetlatlng = await this.fetchGeocoder(targettext).catch(console.log);
        const sqlsource = `select top 1 hid,bez, pos.st_distance(new st_point('Point(${sourcelatlng[0][0]} ${sourcelatlng[0][1]} )',4326),'meter')dist from haltestelle order by dist`;
        const dbanswersource = await utils.dbOp(config.hdb, sqlsource).catch(console.log);
        var arrayrowsource = utils.jsonRowsToArrayRows(dbanswersource);
        usesourcetarget.push(arrayrowsource[0]);
        const sqltarget = `select top 1 hid,bez, pos.st_distance(new st_point('Point(${targetlatlng[0][0]} ${targetlatlng[0][1]} )',4326),'meter')dist from haltestelle order by dist`;
        const dbanswertarget = await utils.dbOp(config.hdb, sqltarget).catch(console.log);
        var arrayrowtarget = utils.jsonRowsToArrayRows(dbanswertarget);
        usesourcetarget.push(arrayrowtarget[0]);
        return usesourcetarget;


    }


}







