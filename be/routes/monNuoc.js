const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const monNuocSchema = new mongoose.Schema({
    ten: { type: String, required: true },
    loai: { type: String, required: true },
    yeuThich: { type: Number, default: 0 },
    gia: { type: Number, required: true },
    hinhAnh: { type: String },
    moTa: { type: String }
});

const MonNuoc = mongoose.model('MonNuoc', monNuocSchema, 'monNuoc');

router.get('/', async (req, res) => {
    try {
        const monNuoc = await MonNuoc.find();
        res.json(monNuoc);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách món nước', error: err });
    }
});



router.post('/', async (req, res) => {
    const { ten, loai, yeuThich, gia, hinhAnh, moTa } = req.body;
    const monNuocMoi = new MonNuoc({
        ten, loai, yeuThich, gia, hinhAnh, moTa
    });

    try {
        const savedMonNuoc = await monNuocMoi.save();
        res.status(201).json(savedMonNuoc);
    } catch (err) {
        res.status(400).json({ message: 'Lỗi khi thêm món nước', error: err });
    }
});

router.put('/:id/like', async (req, res) => {
    try {
        const monNuoc = await MonNuoc.findById(req.params.id);
        if (!monNuoc) {
            return res.status(404).json({ message: 'Không tìm thấy món nước' });
        }
        monNuoc.yeuThich += 1; // Tăng lượt thích lên 1
        const updatedMonNuoc = await monNuoc.save();
        res.json(updatedMonNuoc);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi cập nhật lượt thích', error: err });
    }
});

module.exports = router;