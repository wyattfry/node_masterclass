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

module.exports = helpers;