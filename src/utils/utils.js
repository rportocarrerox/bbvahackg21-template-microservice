const Cloudant = require('@cloudant/cloudant');
const logger = require('../utils/logger');
const vcap = require('../../config/vcap-local.json');


function dbCloudantConnect() {
    return new Promise((resolve, reject) => {
        Cloudant({
            url: vcap.services.cloudantNoSQLDB.credentials.url
        }, ((err, cloudant) => {
            if (err) {
                logger.error('Connect failure: ' + err.message);
                console.log(err.message)
                reject(err);
            } else {
                dbname = process.env.DATABASE
                let database
                cloudant.db.list().then((body) => {
                    database = body.find((db) => {
                        return db === dbname
                    });
                    if(typeof database === 'undefined') {
                        cloudant.db.create(dbname).then(() => {
                            logger.info("Database: " + dbname + " created")
                            //database = cloudant.use(dbname);
                        }).catch((err) => {
                            console.log(err);
                        });
                    } else {
                        
                    }
                }).catch((err) => { 
                    logger.error(err); 
                });
                database = cloudant.db.use(dbname);
                logger.info('Connect success! Connected to DB: ' + dbname);
                logger.info(database)
                resolve(database);
            }
        }));
    });
}

function writeServerResponse(response, responseMessage, statusCode) {
    logger.debug(responseMessage, `writeServerResponse(${statusCode})`);
   response.statusCode = statusCode;
   response.write(responseMessage);
   response.end();
}

function writeServerJsonResponse(response, responseJson, statusCode) {
    logger.debug(JSON.stringify(responseJson), `writeServerJsonResponse(${statusCode})`);
    response.setHeader('Content-Type', 'application/json');
    response.status(statusCode).send(responseJson);
}

module.exports.writeServerResponse = writeServerResponse;
module.exports.writeServerJsonResponse = writeServerJsonResponse;
module.exports.dbCloudantConnect = dbCloudantConnect;