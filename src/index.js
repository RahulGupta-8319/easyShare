const cors = require('cors')
const express = require('express');
const bodyParser = require('body-parser')
const route = require('./routes/route');
const mongoose = require('mongoose');
const app = express();
const path = require('path')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



mongoose.connect("mongodb+srv://Monalisamishra:MDYlL3MKtGxQa59a@cluster0.7zrfpkj.mongodb.net/group4Database", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use(express.static(path.join(__dirname,"../client/build")))
app.get("*",function(req,res){
    res.sendFile(path.join(__dirname,"../client/build/index.html"))
})

app.use('/', route);

app.use((req, res, next) => {
    const error = new Error('/ Path not found /');
    return res.status(400).send({ status: 'ERROR', error: error.message })
});


app.listen(process.env.PORT || 3001, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3001))
});