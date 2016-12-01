/*!
    version: 1.0.0
    date: 2016-011-14
    author: qmjie
    github：基于lazyloadImg改造而来，https://github.com/lzxb/lazyloadImg
*/
!(function (LazyloadImg) {
    'use strict';
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        define(LazyloadImg);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = LazyloadImg();
    } else {
        window.LazyloadImg = LazyloadImg();
    }
})(function () {
    'use strict';

    /**
     * 构建对象
     */
    function LazyloadImg(myset) {

        this.el = '[data-src]'; //元素选择器
        /*
            元素在可视区位置，符合其中一个条件就会触发加载机制
        */
        this.top = 0; //元素在顶部伸出的距离才加载
        this.right = 0; //元素在右边伸出的距离才加载
        this.bottom = 0; //元素在底部伸出的距离才加载
        this.left = 0; //元素在左边伸出的距离才加载

        //this.before = () => { }; //加载之前执行方法
		this.before = function(){};
		this.load = function(el){};
		this.error = function(el){};
        //this.load = (el) => { }; //加载成功后回调方法
        //this.error = (el) => { }; //加载失败后回调方法
        this.qriginal = false; //是否将图片处理成正方形,true处理成正方形，false不处理

        //监听的事件列表
        this.monitorEvent = ['DOMContentLoaded', 'load', 'click', 'touchstart', 'touchend', 'haschange', 'online', 'pageshow', 'popstate', 'resize', 'storage', 'mousewheel', 'scroll'];

		
        for (var key in myset) { //覆盖配置
            this[key] = myset[key];
        }
	
		
        /**
         * 初始化
         */
        this.init = function(el) {

            //初始化样式
            this.createStyle();
            //src属性值
            this.src = (function() {
                return /\[data-([a-z]+)\]$/.exec(el)[1] || 'src';
            })();
			
			window.that = this;
            this.start();
        };

        /**
         * 创建插件所需样式
         */
        this.createStyle = function() {
            var style = document.getElementById('LazyloadImg-style');
            if (style) {
                return false; //已经创建了样式
            }
            style = document.createElement('style');
            style.id = 'LazyloadImg-style';
            style.type = 'text/css';
            style.innerHTML = '\
                .LazyloadImg-qriginal {\
                    -webkit-transition: none!important;\
                    -moz-transition: none!important;\
                    -o-transition: none!important;\
                    transition: none!important;\
                    background-size: cover!important;\
                    background-position: center center!important;\
                    background-repeat: no-repeat!important;\
                }\
            ';
            document.querySelector('head').appendChild(style);
        };
		
		this.addEvent = function(event,callback,obj) {
			var obj = obj || window;
			if (window.addEventListener) {
				/**
				 其它浏览器的事件代码: Mozilla, Netscape, Firefox
				 添加的事件的顺序即执行顺序 注意用 addEventListener 添加带on的事件，不用加on
				 */
				obj.addEventListener(event, callback , false);
			} else {
				/**
				 IE 的事件代码 在原先事件上添加 add 方法
				 */
				obj.attachEvent('on'+event, callback);
			}
		}
		this.removeEvnent = function(event,callback,obj) {
			var obj = obj || window;
			if (window.removeEventListener) {
				obj.removeEventListener(event, callback, false);
			}
			else {
				obj.detachEvent('on'+event, callback);
			}
		}
		
        /**
         * 开始
         */
        this.start = function() {
            var eventList = this.monitorEvent;

            for (var i = 0; i < eventList.length; i++) {
				this.addEvent(eventList[i], this.eachDOM);
            }
            this.eachDOM();
        };
        /**
         * 遍历DOM元素
         */
        this.eachDOM = function() {
			
            var list = document.querySelectorAll(that.el);
			
			//优化，当list为空时，说明已经全部加载完毕
			if(!list){
				return;
			}
			
            var trueList = [];
            for (var i = 0; i < list.length; i++) {
                if (that.testMeet(list[i]) === true) {
                    trueList.push(list[i]);
                }

            }

            for (var i = 0; i < trueList.length; i++) {
                that.loadImg(trueList[i]);
            }

        };
        /**
         * 检测元素是否在可视区
         * @param {object} el 检测的元素
         */
        this.testMeet = function(el) {
			
            var bcr = el.getBoundingClientRect(); //取得元素在可视区的位置

            var mw = el.offsetWidth; //元素自身宽度
            var mh = el.offsetHeight; //元素自身的高度
            var w = window.innerWidth; //视窗的宽度
            var h = window.innerHeight; //视窗的高度
            var boolX = (!((bcr.right - this.left) <= 0 && ((bcr.left + mw) - this.left) <= 0) && !((bcr.left + this.right) >= w && (bcr.right + this.right) >= (mw + w))); //上下符合条件
            var boolY = (!((bcr.bottom - this.top) <= 0 && ((bcr.top + mh) - this.top) <= 0) && !((bcr.top + this.bottom) >= h && (bcr.bottom + this.bottom) >= (mh + h))); //上下符合条件
            if (el.width != 0 && el.height != 0 && boolX && boolY) {
                return true;
            } else {
                return false;
            }
        };
        /**
         * 加载图片
         * @param {object} el 要加载图片的元素
         */
        this.loadImg = function(el)  {
			
			var src = '';
			if(el.dataset){
				src = el.dataset[that.src];
			}else{
				src = el.getAttribute('data-'+that.src);
			}
            
			
            var img = new Image();
            img.src = src;

            that.before.call(that, el);
            img.addEventListener('load', function(){

                if (that.qriginal) {
                    el.src = that.getTransparent(el.src, el.width, el.height);
                    el.className += ' LazyloadImg-qriginal';
                    el.style.backgroundImage = 'url(' + img.src + ')';
                } else {
                    el.src = img.src;
                }
				
                delete el.dataset[that.src];
                return that.load.call(that, el);
            }, false);
            img.addEventListener('error', function(){
                return that.error.call(that, el);
            }, false);
        };
        /**
         * 获取透明的图片
         */
        this.getTransparent = (function() {
            var canvas = document.createElement('canvas');
            canvas.getContext('2d').globalAlpha = 0.0;
            var images = {};

            return function(src, w, h){
                if (images[src]) return images[src]; //已经同样路径的已经生成过，无需重复生成浪费资源
                canvas.width = w;
                canvas.height = h;
                var data = canvas.toDataURL('image/png');
                images[src] = data;
                return data;
            };

        })();
        /**
         * 卸载插件
         */
        this.end = function() {
            var eventList = this.monitorEvent;
            for (var i = 0; i < eventList.length; i++) {
                window.removeEventListener(eventList[i], this.eachDOM, false);
            }
        };
        this.init(this.el);
    };

    return LazyloadImg;

});