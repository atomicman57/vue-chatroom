var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Room = require('../models/Room.js');
var passport = require('passport');
var jwt = require('jsonwebtoken');
var settings = require('../config/settings');


/* GET ALL ROOMS */
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  Room.find().
    populate('creator').
    exec(function (err, rooms) {
    if (err) return next(err);
    res.json(rooms);
  });
});

/* GET SINGLE ROOM BY ID */
router.get('/:id', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  Room.findById(req.params.id).
  populate('creator').
  exec(function (err, room) {
    if (err) return next(err);
    res.json(room);
  });
});

/* SAVE ROOM */
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  var user = jwt.decode(token);
  req.body.creator = user._id;
  Room.create(req.body, function (err, post) {
    console.log(err)
    // if (err) return next(err);
    if (err) throw err;
    res.json(post);
  });
});

/* UPDATE ROOM */
router.put('/:id', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  Room.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE ROOM */
router.delete('/:id', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);
  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  Room.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

router.post('/verify', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getRoomToken(req.headers);
  console.log('Test2', token);

  if (!token) {
    return res.status(401).send({success: false, message: 'Unauthorized.'});
  }
  var room = jwt.decode(token);
  console.log(room);
  Room.findOne({ _id: room._id }, function (err, room) {
    if (err) return next(err);
    res.json(room);
  });
});

router.post('/private', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);

  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  Room.findOne({
    _id: req.body.id
  }, function(err, room) {
    if (err) throw err;

    if (!room) {
      res.status(401).send({success: false, message: 'Room authentication failed. Room not found.'});
    } else {
      // check if password matches
      room.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if room is found and password is right create a token
          var token = jwt.sign(room.toJSON(), settings.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'Room ' + token});
        } else {
          res.status(401).send({success: false, message: 'Room authentication failed. Wrong password.'});
        }
      });
    }
  });
});

router.post('/ban', passport.authenticate('jwt', { session: false}), function(req, res, next) {
  var token = getToken(req.headers);

  if (!token) {
    return res.status(403).send({success: false, message: 'Unauthorized.'});
  }
  var user = jwt.decode(token);
  Room.findOne({
    _id: req.body.id
  }).
  populate('creator').
  exec(function (err, room) {
    if (err) return next(err);

    if (!room) {
      return res.status(401).send({success: false, message: 'Room authentication failed. Room not found.'});
    }

    if(room.creator._id != user._id){
      return res.status(401).send({success: false, message: 'Unauthorized.'});
    }

    Room.update({
      _id: req.body.id
    }, {
        $push: {
            banned_users: req.body.userId
        }
    }).exec(function(err, user){
      return res.status(200).send({success: true, message: 'User Banned.'});
    })

  });
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

getRoomToken = function (headers) {
  console.log(headers.roomtoken)
  if (headers && headers.roomtoken) {
    var parted = headers.roomtoken.split(' ');
    console.log(parted);
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
