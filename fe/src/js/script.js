document.addEventListener('DOMContentLoaded', () => {
    // Truy vấn các phần tử
    const navbar = document.querySelector('.navbar');
    const searchForm = document.querySelector('.search-form');
    const cartItem = document.querySelector('.cart-items-container');
    const searchBtn = document.querySelector('#search-btn');
    const cartBtn = document.querySelector('#cart-btn');
    const menuBtn = document.querySelector('#menu-btn');
    const userBtn = document.querySelector('#user-btn');

    // Hàm toggle active class
    const toggleActive = (element) => {
        [navbar, searchForm, cartItem].forEach(el => {
            if (el !== element) el?.classList.remove('active');
        });
        element?.classList.toggle('active');
    };

    // Gán sự kiện với kiểm tra tồn tại
    if (searchBtn) {
        searchBtn.addEventListener('click', () => toggleActive(searchForm));
    } else {
        console.warn('Không tìm thấy #search-btn trong DOM');
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', () => toggleActive(cartItem));
    } else {
        console.warn('Không tìm thấy #cart-btn trong DOM');
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', () => toggleActive(navbar));
    } else {
        console.warn('Không tìm thấy #menu-btn trong DOM');
    }

    if (userBtn) {
        userBtn.addEventListener('click', () => {
            window.location.assign('thongTinCaNhan.html');
        });
    } else {
        console.warn('Không tìm thấy #user-btn trong DOM');
    }

    // Xử lý sự kiện cuộn trang
    window.onscroll = () => {
        navbar?.classList.remove('active');
        searchForm?.classList.remove('active');
        cartItem?.classList.remove('active');
    };
});