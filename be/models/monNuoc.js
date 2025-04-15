// models/monNuoc.js
const mongoose = require('mongoose');

// Định nghĩa schema cho MonNuoc
const monNuocSchema = new mongoose.Schema({
    ten: { type: String, required: true },
    loai: { type: String, required: true },
    yeuThich: { type: Number, default: 0 },
    gia: { type: Number, required: true },
    hinhAnh: { type: String },
    moTa: { type: String },
    likedBy: [{ type: String, ref: 'User' }]
});

// Tạo model MonNuoc
const MonNuoc = mongoose.model('MonNuoc', monNuocSchema, 'monNuoc');

module.exports = MonNuoc;
