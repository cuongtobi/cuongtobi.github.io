---
layout: post
title: Iframe click event trong Javascript
date: 2022-04-25
categories: today-i-learned
tags:
  - javascript
  - iframe
  - frontend
description: "Cách phát hiện người dùng click vào iframe bằng blur event và document.activeElement trong JavaScript khi trang cha không thể đọc DOM của iframe."
image: /assets/images/og-default.png
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
