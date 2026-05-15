const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  userId: String,

  wallet: {
    type: Number,
    default: 1000
  },

  lastDaily: {
    type: Date,
    default: null
  },

  gamblesPlayed: {
    type: Number,
    default: 0
  },

  wins: {
    type: Number,
    default: 0
  },

  losses: {
    type: Number,
    default: 0
  }

});

module.exports = mongoose.model('User', userSchema);