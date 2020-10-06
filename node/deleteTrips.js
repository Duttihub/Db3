const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');

module.exports = {


    deleteTrips: async function (fsid) {
        //Holen der FID'S durch -->Select * from fahrt where fsid= 1;

        const FIDs = await getFIDforFSID(fsid)
        //Mit bulkload  Halt löschen! --> Dann brauche ich die for schleife nicht --sql params= fids
        const deleteHaltSQL = `Delete from Halt where fid=?`
        await utils.dbBulkOp(config.hdb, deleteHaltSQL, FIDs)

        //Mit bulkload Fahrt löschen -->sql params = fid 

        const deleteFahrtenSQL = `Delete from Fahrt where fid=?`
        await utils.dbBulkOp(config.hdb, deleteFahrtenSQL, FIDs)

        return 'Halte und FahrtenDatensätze wurden gelöscht '
    }

}

async function getFIDforFSID(fsid) {
    let FIDs = []
    const FIDSQL = ` Select fid from fahrt where fsid= ${fsid}`
    const FIDFromDB = await utils.dbOp(config.hdb, FIDSQL)
    const FIDsArray = utils.jsonRowsToArrayRows(FIDFromDB)

    return FIDsArray
}


//getFIDforFSID(1).catch(console.log)

//deleteTrips(1).catch(console.log)