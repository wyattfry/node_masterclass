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
        console.log(firstName, lastName, phone, password, tosAgreement)
        callback(400, {'Error': 'Missing required field(s).'});
    }
}

handlers._users.get = (data, callback) => {
    // required: phone
    // TODO only let users get their own user
    // validate phone
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
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
}

handlers._users.put = (data, callback) => {
    // required: phone
    // optional: firstName, lastName, password (at least 1)
    // TODO only let users update their own user
    // check for required field phone in req body
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
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
}

handlers._users.delete = (data, callback) => {
    // required: phone
    // TODO: users can only delete their own user
    // Validate phone
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
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
}

handlers.notfound = (data, callback) => {
    callback(404);
};

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

module.exports = handlers;