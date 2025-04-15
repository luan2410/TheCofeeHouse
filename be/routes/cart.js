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

// Thanh toán giỏ hàng và tạo đơn hàng
router.post('/checkout', async (req, res) => {
  try {
      const { userId, paymentMethod, deliveryAddress, note } = req.body;
      console.log('[DEBUG] Request body:', req.body); // Log dữ liệu đầu vào

      // 1. Tìm giỏ hàng và log chi tiết
      const cart = await Cart.findOne({ userId }).lean();
      console.log('[DEBUG] Raw cart from DB:', cart); // Log giỏ hàng trước khi populate

      const populatedCart = await Cart.findOne({ userId })
          .populate({
              path: 'items.productId',
              select: 'name gia'
          })
          .lean()
          .exec();
      console.log('[DEBUG] Populated cart:', populatedCart); // Log sau populate

      if (!populatedCart || populatedCart.items.length === 0) {
          console.log('[DEBUG] Cart empty reason:', {
              cartExists: !!cart,
              itemsExist: cart?.items?.length > 0,
              populatedItems: populatedCart?.items
          });
          return res.status(400).json({ message: 'Giỏ hàng trống' });
      }
      // 2. Tính tổng tiền
      let totalAmount = 0;
      const orderItems = [];
      
      cart.items.forEach(item => {
          if (item.productId && item.productId.gia) {
              const itemTotal = item.productId.gia * item.quantity;
              totalAmount += itemTotal;
              
              orderItems.push({
                  product: item.productId._id,
                  category: item.category,
                  name: item.productId.name,
                  quantity: item.quantity,
                  price: item.productId.gia,
                  itemTotal: itemTotal
              });
          }
      });

      // 3. Tạo đơn hàng mới
      const newOrder = new Order({
          user: userId,
          items: orderItems,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          deliveryAddress: deliveryAddress,
          status: 'pending', // Trạng thái ban đầu
          orderDate: moment().format('YYYY-MM-DD HH:mm:ss'),
          note: note || ''
      });

      // 4. Lưu đơn hàng và xóa giỏ hàng
      await newOrder.save();
      await Cart.deleteOne({ userId });

      res.json({
          message: 'Thanh toán thành công',
          order: newOrder
      });

  } catch (err) {
    console.error('[ERROR] Checkout failed:', err);

      res.status(500).json({ message: 'Lỗi khi thanh toán', error: err.message });
  }
});


module.exports = router;