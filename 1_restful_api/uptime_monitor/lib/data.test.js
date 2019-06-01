const assert = require('assert').strict;
const crypto = require("crypto");
const fs = require('fs');
const path = require('path');

const dir = 'test';
const pathToDataDir = path.join(__dirname, '..', '.data', dir)

if (!fs.existsSync(pathToDataDir)) {
    fs.mkdirSync(pathToDataDir);
}

const file = crypto.randomBytes(16).toString("hex");
const testData = 'test data';

const _data = require('./data');

_data.read(dir, file, (err, data) => {
    assert(err != undefined, 'err should be defined when reading from a non existent dir/file.');
    assert(data === undefined, 'data should not be defined when reading from a non existent dir/file.');
});

_data.delete(dir, file, (err) => {
    assert(err != undefined, 'err should be defined when deleting a non existent dir/file.');
});

_data.update(dir, file, testData, (err) => {
    assert(err != undefined, 'err should be defined when updating a non existent dir/file.');
});

_data.create(dir, file, testData, (err) => {
    assert.deepEqual(err, false, 'err should be false when creating a new dir/file.');

    _data.create(dir, file, testData, (err) => {
        assert(err !== false, 'err should be defined when creating a dir/file that already exists.');

        _data.read(dir, file, (err, data) => {
            assert.deepEqual(err, false, 'err should be false when reading from an existent dir/file.');
            assert.deepEqual(data, testData, 'data should be defined when reading from an existent dir/file.');
        
            const updatedTestData = 'Updated test data.';

            _data.update(dir, file, updatedTestData, (err) => {
                assert.deepEqual(err, false, 'err should be false when updating an existent dir/file.');

                _data.read(dir, file, (err, data) => {
                    assert.deepEqual(err, false, 'err should be false when reading from an updated dir/file.');
                    assert.deepEqual(data, updatedTestData, 'data should be updated.');

                    _data.delete(dir, file, (err) => {
                        assert.deepEqual(err, false, 'err should be false when deleting an existent dir/file.');
    
                        _data.read(dir, file, (err, data) => {
                            assert(err != undefined, 'err should be defined when reading from a deleted dir/file.');
                            assert.deepEqual(data, undefined, 'data should not be defined when reading from a deleted dir/file.');
                        });
    
                    });

                });

            });
        
        });        

    });

});
