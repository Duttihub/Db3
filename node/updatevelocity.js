const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');


module.exports = {

    calculateVelocity: async function (velocity) {

        await deleteAktuelleSegemntDauerfromDB();


        let laengeInKM;
        let dauer;
        let segmentdauerEntrys = []
        let entry = []
        const segmentData = await getSegmenteAndLaengen()
        console.log(segmentData.length)


        for (let i = 0; i < segmentData.length; i++) {
            hid_a = segmentData[i][0]
            hid_b = segmentData[i][1]

            laengeInKM = segmentData[i][2] / 1000
            dauerInH = laengeInKM / velocity
            dauerInMin = dauerInH * 60
            dauerInSek = dauerInMin * 60
            entry = [hid_a, hid_b, dauerInSek]
            segmentdauerEntrys.push(entry)
        }

        updateSegmentdauerinDB(segmentdauerEntrys)


    }




}

async function getSegmenteAndLaengen() {
    const getSegmenteSql = 'Select hid_a ,hid_b, LAENGE_IN_METER from Segment'
    const segmentData = await utils.dbOp(config.hdb, getSegmenteSql)
    var arraySegmentData = utils.jsonRowsToArrayRows(segmentData);
    return arraySegmentData
}


async function deleteAktuelleSegemntDauerfromDB() {
    const deletedauern = 'delete from segmentdauer '
    await utils.dbOp(config.hdb, deletedauern)
}

async function updateSegmentdauerinDB(entrys) {
    const insertSegemntdauerSQL = 'Insert into segmentdauer values (?,?,?)'
    await utils.dbBulkOp(config.hdb, insertSegemntdauerSQL, entrys);
}