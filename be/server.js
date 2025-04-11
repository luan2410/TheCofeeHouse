const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Khởi tạo app
const app = express();

// Middleware xử lý JSON và form data
app.use(express.json()); // Dùng cho JSON body
app.use(express.urlencoded({ extended: true })); // Dùng cho form-urlencoded
app.use(cors());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cofeeShop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Kết nối MongoDB thành công!'))
    .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Import routes
const testRoutes = require('./routes/testRoutes');
const monNuocRoutes = require('./routes/monNuoc');
const monAnRoutes = require('./routes/monAn');
const userRouter = require('./routes/user_router');
const blogRouter = require('./routes/blog');

// Sử dụng routes
app.use('/', testRoutes);
app.use('/api/mon-nuoc', monNuocRoutes);
app.use('/api/mon-an', monAnRoutes);
app.use('/api/user', userRouter);
app.use('/api', blogRouter);

// Xử lý 404 - Not Found
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài nguyên'
    });
});

// Xử lý lỗi server nội bộ
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Lỗi server nội bộ'
    });
});

// Chạy server
app.listen(3000, () => {
    console.log('🚀 Server chạy tại http://localhost:3000');
});
