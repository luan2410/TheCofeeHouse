const express = require('express');
const router = express.Router();
const Order = require('../models/order'); // Đảm bảo đường dẫn đúng với vị trí model

// GET /api/orders/user/:userId - Lấy danh sách đơn hàng theo userId
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', err);
        res.status(500).json({ error: 'Lỗi server khi lấy đơn hàng' });
    }
});

module.exports = router;
