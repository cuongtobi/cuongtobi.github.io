---
layout: post
title: Iframe click event trong Javascript
date: 2022-04-25
author: cuongtobi
categories: today-i-learned
description: Do không thể trực tiếp đọc iframe content(DOM) từ trang mẹ nên phải dựa vào blur event để theo dõi hành động trên iframe....
---
Do không thể trực tiếp đọc **iframe** content(**DOM**) từ trang mẹ nên phải dựa vào **blur event** để theo dõi hành động trên **iframe**.

{% highlight javascript %}
window.addEventListener('DOMContentLoaded', function () {
    window.focus();

    window.addEventListener('blur', function () {
        setTimeout(function () {
            if (document.activeElement.tagName === 'IFRAME') {
                console.log('clicked');
            }
        });
    });
});
{% endhighlight %}
