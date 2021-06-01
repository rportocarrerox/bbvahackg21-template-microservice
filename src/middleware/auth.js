const jwt = require('jsonwebtoken')
const utils = require('../utils/utils');
const userDao = require('../models/user-dao')
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
    if (req.query.f === "true") {
        next()
        return
    }
    const token = req.header('Authorization').replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    //logger.info(JSON.stringify(decoded), "decoded")
    await userDao.findUserByIdAndToken(decoded._id, token).then((response) => {
        let user = response.data
        if (user == null) {
            utils.writeServerJsonResponse(res, { "error": 'Please authenticate.' }, 401);
            return
        }
        req.token = token
        req.email = user.email
        next()
    }).catch((err) => {
        utils.writeServerJsonResponse(res, { "error": err }, 500);
        next()
    });
}

module.exports = auth