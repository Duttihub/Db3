const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');

module.exports = {
    fahrtenErzeugen: async function (fsid) {
        let fahrten = []
        var halte = null
        var result = 'Hier ist ein Fehler unterlaufen'

        const gesamtdauer_in_sekunden = await calculateDauer(fsid)
        const datum_beginn = await getDatumBeginn(fsid)

        const letztFahrtFahrtSpez = await getLetzteFahrtFahrtSpez(fsid)
        console.log('letzte Fahrt ' + letztFahrtFahrtSpez)
        var index = 0

        do {

            var fid = index + 1
            var start = await calculateStart(fsid, index, datum_beginn)
            var ende = await calculateEnde(fsid, start, gesamtdauer_in_sekunden, datum_beginn)
            let entryEINEFahrt = [fid, fsid, start, ende]
            console.log(entryEINEFahrt)


            const insertFahrtenSQL = 'insert into fahrt values (?,?,?,?)'
            await utils.dbOp(config.hdb, insertFahrtenSQL, entryEINEFahrt)

            console.log('moin')
            halte = await halteErzeugen(fid, fsid, datum_beginn, start)
            const insertHalteSQL = 'Insert into Halt values (?,?,?,?,?,?)'
            await utils.dbBulkOp(config.hdb, insertHalteSQL, halte)

            index++

            result = 'alles gut! Halte und Fahrten konnten hinzugefügt werden '
        }
        while (start < letztFahrtFahrtSpez)



        return result



    }

}

//fahrtenErzeugen(1).catch(console.log)
//halteErzeugen(1, 1, '2020-01-02').catch(console.log)

//getLetzteFahrtFahrtSpez(1).catch(console.log)

async function getLetzteFahrtFahrtSpez(fsid) {
    const letzteFahrtSQL = ` Select ZEIT_LETZTE_FAHRT from fahrtenspez where fsid= ${fsid}`
    const letzteFahrtFromDB = await utils.dbOp(config.hdb, letzteFahrtSQL)
    const letzteFahrtINArray = utils.jsonRowsToArrayRows(letzteFahrtFromDB)
    const letzteFahrt = letzteFahrtINArray[0][0]
    return letzteFahrt
}

async function halteErzeugen(fid, fsid, datum_beginn, start) {
    let halte = []
    const anzahl_haltestellen = await getAnzahlHaltestellen(fsid)
    const startHaid = await getStartHAID()

    for (let h = 1; h <= anzahl_haltestellen; h++) {
        var hid = await getHaltestellenID(fsid, h, anzahl_haltestellen)
        var haid;

        haid = startHaid + h

        var nr = h

        var abfahrtLetzerHalt = await getAbfahrtLetzerHalt(h, halte, fid, start)
        var vorherigeHaltestelle = await getVorherigeHaltestelle(h, halte, hid)



        var ankunft = await getAnkunftHalt(h, abfahrtLetzerHalt, vorherigeHaltestelle, hid, datum_beginn)
        var abfahrt = await getAbfahrtHalt(ankunft, h, datum_beginn)

        let halt = [haid, fid, hid, nr, ankunft, abfahrt]
        console.log('Ich bin Halt' + halt)
        halte.push(halt)

    }


    return halte
}



async function getAbfahrtHalt(ankunft, index, datum_beginn) {
    var abfahrt;
    if (index == 1) {
        abfahrt = ankunft

    } else {
        //addSekunds durchführen
        const haltezeit = 30
        var abfahrtString = await addSecondsAusfuehren(datum_beginn, ankunft, haltezeit)
        var abfahrt = abfahrtString.slice(11, 19)

    }



    return abfahrt

}


async function getVorherigeHaltestelle(index, halte, hid) {
    var vorherigerHalt;
    if (index == 1) {
        vorherigerHalt = hid
    } else {
        const lastIndex = index - 2
        vorherigerHalt = halte[lastIndex][2]


    }

    return vorherigerHalt
}

async function getAbfahrtLetzerHalt(index, halte, fid, start) {
    var abfahrtLetzerHalt;
    if (index == 1) {
        abfahrtLetzerHalt = start

    } else {
        const lastIndex = index - 2
        abfahrtLetzerHalt = halte[lastIndex][5]
    }

    return abfahrtLetzerHalt
}

async function getAnkunftHalt(index, abfahrtLetzerHalt, vorherigeHaltestelle, hid, datum_beginn) {

    var ankunft;
    if (index == 1) {
        ankunft = abfahrtLetzerHalt
    } else {
        //Hole ich mit die Abfahrt am letzten Halt + Segmentdauer= Ankunft 
        const segmentdauer = await getSegmentdauer(vorherigeHaltestelle, hid)



        //AddSeconds ausführen

        var ankunftString = await addSecondsAusfuehren(datum_beginn, abfahrtLetzerHalt, segmentdauer)

        var ankunft = ankunftString.slice(11, 19)


    }


    return ankunft

}



async function getSegmentdauer(hid_a, hid_b) {
    const segmentdauerSQL = ` Select DAUER_IN_SEK from segmentdauer where hid_a= ${hid_a} and hid_b=${hid_b}`
    const segmentdauerFromDB = await utils.dbOp(config.hdb, segmentdauerSQL)
    const segmentdauerINArray = utils.jsonRowsToArrayRows(segmentdauerFromDB)
    const segmentdauer = segmentdauerINArray[0][0]

    return segmentdauer
}


async function getHaltestellenID(fsid, index, anzahl_haltestellen) {
    var hid;
    const ulid = await getULIDforFahrtenspez(fsid)
    const lastIndex = index - 1
    if (index < anzahl_haltestellen) {
        const hidSQL = `select hid_a from abschnitt where ulid=${ulid} and nr=${index}`
        const hidFromDBJSON = await utils.dbOp(config.hdb, hidSQL)
        const hidINArray = utils.jsonRowsToArrayRows(hidFromDBJSON)
        hid = hidINArray[0][0]
    } else {
        const lasthidSQL = `select hid_b from abschnitt where ulid=${ulid} and nr=${lastIndex}`
        const lasthidFromDBJSON = await utils.dbOp(config.hdb, lasthidSQL)
        const lasthidINArray = utils.jsonRowsToArrayRows(lasthidFromDBJSON)
        hid = lasthidINArray[0][0]
    }


    return hid
}

async function getStartHAID() {
    const getHighestHAIDsFromDBSQL = 'Select top 1 haid from Halt order by haid desc'

    const highestHAIDfromDBJSON = await utils.dbOp(config.hdb, getHighestHAIDsFromDBSQL)
    const highestHAIDfromDBArray = utils.jsonRowsToArrayRows(highestHAIDfromDBJSON)
    var highestHAID;


    if (highestHAIDfromDBArray.length == 0) {
        highestHAID = 0
    } else if (highestHAIDfromDBArray.length >= 1) {
        highestHAID = highestHAIDfromDBArray[0][0]
    }

    return highestHAID
}




async function calculateStart(fsid, f, datum_beginn) {
    const freq = await getFrequenz(fsid)
    const ersteFahrtSQL = `select ZEIT_ERSTE_FAHRT from fahrtenspez where fsid=${fsid}`
    const ersteFahrtFromDB = await utils.dbOp(config.hdb, ersteFahrtSQL)
    const ersteFahrtINArray = utils.jsonRowsToArrayRows(ersteFahrtFromDB)
    const ersteFahrt = ersteFahrtINArray[0][0]


    //AddSeconds ausführen
    const seconds_to_add = freq * f
    var startTimestamp = await addSecondsAusfuehren(datum_beginn, ersteFahrt, seconds_to_add)

    var startTime = startTimestamp.slice(11, 19)


    return startTime

}

async function calculateDauer(fsid) {

    //Segmentdauer für alle Halte der Unterlinie einholen
    const segmentdauernAbschnitte = await getSegmentdauerforAbschnittederUnterlinie(fsid)

    //+ gesammte Haltezeit von 30 sec
    const anzahlHalteZeiten = await getAnzahlHalteZeiten(fsid)
    const halteZeitGesamt = anzahlHalteZeiten * 30


    //Errechnen Gesamtdauer mit HalteZeit in Sekunden
    const gesamtdauer = segmentdauernAbschnitte + halteZeitGesamt

    console.log('i am Gesamtdauer' + gesamtdauer)

    return gesamtdauer
}

async function calculateEnde(fsid, start, gesamtdauer_in_sekunden, datum_beginn) {


    //AddSeconds ausführen
    var endTimestamp = await addSecondsAusfuehren(datum_beginn, start, gesamtdauer_in_sekunden)

    var endTime = endTimestamp.slice(11, 19)

    return endTime



    //Errechnen EndeZeitpunkt der Fahrt 
    //const ende = start +


    //--> Wobei man den oberen Teil ja für eine fahrtenspez - also unterlinie nur einmal machen muss! 
    // dann kann man ja einfach start+ ErgebnisObererteil = Ende für allle weiterern!

}

async function getFrequenz(fsid) {
    const freqSQL = `select FREQUENZ_IN_SEK from fahrtenspez where fsid=${fsid}`
    const freqFromDB = await utils.dbOp(config.hdb, freqSQL)
    const freqINArray = utils.jsonRowsToArrayRows(freqFromDB)
    const freq = freqINArray[0][0]

    return freq
}

async function getULIDforFahrtenspez(fsid) {
    const ulidSQL = `Select ulid from fahrtenspez where fsid=${fsid}`
    const ulidFromDB = await utils.dbOp(config.hdb, ulidSQL)
    const ulidINArray = utils.jsonRowsToArrayRows(ulidFromDB)
    const ulid = ulidINArray[0][0]
    return ulid
}

async function getAbschnitteForUnterline(fsid) {
    const ulid = await getULIDforFahrtenspez(fsid)
    const abschnitteUnterlineSQL = `select * from abschnitt where ulid=${ulid}`
    const abschnitteUnterlineFromDB = await utils.dbOp(config.hdb, abschnitteUnterlineSQL)
    const abschnitteUnterlineINArray = utils.jsonRowsToArrayRows(abschnitteUnterlineFromDB)
    return abschnitteUnterlineINArray

}

async function getSegmentdauerforAbschnittederUnterlinie(fsid) {

    const abschnitteUnterline = await getAbschnitteForUnterline(fsid)
    var segmentdauernAbschnitte = 0
    for (let i = 0; i < abschnitteUnterline.length; i++) {
        const abschnitt = abschnitteUnterline[i]
        var hid_a = abschnitt[2]
        var hid_b = abschnitt[3]
        const sdSQL = `Select* from segmentdauer where hid_a=${hid_a} and hid_b=${hid_b}`
        const sdFromDB = await utils.dbOp(config.hdb, sdSQL)
        const sdINArray = utils.jsonRowsToArrayRows(sdFromDB)

        var dauerSegment = sdINArray[0][2]

        segmentdauernAbschnitte = segmentdauernAbschnitte + dauerSegment

    }
    return segmentdauernAbschnitte

}

async function getAnzahlHalteZeiten(fsid) {
    const ulid = await getULIDforFahrtenspez(fsid)
    const anzahlHalteAbschnitteSQL = `select top 1  nr from abschnitt where ulid=${ulid} order by nr desc `
    const anzahlHalteAbschnitteFromDB = await utils.dbOp(config.hdb, anzahlHalteAbschnitteSQL)
    const anzahlHalteAbschnitteINArray = utils.jsonRowsToArrayRows(anzahlHalteAbschnitteFromDB)
    const anzahlHalteAbschnitte = anzahlHalteAbschnitteINArray[0][0]
    const startHaltestelle = 1
    const anzahlHalteZeiten = anzahlHalteAbschnitte - startHaltestelle

    return anzahlHalteZeiten
}

async function getAnzahlHaltestellen(fsid) {
    const ulid = await getULIDforFahrtenspez(fsid)
    const anzahlStationenSQL = `Select ANZAHL_STATIONEN from Unterlinie where ulid=${ulid} `
    const anzahlStationenFromDB = await utils.dbOp(config.hdb, anzahlStationenSQL)
    const anzahlStationenINArray = utils.jsonRowsToArrayRows(anzahlStationenFromDB)
    const anzahlStationen = anzahlStationenINArray[0][0]
    return anzahlStationen
}

async function getDatumBeginn(fsid) {
    const datumBeginnSQL = `Select datum_beginn from Zeitplan z join fahrtenspez fs on z.zpid=fs.zpid where fs.fsid=${fsid} `
    const datumBeginnFromDB = await utils.dbOp(config.hdb, datumBeginnSQL)
    const datumBeginnINArray = utils.jsonRowsToArrayRows(datumBeginnFromDB)
    const datumBeginn = datumBeginnINArray[0][0]
    return datumBeginn
}


async function addSecondsAusfuehren(datum_beginn, start, dauer_in_sekunden) {
    const addsecondsSQL = ` SELECT ADD_SECONDS (TO_TIMESTAMP ('${datum_beginn} ${start}'), ${dauer_in_sekunden}) "add seconds" FROM DUMMY; `
    const addsecondsFromDB = await utils.dbOp(config.hdb, addsecondsSQL)
    const addsecondsINArray = utils.jsonRowsToArrayRows(addsecondsFromDB)
    const addseconds = addsecondsINArray[0][0]

    return addseconds
}

//halteErzeugen(1, 1, '2020-01-02').catch(console.log)

//getAnkunftHalt(2, '06:00', 10020, 10053, '2020-01-02').catch(console.log)

//getAbfahrtHalt('06:00:00', 2, '2020-01-02').catch(console.log)
//getStartderFahrt(1).catch(console.log)
//getHaltestellenID(1, 1).catch(console.log)

//getnewHAID().catch(console.log)
//getAnzahlHaltestellen(1).catch(console.log)
//fahrtenErzeugen(1).catch(console.log)

//calculateStart(1, 2).catch(console.log)

//getDatumBeginn(1).catch(console.log)

//calculateEnde(1).catch(console.log)

//getAbschnitteForUnterline(1).catch(console.log)

//getAnzahlHalteZeiten(1).catch(console.log)

//getSegmentdauerforAbschnitt(1).catch(console.log)
