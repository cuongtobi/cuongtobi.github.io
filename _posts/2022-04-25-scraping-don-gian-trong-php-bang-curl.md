---
layout: post
title: Scraping đơn giản trong PHP bằng cURL
date: 2022-04-25
author: cuongtobi
categories: today-i-learned
description: Trong PHP có rất nhiều cách để  scraping một trang web. Trong bài viết này sẽ giới thiệu một cách scraping đơn giản trong PHP bằng cURL...
---
Trong **PHP** có rất nhiều cách để  **scraping** một trang web. Trong bài viết này sẽ giới thiệu một cách **scraping** đơn giản trong **PHP** bằng **cURL**. 

Khởi tạo **cURL**

{% highlight php %}
$curl = curl_init();
{% endhighlight %}

Thiết lập options cho **cURL**
{% highlight php %}
curl_setopt_array($curl, array(
    CURLOPT_URL => 'https://example.com',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'GET',
    CURLOPT_HTTPHEADER => array(
        'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
    ),
));
{% endhighlight %}

Chạy **cURL**
{% highlight php %}
$response = curl_exec($curl);
{% endhighlight %}

Đóng **cURL**
{% highlight php %}
curl_close($curl);
{% endhighlight %}

Lấy dữ liệu từ **DOM** bằng **regex**, ví dụ lấy **title** của website:
{% highlight php %}
$regex = "/<title>(.*?)<\/title>/s";

if (preg_match($regex, $response, $list)) {
    echo $list[1];
} else {
    echo "Not found";
}
{% endhighlight %}
