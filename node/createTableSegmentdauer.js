const config = require('../../../code-node/config/config');
const utils = require('../../../code-node/lib/utils');

/**
 * Dieses Skrip zuvor in DbVisualizer ausgeführt:
 *
 *CREATE TABLE Segmentdauer (
    HID_A integer,
    HID_B integer,
    DAUER_IN_SEK integer,
   ....
);

 * alter table Segmentdauer add foreign key(hid_a, hid_b) references segment(hid_a,hid_b);
 */

