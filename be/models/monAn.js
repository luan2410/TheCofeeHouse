const mongoose = require('mongoose');

const monAnSchema = new mongoose.Schema({
    tenMon: { type: String, required: true },
    danhMuc: { 
        type: String, 
        enum: ['banh', 'sandwich', 'khac'], 
        required: true 
    },
    gia: { type: Number, required: true },
    hinhAnh: { type: String, required: true },
    yeuThich: { type: Boolean, default: false },
    moTa: { type: String },
    trangThai: { 
        type: String, 
        enum: ['con_hang', 'het_hang'], 
        default: 'con_hang' 
    },
    ngayTao: { type: Date, default: Date.now },
    ngayCapNhat: { type: Date, default: Date.now }
});

// Middleware để cập nhật ngàyCapNhat mỗi khi document được cập nhật
monAnSchema.pre('save', function (next) {
    this.ngayCapNhat = new Date();
    next();
});

// Sửa tại đây: chỉ định rõ collection tên là 'monAn'
module.exports = mongoose.model('MonAn', monAnSchema, 'monAn');
