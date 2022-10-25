const validUrl = require('valid-url');
const urlmodel = require("../models/urlmodel")
const shortid = require('shortid');
const redis = require("redis")
const { promisify } = require("util")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}
let urlRegex = "((http|https)://)(www.)?"
    + "[a-zA-Z0-9@:%._\\+~#?&//=]{2,256}\\.[a-z]"
    + "{2,6}\\b([-a-zA-Z0-9@:%._\\+~#?&//=]*)"




const redisClient = redis.createClient(
    11463,
    "redis-11463.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("I7PEnFrz6bJlx5S4m4ONGocHy6Zz97tP", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);





const createUrl = async function (req, res) {
    try {
        if (!Object.keys(req.body).length > 0) {
            return res.status(400).send({ status: false, message: "Please provide some data in body" })
        }

        if (Object.keys(req.body).length > 1) {
            return res.status(400).send({ status: false, message: "Please provide only longUrl" })
        }
        let { longUrl} = req.body
        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "longUrl is required" })
        }

        if (!longUrl.match(urlRegex)) {
            return res.status(400).send({ status: false, message: "invalid Url" })
        }

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "invalid url" })
        }

        let longurl1 = await GET_ASYNC(`${longUrl}`)
        

        if (longurl1) {
            let data = JSON.parse(longurl1)
        
            return res.status(200).send({ status: true, message: "url already present", data: data })
        }

        let findUrl = await urlmodel.findOne({ longUrl: longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
        if (findUrl) {
            return res.status(200).send({ status: true, message: "url already present", data: findUrl })
        }


        const urlcode = shortid.generate().toLowerCase()
        const shorturl = `http://${req.get("host")}/${urlcode}`
        const savedata = {
            "longUrl": longUrl,
            "urlCode": urlcode,
            "shortUrl": shorturl
        }

        const createData = await urlmodel.create(savedata)
        const url = {...createData.toObject()}
        delete url._id
        delete url.__v
        await SET_ASYNC(`${longUrl}`, JSON.stringify(url))
        return res.status(201).send({ status: true, data: url })
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

const getUrl = async function (req, res) {
    try {
        let urlcode1 = req.params.urlCode
        if(shortid.isValid(urlcode1)) return res.status(400).send({status:false, message:"UrlCode Is InValid"})
        
        let urlcode = await GET_ASYNC(`${urlcode1}`)

        if (urlcode) {
            let data = JSON.parse(urlcode)
            return res.status(302).redirect(data.longUrl)
        } else {
            const findurlLink = await urlmodel.findOne({ urlCode: urlcode1 })
            if (!findurlLink) return res.status(404).send({ status: false, message: "Url Not Found" })
            await SET_ASYNC(`${urlcode1}`, JSON.stringify(findurlLink))
            return res.status(302).redirect(findurlLink.longUrl)
        }
    } catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}

module.exports = { createUrl, getUrl }
