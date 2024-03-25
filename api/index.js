const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Message = require("./models/Message");
const ws = require("ws");
const cookieParser = require("cookie-parser");
const fs = require("fs");
require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;
const mongoURL = process.env.MONGO_URL;
const clientURL = process.env.CLIENT_URL;
const bcryptSalt = bcrypt.genSaltSync(10);


mongoose.connect(mongoURL);

const app = express();
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.json());
app.use(cookieParser());   

app.use(cors({
    credentials: true,
    origin: clientURL
}));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject("no token");
        }
    });
}


app.get("/test", function(req,res) {
    res.json("test ok");
});

app.get("/messages/:userId", async function(req, res){
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    // console.log({userId, ourUserId});
    const messages = await Message.find({
        sender:{$in:[userId,ourUserId]},
        recipient:{$in:[userId,ourUserId]}
    }).sort({createdAt:1});
    res.json(messages);
});

app.get("/people", async (req, res) => {
    const users = await User.find({}, {"_id":1, username:1});
    res.json(users);
})

app.get("/profile", function(req, res) {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            res.json(userData);
        });
    } else {
        res.status(401).json("no token sorry");
    }
});


app.post("/login", async function(req, res) {
    console.log("*******Login Attempt************");
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
        const passOK = bcrypt.compareSync(password, foundUser.password)
        if (passOK) {
            jwt.sign({userId:foundUser._id, username}, jwtSecret, {}, (err, token) => {
                res.cookie("token", token, {sameSite:'none', secure:true}).json({
                    id: foundUser._id,
                });
            });
        }
    }

});

app.post("/logout", (req, res) => {
    res.cookie("token", "", {sameSite: "none", secure:true}).json("ok");
})

app.post("/register", async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({username: username, 
            password: hashedPassword});
        jwt.sign({userId:createdUser._id, username}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie("token", token, {sameSite: "none", secure:true}).status(201).json({
                id: createdUser._id,
            });
        });
    } catch(err) {
        if (err) throw err;
        res.status(500).json("error");
    }
});



const host = process.env.HOST || '0.0.0.0'; // Binds to all network interfaces
const port = process.env.PORT || 3000; // Use the desired port number

const server = app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});

const wss = new ws.WebSocketServer({server});
wss.on("connection", (connection, req) => {

    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId, username:c.username}))
            }));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            // console.log("dead");
        }, 1000)
    }, 5000);

    connection.on("pong", () => {
        clearTimeout(connection.deathTimer)
        // console.log("pong");
    });


    // read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if (cookies) {
        const tokenCookieString = cookies.split(";").find(str => str.startsWith("token="));
        if (tokenCookieString) {
            // console.log(tokenCookieString)
            const token = tokenCookieString.split("=")[1]
            if (token) {
                jwt.verify(token, jwtSecret, {}, (err, userData) =>{
                    if (err) throw err;
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                });
            }
        }
    }

    connection.on("message", async (message) => {
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;
        let filename = null;
        if (file) {
            console.log("size", file.data.length);
            const parts = file.name.split(".");
            const ext = parts[parts.length - 1];
            filename = Date.now() + "." + ext;
            const path = __dirname + "/uploads/" + filename;
            const bufferData = new Buffer(file.data.split(",")[1], "base64");
            fs.writeFile(path, bufferData, () => {
                console.log("file saved:"+path);
            });
        }
        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender:connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });
            console.log("created message");
            [...wss.clients]
            .filter(c => c.userId === recipient)
            .forEach(c => c.send(JSON.stringify({
                text, 
                sender:connection.userId,
                recipient,
                file: file ? filename : null,
                _id:messageDoc._id,
            })));
        }
    });

    // notify everyone about online people (when someone connects)
    notifyAboutOnlinePeople();
});

wss.on("close", data => {
    console.log("disconnected", data);
});

