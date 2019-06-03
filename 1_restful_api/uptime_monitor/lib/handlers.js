// request handlers

// dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

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
    // Validate phone
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
            if (phone) {
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                // delete user's checks
                                const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                const checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    // loop through checks
                                    userChecks.forEach((checkId) => {
                                        _data.delete('checks', checkId, (err) => {
                                            if (err) {
                                                deletionErrors = true;
                                            } else {
                                                checksDeleted += 1;
                                            }
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200)
                                                } else {
                                                    callback(500, {'Error': 'Encountered errors when deleting checks.'});
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
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

handlers.checks = (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405); // Method not allowed
    }
}

handlers._checks = {};

// post
// required: protocol, url, method, successCodes, timeoutSeconds
handlers._checks.post = (data, callback) => {
    // validate endpoints
    const protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone;
                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // make sure they have fewer than max checks allowed
                        if (userChecks.length < config.maxChecks) {
                            const checkId = helpers.createRandomString(20);
                            // create check object with ref to creator user
                            const checkObject = {
                                'id': checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds,
                            };
                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {
                                    // add checkId to user object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error': 'Could not update the user with the new check.'});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error': 'Could not save check.'});
                                }
                            });
                        } else {
                            callback(400, {'Error': `User already has maximum number of checks allowed. (${config.maxChecks})`});
                        }
                    } else {
                        callback(403, {'Error': err});
                    }
                });
            } else {
                callback(403, {'Error': err});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required inputs, or inputs invalid.'});
    }
};


handlers._checks.get = (data, callback) => {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    // get token from headers
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback()
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
}

handlers._checks.put = (data, callback) => {
    // required: id
    // optional: protocol, method, successCodes, timeoutSeconds
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;
    const protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    // check token
                    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            checkData.protocol = protocol ? protocol : checkData.protocol;
                            checkData.url = url ? url : checkData.url;
                            checkData.method = method ? method : checkData.method;
                            checkData.successCodes = successCodes ? successCodes : checkData.successCodes;
                            checkData.timeoutSeconds = timeoutSeconds ? timeoutSeconds : checkData.timeoutSeconds;
                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, {'Error': 'Could not update check.'});
                                }
                            });
                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(400, {'Error': 'CheckId did not exist.'});
                }
            });
        } else {
            callback(400, {'Error': 'Missing required field.'});    
        }
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
};

handlers._checks.delete = (data, callback) => {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if (tokenIsValid) {
                        _data.delete('checks', id, (err) => {
                            if (!err) {
                                _data.read('users', checkData.userPhone, (err, userData) => {
                                    if (!err && userData) {
                                        const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        const checkIndex = userChecks.indexOf(id);
                                        if (checkIndex > -1) {
                                            userChecks.splice(checkIndex, 1);
                                            _data.update('users', checkData.userPhone, userData, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {'Error': 'Could not update the user\'s object.'});
                                                }
                                            });
                                        } else {
                                            callback(500, {'Error': 'Could not find the check on the user\'s object.'});
                                        }
                                    } else {
                                        callback(500, {'Error': 'Could not find the user the created the check.'});
                                    }
                                });
                
                            } else {
                                callback(500, {'Error': 'Could not delete the check.'});
                            }
                        });
                    } else {
                        callback(403, {'Error': 'Token missing in header, or token is invalid.'});
                    }
                });
            } else {
                callback(400, {'Error': 'The requested check ID does not exist.'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field.'});
    }
};

handlers.notfound = (data, callback) => {
    callback(404);
};

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

module.exports = handlers;