const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes (chỉ khai báo mỗi cái 1 lần duy nhất)
const testRoutes = require('./routes/testRoutes');
const monNuocRoutes = require('./routes/monNuoc');
const monAnRoutes = require('./routes/monAn');
const userRouter = require('./routes/user_router');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cofeeShop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Kết nối MongoDB thành công!');
    // Nếu muốn tạo index thủ công thì dùng khi có index được định nghĩa trong schema
    // mongoose.model('MonAn').createIndexes();
    // mongoose.model('User').createIndexes();
})
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Sử dụng routes
app.use('/', testRoutes);
app.use('/api/mon-nuoc', monNuocRoutes);
app.use('/api/mon-an', monAnRoutes);
app.use('/api/user', userRouter);

// Xử lý 404 - Not Found
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài nguyên'
    });
});

// Xử lý lỗi server
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Lỗi server nội bộ'
    });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
