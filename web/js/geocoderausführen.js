const gc = require('./geocoder');
let array = ['Torstrasse', 'Marienstrasse 18']


gc.getSourceandTarget(array).catch(console.log);
//gc.fetchGeocoder('Marienstrasse 18');