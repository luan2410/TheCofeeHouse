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

module.exports = router;
