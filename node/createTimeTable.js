const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');

module.exports = {

    createTimeTabel: async function (begin, end, days) {


        var zpid = 0
        var mo = 0
        var di = 0
        var mi = 0
        var don = 0
        var fr = 0
        var sa = 0
        var so = 0

        const datum_beginn = await transformDate(begin)
        const datum_ende = await transformDate(end)


        let validDays = await getDaysinArray(days);
        console.log(validDays)

        if (validDays.includes('Mo')) {
            mo = 1
        } if (validDays.includes('Di')) {
            di = 1
        } if (validDays.includes('Mi')) {
            mi = 1
        } if (validDays.includes('Do')) {
            don = 1
        } if (validDays.includes('Fr')) {
            fr = 1
        } if (validDays.includes('Sa')) {
            sa = 1
        } if (validDays.includes('So')) {
            so = 1
        }

        var valid = await checkForDuplicate([begin, end, mo, di, mi, don, fr, sa, so])
        if (valid) {
            zpid = await getnewZPID()
            console.log('i am zpid' + zpid)
            let entry = [zpid, datum_beginn, datum_ende, mo, di, mi, don, fr, sa, so]
            console.log('i am entry' + entry)
            await insertZeitplaninDB(entry).catch(console.log)
            return 'Zeitplan wurde erfolgreich hinzugefügt'
        } else {
            return 'Zeitplan konnte nicht hinzugefügt werden es würde sich um ein Duplikat handeln'
        }


    }
}

async function getDaysinArray(days) {

    let arrayDays = []

    for (let i = 0; i < 7; i++) {
        var first = i * 2
        var second = first + 2
        const day = String(days).substring(first, second)
        day.toUpperCase()
        arrayDays.push(day)
    }
    return arrayDays

}

async function getnewZPID() {
    const getHighestZPIDsFromDBSQL = 'Select top 1 zpid from Zeitplan order by zpid desc'

    const highestZPIDfromDBJSON = await utils.dbOp(config.hdb, getHighestZPIDsFromDBSQL)
    const highestZPIDfromDBArray = utils.jsonRowsToArrayRows(highestZPIDfromDBJSON)

    var newZPID = 0

    if (highestZPIDfromDBArray.length == 0) {
        newZPID = 1
    } else if (highestZPIDfromDBArray.length >= 1) {
        const highestZPID = highestZPIDfromDBArray[0][0]
        newZPID = highestZPID + 1
    }

    return newZPID
}

async function checkForDuplicate(newEntryData) {
    var valid = true

    const getTimeTablesSQL = 'Select Datum_Beginn, Datum_Ende, Mo, Di, Mi,Do,Fr,Sa,So from Zeitplan'
    const exsistingTimeTablesDB = await utils.dbOp(config.hdb, getTimeTablesSQL)
    const exsistingTimeTables = utils.jsonRowsToArrayRows(exsistingTimeTablesDB)
    //Einbauen, wenn noch gar kein Time Table angelegt ist ! 


    const datum_beginn = await transformDate(newEntryData[0])
    const datum_ende = await transformDate(newEntryData[1])
    console.log(datum_beginn)
    console.log(datum_ende)




    for (var i = 0; i < exsistingTimeTables.length; i++) {
        if (exsistingTimeTables[i][0] == datum_beginn && exsistingTimeTables[i][1] == datum_ende &&
            exsistingTimeTables[i][2] == newEntryData[2] && exsistingTimeTables[i][3] == newEntryData[3] &&
            exsistingTimeTables[i][4] == newEntryData[4] && exsistingTimeTables[i][5] == newEntryData[5] &&
            exsistingTimeTables[i][6] == newEntryData[6] && exsistingTimeTables[i][7] == newEntryData[7] &&
            exsistingTimeTables[i][8] == newEntryData[8]) {

            valid = false
        }
    }
    console.log(valid)
    return valid;
}

async function transformDate(dateString) {

    // Möglich für diese Schreibweise! 02.01.2020

    var day = dateString.slice(0, 2)
    var month = dateString.slice(3, 5)
    var year = dateString.slice(6, 10)

    const dateFormatted = '' + year + '-' + month + '-' + day + ''
    return dateFormatted

}

async function insertZeitplaninDB(entry) {
    console.log('I come here!')
    const insertTimeTableSQL = 'Insert into Zeitplan values (?,?,?,?,?,?,?,?,?,?)'
    await utils.dbOp(config.hdb, insertTimeTableSQL, entry);
}


//transformDate('02.01.2020').catch(console.log)

//checkForDuplicate(['02.01.2020', '30.12.2020', 0, 1, 0, 1, 0, 1, 1]).catch(console.log)

