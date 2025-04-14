const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();


// Định nghĩa schema cho MonAn
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
const MonAn = mongoose.model('MonAn', monAnSchema, 'monAn');





// Lấy tất cả hoặc tìm kiếm, lọc theo danh mục / yêu thích
router.get('/', async (req, res) => {
    try {
        const { tenMon, danhMuc, yeuThich } = req.query;
        const filter = {};

        if (tenMon) {
            filter.tenMon = { $regex: tenMon, $options: 'i' }; // tìm gần đúng không phân biệt hoa thường
        }

        if (danhMuc) {
            filter.danhMuc = danhMuc;
        }

        if (yeuThich !== undefined) {
            filter.yeuThich = yeuThich === 'true';
        }

        const monAn = await MonAn.find(filter);
        res.json(monAn);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Like hoặc Unlike món ăn
router.put('/:id/like', async (req, res) => {
    try {
        const monAn = await MonAn.findById(req.params.id);
        if (!monAn) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn' });
        }

        monAn.yeuThich = !monAn.yeuThich;
        monAn.ngayCapNhat = new Date();

        const updatedMonAn = await monAn.save();
        res.json(updatedMonAn);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
