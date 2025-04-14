const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRouter = require('./routes/user_router')
const testRoutes = require('./routes/testRoutes'); ///  import routes vao` . ở đây là import vào "testRoutes"
const monNuocRoutes = require('./routes/monNuoc');
const monAnRoutes = require('./routes/monAn');
const blogRouter = require('./routes/blog');

const cartRoutes =require('./routes/cart')
// const orderRouter = require('./routes/order');
const cors = require('cors');


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
app.use('/api/user', userRouter);
app.use('/api/mon-nuoc', monNuocRoutes);
app.use('/api/mon-an', monAnRoutes);
app.use('/api', blogRouter);
app.use('/',cartRoutes);

// Chạy server
app.listen(3000, () => {
    console.log('🚀 Server chạy tại http://localhost:3000');
});
