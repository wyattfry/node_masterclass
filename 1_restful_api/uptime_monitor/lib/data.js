// Library for storing and editing data

// Dependencies
const fs = require('fs');
const path = require('path');

// Container for the module to be exported
const lib = {};

// base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');


lib.create = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // convert "data" to string
            const stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);                                
                        } else {
                            callback('Error closing file.');
                        }
                    })
                } else {
                    callback('Error writing to new file.');
                }
            })
        } else {
            callback('Could not create new file, it may already exist');
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
        if (!err) {
            callback(false, JSON.parse(data));
        } else {
            callback(err);
        }
    });
};


lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor, (err) => {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file.');
                                }
                            });
                        } else {
                            callback('Error writing to existing file.')
                        }
                    });
                } else {
                    callback('Error truncating file.');
                }
            });
        } else {
            callback('Could not open the file to update. It may not exist.');
        }
    });
};

lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting the file.');
        }
    });
}

module.exports = lib;

