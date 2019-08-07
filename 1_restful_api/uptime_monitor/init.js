const fs = require('fs');
const path = require ('path');

// base directory of the data folder
const baseDir = path.join(__dirname, '.data/');

// if .data/checks users tokens don't exist, create them
const tables = [
    'users',
    'tokens',
    'checks',
];

fs.mkdir(baseDir, 0744, (err) => {
    if (err) {
        console.error('Could not create directory', baseDir);
    } else {
        console.log('Created directory', baseDir);
        tables.forEach( (t) => {
            const dirToCreate = baseDir + t;
            fs.mkdir(dirToCreate, 0744, (err) => {
                if (err) {
                    console.error('Could not create directory', dirToCreate, err);
                } else {
                    console.log('Created directory', dirToCreate)
                }
            });
        });
    }
});
