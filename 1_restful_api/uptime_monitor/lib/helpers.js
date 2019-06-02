const crypto = require('crypto');

const config = require('../config');

const helpers = {};

helpers.hash = (unhashedString) => {
    if (typeof(unhashedString) == 'string' && unhashedString.length > 0) {
        return crypto
            .createHmac('sha256', config.hashingSecret)
            .update(unhashedString)
            .digest('hex');
    } else {
        return false;
    }
}

helpers.parseJsonToObject = (stringToParse) => {
    try {
        return JSON.parse(stringToParse);
    } catch (exception) {
        return {};
    }
}

helpers.createRandomString = (length) => {
    length = typeof(length) == 'number' && length > 0 ? length : false;
    if (length) {
        const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
            randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }
        return randomString;
    } else {
        return false;
    }
};

module.exports = helpers;