// Language Manager — apply language immediately (before DOM renders) to reduce flash
(function () {
  var supported = ["en", "zh"];

  // Inject CSS for 3D flip language-switch animation
  var _langStyle = document.createElement('style');
  _langStyle.textContent = [
    '@keyframes lang-flip-out {',
    '  0%   { transform: perspective(800px) rotateX(0deg);   opacity: 1; }',
    '  100% { transform: perspective(800px) rotateX(-90deg); opacity: 0; }',
    '}',
    '@keyframes lang-flip-in {',
    '  0%   { transform: perspective(800px) rotateX(90deg); opacity: 0; }',
    '  100% { transform: perspective(800px) rotateX(0deg); opacity: 1; }',
    '}',
    '.lang-flip-out { animation: lang-flip-out .25s ease-in forwards; }',
    '.lang-flip-in  { animation: lang-flip-in  .3s ease-out forwards; }',
  ].join('\n');
  document.head.appendChild(_langStyle);

  function detectLang() {
    // 1. URL param takes priority (user explicitly chose)
    try {
      var urlLang = new URLSearchParams(location.search).get("lang");
      if (urlLang && supported.indexOf(urlLang) !== -1) return urlLang;
    } catch (e) { }
    // 2. No URL param → follow system language
    try {
      var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      if (nav.indexOf('zh') === 0) return 'zh';
    } catch (e) { }
    return 'en';
  }

  var currentLang = detectLang();
  document.documentElement.setAttribute("data-lang", currentLang);
  document.documentElement.setAttribute(
    "lang",
    currentLang === "zh" ? "zh-CN" : "en",
  );

  // ─── Translations ────────────────────────────────────────────────────────────
  var T = {
    // Page titles
    "page.title.home": {
      en: "Home - JunxiBao's Blog",
      zh: "主页 - 鲍俊希的博客",
    },
    "page.title.passage": {
      en: "Articles - JunxiBao's Blog",
      zh: "文章 - 鲍俊希的博客",
    },

    // Shared nav
    "nav.about": { en: "About Myself", zh: "关于我" },
    "nav.articles": { en: "Articles", zh: "文章" },
    "nav.email": { en: "Email", zh: "邮件" },

    // Shared modals / buttons
    "modal.close": { en: "Close", zh: "关闭" },
    "btn.backToTop": { en: "Back to top", zh: "返回顶部" },

    // ── home.html ─────────────────────────────────────────────────────────────
    "home.hero.title": { en: "Welcome to My Website", zh: "欢迎来到我的网站" },
    "home.hero.subtitle": {
      en: "In this page, I will record my study life, welcome to watch",
      zh: "在这里，我会记录我的学习生活，欢迎观看",
    },

    "home.profile.h2": { en: "Hello, I'm Junxi Bao", zh: "你好，我是鲍俊希" },
    "home.profile.p1": {
      en: "I'm a passionate high school student at <strong>NINGBO HD School</strong>, deeply fascinated by the world of technology, especially computer science and engineering.",
      zh: "我是一名就读于<strong>宁波赫德实验学校</strong>的高中生，对科技世界充满热情，尤其痴迷于计算机科学和工程领域。",
    },
    "home.profile.p2": {
      en: "In this Website, I document my journey through the fascinating realms of technology, like programming, smart home automation, and innovative projects. From building intelligent systems to crafting web applications, every project is a step forward in my tech adventure.",
      zh: "在这个网站里，我记录着探索科技世界的旅程，包括编程、智能家居自动化以及各种创新项目。从构建智能系统到开发网页应用，每一个项目都是我技术探险路上的一步。",
    },
    "home.profile.p3": {
      en: "Join me as I explore the intersection of creativity and technology, sharing insights, challenges, and discoveries along the way.",
      zh: "欢迎与我一起探索创意与技术的交汇处，共同分享见解、挑战与发现。",
    },

    "home.skills.h2": { en: "My Tech Arsenal", zh: "我的技术武器库" },

    "skill.app-dev.name": { en: "Application development", zh: "应用开发" },
    "skill.app-dev.desc": {
      en: "SQL database, Capacitor Framework, API keys, Network Request",
      zh: "SQL数据库，Capacitor框架，API密钥，网络请求",
    },
    "skill.smart-home.name": { en: "Smart Home", zh: "智能家居" },
    "skill.smart-home.desc": {
      en: "Home Assistant, IoT, Automation",
      zh: "Home Assistant，物联网，自动化",
    },
    "skill.web-dev.name": { en: "Web Development", zh: "网页开发" },
    "skill.web-dev.desc": {
      en: "HTML, CSS, JavaScript",
      zh: "HTML，CSS，JavaScript",
    },
    "skill.raspberry-pi.name": { en: "Raspberry Pi", zh: "树莓派" },
    "skill.raspberry-pi.desc": {
      en: "Embedded Systems, Linux, Face Recognition",
      zh: "嵌入式系统，Linux，人脸识别",
    },
    "skill.web3.name": { en: "Web 3", zh: "Web 3" },
    "skill.web3.desc": {
      en: "Blockchain, Smart Contracts, DApps",
      zh: "区块链，智能合约，去中心化应用",
    },

    "home.apps.h2": { en: "APP INSTALLATION", zh: "应用安装" },
    "home.apps.subtitle": {
      en: "Here you can download and access my two applications",
      zh: "在这里，你可以下载并访问我的两款应用",
    },
    "home.apps.btn": { en: "<i data-lucide='smartphone'></i> Open App List", zh: "<i data-lucide='smartphone'></i> 打开应用列表" },
    "home.apps.modal.title": { en: "Application list", zh: "应用列表" },
    "home.apps.purpura.title": { en: "Purpura Elf", zh: "紫癜精灵" },
    "home.apps.purpura.desc": {
      en: 'This software is a project I collaborated on with a classmate who suffers from purpura. It aims to track the disease through artificial intelligence so that purpura patients can have better health. To read more, click <a href="./articles/App_Making.html">here</a>.',
      zh: '这款软件是我与一位患有紫癜的同学合作的项目，旨在通过人工智能追踪疾病，帮助紫癜患者改善健康状况。更多详情，点击<a href="./articles/App_Making.html">这里</a>。',
    },
    "home.apps.seasons.title": { en: "The Four Seasons", zh: "人间四季" },
    "home.apps.seasons.desc": {
      en: 'One day, while walking with my mother, I heard that there was no good calendar software on the market. The one that came with Apple was too complicated and did not have the lunar calendar function. The third-party ones were either full of ads or required money. So, I made one myself using AI. To read more, click <a href="./articles/calendar.html">here</a>.',
      zh: '有一天，我和妈妈散步时，听说市面上没有好用的日历软件。苹果自带的太复杂，也没有农历功能；第三方的要么广告满天飞，要么收费。于是，我用AI自己做了一个。更多详情，点击<a href="./articles/calendar.html">这里</a>。',
    },

    "home.cta.h2": {
      en: "Ready to Explore My Projects?",
      zh: "准备探索我的项目了吗？",
    },
    "home.cta.p": {
      en: "Discover the fascinating world of technology through my articles and projects",
      zh: "通过我的文章和项目，探索精彩的科技世界",
    },
    "home.cta.articles": { en: "<i data-lucide='book-open'></i> Read Articles", zh: "<i data-lucide='book-open'></i> 阅读文章" },
    "home.cta.github": { en: "<i data-lucide='github'></i> View GitHub", zh: "<i data-lucide='github'></i> 查看 GitHub" },
    "home.cta.email": { en: "<i data-lucide='mail'></i> Get in Touch", zh: "<i data-lucide='mail'></i> 联系我" },

    // Uptime (shared)
    "uptime.label": { en: "// site has been running for", zh: "// 网站已运行" },
    "uptime.days": { en: "days", zh: "天" },
    "uptime.hours": { en: "hours", zh: "小时" },
    "uptime.mins": { en: "mins", zh: "分钟" },
    "uptime.secs": { en: "secs", zh: "秒" },

    // ── passage.html ──────────────────────────────────────────────────────────
    "passage.hero.title": { en: "Knowledge Repository", zh: "知识库" },
    "passage.hero.subtitle": {
      en: "Exploring technology, sharing insights, building the future",
      zh: "探索技术，分享见解，构建未来",
    },

    "passage.stats.h2": { en: "Article Statistics", zh: "文章数据概览" },
    "passage.stats.total": { en: "Total Articles", zh: "文章总数" },
    "passage.stats.updated": { en: "Last Updated", zh: "最近更新" },

    "passage.filter.h3": { en: "Filter by Category", zh: "按分类筛选" },
    "passage.filter.all": { en: "All Articles", zh: "全部文章" },
    "passage.filter.projects": { en: "Projects", zh: "项目" },
    "passage.filter.daily": { en: "Daily", zh: "日常" },
    "passage.filter.app-development": { en: "APP Development", zh: "APP开发" },
    "passage.search.placeholder": {
      en: "Search articles by title, tag or description...",
      zh: "按标题、标签或描述搜索文章...",
    },
    "passage.article.read": { en: "Read Article →", zh: "阅读文章 →" },

    "article.ai_agent_apps.title": {
      en: "Building Two Apps with AI: Easy Agent & WeChatAutoReply",
      zh: "通过 AI 编程开发的两款实用 APP：Easy Agent 与 WeChatAutoReply"
    },
    "article.ai_agent_apps.desc": {
      en: "How I built Easy Agent to summon LLMs globally, and WeChatAutoReply using VoiceOver APIs, purely through AI programming.",
      zh: "我是如何通过 AI 编程开发出支持全局快捷键唤起的 Easy Agent 以及基于原生无障碍树的微信自动回复工具的。"
    },

    // Article titles & descriptions
    "article.obsidian.title": {
      en: "Obsidian: The Best Note-Taking Tool",
      zh: "Obsidian：最好用的笔记工具",
    },
    "article.obsidian.desc": {
      en: "From theme setup and LaTeX workflow to AI-assisted knowledge management, this is why Obsidian became my long-term note-taking tool.",
      zh: "从主题配置、LaTeX 公式输入到 AI 辅助知识整理，这篇文章分享了 Obsidian 为什么成为我长期使用的笔记工具。",
    },
    "article.tangem.title": {
      en: "Taking the First Step in Crypto Investing: My Tangem Cold Wallet Unboxing Experience",
      zh: "踏出加密投资的第一步：我的 Tangem 冷钱包开箱体验",
    },
    "article.tangem.desc": {
      en: "Unboxing and setting up my new Tangem hardware wallet to secure my crypto assets, along with an updated portfolio strategy.",
      zh: "开箱并设置我的 Tangem 硬件钱包以保护我的加密资产，并更新了投资组合策略。",
    },
    "article.web3.title": {
      en: "From a 500 RMB Liquidation to Building a Crypto Portfolio",
      zh: "从500元爆仓到构建加密货币投资组合",
    },
    "article.web3.desc": {
      en: "How paying for ChatGPT accidentally led me into Web3: a journey from a small liquidation to building a core crypto portfolio.",
      zh: "试图给ChatGPT充值，却意外踏入了Web3的世界：从一次小爆仓到构建加密货币投资组合的历程。",
    },
    "article.mywebsite.title": {
      en: "My Website, My Rules",
      zh: "我的网站，我的规则",
    },
    "article.mywebsite.desc": {
      en: "This is the first article on this website, where I'll walk you through the development process and provide a general introduction to its purpose and features.",
      zh: "这是本网站的第一篇文章，我将带你了解网站的开发过程，并简要介绍其目的和功能。",
    },
    "article.editor.title": {
      en: "The Complex Path of Finding a Suitable Editor",
      zh: "寻找合适编辑器的曲折之路",
    },
    "article.editor.desc": {
      en: "This article shares my journey of exploring different code editors. From DEV C++ to Visual Studio, JetBrains, VSCode, and Neovim, I compare their pros and cons. In the end, I mainly use neovim and sometimes use VSCode for Raspberry Pi's development.",
      zh: "这篇文章分享了我探索不同代码编辑器的历程。从DEV C++到Visual Studio、JetBrains、VSCode和Neovim，逐一比较优缺点。最终，我主要使用Neovim，有时也用VSCode进行树莓派开发。",
    },
    "article.smarthome.title": {
      en: "The Intelligent Path in my room",
      zh: "我房间里的智能之路",
    },
    "article.smarthome.desc": {
      en: "I built a smart bedroom using Xiaomi devices and Home Assistant. I installed a smart socket, upgraded my chandelier lights, added motion sensors for automation, and used a Curtain Mate for automatic curtain control. This setup makes my room more convenient, efficient, and comfortable without major modifications.",
      zh: "我使用小米设备和Home Assistant打造了一个智能卧室。安装了智能插座，升级了吊灯，添加了人体传感器实现自动化，并使用窗帘电机实现自动窗帘控制。这套系统让我的房间更便捷、高效、舒适。",
    },
    "article.cloudflare.title": {
      en: "Internet Great Good Samaritan: Cloudflare",
      zh: "互联网大善人：Cloudflare",
    },
    "article.cloudflare.desc": {
      en: "I used to host my website on Vultr for $5/month, which was too expensive. Due to the GFW, GitHub Pages was inaccessible. I finally switched to Cloudflare, which is free, powerful, and not blocked, greatly reducing my costs.",
      zh: "我曾在Vultr上以每月5美元的价格托管网站，实在太贵。由于防火长城，GitHub Pages也无法访问。最终我迁移到了Cloudflare，免费、强大且不被屏蔽，大大降低了成本。",
    },
    "article.email.title": {
      en: "Managing Emails with Custom Domain via Cloudflare",
      zh: "通过Cloudflare用自定义域名管理邮件",
    },
    "article.email.desc": {
      en: "Managing emails can be tricky when important messages get buried under promotions. I explored Gmail's plus addressing and eventually settled on Cloudflare's email forwarding with my custom domain—a free solution with some trade-offs.",
      zh: "当重要邮件被埋在促销信息中时，邮件管理会变得十分麻烦。我尝试了Gmail加号地址，最终选择了Cloudflare邮件转发配合自定义域名——一个免费但有所取舍的方案。",
    },
    "article.app1.title": {
      en: "The process of me making an app",
      zh: "我制作应用的过程",
    },
    "article.app1.desc": {
      en: "In this website, I described the process of making my own app and some problems I encountered in the early stage, such as js loading problems, https problems, etc. I will add more content later.",
      zh: "在这篇文章中，我描述了制作自己应用的过程，以及早期遇到的一些问题，例如JS加载问题、HTTPS问题等，后续还会继续补充内容。",
    },
    "article.raspi.title": {
      en: "Developing an automatic vision measurement system using Raspberry Pi",
      zh: "基于树莓派开发自动视力测量系统",
    },
    "article.raspi.desc": {
      en: "This is a notion from a project I did. My project was to build an automatic vision test system based on gesture recognition and face recognition on a Raspberry Pi.",
      zh: "这是我做的一个项目的Notion文档。该项目旨在基于树莓派，通过手势识别和人脸识别构建一套自动视力测量系统。",
    },
    "article.app2.title": {
      en: "The process of me making an app 2",
      zh: "我制作应用的过程 2",
    },
    "article.app2.desc": {
      en: 'This article is the second part of <a href="./articles/App_Making.html">The process of me making an app.</a> And in this article, I successfully submitted my app to the App Store.',
      zh: '这篇文章是<a href="./articles/App_Making.html">我制作应用的过程</a>的第二部分。在这篇文章中，我成功将应用提交到了App Store。',
    },
    "article.calendar.title": {
      en: "From Zero to App Store: My First Swift App Made with AI",
      zh: "从零到App Store：我用AI开发的第一款Swift应用",
    },
    "article.calendar.desc": {
      en: "AI lowered the barrier, enabling a beginner to turn an idea into a full App Store release.",
      zh: "AI降低了门槛，让一个初学者能够将想法变成一款正式上架App Store的应用。",
    },
    "article.router.title": {
      en: "Building a Home Networking Solution with Mesh Routers",
      zh: "使用Mesh路由器构建家庭网络方案",
    },
    "article.router.desc": {
      en: "Setting up a Xiaomi BE6500 mesh router with Clash proxy for whole-home internet access, including performance optimization and rule customization.",
      zh: "配置小米BE6500 Mesh路由器与Clash代理，实现全屋上网，包括性能优化和规则自定义。",
    },
    "article.app3.title": {
      en: "The process of me making an app 3",
      zh: "我制作应用的过程 3",
    },
    "article.app3.desc": {
      en: 'This article is the third part of <a href="./articles/App_Making.html">The process of me making an app.</a> In this article, I continue to improve the app after it went live on the App Store, including fixing UI issues and adding photo upload features.',
      zh: '这篇文章是<a href="./articles/App_Making.html">我制作应用的过程</a>的第三部分。在这篇文章中，我继续改进应用上线后的功能，包括修复UI问题和添加照片上传功能。',
    },
    "article.app4.title": {
      en: "The process of me making an app 4",
      zh: "我制作应用的过程 4",
    },
    "article.app4.desc": {
      en: 'This article is the fourth part of <a href="./articles/App_Making.html">The process of me making an app.</a> In this article, I discuss how I implemented code obfuscation and compression to protect my source code, optimized app performance, and my journey to obtaining a Software Copyright.',
      zh: '这篇文章是<a href="./articles/App_Making.html">我制作应用的过程</a>的第四部分。在这篇文章中，我讨论了如何实现代码混淆和压缩以保护源代码、优化应用性能，以及我申请软件著作权的历程。',
    },
    "article.toefl.title": {
      en: "TOEFL Learning: A Painful Journey",
      zh: "TOEFL学习：一段痛苦的历程",
    },
    "article.toefl.desc": {
      en: "As a student who transferred from a regular middle school to an international school, English has always been my biggest weakness. This article documents my TOEFL learning journey from scoring 3 on reading in my first attempt to eventually achieving 94, including the setbacks, efforts, and growth along the way.",
      zh: "作为一名从普通初中转入国际学校的学生，英语一直是我最大的弱项。这篇文章记录了我从第一次托福阅读只得3分，到最终取得94分的学习历程，包括其中的挫折、努力与成长。",
    },
    "article.ctb.title": {
      en: "National Championship: A Thrilling Journey from Code to Podium",
      zh: "CTB全国赛摘金记：从代码到领奖台的惊险之旅",
    },
    "article.ctb.desc": {
      en: "My experience at the CTB National Finals pitching our app to juries and cracking poster dilemmas with AI.",
      zh: "我在CTB全国总决赛中向评委展示应用、并用AI攻克海报难题的全程体验。",
    },
    "article.vpn-darkweb.title": {
      en: "Setting Up a VPN Node and Dark Web Site on an Overseas Server",
      zh: "通过海外服务器搭建翻墙节点和暗网网站",
    },
    "article.vpn-darkweb.desc": {
      en: "From self-hosting a CMIN2 proxy node with s-ui panel management to deploying a Tor hidden service with a custom .onion vanity address — a hands-on journey through network security, protocol disguise, and dark web architecture.",
      zh: "从自建 CMIN2 代理节点、使用 s-ui 面板管理多用户，到部署 Tor 隐藏服务并生成专属 .onion 域名——一段关于网络安全、协议伪装与暗网架构的实战之旅。",
    },
    "article.youth.title": {
      en: "2025 Youth Challenge competition",
      zh: "2025青年挑战赛",
    },
    "article.youth.desc": {
      en: 'Our school\'s education group held a charity competition called the "2050 Future Changemakers Competition." Our "Purpura Elf" project participated and won the national championship with a prize of 4000 yuan. This article documents our journey from the preliminary rounds through the school finals to the national finals in Shanghai, including the challenges, improvements, and ultimate victory.',
      zh: '我们学校的教育集团举办了一场名为"2050未来变革者竞赛"的公益赛事。我们的"紫癜精灵"项目参赛并荣获全国冠军，奖金4000元。这篇文章记录了我们从预赛、校内决赛到上海全国总决赛的历程，包括面临的挑战、改进与最终的胜利。',
    },
    "article.ap-exams.title": {
      en: "Thoughts on AP Exams",
      zh: "AP考试的那些事",
    },
    "article.ap-exams.desc": {
      en: "Taking six AP exams in one year — from the anxiety-inducing Physics C mock exams I never cracked a 5 on, to Statistics surprises and a surprisingly smooth Physics test day. A candid look at the most stressful academic year of my high school life.",
      zh: "一年备考六门 AP——从物理模考屡战屡败的煎熬，到统计出乎意料的难题，再到正式考试时物理意外简单的释然。记录我高中最有压力的一年。",
    },

    // ── index.html ────────────────────────────────────────────────────────────
    "index.title": { en: "JunxiBao's Blog", zh: "鲍俊希的博客" },
    "index.output.whoami": { en: "Junxi Bao - High School Student & Tech Enthusiast", zh: "鲍俊希 - 高中生 & 科技爱好者" },
    "index.output.about1": { en: "Passionate about computer science, engineering, and smart home technology.", zh: "热爱计算机科学、工程学与智能家居技术。" },
    "index.output.about2": { en: "Currently studying at NINGBO HD School.", zh: "目前就读于宁波赫德实验学校。" },
    "index.output.projects": { en: "Smart Home Setup | Web Development | App Development | Raspberry Pi Projects", zh: "智能家居 | 网页开发 | 应用开发 | 树莓派项目" },
    "index.output.ready": { en: "Ready to explore?", zh: "准备好探索了吗？" },
    "index.btn.enter": { en: "<i data-lucide='rocket'></i> Enter Website", zh: "<i data-lucide='rocket'></i> 进入网站" },

    // ── Article category tags ─────────────────────────────────────────────────
    "tag.daily": { en: "daily", zh: "日常" },
    "tag.app-development": { en: "app-development", zh: "APP开发" },
    "tag.projects": { en: "projects", zh: "项目" },
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function get(key) {
    var t = T[key];
    if (!t) return null;
    return t[currentLang] !== undefined
      ? t[currentLang]
      : t["en"] !== undefined
        ? t["en"]
        : null;
  }

  function updateLinks() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || /^(https?:|mailto:|javascript:|tel:|#)/.test(href)) return;
      try {
        var u = new URL(href, location.href);
        if (u.hostname !== location.hostname) return;
        u.searchParams.set("lang", currentLang);
        a.setAttribute("href", u.pathname + (u.search || "") + (u.hash || ""));
      } catch (e) { }
    });
  }

  function applyTranslations() {
    // Update html lang attribute
    document.documentElement.setAttribute(
      "lang",
      currentLang === "zh" ? "zh-CN" : "en",
    );

    // Translate elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var t = get(key);
      if (t === null) return;
      if (el.tagName === "TITLE") {
        document.title = t;
      } else {
        el.innerHTML = t;
      }
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      var t = get(key);
      if (t !== null) el.placeholder = t;
    });

    // Translate aria-labels
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria-label");
      var t = get(key);
      if (t !== null) el.setAttribute("aria-label", t);
    });

    // Propagate lang param to all internal links
    updateLinks();

    window.dispatchEvent(
      new CustomEvent("langchange", { detail: { lang: currentLang } }),
    );

    // Re-initialize lucide icons for newly injected translation elements
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Signal that translations are ready — image loading can begin
    window.__langReady = true;
    window.dispatchEvent(new CustomEvent('langready'));
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  window.LangManager = {
    get: function () {
      return currentLang;
    },
    set: function (lang) {
      if (supported.indexOf(lang) === -1) return;

      var targets = document.querySelectorAll('[data-i18n]');
      var FLIP_OUT_MS = 250;

      // Save scroll position so the page stays put
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Phase 1 — flip current text backward
      targets.forEach(function (el) {
        el.classList.remove('lang-flip-in');
        el.classList.add('lang-flip-out');
      });

      // Phase 2 — after flip-out, swap text and flip new text in
      setTimeout(function () {
        currentLang = lang;
        document.documentElement.setAttribute("data-lang", lang);

        try {
          var url = new URL(location.href);
          url.searchParams.set("lang", lang);
          history.replaceState(null, "", url.toString());
        } catch (e) { }
        applyTranslations();

        // Restore scroll position after text swap
        window.scrollTo(0, scrollY);

        // Flip new text in from behind
        requestAnimationFrame(function () {
          targets.forEach(function (el) {
            el.classList.remove('lang-flip-out');
            el.classList.add('lang-flip-in');
          });
          window.scrollTo(0, scrollY);
        });
      }, FLIP_OUT_MS);
    },
    cycle: function () {
      this.set(currentLang === "zh" ? "en" : "zh");
    },
    translate: get,
  };

  // Apply on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTranslations);
  } else {
    applyTranslations();
  }

  // Carry lang URL param when navigating to internal pages (same pattern as theme.js)
  document.addEventListener(
    "click",
    function (e) {
      var link = e.target.closest && e.target.closest("a[href]");
      if (!link) return;
      var href = link.getAttribute("href");
      if (!href || /^(https?:|mailto:|javascript:|tel:|#)/.test(href)) return;
      // theme.js already handles navigation with its own interceptor;
      // lang param is embedded in the href attribute via updateLinks(), so theme.js
      // will carry it automatically. Nothing extra needed here.
    },
    true,
  );

  // ─── Fix anchor links when duplicate IDs exist across lang-en / lang-zh ───
  // When both language sections have the same id (e.g. #popup-ui-fix), the
  // browser always scrolls to the FIRST one in DOM order, which is in the
  // hidden lang-en section. This handler finds the visible element instead.
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) !== "#") return;

    var targetId = href.slice(1);
    if (!targetId) return;

    // Find all elements with this id
    var candidates = document.querySelectorAll("[id=\"" + targetId + "\"]");
    if (candidates.length <= 1) return; // No duplicates → browser handles it fine

    // Pick the one that is currently visible (inside the active lang section)
    var visibleTarget = null;
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].offsetParent !== null || candidates[i].getClientRects().length > 0) {
        visibleTarget = candidates[i];
        break;
      }
    }

    if (visibleTarget) {
      e.preventDefault();
      visibleTarget.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL hash without triggering default scroll
      history.replaceState(null, "", "#" + targetId);
    }
  });
})();
