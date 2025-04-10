const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes (chỉ khai báo mỗi cái 1 lần duy nhất)
const testRoutes = require('./routes/testRoutes');
const monNuocRoutes = require('./routes/monNuoc');
const monAnRoutes = require('./routes/monAn');
const userRouter = require('./routes/user_router');
const blogRouter = require('./routes/blog'); 

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cofeeShop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

    .then(() => console.log('✅ Kết nối MongoDB thành công!'))
    .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Dùng routes ......
app.use('/', testRoutes); //// Ở đây khi import ở trên xong thì phải khai báo ở dưới đây để dùng. "tesroutes" .
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

// Xử lý lỗi server
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
