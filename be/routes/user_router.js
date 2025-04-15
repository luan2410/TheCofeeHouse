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
    rank: { type: String, enum: ['silver', 'gold', 'vip'], default: 'silver' },
    sdt: { type: String, required: true },
    ngayTao: { type: Date, default: Date.now },
    comment: { type: String }, // Thêm trường comment
    img: { type: String }
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
        res.status(200).json({
            message: "Đăng nhập thành công",
            idUser: user.idUser, // Chỉ cần trả về idUser thay vì toàn bộ user
        });
        // res.status(200).json({ message: "Đăng nhập thành công", user });
        // res.redirect('http://localhost:3000/index.html');
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

router.get('/ranking', async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $addFields: {
                    rankOrder: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$rank', 'vip'] }, then: 3 },
                                { case: { $eq: ['$rank', 'gold'] }, then: 2 },
                                { case: { $eq: ['$rank', 'silver'] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            },
            { $sort: { rankOrder: -1 } },
            {
                $project: {
                    _id: 0,
                    ho: 1,
                    ten: 1,
                    sdt: 1,
                    rank: 1
                }
            }
        ]);

        res.json(users);
    } catch (error) {
        console.error("❌ Lỗi khi lấy bảng xếp hạng:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
});

// Đếm số lượng người theo từng rank
router.get('/count/:rank', async (req, res) => {
    try {
        const { rank } = req.params;
        const count = await User.countDocuments({ rank });
        res.json({ rank, count });
    } catch (error) {
        console.error('Lỗi khi đếm rank:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});


router.get('/:idUser', async (req, res) => {
    const { idUser } = req.params;  // Lấy idUser từ URL

    try {
        const user = await User.findOne({ idUser });

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Trả về dữ liệu người dùng nếu tìm thấy
        res.json({
            idUser: user.idUser,
            ho: user.ho,
            ten: user.ten,
            tenTaiKhoan: user.tenTaiKhoan,
            sdt: user.sdt,
            ngayTao: user.ngayTao,
            diemTichLuy: user.diemTichLuy,
            comment: user.comment,
            img: user.img
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
});


// API Cập nhật thông tin người dùng (PUT)
router.put('/update/:idUser', async (req, res) => {
    const { idUser } = req.params;

    // Xác định schema update với validation cho các trường
    const updateSchema = Joi.object({
        ho: Joi.string()
            .optional()
        ,

        ten: Joi.string()
            .optional()
        ,

        tenTaiKhoan: Joi.string()
            .optional()
        ,

        matKhau: Joi.string()
            .optional()

        ,

        sdt: Joi.string()
            .optional()

    });

    // Validate dữ liệu từ client
    const { error } = updateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
    }

    try {
        // Cập nhật thông tin người dùng
        const user = await User.findOneAndUpdate(
            { idUser },
            { $set: req.body }, // Cập nhật dữ liệu người dùng
            { new: true } // Trả về document mới sau khi update
        );

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng để cập nhật' });
        }

        res.status(200).json({
            message: 'Cập nhật thông tin thành công',
            user
        });
    } catch (err) {
        console.error('Lỗi khi cập nhật người dùng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});













module.exports = router;
