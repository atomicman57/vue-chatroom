var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var Chat = require("../models/Chat.js");
var passport = require("passport");
var jwt = require("jsonwebtoken");
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 900 });

// Socket IO
server.listen(4000);
global.io = io;
io.on("connection", function(socket) {
  console.log("User connected");
  socket.on("disconnect", function() {
    console.log("User disconnected");
  });

  socket.on("join-room", function(data) {
    socket.userId = data.user._id
    socket.nickname = data.user.nickname
    if(!io.sockets.adapter.rooms[data.room]) {
      return socket.join(data.room)
    }
    if(io.sockets.adapter.rooms[data.room]) {
      if(!io.sockets.adapter.rooms[data.room].sockets[socket.id]) {
      socket.join(data.room)
      console.log("join", socket.nickname);
      io.emit("new-user", { message: data });
    }
  }

  });

  socket.on("kick-user-out", function(data) {
    let userSocket = io.sockets.connected[data.user.socketId];
    userSocket.leave(data.room);
    io.emit("user-kick-out", { message: data });
  });

  socket.on("ban-user", function(data) {
    let userSocket = io.sockets.connected[data.user.socketId];
    userSocket.leave(data.room);
    io.emit("ban-room-user", { message: data });
  });

  socket.on("leave-room", function(data) {
    socket.leave(data.room)
      io.emit("leave-room", { message: data });
  });

  socket.on("get-user", function(data) {
      io.emit(data.room, { message: getAllRoomMembers(data.room, '/', socket) });
  });
});

function getAllRoomMembers(room, _nsp, socket) {
  var roomMembers = [];
  var nsp = '/'
   if(io.sockets.adapter.rooms[room]) {
    for( var member in io.sockets.adapter.rooms[room].sockets ) {
        let userId = io.sockets.connected[member].userId
        let nickname = io.sockets.connected[member].nickname

        roomMembers.push({userId, nickname, socketId: member });
    }
  }
  roomMembers = removeDuplicates(roomMembers, 'userId');
  return roomMembers;
}


function removeDuplicates(originalArray, prop) {
  var newArray = [];
  var lookupObject  = {};

  for(var i in originalArray) {
     lookupObject[originalArray[i][prop]] = originalArray[i];
  }

  for(i in lookupObject) {
      newArray.push(lookupObject[i]);
  }
   return newArray;
}

/* GET ALL CHATS */
router.get(
  "/:roomid",
  passport.authenticate("jwt", { session: false }),
  function(req, res, next) {
    var token = getToken(req.headers);
    if (!token) {
      return res.status(403).send({ success: false, message: "Unauthorized." });
    }
    Chat.find({ room: req.params.roomid })
      .populate("sender")
      .populate("recipient")
      .exec(function(err, chats) {
        if (err) return next(err);
        res.json(chats);
      });
  }
);

/* GET SINGLE CHAT BY ID */
router.get("/:id", passport.authenticate("jwt", { session: false }), function(
  req,
  res,
  next
) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({ success: false, message: "Unauthorized." });
  }
  Chat.findById(req.params.id)
    .populate("sender")
    .populate("recipient")
    .exec(function(err, chat) {
      if (err) return next(err);
      res.json(chat);
    });
});

/* SAVE CHAT */
router.post("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res,
  next
) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({ success: false, message: "Unauthorized." });
  }
  var user = jwt.decode(token);
  req.body.sender = user._id;
  Chat.create(req.body, function(err, created_chat) {
    if (err) return next(err);
    return Chat.findById(created_chat._id)
      .populate("sender")
      .populate("recipient")
      .exec(function(err, chat) {
        if (err) return next(err);
        // global.io.sockets.emit('new-message', { message: chat});
        global.io.sockets.emit("new-message", { message: chat });
        return res.json(chat);
      });
    // res.json(post);
  });
});

/* UPDATE CHAT */
router.put("/:id", passport.authenticate("jwt", { session: false }), function(
  req,
  res,
  next
) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({ success: false, message: "Unauthorized." });
  }
  Chat.findByIdAndUpdate(req.params.id, req.body, function(err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE CHAT */
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  function(req, res, next) {
    var token = getToken(req.headers);
    if (!token) {
      return res.status(403).send({ success: false, message: "Unauthorized." });
    }
    Chat.findByIdAndRemove(req.params.id, req.body, function(err, post) {
      if (err) return next(err);
      res.json(post);
    });
  }
);

getToken = function(headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(" ");
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
