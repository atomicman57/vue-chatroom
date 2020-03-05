var mongoose = require('mongoose'), Schema = mongoose.Schema;

var ChatSchema = new mongoose.Schema({
  room : { type: Schema.Types.ObjectId, ref: 'Room' },
  message: String,
  type: {
    type : String,
    required: true,
    default : 'Public',
    enum : ['Public', 'Private']
  },
  sender: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  recipient: { type: Schema.Types.ObjectId, ref: 'User' },
  created_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', ChatSchema);
