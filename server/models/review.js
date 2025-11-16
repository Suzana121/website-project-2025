const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  comment: String,
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
