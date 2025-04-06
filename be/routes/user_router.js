const express = require('express');
const router = express.Router();
const Joi = require('joi');
const mongoose = require('mongoose');

// 👉 Gộp luôn schema ở đây
const userSchema = new mongoose.Schema({
    idUser: { type: String, required: true, unique: true },
    ho: { type: String, required: true },
    ten: { type: String, required: true },
    tenTaiKhoan: { type: String, required: true, unique: true },
    matKhau: { type: String, required: true },
    sdt: { type: String, required: true },
    ngayTao: { type: Date, default: Date.now }
});

// ✅ Fix lỗi OverwriteModelError:
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 👉 API Đăng nhập
router.post('/login', async (req, res) => {
    const schema = Joi.object({
        tenTaiKhoan: Joi.string().required(),
        matKhau: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const user = await User.findOne({
            tenTaiKhoan: req.body.tenTaiKhoan,
            matKhau: req.body.matKhau // 👈 nên hash ở thực tế nhé
        });

        if (!user) return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });

        res.status(200).json({ message: "Đăng nhập thành công", user });
        res.redirect('http://localhost:3000/index.html');
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err });
    }
    console.log("✅ Dữ liệu nhận được:", req.body); // Thêm dòng này
});



const schema = Joi.object({
    ho: Joi.string().required().messages({
        "any.required": "Họ là bắt buộc",
        "string.empty": "Họ không được để trống"
    }),
    ten: Joi.string().required().messages({
        "any.required": "Tên là bắt buộc",
        "string.empty": "Tên không được để trống"
    }),
    tenTaiKhoan: Joi.string().required().messages({
        "any.required": "Tên tài khoản là bắt buộc",
        "string.empty": "Tên tài khoản không được để trống"
    }),
    matKhau: Joi.string().required().messages({
        "any.required": "Mật khẩu là bắt buộc",
        "string.empty": "Mật khẩu không được để trống"
    }),
    sdt: Joi.string().required().messages({
        "any.required": "Số điện thoại là bắt buộc",
        "string.empty": "Số điện thoại không được để trống"
    })
});

// Định nghĩa schema cho Counter trong cùng file Router
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Định danh bộ đếm, ví dụ: 'userId'
    seq: { type: Number, default: 0 } // Giá trị bộ đếm
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

async function getNextUserId() {
    const counter = await Counter.findOneAndUpdate(
        { _id: 'userId' },  // Sử dụng _id để xác định bộ đếm
        { $inc: { seq: 1 } }, // Tăng bộ đếm lên 1
        { new: true, upsert: true }  // Tạo mới nếu không tồn tại
    );
    return `U${String(counter.seq).padStart(3, '0')}`; // Trả về ID theo định dạng "U001"
}

router.post('/register', async (req, res) => {
    try {
        // Validate dữ liệu đầu vào
        const { error } = schema.validate(req.body);
        if (error) {
            // Trả về lỗi với thông báo chi tiết của từng trường
            return res.status(400).json({
                message: error.details.map(detail => detail.message).join(', ') // Trả về tất cả lỗi nếu có
            });
        }

        // Kiểm tra xem tên tài khoản đã tồn tại chưa
        const existingUser = await User.findOne({ tenTaiKhoan: req.body.tenTaiKhoan });
        if (existingUser) {
            return res.status(400).json({
                message: "Tên tài khoản đã tồn tại"
            });
        }
        //tạo ID tự động cho người dùng mới
        const idUser = await getNextUserId();  
        const user = new User({
            ...req.body, 
            idUser: idUser   
        });
        if (!user) {
            return res.status(400).json({ message: "Tạo tài khoản thất bại" });
        }
        // Lưu người dùng vào cơ sở dữ liệu
        await user.save();
      
        // Thành công, trả về thông báo
        return res.status(201).json({
            message: "Tạo tài khoản thành công",
            user: user
        });

    } catch (err) {
        console.error("Lỗi khi tạo tài khoản:", err);
        return res.status(500).json({
            message: "Lỗi server",
            error: err.message
        });
    }
});

module.exports = router;
