var mongoose = require('mongoose');
var passport = require('passport');
var settings = require('../config/settings');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");

router.post('/register', function(req, res) {
    if (!req.body.nickname || !req.body.password) {
      res.status(400).json({success: false, message: 'Please pass nickname and password.'});
    } else {
      var newUser = new User({
        nickname: req.body.nickname,
        password: req.body.password
      });
      // save the user
      newUser.save(function(err) {
        if (err) {
            console.log(err)
          return res.status(400).json({success: false, message: 'nickname already exists.'});
        }
        res.json({success: true, message: 'Successful created new user.'});
      });
    }
  });

  router.post('/login', function(req, res) {
    User.findOne({
      nickname: req.body.nickname
    }, function(err, user) {
      if (err) throw err;
  
      if (!user) {
        res.status(401).send({success: false, message: 'Authentication failed. User not found.'});
      } else {
        // check if password matches
        user.comparePassword(req.body.password, function (err, isMatch) {
          if (isMatch && !err) {
            // if user is found and password is right create a token
            var token = jwt.sign(user.toJSON(), settings.secret);
            // return the information including token as JSON
            res.json({success: true, token: 'JWT ' + token});
          } else {
            res.status(401).send({success: false, message: 'Authentication failed. Wrong password.'});
          }
        });
      }
    });
  });

  router.get('/currentuser', passport.authenticate('jwt', { session: false}), function(req, res, next) {
    var token = getToken(req.headers);
    if (!token) {
      return res.status(401).send({success: false, message: 'Unauthorized.'});
    }
    var user = jwt.decode(token);
    User.findOne({ _id: user._id }, function (err, user) {
      if (err) return next(err);
      res.json(user);
    });
  });
  

  module.exports = router;