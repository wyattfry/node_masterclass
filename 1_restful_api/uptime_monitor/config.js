// Create and export config variables

const environments = {};

environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
};

environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
};

let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

const exportedEnvironment = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = exportedEnvironment;
