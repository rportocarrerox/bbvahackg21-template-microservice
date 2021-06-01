const express = require('express')
const logger = require('../utils/logger');
const utils = require('../utils/utils');
const auth = require('../middleware/auth')
const userDao = require('../models/user-dao')
const router = new express.Router()
const cors = require('cors');

router.get('/users/me', auth, async (req, res) => {
    await userDao.findUserByEmail(req.email).then((result) => {
        //logger.info(JSON.stringify(result), '/users/me')
        const userBody = userDao.toResponseBody(JSON.parse(result.data));
        utils.writeServerJsonResponse(res, userBody, result.statusCode);
    }).catch((err) => {
        next(err);
    });
})

module.exports = router