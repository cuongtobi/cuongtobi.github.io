(function () {
  "use strict";

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var menuButton = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-site-nav]");

    if (menuButton && nav) {
      menuButton.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var themeToggle = document.querySelector("[data-theme-toggle]");
    var themeIcon = document.querySelector("[data-theme-icon]");
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    var storageKey = "cuongtobi-theme-v2";

    function getTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function applyTheme(theme, persist) {
      var nextTheme = theme === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);

      if (themeIcon) {
        themeIcon.textContent = nextTheme === "dark" ? "☀" : "☾";
      }

      if (themeToggle) {
        var label = nextTheme === "dark"
          ? "Chuyển sang giao diện ban ngày"
          : "Chuyển sang giao diện đêm";
        themeToggle.setAttribute("aria-label", label);
        themeToggle.setAttribute("title", label);
      }

      if (themeMeta) {
        themeMeta.setAttribute("content", nextTheme === "dark" ? "#070d14" : "#f6f8fc");
      }

      if (persist) {
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch (e) {}
      }
    }

    applyTheme(getTheme(), false);

    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        applyTheme(getTheme() === "dark" ? "light" : "dark", true);
      });
    }

    var postSearch = document.querySelector("[data-post-search]");
    var postCards = Array.prototype.slice.call(document.querySelectorAll("[data-post-card]"));
    var postFilters = Array.prototype.slice.call(document.querySelectorAll("[data-post-filter]"));
    var emptyState = document.querySelector("[data-post-empty]");
    var activeFilter = "all";

    function filterPosts() {
      if (!postCards.length) return;
      var query = normalize(postSearch ? postSearch.value : "");
      var visible = 0;

      postCards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var matchesSearch = !query || haystack.indexOf(query) !== -1;
        var matchesFilter = activeFilter === "all" || haystack.indexOf(activeFilter) !== -1;
        var show = matchesSearch && matchesFilter;
        card.hidden = !show;
        if (show) visible += 1;
      });

      if (emptyState) emptyState.hidden = visible !== 0;
    }

    if (postSearch) postSearch.addEventListener("input", filterPosts);

    postFilters.forEach(function (button) {
      button.addEventListener("click", function () {
        postFilters.forEach(function (item) { item.classList.remove("active"); });
        button.classList.add("active");
        activeFilter = normalize(button.getAttribute("data-post-filter")) || "all";
        filterPosts();
      });
    });

    var tagSearch = document.querySelector("[data-tag-search]");
    var tagItems = Array.prototype.slice.call(document.querySelectorAll("[data-tag-item]"));
    if (tagSearch && tagItems.length) {
      tagSearch.addEventListener("input", function () {
        var query = normalize(tagSearch.value);
        tagItems.forEach(function (item) {
          item.hidden = query && normalize(item.getAttribute("data-tag-name")).indexOf(query) === -1;
        });
      });
    }

    var toc = document.getElementById("toc-list");
    var article = document.querySelector(".article-content");
    if (toc && article) {
      var headings = Array.prototype.slice.call(article.querySelectorAll("h1, h2, h3"));
      toc.innerHTML = "";

      if (!headings.length) {
        var item = document.createElement("li");
        item.className = "muted";
        item.textContent = "Bài viết không có heading.";
        toc.appendChild(item);
      } else {
        headings.forEach(function (heading, index) {
          if (!heading.id) heading.id = "section-" + (index + 1);
          var li = document.createElement("li");
          li.className = "toc-" + heading.tagName.toLowerCase();
          var link = document.createElement("a");
          link.href = "#" + heading.id;
          link.textContent = heading.textContent;
          li.appendChild(link);
          toc.appendChild(li);
        });
      }
    }

    var codeBlocks = Array.prototype.slice.call(document.querySelectorAll(".article-content pre"));
    codeBlocks.forEach(function (pre) {
      var host = pre.parentElement && pre.parentElement.classList.contains("highlight") ? pre.parentElement : pre;
      if (host.querySelector(".code-copy")) return;

      var button = document.createElement("button");
      button.className = "code-copy";
      button.type = "button";
      button.textContent = "Copy";

      button.addEventListener("click", function () {
        var code = pre.querySelector("code");
        var text = code ? code.innerText : pre.innerText;
        navigator.clipboard.writeText(text).then(function () {
          button.textContent = "Copied";
          window.setTimeout(function () { button.textContent = "Copy"; }, 1300);
        });
      });

      host.appendChild(button);
    });

    var copyUrlButton = document.querySelector("[data-copy-url]");
    if (copyUrlButton) {
      copyUrlButton.addEventListener("click", function () {
        navigator.clipboard.writeText(window.location.href).then(function () {
          var old = copyUrlButton.textContent;
          copyUrlButton.textContent = "✓";
          window.setTimeout(function () { copyUrlButton.textContent = old; }, 1200);
        });
      });
    }
  });
})();
