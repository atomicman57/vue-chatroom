var bcrypt = require('bcrypt-nodejs');
var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var RoomSchema = new mongoose.Schema({
  room_name: String,
  type: {
    type: String,
    required: true,
    default: "Public",
    enum: ["Public", "Private"]
  },
  creator: { type: Schema.Types.ObjectId, ref: "User" },
  password: String,
  banned_users: [{ 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  created_date: { type: Date, default: Date.now }
});

RoomSchema.pre("save", function(next) {
  var room = this;
  if (room.type == "Private") {
    if (this.isModified("password") || this.isNew) {
      bcrypt.genSalt(10, function(err, salt) {
        if (err) {
          return next(err);
        }
        bcrypt.hash(room.password, salt, null, function(err, hash) {
          if (err) {
            return next(err);
          }
          room.password = hash;
          next();
        });
      });
    } else {
      return next();
    }
  } else {
    return next();
  }
});

RoomSchema.methods.comparePassword = function(passw, cb) {
  bcrypt.compare(passw, this.password, function(err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = mongoose.model("Room", RoomSchema);
