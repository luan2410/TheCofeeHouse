const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const MonAn = require('../models/monAn');
const MonNuoc = require('../models/monNuoc');
const User = require('./user_router'); // nếu user.js là file model User
const Order = require('./order'); // nếu order.js là file model Order
const moment = require('moment');
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'items.category' // Sửa lại refPath ở đây
            },
            category: {
                type: String,
                enum: ['MonAn', 'MonNuoc'],
                required: true
            },
            quantity: { type: Number, required: true, default: 1 },
        },
    ],
});
const Cart = mongoose.model('Cart', cartSchema);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', async (req, res) => {
    try {
        const { userId, productId, category, quantity } = req.body;

        if (!userId || !productId || !category || !quantity) {
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Kiểm tra nếu món đã có trong giỏ
        const index = cart.items.findIndex(
            item => item.productId.toString() === productId && item.category === category
        );

        if (index >= 0) {
            cart.items[index].quantity += quantity;
        } else {
            cart.items.push({ productId, category, quantity });
        }

        await cart.save();
        res.json({ message: 'Đã thêm vào giỏ', cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi thêm giỏ hàng' });
    }
});

// Xem giỏ hàng của người dùng
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ userId }).exec();

        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ message: 'Giỏ hàng trống' });
        }

        let total = 0;

        // Mảng mới chứa thông tin sản phẩm đầy đủ
        const populatedItems = await Promise.all(cart.items.map(async item => {
            let productDetail = null;

            if (item.category === 'MonAn') {
                productDetail = await MonAn.findById(item.productId).select('tenMon gia hinhAnh').exec();
            } else if (item.category === 'MonNuoc') {
                productDetail = await MonNuoc.findById(item.productId).select('ten gia hinhAnh').exec();
            }

            if (productDetail && productDetail.gia) {
                total += productDetail.gia * item.quantity;
            }

            return {
                ...item.toObject(),
                productDetail
            };
        }));

        res.json({
            message: 'Lấy giỏ hàng thành công',
            cart: {
                ...cart.toObject(),
                items: populatedItems
            },
            total
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng', error: err.message });
    }
});


// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', async (req, res) => {
    try {
        const { userId, productId, category, quantity } = req.body;

        if (!userId || !productId || !category || quantity === undefined) {
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
        }

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId && item.category === category
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        }

        if (quantity <= 0) {
            // Nếu số lượng <= 0 thì xóa sản phẩm khỏi giỏ hàng
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();
        res.json({ message: 'Cập nhật giỏ hàng thành công', cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi cập nhật giỏ hàng' });
    }
});

router.post('/checkout', async (req, res) => {
    try {
        // Lấy thông tin từ body request
        const { userId, paymentMethod, deliveryAddress, note } = req.body;

        // Kiểm tra xem giỏ hàng của người dùng có tồn tại không
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.status(400).json({ message: 'Cart not found' });
        }

        // Tính tổng giá trị đơn hàng và thêm thông tin sản phẩm
        let totalAmount = 0;
        const populatedItems = cart.items.map(item => {
            const product = item.productId; // Lấy sản phẩm từ item
            const itemTotal = product.gia * item.quantity; // Tính tổng tiền cho sản phẩm
            totalAmount += itemTotal; // Cộng vào tổng tiền của đơn hàng

            return {
                product: product._id,  // ID của sản phẩm
                name: product.ten,     // Tên sản phẩm
                price: product.gia,     // Giá sản phẩm
                category: product.loai, // Danh mục sản phẩm
                quantity: item.quantity, // Số lượng sản phẩm
                itemTotal: itemTotal    // Tổng tiền của sản phẩm (giá * số lượng)
            };
        });

        // Tạo đơn hàng mới
        const newOrder = new Order({
            user: userId,           // Truyền userId vào
            orderDate: new Date(),  // Lấy thời gian hiện tại
            items: populatedItems,
            totalAmount,
            paymentMethod,
            deliveryAddress,
            note,
            status: 'pending',      // Đơn hàng đang chờ xử lý
        });

        // Lưu đơn hàng vào DB
        await newOrder.save();

        // Xóa giỏ hàng sau khi thanh toán thành công
        await Cart.findOneAndDelete({ userId });

        // Trả về phản hồi khi thanh toán thành công
        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Checkout failed:', error);
        res.status(500).json({ message: 'Checkout failed', error: error.message });
    }
});


module.exports = router;