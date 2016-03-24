/**
 * Created by acer on 2016/3/15.
 */
;(function($){
    var _prefix = (function(temp){
        //私有方法，由于在闭包中，所以外部无法访问此方法
        //获取浏览器前缀，查看当前浏览器是否支持transition属性
        //若支持则，返回属性，否则返回false
        var prefix = ["moz","o","webkit","ms"];
        var props = "";
        for(var i in prefix){
            props = prefix[i]+"Transition";
            if(temp.style[props]!=undefined) {
                return "-" + prefix[i].toLowerCase() + "-";
            }
        }
        return false;
    })(document.createElement("div"));
    //定义对象构造方法
    var PageSwitch = (function(){//定义PageSwitch对象
        function PageSwitch(ele,options){//构造函数
            this.setting = $.extend(true, $.fn.pageSwitch.default,options||{});
            this.ele=ele;
            this.init();
        }
        PageSwitch.prototype = {
            //以_开头的为私有方法
            //初始化插件
            //初始化DOM结构
            init:function(){
                var me = this;//避免混淆this
                /*初始化DOM结构*/
                me.selectors = me.setting.selectors;
                me.sections = me.ele.find(me.selectors.sections);
                me.section = me.sections.find(me.selectors.section);

                //用于避免连续滑动
                me.canScroll = true;
                /*初始化参数*/
                me.direction = me.setting.direction == "vertical"? true : false;
                me.pageCount = me.pageCount();
                me.index = (me.setting.index>=0&&me.setting.index<me.pageCount)? me.setting.index : 0;

                if(!me.direction){
                    me._initLayout();
                }
                if(me.setting.pagination){
                    me._initPaging();
                }
                me._initEven();
            },
            //获取页面数量
            pageCount:function(){
                var me = this;
                return me.section.length;
            },
            //获取页面滑动的宽度或是高度
            switchLength:function(){
                return this.direction ? this.ele.height() : this.ele.width();
            },
            //向上滑动方法
            prev:function(){
                var me = this;
                if(me.index>0){

                    me.index --;
                }else if(me.setting.loop){

                    me.index = me.pageCount - 1;
                }
                me._scrollPage();
            },
            //向下滑动方法
            next:function(){
                var me = this;
                if(me.index < me.pageCount-1){

                    me.index ++;
                }else if(me.setting.loop){

                    me.index = 0;
                }
                me._scrollPage();
            },
            //横屏滑动时的页面布局
            _initLayout:function(){
                var me = this;
                var width = (me.pageCount()*100)+"%",
                    cellWidth = 100/me.pageCount().toFixed(2)+"%";
                me.sections.width(width);
                me.section.width(cellWidth).css("float","left");
            },
            //实现分页的DOM结构及其css样式
            _initPaging:function(){
                var me = this,
                    pagesClass = me.selectors.page.substring(1);
                me.activeClass = me.selectors.active.substring(1);
                var pageHtml = "<ul class="+pagesClass+">";
                for(var i=0;i<me.pageCount;i++){
                    pageHtml+="<li></li>";
                }
                pageHtml+="</ul>";
                me.ele.append(pageHtml);
                var pages = me.ele.find(me.selectors.page);
                me.pageItem = pages.find("li");
                me.pageItem.eq(me.index).addClass(me.activeClass);
                if(me.direction){
                    pages.addClass("vertical");
                }else {
                    pages.addClass("horizontal");
                }
            },
            //实现事件绑定
            _initEven:function(){
                var me = this;
                //点击分页事件
                me.ele.on("click",me.selectors.page+" li",function(){
                    me.index = $(this).index;
                    me._scrollPage();
                });
                //鼠标滚轮事件,其他浏览器中是mousewheel，firefox中是DOMMouseScroll
                me.ele.on("mousewheel DOMMouseScroll",function(e){
                    //取得滑动方向，保存在e的originalEven对象中，其他浏览器向上滑动为正，火狐为负
                    if(me.canScroll){
                        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
                        if(delta > 0 && (me.index && !me.setting.loop || me.setting.loop)){
                            me.prev();
                        }else if(delta < 0 && (me.index <= (me.pageCount-1) && !me.setting.loop || me.setting.loop)){
                            me.next();
                        }
                    }
                });
                //键盘事件
                //监听keydown事件
                //判断按下是哪个键：keycode，方向左上右下，分别是37/38/39/40
                if(me.setting.keyboard){
                    $(window).on("keydown",function(e){
                        var keyCode = e.keyCode;
                        if(keyCode == 37 || keyCode == 38 && (me.index && !me.setting.loop || me.setting.loop)){
                            me.prev();
                        }else if(keyCode == 39 || keyCode == 40 && (me.index <= (me.pageCount-1) && !me.setting.loop || me.setting.loop)){
                            me.next();
                        }
                    })
                };
                //窗口改变时发生的事件，绑定resize事件

                //动画结束时的回调事件，由options中的callback参数设定，绑定transitionend事件
                me.sections.on("webkitTransitionEnd msTransitionend mozTransitionend transitionend",function(){
                    me.canScroll = true;
                    if(me.setting.callback && $.type(me.setting.callback) == "function"){
                        me.setting.callback();
                    }
                })
            },
            //分页滚动事件
            _scrollPage:function(){
                var me = this;
                var acticePage = me.section.eq(me.index).position();//获取当前页面的相对坐标值
                if(!acticePage) return;
                //判断浏览器是否支持transition属性，若不支持则用animation
                me.canScroll =false;
                if(_prefix){
                    me.sections.css(_prefix+"transition","all "+me.setting.duration+"ms "+me.setting.easing);
                    var translate = me.direction ? "translateY(-"+acticePage.top+"px)": "translateX(-"+acticePage.left+"px)";
                    me.sections.css(_prefix+"transform",translate);
                }else{
                    var animateCss = me.direction ? {top : -acticePage.top+"px"} : {left : -acticePage.left+"px"};
                    me.sections.animate(animateCss, me.setting.duration, function () {
                        me.canScroll = true;
                        if (me.setting.callback && $.type(me.setting.callback) == "function") {
                            me.setting.call();
                        }
                    })
                }
                //分页导航条样式切换
                if(me.setting.pagination){
                    me.pageItem.eq(me.index).addClass(me.activeClass).siblings("li").removeClass(me.activeClass)
                }
            }
        };
        return PageSwitch;
    })();
    $.fn.pageSwitch = function(options){
        return this.each(function(){//单例模式为每个jquery对象创建PageSwitch实例，
            var me = $(this),
                instance = me.data("PageSwitch");
            if(!instance){
                instance = new PageSwitch(me,options);
                me.data("PageSwitch",instance);
            }
            //判断若options参数为字符串时，则返回相对应的方法
            if ( typeof options === 'string' ) {
                if(!$.isfunction(instance[options])||!options.charAt(0) === "_")return instance[options]();
                else{
                    logError( "no such method '" + options + "' for dlmenu instance" );
                    return;
                }
            }
        });
    };
    $.fn.pageSwitch.default = {
        selectors:{
            sections:".sections",
            section:".section",
            page:".pages",
            active:".active"
        },
        index: 0,//开始页面
        easing: "ease",//速度曲线
        duration:500,//时间
        loop: true,//是否自动循环
        pagination:true,//
        direction :"vertical",//默认为竖屏滑动 (vertical,horizancal)
        keyboard:true,
        callback:""
    };

    $(function(){
        $("[data-PageSwitch]").pageSwitch();
    })
})(jQuery);