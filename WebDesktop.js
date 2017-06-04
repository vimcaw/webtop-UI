//常用函数封装

/**
 * query选择器
 * @param selector {String} 选择器
 * @returns {*} {Node/NodeList} 若为id选择器，返回单个元素，否则返回NodeList
 */
var $ = function (selector) {
	if (selector.charAt(0) === '#') {
		return document.querySelector(selector);
	} else {
		return document.querySelectorAll(selector);
	}
};

/**
 * 遍历数组或类数组并对每项进行操作
 * @param array {Array/Array-like} 要遍历的数组
 * @param callback {Function} 对每项进行处理的函数
 */
var foreach = function (array, callback) {
	for (var i = 0,item; item = array[i++];) {
		callback(item);
	}
};

/**
 * 让某个元素播放一次动画（通过切换类名实现），可多次触发
 * @param $element {Element} 要播放动画的元素
 * @param classBefore {String} 播放之前，没有animation属性的class
 * @param classAfter {String} 带有animation属性的class
 */
function playAnimation($element, classBefore, classAfter) {
	$element.className = classBefore;
	window.requestAnimationFrame(function() {
		window.requestAnimationFrame(function() {
			$element.className = classAfter;
		});
	});
}

/**
 * 使某个元素可以被鼠标拖动来改变位置
 * @param $enable 能发生拖动的元素
 * @param $move 被拖动的元素
 */
var setDragMoving = function ($enable, $move) {
	var isDraging = false;
	var oldPosX, oldPosY, startPosX, startPosY;
	
	/**
	 * 使浮出层保持在屏幕内
	 * @param pos {Number} 浮出层的坐标
	 * @param maxPos {Number} 浮出层的最大坐标
	 * @returns {Number} 修正后的坐标
	 */
	var getPosInScreen = function (pos, maxPos) {
		if (pos < 0) {
			return 0;
		}
		else if (pos > maxPos) {
			return maxPos;
		}
		else {
			return pos;
		}
	};
	
	$enable.addEventListener('mousedown', function (event) {
		isDraging = true;
		//保存要移动的对象的当前位置
		oldPosX = parseInt($move.style.left.split('px')[0]);
		oldPosY = parseInt($move.style.top.split('px')[0]);
		//保存鼠标当前的位置
		startPosX = event.screenX;
		startPosY = event.screenY;
		return false;       //防止浏览器选中内容
	});
	
	window.addEventListener('mouseup', function () {
		isDraging = false;
	});
	
	window.addEventListener('mousemove', function (event) {
		if (isDraging) {
			//当前坐标 = 开始拖动时浮出层的坐标 + 鼠标移动的坐标
			var currentPosX = oldPosX + event.screenX - startPosX;
			var currentPosY = oldPosY + event.screenY - startPosY;
			
			//最大拖动范围
			var maxPosX = window.innerWidth - $move.offsetWidth;
			var maxPosY = window.innerHeight - $move.offsetHeight;
			
			//修正当前坐标，使浮出层保持在屏幕内
			currentPosX = getPosInScreen(currentPosX, maxPosX);
			currentPosY = getPosInScreen(currentPosY, maxPosY);
			
			$move.style.left = currentPosX + 'px';
			$move.style.top = currentPosY + 'px';
		}
	});
};

/**
 * 获取某个radio选中的元素
 * @param radioName {String} 要获取的name属性
 * @returns {HTMLInputElement} 选中的元素
 */
function getRadioCheckedElement(radioName) {
	var $radios = document.getElementsByName(radioName);
	for (var i = 0, item; item = $radios[i++];) {
		if (item.checked) {
			return item;
		}
	}
}

/**
 * 遍历监听radio的change事件
 * @param radioName {String} 要监听的radio的name
 * @param callback {Function} 对change之后新选中的元素进行操作的回调，this指向新选中的元素
 */
function listenRadioChange(radioName, callback) {
	var $radios = document.getElementsByName(radioName);
	foreach($radios, function (item) {
		item.addEventListener('change', function () {
			if (this.checked) {
				return callback.call(this, arguments);
			}
		});
	});
}

/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
/*---------------------------------- Menu -----------------------------------*/
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/

/**
 * 遍历所有子菜单并执行操作
 * @param $ul {HTMLUIListElement} 菜单ul容器元素
 * @param callback {Function} 对每个子菜单执行操作回调函数，传递该子菜单元素作为回调参数
 */
function foreachMenu ($ul, callback) {
	var $uls = $ul.children;
	foreach($uls, function (item) {
		if (item.children.length === 0) {
			callback(item);
		} else {
			foreachMenu(item.querySelector('ul'), callback);
		}
	});
}

/**
 * 给菜单绑定指令
 * @param $menuUl {HTMLUListElement} 要绑定的菜单列表
 * @param commandSet {Object} 要绑定的指令集
 */
function bindMenuClick ($menuUl, commandSet) {
	//遍历菜单，给每项子菜单绑定指令集中的指令
	foreachMenu($menuUl, function (item) {
		var id = getIdSuffix(item.id);      //id值去前缀
		if (id && commandSet[id]) {
			item.onclick = function () {
				commandSet[id]();
			};
		} else {
			item.onclick = function () {
				alert('undefined Task');
			}
		}
	});
	//给二级菜单框绑定点击事件，在子菜单点击后的冒泡阶段隐藏此二级菜单
	var $ul_2 = $menuUl.getElementsByTagName('ul');
	foreach($ul_2, function (item) {
		item.onclick = function () {
			item.className = 'hide';
		}
	});
}

/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
/*--------------------------------- Window ----------------------------------*/
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/

/**
 * windowUI组件构造函数，生成windowUI组件对象
 * @param $window {Element} 窗口容器元素
 * @constructor
 */
function WindowUI ($window) {
	this.$this = $window;   //窗口本身元素
	this.$elements = this.$this.children;   //窗口子元素集合
	this.$titleBar = document.createElement('div');     //标题栏
	this.$title = document.createElement('p');      //标题文本
	
	this.$titleBar.className = 'title-bar';
	this.$title.innerText = this.$this.id;
	
	//关闭按钮
	var $close = document.createElement('div');
	$close.className = 'close';
	var _this = this;
	$close.onclick = function () {
		_this.close();
	};
	
	//构建DOM
	this.$titleBar.appendChild(this.$title);
	this.$titleBar.appendChild($close);
	this.$this.insertBefore(this.$titleBar, this.$this.firstChild);
	
	//给窗口标题栏添加拖拽移动功能
	setDragMoving(this.$titleBar, this.$this);
}

WindowUI.prototype = {
	constructor: WindowUI,
	//窗口打开时，非窗口区域的覆盖块，用来屏蔽非窗口区域的交互
	$block: (function () {
		var $block = document.createElement('div');
		$block.className = 'block-all';
		$block.style.height = window.innerHeight + 'px';
		$block.style.display = 'none';
		document.body.appendChild($block);
		return $block;
	})(),
	/**
	 * 打开这个窗口
	 * @param isCenter {Boolean} 打开时窗口是否居中（默认true)
	 */
	open: function (isCenter) {
		this.$this.style.display = 'block';
		this.$block.style.display = 'block';
		var _this = this;
		
		//点击非窗口区域时，闪烁窗口
		this.$block.onclick = function () {
			_this.twinkle();
		};
		
		if (isCenter === undefined || isCenter === true) {
			//让窗口居中
			this.setCenter();
		}
	},
	/**
	 * 关闭这个窗口
	 */
	close: function () {
		this.$this.style.display = 'none';
		this.$block.style.display = 'none';
		//修复类名，防止下次窗口刚出现就闪烁
		this.$this.className = 'window';
		this.$titleBar.className = 'title-bar';
	},
	/**
	 * 查找窗口中的元素
	 * @param selector {String} 要查找元素的css选择器
	 * @returns {Element} 找到的元素
	 */
	find: function (selector) {
		return this.$this.querySelector(selector);
	},
	/**
	 * 让这个窗口居中
	 */
	setCenter: function () {
		var left = (window.innerWidth - this.$this.offsetWidth) / 2;
		var top = (window.innerHeight - this.$this.offsetHeight) / 2;
		this.$this.style.left = left + 'px';
		this.$this.style.top = top + 'px';
	},
	/**
	 * 闪烁窗口的标题栏和边框
	 */
	twinkle: function () {
		playAnimation(this.$this, 'window', 'window twinkle-border');
		playAnimation(this.$titleBar, 'title-bar', 'title-bar twinkle-title');
	}
};

/**
 * 获取所有窗口组件
 * @returns {{}} WindowUI对象列表
 */
function getAllWindowUI () {
	var windowUIList = {};
	var $windows = $('.window');
	foreach($windows, function (item) {
		windowUIList[item.id] = new WindowUI(item);
	});
	return windowUIList;
};

var windowUIList = getAllWindowUI();

