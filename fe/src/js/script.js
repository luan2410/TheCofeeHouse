document.addEventListener('DOMContentLoaded', () => {
    let navbar = document.querySelector('.navbar');
    let searchForm = document.querySelector('.search-form');
    let cartItem = document.querySelector('.cart-items-container');


    const searchBtn = document.querySelector('#search-btn');
    if (searchBtn && searchForm) {
        searchBtn.onclick = () => {
            searchForm.classList.toggle('active');
            navbar?.classList.remove('active');
            cartItem?.classList.remove('active');
        };
    }

document.querySelector('#menu-btn').onclick = () => {
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
    cartItem.classList.remove('active');
}


    const cartBtn = document.querySelector('#cart-btn');
    if (cartBtn && cartItem) {
        cartBtn.onclick = () => {
            cartItem.classList.toggle('active');
            navbar?.classList.remove('active');
            searchForm?.classList.remove('active');
        };
    }


    window.onscroll = () => {
        navbar?.classList.remove('active');
        searchForm?.classList.remove('active');
        cartItem?.classList.remove('active');
    };
});

document.querySelector('#search-btn').onclick = () => {
    searchForm.classList.toggle('active');
    navbar.classList.remove('active');
    cartItem.classList.remove('active');
}

let cartItem = document.querySelector('.cart-items-container');

document.querySelector('#cart-btn').onclick = () => {
    cartItem.classList.toggle('active');
    navbar.classList.remove('active');
    searchForm.classList.remove('active');
}

window.onscroll = () => {
    navbar.classList.remove('active');
    searchForm.classList.remove('active');
    cartItem.classList.remove('active');
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("#user-btn").onclick = function () {
        window.location.assign("thongTinCaNhan.html");
    };
});

