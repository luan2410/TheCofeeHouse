const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Tạo Schema để định nghĩa 1 collection. 
const userSchema = new mongoose.Schema({
    name: String,
    email: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// [GET] Hiển thị tất cả user
router.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// [POST] Thêm user
router.post('/register', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email
    });

    try {
        await user.save();
        res.json({ message: '✅ Thêm thành công!' });
    } catch (err) {
        res.status(500).json({ error: '❌ Thêm thất bại!' });
    }
});

// [PUT] Sửa user
router.put('/update/:id', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: '✅ Sửa thành công!' });
    } catch (err) {
        res.status(500).json({ error: '❌ Sửa thất bại!' });
    }
});

// [DELETE] Xóa user
router.delete('/delete/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: '✅ Xóa thành công!' });
    } catch (err) {
        res.status(500).json({ error: '❌ Xóa thất bại!' });
    }
});

module.exports = router;
///
// db.users.insertMany([
//     { name: 'Nguyễn Văn A', email: 'a@example.com' },
//     { name: 'Trần Thị B', email: 'b@example.com' },
//     { name: 'Lê Minh C', email: 'c@example.com' },
//     { name: 'Phan Kim D', email: 'd@example.com' },
//     { name: 'Hoàng Đức E', email: 'e@example.com' }
// ])
//