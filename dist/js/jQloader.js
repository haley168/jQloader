'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * jQloader v0.0.6
 * @license: MIT
 * Designed and built by Moer
 * github   https://github.com/Moerj/jQloader
 */

(function ($) {
    'use strict';

    // 加载时页面顶部进度条

    var ProgressBar = function () {
        function ProgressBar() {
            _classCallCheck(this, ProgressBar);

            this.color = '#58a2d1';
            this.transition = '10s width';
            this.timer = null;
            this.$progress = $('<span></span>');
            this.reset();
            $('html').append(this.$progress);
        }

        _createClass(ProgressBar, [{
            key: 'reset',
            value: function reset() {
                this.$progress.css({
                    backgroundColor: this.color,
                    transition: 'none',
                    height: '2px',
                    width: 0,
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 9999,
                    boxShadow: '1px 1px 2px 0 ' + this.color
                });
            }
        }, {
            key: 'max',
            value: function max() {
                return document.body.clientWidth;
            }
        }, {
            key: 'setColor',
            value: function setColor(color) {
                if (typeof color === 'string') {
                    this.color = color;
                }
            }
        }, {
            key: 'start',
            value: function start() {
                this.reset();
                this.$progress.css({
                    width: this.max(),
                    transition: this.transition
                });
            }
        }, {
            key: 'stop',
            value: function stop() {
                this.$progress.css({
                    width: this.$progress.width()
                });
            }
        }, {
            key: 'finish',
            value: function finish() {
                var _this = this;

                this.stop();
                this.$progress.css({
                    width: this.max(),
                    transition: '0.5s width'
                });
                if (!this.timer) {
                    this.timer = setTimeout(function () {
                        _this.timer = null;
                        _this.reset();
                    }, 700);
                }
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                this.$progress.remove();
                this.$progress = null;
            }
        }]);

        return ProgressBar;
    }();

    // 初始化 dom 对象下的命名空间，用于存放数据


    function _initNamespace(dom) {
        if (dom._jQloader === undefined) {
            dom._jQloader = {}; //dom 上存放jQloader数据的命名空间
        }
        if (dom._jQloader.loadFinishEvents === undefined) {
            dom._jQloader.loadFinishEvents = [];
        }
        if (dom._jQloader.loadFinish === undefined) {
            dom._jQloader.loadFinish = function () {
                var events = dom._jQloader.loadFinishEvents;
                for (var i = 0; i < events.length; i++) {
                    events[i]();
                }
            };
        }
    }

    // 编译当前页面 html 标签上的 loadPage 指令
    function _compile() {

        // 编译include
        var includeDoms = document.getElementsByTagName('jq-include');
        for (var _i = 0; _i < includeDoms.length; _i++) {
            var $loader = $(includeDoms[_i]);
            var url = $loader.attr('src');
            if (url) {
                (function () {
                    var $container = $('<div></div>');
                    $loader.replaceWith($container);
                    $container.loadPage({
                        url: url,
                        history: false,
                        progress: false
                    }, function () {
                        // 编译并ajax加载完成后的回调
                        $container.children().eq(0).unwrap();
                    });
                })();
            }
        }

        // 动态绑定所有a标签
        var links = document.getElementsByTagName('a');

        var _loop = function _loop() {
            var a = links[i];
            var attrRouter = a.getAttribute('load');
            if (attrRouter) {
                (function () {
                    var url = attrRouter; //真正需要的路由地址
                    a.removeAttribute('load'); //防止重复编译
                    a.href = '#' + url;
                    a.onclick = function (event) {
                        event.preventDefault();
                        var container = a.getAttribute('to');
                        if (container) {
                            $(container).loadPage({
                                url: url,
                                title: a.innerHTML
                            });
                        } else {
                            $('jq-router').loadPage({
                                url: url,
                                title: a.innerHTML
                            });
                        }
                    };
                })();
            }
        };

        for (var i = 0; i < links.length; i++) {
            _loop();
        }
    }

    // 载入历史记录
    function _loadHitory() {
        var url = document.location.hash.substr(1);
        var $container = $('jq-router');

        if (url) {
            $container.loadPage({
                url: url,
                history: false,
                progress: false,
                title: history.state
            });
        } else {
            // 没有 url 参数，代表当前回到无路由页面
            // 因为用清空或者重请求等方法很难判断逻辑
            // 强制刷新一次，释放内存，也让它真正回到首页，用sessionStorage避免死循环刷新
            var needReload = sessionStorage.getItem('jqRouterReload');
            if (needReload) {
                sessionStorage.removeItem('jqRouterReload');
            } else {
                sessionStorage.setItem('jqRouterReload', true);
                window.location.reload();
            }
        }
    }

    // 浏览器历史跳转
    window.addEventListener("popstate", function () {
        _loadHitory();
    });

    // 暴露的公共方法 ==============================
    // loadPage 加载完后的回调
    $.fn.loadFinish = function (call_back) {
        var container = $(this);
        container[0]._jQloader.loadFinishEvents.push(call_back);
        return container;
    };

    // 加载一个页面
    $.fn.loadPage = function (OPTS, call_back) {
        var $container = $(this);

        if (!$container.length) {
            console.error($container.selector + ' not a vaild selector');
            return $container;
        }

        var DEFAULT = {
            history: true,
            progress: true,
            cache: true,
            async: true,
            title: null
        };

        OPTS = $.extend({}, DEFAULT, OPTS);

        // 初始化配置容器命名空间
        _initNamespace($container[0]);

        // 开启 loading 进度条
        if (OPTS.progress) $.progressBar.start();

        // 请求页面
        $.ajax({
            dataType: 'html',
            url: OPTS.url,
            cache: OPTS.cache,
            async: OPTS.async,
            timeout: 10000,
            success: function success(data) {

                // 记录浏览器历史
                if (OPTS.history && $container[0].localName === 'jq-router') {
                    // 处理 url 格式，浏览器地址栏去掉./开头
                    var url = OPTS.url;
                    if (OPTS.url.substring(0, 2) === './') {
                        url = OPTS.url.substring(2);
                    }

                    // 浏览器地址栏操作
                    history.pushState(OPTS.title, '', '#' + url);
                }

                // 修改页面 title
                if (OPTS.title) {
                    window.document.title = OPTS.title;
                }

                // 写入页面
                $container.html(data);

                // 解决Zepto ajxa 请求到的页面 script 标签执行问题
                if (typeof Zepto != 'undefined' && typeof jQuery == 'undefined') {
                    var script = $container.find('script');
                    for (var i = 0; i < script.length; i++) {
                        var src = script[i].src;
                        if (src) {
                            // Zepto不会运行外联script
                            $.get(src);
                        } else {
                            // Zepto会执行两次页面的内联script
                            $(script[i]).remove();
                        }
                    }
                }

                // 编译新页面上的指令
                _compile();

                // 运行容器上的回调方法组
                $container[0]._jQloader.loadFinish();
            },
            error: function error() {
                console.warn('页面载入失败！');
            },
            complete: function complete() {
                // 进度条结束
                if (OPTS.progress) $.progressBar.finish();
                if (call_back) call_back();
            }
        });

        return $container;
    };

    // 创建进度条
    if (!$.progressBar) {
        $.progressBar = new ProgressBar();
    }

    $(function () {
        // jQloader所在页面/首页初始化 dom 完毕

        // 执行一次编译
        _compile();

        // 请求一次浏览器历史
        _loadHitory();
    });
})($);