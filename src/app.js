const express = require('express')
const userRouter = require('./routers/user')
const cfenv = require("cfenv");
const bodyParser = require('body-parser');
require('dotenv').config()
const cors = require('cors');

const app = express()

//app.use(bodyParser.json());
app.use(express.json())
app.use(cors());
app.options('*', cors());

app.use(userRouter)

module.exports = app