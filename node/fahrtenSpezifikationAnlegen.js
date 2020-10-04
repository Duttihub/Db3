const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');


module.exports = {

    anlegenFahrtenSpezifikation: async function (ulid, zpid, first, last, freq) {

        const success = ' Fahrtenspez konnte erzeugt werden'
        const fail = ' Fahrtenspez konnte nicht erzeugt werden - checken sie die letzte Fahrt. Sie muss vor 24:00 Uhr liegen'

        var validate1 = await validateFirst(first)
        var validate2 = await validateLast(last)

        console.log('first' + validate1)
        console.log('seconst' + validate2)


        if (validate1 == true && validate2 == true) {

            var fsid = await getnewFSID()

            let entry = [fsid, zpid, ulid, first, last, freq]
            console.log(entry)

            await insertFahrtenSpezinDB(entry).catch(console.log)
            return success
        } else {
            return fail
        }




    }

}

async function insertFahrtenSpezinDB(entry) {
    console.log('I come here!')
    const insertFahrtenspezSQL = 'Insert into Fahrtenspez values (?,?,?,?,?,?)'
    await utils.dbOp(config.hdb, insertFahrtenspezSQL, entry);
}

async function validateFirst(first) {
    var valid = false
    var indexofSignal = first.indexOf(':')
    var timeString = first.slice(0, indexofSignal)
    var timeInteger = parseInt(timeString)
    if (timeInteger >= 0 && timeInteger <= 23) {
        valid = true
    }
    return valid
}

async function validateLast(second) {
    var valid = false
    var indexofSignal = second.indexOf(':')
    var hourString = second.slice(0, indexofSignal)
    var hourInteger = parseInt(hourString)


    var minuteString = second.slice(indexofSignal + 1, second.length)
    var minuteInteger = parseInt(minuteString)

    if (hourInteger >= 0 && hourInteger <= 23 && minuteInteger <= 59 && minuteInteger > 1) {
        valid = true
    }


    return valid
}

async function getnewFSID() {
    const getHighestFSIDsFromDBSQL = 'Select top 1 fsid from fahrtenspez order by fsid desc'

    const highestFSIDfromDBJSON = await utils.dbOp(config.hdb, getHighestFSIDsFromDBSQL)
    const highestFSIDfromDBArray = utils.jsonRowsToArrayRows(highestFSIDfromDBJSON)

    var newFSID = 0

    if (highestFSIDfromDBArray.length == 0) {
        newFSID = 1
    } else if (highestFSIDfromDBArray.length >= 1) {
        const highestFSID = highestFSIDfromDBArray[0][0]
        newFSID = highestFSID + 1
    }
    console.log(newFSID)
    return newFSID
}

//validateLast("00:00").catch(console.log)

//getnewFSID().catch(console.log)