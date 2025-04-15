// routes/monAnRoutes.js
const express = require('express');
const router = express.Router();
const MonAn = require('../models/monAn'); // Import model MonAn

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
