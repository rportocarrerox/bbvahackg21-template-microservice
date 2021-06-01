const logger = require('../utils/logger');
const utils = require('../utils/utils');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');

let db;

(function getDbConnection() {
    logger.info('Initializing Cloudant connection...', 'lists-dao-cloudant.getDbConnection()');
    utils.dbCloudantConnect().then((database) => {
        logger.info('Cloudant connection initialized.');
        db = database;
        logger.info(db)
    }).catch((err) => {
        logger.error('Error while initializing DB: ' + err.message);
        throw err;
    });
})();

function save(userBody) {
    let userId = uuidv4();
    userBody['_id'] = userId;
    userBody['id'] = userId;
    userBody['createdDate'] = Date.now();
    userBody['updatedDate'] = null;
    userBody.password = encryptPassword(userBody.password)
    userBody['token'] = null;
    //userToken = generateAuthToken(userBody)

    //logger.info("userBody")
    //logger.info(JSON.stringify(userBody))

    return new Promise((resolve, reject) => {
        findUserByEmail(userBody.email).then((response) => {
            let findUser = response.data != null
            if(findUser){
                logger.info('User founded', 'find user');
                resolve({
                    data: {
                        "error": "User exists. Please create a user with other parameters."
                    },
                    statusCode: 400
                })
                return
            }

            db.insert(userBody, (err, result) => {
                if (err) {
                    logger.error('Error occurred: ' + err.message, 'create()');
                    reject(err);
                } else {
                    resolve({ data: { user: toResponseBody(userBody) }, statusCode: 201 });
                }
            });
        })
    });
}

function findUserByEmail(email){
    return new Promise((resolve, reject) => {
        //logger.info(email)
        db.find({ 
            'selector': { 
                'email': email
            } 
        }, (err, documents) => {
            if (err) {
                logger.error('Error occurred: ' + err.message, 'find user');
                reject(err);
            } else {
                logger.info("User founded")
                //logger.info(JSON.stringify(documents.docs))
                resolve({ data: documents.docs.length > 0 ? JSON.stringify(documents.docs[0]) : null, statusCode: (documents.docs.length > 0) ? 200 : 204 });
            }
        });
    });
}

function findByCredentials (email, password) {
    return new Promise((resolve, reject) => {
        findUserByEmail(email).then((response) => {
            let user = response.data
            if (user == null) {
                resolve(
                    { data: {
                        "error": "Unable to login. User not found."
                    }, 
                    statusCode: 400 
                });
                return
            }

            user = JSON.parse(user)
            const isMatch = bcrypt.compareSync(password, user.password)

            if (!isMatch) {
                resolve(
                    { data: {
                        "error": "Unable to login. Bad credentials."
                    }, 
                    statusCode: 400 
                });
                return
            }

            if(user.token != null){
                resolve(
                    { data: {
                        "error": "Unable to login. Session has already active."
                    }, 
                    statusCode: 400 
                });
                return
            }

            const userToken = generateAuthToken(user)

            db.insert(user, (err, documents) => {
                if (err) {
                    logger.error('Error occurred: ' + err.message, 'logout');
                    reject(err);
                } else {
                    logger.info("User updated", "login")
                    //logger.info(JSON.stringify(documents.docs))
                }
            });
            
            logger.info("Login success!")
            resolve({ data: { user: toResponseBody(user), token: userToken }, statusCode: 200 });
        }).catch((error) => {
            reject(error)
        });
    });
}

function findUserByIdAndToken(id, token){
    return new Promise((resolve, reject) => {
        logger.info(id)
        logger.info(token)
        db.find({ 
            'selector': { 
                'id': id,
                'token': token
            } 
        }, (err, documents) => {
            if (err) {
                logger.error('Error occurred: ' + err.message, 'find user');
                reject(err);
            } else {
                logger.info("User founded")
                logger.info(JSON.stringify(documents.docs))
                resolve({ data: documents.docs.length > 0 ? JSON.stringify(documents.docs[0]) : null, statusCode: (documents.docs.length > 0) ? 200 : 204 });
            }
        });
    });
}

function logout(email){
    return new Promise((resolve, reject) => {
        //logger.info(email)
        findUserByEmail(email).then((response) => {
            let user = response.data
            if (user == null) {
                resolve(
                    { data: {
                        "error": "User not found."
                    }, 
                    statusCode: 400 
                });
                return
            }

            user = JSON.parse(user)
            user.token = null

            db.insert(user, (err, documents) => {
                if (err) {
                    logger.error('Error occurred: ' + err.message, 'logout');
                    reject(err);
                } else {
                    logger.info("User updated", "logout")
                    logger.info(JSON.stringify(documents.docs))
                    resolve({ data: null, statusCode: 204 });
                }
            });
        }).catch((error) => {
            reject(error)
        });
    });
}

function toResponseBody(userData){
    const userBody = {}
    userBody['email'] = userData.email
    userBody['name'] = userData.name
    return userBody
}

function generateAuthToken(userData) {
    const token = jwt.sign({ _id: userData._id }, process.env.JWT_SECRET)
    userData.token = token
    return token
}

function encryptPassword(password){
    return bcrypt.hashSync(password, 8)
}

module.exports.save = save
module.exports.findByCredentials = findByCredentials
module.exports.findUserByEmail = findUserByEmail
module.exports.findUserByIdAndToken = findUserByIdAndToken
module.exports.logout = logout
module.exports.toResponseBody = toResponseBody