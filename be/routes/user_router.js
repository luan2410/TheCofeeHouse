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
    ngayTao: { type: Date, default: Date.now },
    diemTichLuy: { type: Number, default: 0 }
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
        // Dùng .lean() để lấy plain object
        const user = await User.findOne({
            tenTaiKhoan: req.body.tenTaiKhoan,
            matKhau: req.body.matKhau
        }).lean(); // 👈 THÊM DÒNG NÀY

        if (!user) {
            console.log("❌ Không tìm thấy user với tài khoản:", req.body.tenTaiKhoan);
            return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
        }

        console.log("✅ User tìm thấy:", user);
        console.log("👉 idUser:", user.idUser); // Giờ sẽ không undefined nữa

        return res.status(200).json({
            message: "Đăng nhập thành công",
            idUser: user.idUser
        });

    } catch (err) {
        console.error("❌ Lỗi server:", err);
        return res.status(500).json({ message: "Lỗi server", error: err.message });
    }
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

// GET thông tin người dùng theo idUser
router.get('/:idUser', async (req, res) => {
    try {
        const { idUser } = req.params;
        const user = await User.findOne({ idUser }).lean(); // Trả về plain object

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Trả về thông tin người dùng
        res.status(200).json(user);
    } catch (err) {
        console.error('Lỗi khi lấy thông tin người dùng:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});


// API Cập nhật thông tin người dùng (PUT)
router.put('/update/:idUser', async (req, res) => {
    const { idUser } = req.params;

    // Xác định schema update với validation cho các trường
    const updateSchema = Joi.object({
        ho: Joi.string()
            .optional()
            .pattern(/^[A-Z][a-zA-Z]*$/) // Chữ cái đầu viết hoa
            .messages({
                "string.pattern.base": "Họ phải bắt đầu bằng chữ cái viết hoa và chỉ chứa chữ cái"
            }),

        ten: Joi.string()
            .optional()
            .pattern(/^[A-Z][a-zA-Z]*$/) // Chữ cái đầu viết hoa
            .messages({
                "string.pattern.base": "Tên phải bắt đầu bằng chữ cái viết hoa và chỉ chứa chữ cái"
            }),

        tenTaiKhoan: Joi.string()
            .optional()
            .messages({
                "string.empty": "Tên tài khoản không được để trống"
            }),

        matKhau: Joi.string()
            .optional()
            .min(8) // Ít nhất 8 ký tự
            .pattern(/^(?=.*[A-Z])(?=.*\d)/) // Ít nhất 1 chữ viết hoa và 1 số
            .messages({
                "string.min": "Mật khẩu phải có ít nhất 8 ký tự",
                "string.pattern.base": "Mật khẩu phải bao gồm ít nhất 1 chữ cái viết hoa và 1 số"
            }),

        sdt: Joi.string()
            .optional()
            .pattern(/^(09|07|08)\d{8}$/) // Số điện thoại phải bắt đầu với 09, 07, hoặc 08 và có 10 ký tự
            .messages({
                "string.pattern.base": "Số điện thoại phải bắt đầu bằng 09, 07 hoặc 08 và có 10 ký tự"
            })
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
