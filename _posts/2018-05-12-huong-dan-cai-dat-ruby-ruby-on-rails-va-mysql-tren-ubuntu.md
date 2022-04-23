---
layout: post
title:  Hướng dẫn cài đặt ruby, Ruby on Rails và MySQL trên Ubuntu
date:   2018-05-12
tags: ruby ruby-on-rails
description: Đầu tiên hãy mở cài đặt trong Terminal bằng cách chọn **Edit -> Profile Preferences -> Title and Command** và tích chọn **Run Command as login shell**...
---
- [1. Setup Terminal](#1-setup-terminal)
- [2. Cài đặt Ruby](#2-cài-đặt-ruby)
- [3. Cài đặt Rails](#3-cài-đặt-rails)
- [4. Cài đặt MySQL](#4-cài-đặt-mysql)

Chào anh em hôm nay mình sẽ hướng dẫn anh em cách cài đặt Ruby, Ruby on Rails và MySQL trên hệ điều hành Linux/Ubuntu

![Ruby](https://cdn.iconicjob.vn/prod/wp-content/uploads/2019/06/11144136/lap-trinh-vien-ruby-can-co-ky-nang-gi.jpg)

### 1. Setup Terminal

Đầu tiên hãy mở cài đặt trong Terminal bằng cách chọn **Edit -> Profile Preferences -> Title and Command** và tích chọn **Run Command as login shell**

### 2. Cài đặt Ruby 

Cập nhật package ubuntu:  
{% highlight shell %}
sudo apt-get update
{% endhighlight %}

Cài đặt curl:  
{% highlight shell %}
sudo apt-get install curl
{% endhighlight %}

Cài đặt một số dependencies cho Ruby:  

{% highlight shell %}
sudo apt-get install zlib1g-dev build-essential libssl-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev python-software-properties libffi-dev
{% endhighlight %}

Cài đặt RVM, Ruby và phiên bản mặc định:  
{% highlight shell %}
sudo apt-get install libgdbm-dev libncurses5-dev automake libtool bison libffi-dev
{% endhighlight %}

{% highlight shell %}
gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
{% endhighlight %}

{% highlight shell %}
curl -sSL https://get.rvm.io | bash -s stable
{% endhighlight %}

{% highlight shell %}
source ~/.rvm/scripts/rvm
{% endhighlight %}

{% highlight shell %}
rvm install 2.4.2
{% endhighlight %}

{% highlight shell %}
rvm use 2.4.2 --default
{% endhighlight %}

{% highlight shell %}
ruby -v
{% endhighlight %}

### 3. Cài đặt Rails  
{% highlight shell %}
gem install rails --version 5.1.4 --no-ri --no-rdoc
{% endhighlight %}

{% highlight shell %}
rails -v
{% endhighlight %}

### 4. Cài đặt MySQL  
{% highlight shell %}
sudo apt-get install mysql-server mysql-client libmysqlclient-dev
{% endhighlight %}
