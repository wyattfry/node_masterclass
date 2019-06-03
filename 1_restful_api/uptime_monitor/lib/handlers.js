// request handlers

// dependencies
const _data = require('./data');
const helpers = require('./helpers');

const handlers = {};

handlers.users = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405); // Method not allowed
    }
}

handlers._users = {};

// required: firstName, lastName, phone, password, tosAgreement

handlers._users.post = (data, callback) => {
    // check if all required fields filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' ? data.payload.tosAgreement : false;
    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, (err, data) => {
            if (err) {
                // OK to procede creating user, it does not already exist.
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true,
                    };
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(201)
                        } else {
                            callback(500, {'Error': 'Could not create new user.'});
                        }
                    });
                } else {
                    callback(500, {'Error': 'Could not hash the password.'});
                }
            } else {
                callback(409, {'Error': 'A user with that phone already exists.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s).'});
    }
}

handlers._users.get = (data, callback) => {
    // required: phone
    // validate phone
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    // get token from headers
    console.log('data.headers', data.headers);
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
            if (phone) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        delete userData.hashedPassword;
                        callback(200, userData);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(400, {'Error': 'Missing required field.'});
            }
        } else {
            callback(403, {'Error': 'Token missing in header, or token is invalid.'});
        }
    });
}

handlers._users.put = (data, callback) => {
    // required: phone
    // optional: firstName, lastName, password (at least 1)
    // check for required field phone in req body
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
    const token = tyepoe(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
            const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
            const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
            const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
            if (phone && (firstName || lastName || password)) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        userData.firstName = firstName ? firstName : userData.firstName;
                        userData.lastName = lastName ? lastName : userData.lastName;
                        userData.hashedPassword = password ? helpers.hash(password) : userData.hashedPassword;
                        _data.update('users', phone, userData, (err) => {
                            if (!err) {
                                callback(200)
                            } else {
                                callback(500, {'Error': 'Could not update user.'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'The user does not exist.'});
                    }
                });
            } else {
                callback(400, {'Error': 'Missing required field.'});
            }
        } else {
            callback(403, {'Error': 'Token missing in header, or token is invalid.'});
        }
    });
}

handlers._users.delete = (data, callback) => {
    // required: phone
    // TODO: users can only delete their own user
    // Validate phone
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    const token = tyepoe(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
            if (phone) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, {'Error': 'Could not delete user.'});
                            }
                        });
                    } else {
                        callback(400, {'Error': 'Could not delete user.'});
                    }
                });
            } else {
                callback(400, {'Error': 'Missing required field.'});
            }
        } else {
            callback(403, {'Error': 'Token missing in header, or token is invalid.'});
        }
    });
}

handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405); // Method not allowed
    }
}

handlers._tokens = {};

handlers._tokens.post = (data, callback) => {
// required: phone, password
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    if (phone && password) {
        // get user with given phone
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires,
                    };
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create new token'});
                        }
                    });
                } else {
                    callback(400, {'Error': 'Wrong password.'});
                }
            } else {
                callback(400, {'Error': 'Could not find specified user.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required fields.'});
    }
};

handlers._tokens.get = (data, callback) => {
    // required: id
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }

};

handlers._tokens.put = (data, callback) => {
    // required: id, extend
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend === true ? data.payload.extend : false;
    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if (tokenData.expires > Date.now()) {
                tokenData.expires = Date.now() + 1000 * 60 * 60;
                _data.update('tokens', id, tokenData, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not update token expiration. ' + err});
                    }
                })
            } else {
                callback(400, {'Error': 'Token is expired, cannot be extended'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field(s) or invalid'});
    }
};

handlers._tokens.delete = (data, callback) => {
    // required: id
    // TODO users can only delete their own token
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete token.'});
                    }
                });
            } else {
                callback(400, {'Error': 'Could not delete token.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
};

handlers._tokens.verifyToken = (id, phone, callback) => {
    // look up token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers.notfound = (data, callback) => {
    callback(404);
};

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

module.exports = handlers;