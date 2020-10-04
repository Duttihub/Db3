const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');


async function fahrtenErzeugen(fsid) {
    let fahrten = []

    const gesamtdauer_in_sekunden = await calculateDauer(fsid)

    for (let f = 0; f < 3; f++) {

        var fid = f + 1
        var start = await calculateStart(fsid, f)
        var ende = await calculateEnde(fsid, start, gesamtdauer_in_sekunden)
        let entryEINEFahrt = [fid, fsid, start, ende]
        //Hier müssen eigentlich die Halte zur Fahrt erezugt werden !
        halteErzeugen(fid, fsid)
        fahrten.push(entryEINEFahrt)

        //HIER FEHLT NOCH DER BULK LOAD IN DIE DB HALTE UND FAHRTEN !!
    }

}




async function halteErzeugen(fid, fsid) {
    let halte = []
    const anzahl_haltestellen = await getAnzahlHaltestellen(fsid)

    for (let h = 1; h < anzahl_haltestellen.length; h++) {

    }

    return null
}




async function calculateStart(fsid, f) {
    const freq = await getFrequenz(fsid)
    const ersteFahrtSQL = `select ZEIT_ERSTE_FAHRT from fahrtenspez where fsid=${fsid}`
    const ersteFahrtFromDB = await utils.dbOp(config.hdb, ersteFahrtSQL)
    const ersteFahrtINArray = utils.jsonRowsToArrayRows(ersteFahrtFromDB)
    const ersteFahrt = ersteFahrtINArray[0][0]



    //addsecondsauführen
    //Holen Datum Beginn der Fahrt überZeitplan
    const datum_beginn = await getDatumBeginn(fsid)

    //AddSeconds ausführen
    const seconds_to_add = freq * f
    var startTimestamp = await addSecondsAusfuehren(fsid, datum_beginn, ersteFahrt, seconds_to_add)

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

    return gesamtdauer
}

async function calculateEnde(fsid, start, gesamtdauer_in_sekunden) {




    //Holen Datum Beginn der Fahrt überZeitplan
    const datum_beginn = await getDatumBeginn(fsid)

    //AddSeconds ausführen
    var endTimestamp = await addSecondsAusfuehren(fsid, datum_beginn, start, gesamtdauer_in_sekunden)

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
    const endHaltestelle = 1
    const anzahlHalteZeiten = anzahlHalteAbschnitte - startHaltestelle - endHaltestelle
    console.log(anzahlHalteZeiten)
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


async function addSecondsAusfuehren(fsid, datum_beginn, start, dauer_in_sekunden) {
    const addsecondsSQL = ` SELECT ADD_SECONDS (TO_TIMESTAMP ('${datum_beginn} ${start}'), ${dauer_in_sekunden}) "add seconds" FROM DUMMY; `
    const addsecondsFromDB = await utils.dbOp(config.hdb, addsecondsSQL)
    const addsecondsINArray = utils.jsonRowsToArrayRows(addsecondsFromDB)
    const addseconds = addsecondsINArray[0][0]

    return addseconds
}


getAnzahlHaltestellen(1).catch(console.log)
//fahrtenErzeugen(1).catch(console.log)

//calculateStart(1, 2).catch(console.log)

//getDatumBeginn(1).catch(console.log)

//calculateEnde(1).catch(console.log)

//getAbschnitteForUnterline(1).catch(console.log)

//getAnzahlHalteZeiten(1).catch(console.log)

//getSegmentdauerforAbschnitt(1).catch(console.log)
