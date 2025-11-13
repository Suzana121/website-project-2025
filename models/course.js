const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  instructor: { type: String },
  students: [{ type: String }] // רשימת סטודנטים
});

module.exports = mongoose.model('Course', courseSchema);
