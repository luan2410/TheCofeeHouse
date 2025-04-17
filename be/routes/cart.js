// routes/cart_router.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const MonAn = require('../models/monAn');
const MonNuoc = require('../models/monNuoc');
const Order = require('../models/order');
const moment = require('moment');

// Thêm sản phẩm vào giỏ hàng
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, category, quantity } = req.body;
    if (!userId || !productId || !category || !quantity) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

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

// Xem giỏ hàng
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).exec();
    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: 'Giỏ hàng trống' });
    }

    let total = 0;
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
      cart: { ...cart.toObject(), items: populatedItems },
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng', error: err.message });
  }
});

// Cập nhật số lượng
router.put('/update', async (req, res) => {
  try {
    const { userId, productId, category, quantity } = req.body;
    if (!userId || !productId || !category || quantity === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && item.category === category
    );

    if (itemIndex === -1) return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });

    if (quantity <= 0) {
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

// Thanh toán và tạo đơn hàng
router.post('/checkout', async (req, res) => {
  try {
    const { userId, paymentMethod, deliveryAddress, note } = req.body;
    const cart = await Cart.findOne({ userId }).exec();
    if (!cart) return res.status(400).json({ message: 'Không tìm thấy giỏ hàng' });

    const validatedItems = await Promise.all(cart.items.map(async item => {
      if (item.productDetail) return item;

      let productDetail = null;
      if (item.category === 'MonAn') {
        productDetail = await MonAn.findById(item.productId).select('tenMon gia hinhAnh').lean();
      } else if (item.category === 'MonNuoc') {
        productDetail = await MonNuoc.findById(item.productId).select('ten gia hinhAnh').lean();
      }

      return {
        ...item.toObject(),
        productDetail
      };
    }));

    const validItems = validatedItems.filter(item => item.productDetail);
    if (validItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng không có sản phẩm hợp lệ' });
    }

    let totalAmount = 0;
    const orderItems = validItems.map(item => {
      const itemTotal = item.productDetail.gia * item.quantity;
      totalAmount += itemTotal;
      return {
        product: item.productId,
        category: item.category,
        name: item.productDetail.tenMon || item.productDetail.ten,
        quantity: item.quantity,
        price: item.productDetail.gia,
        itemTotal
      };
    });

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      status: 'pending',
      orderDate: moment().format('YYYY-MM-DD HH:mm:ss'),
      note: note || ''
    });

    await newOrder.save();
    await Cart.deleteOne({ userId });

    res.json({ message: 'Thanh toán thành công', order: newOrder });
  } catch (err) {
    console.error('[ERROR] Checkout failed:', err);
    res.status(500).json({ message: 'Lỗi khi thanh toán', error: err.message });
  }
});

module.exports = router;
