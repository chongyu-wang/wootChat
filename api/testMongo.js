const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();

const app = express();

app.get("/test", function(req, res) {
    res.json("test ok");
})


// const mongoURL = "mongodb+srv://chongyu:AD4M5E14csDR6FwX@cluster0.dvmonhg.mongodb.net/?retryWrites=true&w=majority"
// const mongoURL = "mongodb+srv://sgbcharlie:password12345@cluster0.xnh4oj8.mongodb.net/?retryWrites=true&w=majority"
const mongoURL = "mongodb://sgbcharlie:password12345@ac-gn69rnm-shard-00-00.xnh4oj8.mongodb.net:27017,ac-gn69rnm-shard-00-01.xnh4oj8.mongodb.net:27017,ac-gn69rnm-shard-00-02.xnh4oj8.mongodb.net:27017/?ssl=true&replicaSet=atlas-qtfrz1-shard-0&authSource=admin&retryWrites=true&w=majority"
mongoose.connect(mongoURL);

app.listen(3000, function() {
    console.log("Port is running on port 3000")
});



