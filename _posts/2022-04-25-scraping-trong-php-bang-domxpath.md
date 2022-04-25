---
layout: post
title: Scraping trong PHP bằng DOMXpath
date: 2022-04-25
author: cuongtobi
categories: today-i-learned
description: Trong bài viết này sẽ giới thiệu một cách scraping trong PHP bằng DOMXpath và cURL...
---
Trong bài viết này sẽ giới thiệu một cách **scraping** trong **PHP** bằng **DOMXpath** và **cURL**. Nếu bạn muốn **scraping** một cách đơn giản chỉ cần sử dụng **cURL** hãy đọc [bài viết này](https://cuongtobi.github.io/scraping-don-gian-trong-php-bang-curl.html).

Lấy html của website bằng **cURL**

{% highlight php %}
$url = 'https://example.com';
$curl = curl_init();

curl_setopt_array($curl, array(
    CURLOPT_URL => $url,
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

$html = curl_exec($curl);

curl_close($curl);
{% endhighlight %}

Khởi tạo **DOMDocument** và **DOMXpath**
{% highlight php %}
$doc = new DOMDocument();
$doc->loadHTML($response);

$xpath = new DOMXpath($doc);
{% endhighlight %}

Lấy nội dung thẻ **title** bằng **DOMXpath**
{% highlight php %}
$elements = $xpath->query('//title');
echo $elements->item(0)->nodeValue;
{% endhighlight %}

Lấy nội dung thẻ **meta viewport** bằng **DOMXpath**
{% highlight php %}
$elements = $xpath->query('//meta[contains(@name, "viewport")]');
echo $elements->item(0)->attributes->getNamedItem('content')->value;
{% endhighlight %}
