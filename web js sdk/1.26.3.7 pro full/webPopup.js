(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : factory();
}(this, (function () { 'use strict';

  var popup = {
    sa: {},
    info: {},
    plugin_name: 'WebPopup',
    lib_version: '1.26.3.7',
    plugin_version: '1.26.3.7',
    defaultPara: {
      platform: 'H5',
      preload_image: true,
      encrypt_cookie: false 
    },
    serverData: {},
    localData: {
      global_popup_count: [],
      local_update_time: null,
      eventQueue: [],
      update_time: null
    },
    eventRule: {},
    convertPlans: [],
    isRun: false,
    setArg: function (arg) {
      var temp = {};
      if (arg && Object.prototype.toString.call(arg) === '[object Object]') {
        for (var i in arg) {
          if (i && i !== 'popup_window_content') {
            temp[i] = arg[i];
          }
        }
        return JSON.stringify(temp, null, '  ');
      } else {
        return arg;
      }
    },
    log: function () {
      if (popup.info.show_log === true && typeof console === 'object' && typeof console.log === 'function') {
        try {
          arguments[0] = popup.setArg(arguments[0]);
          arguments[1] = popup.setArg(arguments[1]);
          return console.log.apply(console, arguments);
        } catch (e) {
          console.log(arguments[0]);
        }
      }
    }
  };

  popup.config = {
    storageName: 'universalstatistics202002-webpopupdata',
    loadedSign: 'UniversalStatistics2015JSSDKWebPopupIsLoad'
  };

  var _ = {
    visibility: function (obj) {
      obj = obj || {};
      var visibly = {
        hidden: undefined,
        visibilityChange: undefined,

        isSupported: function () {
          return typeof this.hidden !== 'undefined';
        },
        _visible: obj.onVisible,
        _hidden: obj.onHidden,
        _nativeSwitch: function () {
          document[this.hidden] === true ? this._hidden() : this._visible();
        },
        listen: function () {
          try {
            if (!this.isSupported()) {
              if (document.addEventListener) {
                window.addEventListener('focus', this._visible, 1);
                window.addEventListener('blur', this._hidden, 1);
              } else {
                document.attachEvent('onfocusin', this._visible);
                document.attachEvent('onfocusout', this._hidden);
              }
            } else {
              document.addEventListener(
                this.visibilityChange,
                function () {
                  visibly._nativeSwitch.apply(visibly, arguments);
                },
                1
              );
            }
          } catch (e) { }
        },
        init: function () {
          if (typeof document.hidden !== 'undefined') {
            this.hidden = 'hidden';
            this.visibilityChange = 'visibilitychange';
          } else if (typeof document.mozHidden !== 'undefined') {
            this.hidden = 'mozHidden';
            this.visibilityChange = 'mozvisibilitychange';
          } else if (typeof document.msHidden !== 'undefined') {
            this.hidden = 'msHidden';
            this.visibilityChange = 'msvisibilitychange';
          } else if (typeof document.webkitHidden !== 'undefined') {
            this.hidden = 'webkitHidden';
            this.visibilityChange = 'webkitvisibilitychange';
          }
          this.listen();
        }
      };

      visibly.init();
    },
    getRgba: function (value) {
      if (typeof value !== 'object') {
        return value;
      }
      return 'rgba(' + value.r + ',' + value.g + ',' + value.b + ',' + value.a + ')';
    },
    conversionNum: function (value) {
      if (!value) {
        return;
      }

      if (/^[0|1]?\.\d+$/.test(value)) {
        return Number(value) * 100 + '%';
      }

      var regVal = /^(-?\d+(\.\d+)?)px$/.exec(value);
      if (regVal) {
        return ((Number(regVal[1]) / 375) * window.screen.width).toFixed(2) + 'px';
      }

      return value;
    },
    boxModel: function (type) {
      return function (val) {
        if (typeof val !== 'object') {
          return type + ':' + val + ';';
        }
        var str = '';
        for (var key in val) {
          str += type + '-' + key + ':' + _.conversionNum(val[key]) + ';';
        }
        return str;
      };
    },
    localStorage: {
      get: function (name) {
        return window.localStorage.getItem(name);
      },

      parse: function (name) {
        var storedValue = null;
        try {
          storedValue = JSON.parse(_.localStorage.get(name)) || null;
        } catch (err) { }
        return storedValue;
      },

      set: function (name, value) {
        window.localStorage.setItem(name, value);
      },

      remove: function (name) {
        window.localStorage.removeItem(name);
      },

      isSupport: function () {
        var supported = true;
        try {
          var key = '__universalstatisticssupport__';
          var val = 'testIsSupportStorage';
          _.localStorage.set(key, val);
          if (_.localStorage.get(key) !== val) {
            supported = false;
          }
          _.localStorage.remove(key);
        } catch (err) {
          supported = false;
        }
        return supported;
      }
    },
    addEvent: function () {
      function fixEvent(event) {
        if (event) {
          event.preventDefault = fixEvent.preventDefault;
          event.stopPropagation = fixEvent.stopPropagation;
          event._getPath = fixEvent._getPath;
        }
        return event;
      }
      fixEvent._getPath = function () {
        var ev = this;
        var polyfill = function () {
          try {
            var element = ev.target;
            var pathArr = [element];
            if (element === null || element.parentElement === null) {
              return [];
            }
            while (element.parentElement !== null) {
              element = element.parentElement;
              pathArr.unshift(element);
            }
            return pathArr;
          } catch (err) {
            return [];
          }
        };
        return this.path || (this.composedPath && this.composedPath()) || polyfill();
      };
      fixEvent.preventDefault = function () {
        this.returnValue = false;
      };
      fixEvent.stopPropagation = function () {
        this.cancelBubble = true;
      };

      var register_event = function (element, type, handler) {
        if (element && element.addEventListener) {
          element.addEventListener(
            type,
            function (e) {
              e._getPath = fixEvent._getPath;
              handler.call(this, e);
            },
            false
          );
        } else {
          var ontype = 'on' + type;
          var old_handler = element[ontype];
          element[ontype] = makeHandler(element, handler, old_handler);
        }
      };
      function makeHandler(element, new_handler, old_handlers) {
        var handler = function (event) {
          event = event || fixEvent(window.event);
          if (!event) {
            return undefined;
          }
          event.target = event.srcElement;

          var ret = true;
          var old_result, new_result;
          if (typeof old_handlers === 'function') {
            old_result = old_handlers(event);
          }
          new_result = new_handler.call(element, event);
          if (false === old_result || false === new_result) {
            ret = false;
          }
          return ret;
        };
        return handler;
      }

      register_event.apply(null, arguments);
    },
    extend: function (obj) {
      var slice = Array.prototype.slice;
      _.each(slice.call(arguments, 1), function (source) {
        for (var prop in source) {
          if (source[prop] !== void 0) {
            obj[prop] = source[prop];
          }
        }
      });
      return obj;
    },
    extend2Lev: function (obj) {
      _.each(Array.prototype.slice.call(arguments, 1), function (source) {
        for (var prop in source) {
          if (source[prop] !== void 0) {
            if (_.isObject(source[prop]) && _.isObject(obj[prop])) {
              _.extend(obj[prop], source[prop]);
            } else {
              obj[prop] = source[prop];
            }
          }
        }
      });
      return obj;
    },
    each: function (obj, iterator, context) {
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var nativeForEach = Array.prototype.forEach;
      var breaker = {};
      if (obj == null) {
        return false;
      }
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
            return false;
          }
        }
      } else {
        for (var key in obj) {
          if (hasOwnProperty.call(obj, key)) {
            if (iterator.call(context, obj[key], key, obj) === breaker) {
              return false;
            }
          }
        }
      }
    },
    xhr: function (cors) {
      if (cors) {
        if (typeof window.XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest()) {
          return new XMLHttpRequest();
        } else if (typeof XDomainRequest !== 'undefined') {
          return new XDomainRequest();
        } else {
          return null;
        }
      } else {
        if (typeof window.XMLHttpRequest !== 'undefined') {
          return new XMLHttpRequest();
        }
        if (window.ActiveXObject) {
          try {
            return new ActiveXObject('Msxml2.XMLHTTP');
          } catch (d) {
            try {
              return new ActiveXObject('Microsoft.XMLHTTP');
            } catch (d) { }
          }
        }
      }
    },
    ajax: function (para) {
      para.timeout = para.timeout || 20000;

      para.credentials = typeof para.credentials === 'undefined' ? true : para.credentials;
      function getJSON(data) {
        if (!data) {
          return '';
        }
        try {
          return JSON.parse(data);
        } catch (e) {
          return {};
        }
      }

      var g = _.xhr(para.cors);

      if (!g) {
        return false;
      }

      if (!para.type) {
        para.type = para.data ? 'POST' : 'GET';
      }
      para = _.extend(
        {
          success: function () { },
          error: function () { }
        },
        para
      );

      var oldsuccess = para.success;
      var olderror = para.error;
      var errorTimer;

      function abort() {
        try {
          if (_.isObject(g) && g.abort) {
            g.abort();
          }
        } catch (error) {
          sd.log(error);
        }

        if (errorTimer) {
          clearTimeout(errorTimer);
          errorTimer = null;
          para.error && para.error();
          g.onreadystatechange = null;
          g.onload = null;
          g.onerror = null;
        }
      }

      para.success = function (data) {
        oldsuccess(data);
        if (errorTimer) {
          clearTimeout(errorTimer);
          errorTimer = null;
        }
      };
      para.error = function (err) {
        olderror(err);
        if (errorTimer) {
          clearTimeout(errorTimer);
          errorTimer = null;
        }
      };
      errorTimer = setTimeout(function () {
        abort();
      }, para.timeout);

      if (typeof XDomainRequest !== 'undefined' && g instanceof XDomainRequest) {
        g.onload = function () {
          para.success && para.success(getJSON(g.responseText));
          g.onreadystatechange = null;
          g.onload = null;
          g.onerror = null;
        };
        g.onerror = function () {
          para.error && para.error(getJSON(g.responseText), g.status);
          g.onreadystatechange = null;
          g.onerror = null;
          g.onload = null;
        };
      }
      g.onreadystatechange = function () {
        try {
          if (g.readyState == 4) {
            if ((g.status >= 200 && g.status < 300) || g.status == 304) {
              para.success(getJSON(g.responseText));
            } else {
              para.error(getJSON(g.responseText), g.status);
            }
            g.onreadystatechange = null;
            g.onload = null;
          }
        } catch (e) {
          g.onreadystatechange = null;
          g.onload = null;
        }
      };

      g.open(para.type, para.url, true);

      try {
        if (para.credentials) {
          g.withCredentials = true;
        }
        if (_.isObject(para.header)) {
          _.each(para.header, function (v, i) {
            g.setRequestHeader && g.setRequestHeader(i, v);
          });
        }

        if (para.data) {
          if (!para.cors) {
            g.setRequestHeader && g.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          }
          if (para.contentType === 'application/json') {
            g.setRequestHeader && g.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
          } else {
            g.setRequestHeader && g.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
          }
        }
      } catch (e) {
        sd.log(e);
      }

      g.send(para.data || null);
    },
    getUuid: function () {
      var T = function () {
        var d = 1 * new Date(),
          i = 0;
        while (d == 1 * new Date()) {
          i++;
        }
        return d.toString(16) + i.toString(16);
      };

      var R = function () {
        return Math.random().toString(16).replace('.', '');
      };

      return function () {
        var val = T() + '-' + R() + '-' + R();
        if (val) {
          return val;
        } else {
          return (String(Math.random()) + String(Math.random()) + String(Math.random())).slice(2, 15);
        }
      };
    },
    trim: function (str) {
      return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    },
    isEmptyObject: function (obj) {
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      if (_.isObject(obj)) {
        for (var key in obj) {
          if (hasOwnProperty.call(obj, key)) {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    filter: function (arr, fn, self) {
      var hasOwn = Object.prototype.hasOwnProperty;
      if (arr.filter) {
        return arr.filter(fn);
      }
      var ret = [];
      for (var i = 0; i < arr.length; i++) {
        if (!hasOwn.call(arr, i)) {
          continue;
        }
        var val = arr[i];
        if (fn.call(self, val, i, arr)) {
          ret.push(val);
        }
      }
      return ret;
    },
    isObject: function (obj) {
      if (obj == null) {
        return false;
      } else {
        return Object.prototype.toString.call(obj) == '[object Object]';
      }
    },
    getConvertNumberValue: function (val) {
      if (_.isString(val)) {
        val = Number(val);
      }
      return Math.floor(val * 1000) / 1000;
    },
    isArray:
      Array.isArray ||
      function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
      },
    isString: function (obj) {
      return Object.prototype.toString.call(obj) == '[object String]';
    },
    isDate: function (obj) {
      return Object.prototype.toString.call(obj) == '[object Date]';
    },
    isBoolean: function (obj) {
      return Object.prototype.toString.call(obj) == '[object Boolean]';
    },
    isNumber: function (obj) {
      return Object.prototype.toString.call(obj) == '[object Number]' && /[\d\.]+/.test(String(obj));
    },
    isFunction: function (f) {
      if (!f) {
        return false;
      }
      var type = Object.prototype.toString.call(f);
      return type == '[object Function]' || type == '[object AsyncFunction]';
    },
    getURLSearchParams: function (queryString) {
      queryString = queryString || '';
      var decodeParam = function (str) {
        return decodeURIComponent(str);
      };
      var args = {}; 
      var query = queryString.substring(1); 
      var pairs = query.split('&'); 
      for (var i = 0; i < pairs.length; i++) {
        var pos = pairs[i].indexOf('='); 
        if (pos === -1) continue; 
        var name = pairs[i].substring(0, pos); 
        var value = pairs[i].substring(pos + 1); 
        name = decodeParam(name); 
        value = decodeParam(value); 
        args[name] = value; 
      }
      return args; 
    },
    URL: function (url) {
      var result = {};
      var basicProps = ['hash', 'host', 'hostname', 'href', 'origin', 'password', 'pathname', 'port', 'protocol', 'search', 'username'];
      var isURLAPIWorking = function () {
        var url;
        try {
          url = new URL('https://www.google.com');
          return url.href === 'https://www.google.com';
        } catch (e) {
          return false;
        }
      };
      if (typeof window.URL === 'function' && isURLAPIWorking()) {
        result = new URL(url);
        if (!result.searchParams) {
          result.searchParams = (function () {
            var params = _.getURLSearchParams(result.search);
            return {
              get: function (searchParam) {
                return params[searchParam];
              }
            };
          })();
        }
      } else {
        var _regex = /^https?:\/\/.+/;
        if (_regex.test(url) === false) {
          throw 'Invalid URL';
        }
        var link = document.createElement('a');
        link.href = url;
        for (var i = basicProps.length - 1; i >= 0; i--) {
          var prop = basicProps[i];
          result[prop] = link[prop];
        }
        if (result.hostname && typeof result.pathname === 'string' && result.pathname.indexOf('/') !== 0) {
          result.pathname = '/' + result.pathname;
        }
        result.searchParams = (function () {
          var params = _.getURLSearchParams(result.search);
          return {
            get: function (searchParam) {
              return params[searchParam];
            }
          };
        })();
      }
      return result;
    },
    contentLoaded: function (win, fn) {
      var done = false,
        top = true,
        doc = win.document,
        root = doc.documentElement,
        modern = doc.addEventListener,
        add = modern ? 'addEventListener' : 'attachEvent',
        rem = modern ? 'removeEventListener' : 'detachEvent',
        pre = modern ? '' : 'on',
        init = function (e) {
          if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
          (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
          if (!done && (done = true)) fn.call(win, e.type || e);
        },
        poll = function () {
          try {
            root.doScroll('left');
          } catch (e) {
            setTimeout(poll, 50);
            return;
          }
          init('poll');
        };

      if (doc.readyState == 'complete') fn.call(win, 'lazy');
      else {
        if (!modern && root.doScroll) {
          try {
            top = !win.frameElement;
          } catch (e) { }
          if (top) poll();
        }
        doc[add](pre + 'DOMContentLoaded', init, false);
        doc[add](pre + 'readystatechange', init, false);
        win[add](pre + 'load', init, false);
      }
    },
    indexOf: function (arr, target) {
      var indexof = arr.indexOf;
      if (indexof) {
        return indexof.call(arr, target);
      } else {
        for (var i = 0; i < arr.length; i++) {
          if (target === arr[i]) {
            return i;
          }
        }
        return -1;
      }
    }
  };

  popup._ = _;


  popup.isSupportPopup = function () {
    return _.localStorage.isSupport();
  };

  popup.listenPageStateChange = function () {
    var isShow = true;
    _.visibility({
      onVisible: function () {
        popup.log('页面触发visible-', new Date().getMinutes(), '分', new Date().getSeconds());
        if (isShow === false) {
          popup.updateDataAndSetListen.startState();
          isShow = true;
        }
      },
      onHidden: function () {
        popup.log('页面触发hidden-', new Date().getMinutes(), '分', new Date().getSeconds());
        if (isShow === true) {
          popup.updateDataAndSetListen.stopAllState();
          isShow = false;
        }
      }
    });
  };

  popup.getWebSDK = function () {
    if (_.isObject(window.UniversalStatistics201505) && _.isObject(window.UniversalStatistics201505.readyState) && window.UniversalStatistics201505.readyState.state >= 3) {
      return window.UniversalStatistics201505;
    } else {
      return false;
    }
  };

  popup.getPopupInfo = function (content) {
    if (!(_.isObject(content) && _.isObject(content.template))) {
      return {};
    }
    var msg = {
      $sf_msg_title: '',
      $sf_msg_content: '',
      $sf_msg_image_url: ''
    };
    function getContent(template) {
      _.each(template.subviews, function (temp) {
        var properties = temp.properties || {};
        if (properties.msgType === 'title') {
          msg.$sf_msg_title = properties.text;
        } else if (properties.msgType === 'content') {
          msg.$sf_msg_content = properties.text;
        } else if (temp.type === 'image') {
          msg.$sf_msg_image_url = properties.image;
        }

        if (temp.subviews) {
          getContent(temp);
        }
      });
    }

    getContent(content.template);

    return msg;
  };

  popup.getSFCampaign = function (plan) {
    plan = _.isObject(plan) ? plan : {};
    var obj = {
      planId: '',
      name: '',
      content: null,
      type: ''
    };
    obj.planId = plan.plan_id || '';
    obj.name = plan.cname || '';
    obj.content = _.isObject(plan.popup_window_content) ? plan.popup_window_content.content : '';
    obj.type = _.isObject(plan.popup_window_content) && plan.popup_window_content.popup_type ? plan.popup_window_content.popup_type : 'PRESET';
    return obj;
  };

  popup.getImageList = function (plan_list) {
    if (!_.isArray(plan_list)) {
      return false;
    }
    var regImage = new RegExp('("(backgroundImage|image)":"(http(s)?://.[^"]*)")', 'g');
    var regUrl = new RegExp('http(s)?://.[^S^"]*');
    var list = {};
    var len = plan_list.length,
      images,
      arr = [],
      is_preload_img = false,
      temp;
    for (var i = 0; i < len; i++) {
      if (_.isObject(plan_list[i]) && plan_list[i].status.toLocaleUpperCase() === 'ACTIVE' && plan_list[i].is_audience === true) {
        is_preload_img = plan_list[i].strategy_id ? plan_list[i].is_trigger !== false : plan_list[i].is_control_group !== true;
        if (is_preload_img && plan_list[i].popup_window_content && plan_list[i].popup_window_content.content) {
          images = plan_list[i].popup_window_content.content.match(regImage);
          if (images) {
            for (var j = 0, l = images.length; j < l; j++) {
              temp = images[j].match(regUrl);
              if (temp && temp.length > 0) {
                if (!list[temp[0]]) {
                  list[temp[0]] = 1;
                }
              }
            }
          }
        }
      }
    }
    _.each(list, function (value, key) {
      arr.push(key);
    });

    return arr;
  };

  popup.setIsLoad = function () {
    var isTop = window.self === window.top;
    if (isTop) {
      if (window[popup.config.loadedSign]) {
        return false;
      }
      if (typeof window[popup.config.loadedSign] === 'undefined') {
        window[popup.config.loadedSign] = true;
        return true;
      }
    } else {
      try {
        if (window.top[popup.config.loadedSign]) {
          return false;
        } else {
          window.top[popup.config.loadedSign] = true;
          return true;
        }
      } catch (e) {
        popup.log('非同域名iframe内嵌不能获取父级窗体内容', e);
        return true;
      }
    }
  };

  popup.handlerCampaign = function (checkInstance) {
    var that = checkInstance;
    var uuid = _.getUuid()();

    var popupTemplate = that.plan.popup_window_content;
    if (!_.isObject(popupTemplate)) {
      that.popupFailed(1001, false, {
        uuid: uuid,
        content: '',
        plan: that.plan
      });
      return false;
    }

    var content;
    if (popupTemplate.content) {
      try {
        content = JSON.parse(popupTemplate.content);
      } catch (error) {
        popup.log(error);
      }
    }

    var param = popup.getSFCampaign(that.plan);
    var campaign = {
      state: '',
      isCustom: false
    };
    var start = true;
    try {
      start = popup.info.popup_campaign_listener.shouldStart(param);
    } catch (error) {
      start = false;
      popup.log(error);
    }

    var info = {
      uuid: uuid,
      content: content,
      plan: that.plan
    };

    if (that.plan.is_trigger) {
      if (!start) {
        campaign.state = 'CAMPAIGN_NOT_START_LISTENER_START';
      } else {
        if (popupTemplate.popup_type === 'CUSTOMIZED') {
          if (popup.info.supportCustom === 'withoutCampaignListener') {
            campaign.state = 'CAMPAIGN_CUSTOMIZED_NULL_LISTENER';
          } else if (popup.info.supportCustom === 'withoutStart') {
            campaign.state = 'CAMPAIGN_CUSTOMIZED_LISTENER_NULL_START';
          } else if (!_.isString(popupTemplate.content)) {
            campaign.state = 'DIALOG_NOT_SHOW_JSON_FAILED';
          } else {
            campaign.state = 'CAMPAIGN_TRIGGER_CUSTOMIZED_START';
          }
        } else {
          if(popupTemplate.popup_type === 'PRESET'){
            popup.log('此版本sdk不支持预置弹窗');
          }
          campaign.state = 'DIALOG_NOT_SHOW_JSON_FAILED';
        }
      }
    } else {
      campaign.state = 'CAMPAIGN_NOT_START_TRIGGER';
    }

    campaign.isCustom = popupTemplate.popup_type && popupTemplate.popup_type === 'CUSTOMIZED' ? true : false;
    popup.log('campaign:', campaign, 'plan:', that.plan.cname);

    switch (campaign.state) {
      case 'CAMPAIGN_TRIGGER_CUSTOMIZED_START':
        that.customCampaign(info);
        break;
      case 'CAMPAIGN_NOT_START_LISTENER_START':
        that.popupFailed(1004, campaign.isCustom, info);
        break;
      case 'CAMPAIGN_CUSTOMIZED_NULL_LISTENER':
        that.popupFailed(1006, campaign.isCustom, info);
        break;
      case 'CAMPAIGN_CUSTOMIZED_LISTENER_NULL_START':
        that.popupFailed(1006, campaign.isCustom, info);
        break;
      case 'DIALOG_NOT_SHOW_JSON_FAILED':
        that.popupFailed(1001, campaign.isCustom, info);
        break;
      case 'CAMPAIGN_NOT_START_TRIGGER':
        that.popupFailed(1005, campaign.isCustom, info);
        break;
      default:
        popup.log('CampaignState异常');
        break;
    }
  };

  popup.track = {
    getPublicProps: function (msg) {
      var plan = msg.plan;
      var publicProps = {
        $sf_lib_version: popup.lib_version,
        $sf_plan_type: '运营计划',
        $sf_channel_service_name: 'UNIVERAL_FOCUS',
        $sf_channel_category: 'POPUP',
        $sf_platform_tag: popup.info.platform,
        $sf_msg_id: msg.$sf_msg_id
      };

      if (_.isEmptyObject(plan) || !_.isObject(plan)) {
        return publicProps;
      } else {
        publicProps.$sf_plan_id = plan.plan_id + '';
        publicProps.$sf_plan_strategy_id = plan.strategy_id ? plan.strategy_id : plan.is_control_group ? '-1' : '0';
        if (plan.audience_id) {
          publicProps.$sf_audience_id = plan.audience_id + '';
        }
        if (plan.section_id) {
          publicProps.$sf_section_id = String(plan.section_id);
          publicProps.$sf_plan_type = '新资源位';
        }
      }

      return publicProps;
    },
    popupDisplay: function (popup_content) {
      var params = {
        $sf_msg_title: popup_content.$sf_msg_title,
        $sf_msg_content: popup_content.$sf_msg_content,
        $sf_msg_image_url: popup_content.$sf_msg_image_url,
        $sf_succeed: popup_content.$sf_succeed,
        $sf_fail_reason: popup_content.$sf_fail_reason
      };
      this.trackEvent('$PlanPopupDisplay', params, popup_content);
    },
    trackEvent: function (eventName, params, info) {
      var publicProps = popup.track.getPublicProps(info);
      _.extend(params, publicProps);
      _.each(params, function (value, key) {
        if (value === '' || value === undefined) {
          delete params[key];
        }
      });
      popup.sa.track(eventName, params);
    },
    maskClick: function (ele) {
      if (!ele.msg) {
        return false;
      }
      var params = {
        $sf_close_type: 'POPUP_CLOSE_MASK',
        $sf_msg_title: ele.msg.$sf_msg_title,
        $sf_msg_content: ele.msg.$sf_msg_content,
        $sf_msg_image_url: ele.msg.$sf_msg_image_url,
        $sf_msg_element_type: 'mask',
        $sf_msg_action_id: ele.properties.maskActionId
      };
      this.trackEvent('$PlanPopupClick', params, ele.msg);
      ele.destory();
    },
    elementClickCallback: function (e, ele) {
      var target = e.target;
      var action_value = target.getAttribute('data-action');
      var element_info = target.getAttribute('data-info');
      var msg = ele.msg || {};

      if (!action_value) {
        return false;
      }

      try {
        var action = JSON.parse(action_value) || {};
        var action_item = action[0];
        var info = JSON.parse(element_info) || {};
      } catch (e) {
        popup.log('elementClickCallback error', e);
      }

      var actionObject = {
        type: action_item.type,
        value: _.isString(action_item.value) ? action_item.value : '',
        extra: _.isObject(action_item.value) ? action_item.value : ''
      };
      var plan_id = ele.msg.plan ? ele.msg.plan.plan_id : '';

      var params = {
        $sf_msg_title: msg.$sf_msg_title,
        $sf_msg_content: msg.$sf_msg_content,
        $sf_msg_image_url: msg.$sf_msg_image_url,
        $sf_msg_element_type: info.$sf_msg_element_type,
        $sf_msg_element_content: info.$sf_msg_element_content,
        $sf_msg_element_action: action_item.type,
        $sf_msg_action_id: action_item.id,
        $sf_close_type: action_item.type === 'close' ? action_item.$sf_close_type : ''
      };

      this.trackEvent('$PlanPopupClick', params, msg);

      try {
        popup.info.popup_listener.onClick(plan_id, actionObject);
        var plan = ele.msg.plan;
        if (plan) {
          var campaign_plan = {
            name: plan.cname,
            plan_id: plan.plan_id,
            content: plan.popup_window_content ? plan.popup_window_content.content : '',
            type: plan.popup_window_content ? plan.popup_window_content.popup_type : '',
            action: actionObject
          };
          popup.info.popup_campaign_listener.onClick(campaign_plan);
        }
      } catch (e) {
        popup.log('popup_listener.onClick error', e);
      }

      if (action_item.type === 'close') {
        ele.destory();
      } else {
        action_item.closeable ? ele.destory() : null;
        if (popup.info.popup_listener.openlink === 'auto' && action_item.type === 'openlink') {
          if (action_item.value.slice(0, 4) !== 'http') {
            return false;
          }
          window.location.href = action_item.value;
        }
      }
    }
  };

  var salog = popup.log;

  popup.changeCovertStatus = function (data) {
    var arr = JSON.parse(JSON.stringify(popup.convertPlans));

    _.each(arr, function (item, index) {
      if (!item.is_in_convert_window) {
        return false;
      }
      var step = item.is_in_convert_window.step;
      var uuid = item.is_in_convert_window.uuid;
      popup.convertPlans[index].is_in_convert_window.step = Math.min(step * 2, 600000);

      if (!data) {
        return false;
      }
      _.each(data, function (result) {
        if (result.popup_display_uuid === uuid && result.convert_time) {
          salog('--转化窗口- 目标事件已经完成 - 满足', popup.convertPlans[index].plan_id);
          delete popup.convertPlans[index].is_in_convert_window;
          popup.convertPlans.splice(index, 1);
        }
      });
    });
    popup.updateDataAndSetListen.updateLocalData();
  };

  popup.asyncConvert = function (plan) {
    var project = popup.info.project;
    var flag = false;

    if (!plan && popup.convertPlans.length === 0) {
      return false;
    }

    if (plan) {
      _.each(popup.convertPlans, function (item) {
        if (item.plan_id === plan.plan_id) {
          flag = true;
        }
      });

      if (!flag) {
        popup.convertPlans.push(plan);
      }
    }

    function convertStatusPolling() {
      if (_.isEmptyObject(popup.localData) || !_.isArray(popup.convertPlans) || popup.convertPlans.length === 0) {
        return false;
      }
      var arr = JSON.parse(JSON.stringify(popup.convertPlans));
      var min_step = (arr[0].is_in_convert_window && arr[0].is_in_convert_window.step) || 5000;
      var uuid_list = [];

      _.each(arr, function (item, index) {
        if (!item.is_in_convert_window) {
          return false;
        }
        var now = new Date().getTime();
        var expire_time = item.is_in_convert_window.expire_time;

        if (now > expire_time) {
          salog('--转化窗口超时已经过期 - 满足', popup.convertPlans[index].plan_id);
          delete popup.convertPlans[index].is_in_convert_window;
          popup.convertPlans.splice(index, 1);
          popup.updateDataAndSetListen.updateLocalData();
          return false;
        }

        uuid_list.push(item.is_in_convert_window.uuid);

        if (!item.is_in_convert_window.step) {
          item.is_in_convert_window.step = 5000;
          popup.convertPlans[index].is_in_convert_window.step = 5000;
        }

        if (min_step > item.is_in_convert_window.step) {
          min_step = item.is_in_convert_window.step;
        }
      });

      if (!uuid_list.length) {
        return false;
      }

      if (popup.asyncConvert.timer) {
        clearTimeout(popup.asyncConvert.timer);
      }
      popup.asyncConvert.timer = setTimeout(function () {
        _.ajax({
          url: popup.info.api_base_url + '/sfo/popup_displays?project=' + encodeURIComponent(project) + '&popup_display_uuids=' + encodeURIComponent(uuid_list) + '&time=' + new Date().getTime(),
          type: 'GET',
          cors: true,
          credentials: false,
          contentType: 'application/json',
          success: function (data) {
            popup.changeCovertStatus(data);
            convertStatusPolling();
          },
          error: function () {
            popup.changeCovertStatus();
            convertStatusPolling();
          }
        });
      }, min_step);
    }
    convertStatusPolling();
  };

  popup.ruleTime = {
    getExpire: function (rule_obj, time) {
      var last_time = time;
      var countInterval = Number(rule_obj.value) || 0;
      var count = Number(rule_obj.value) || 0;
      var unit = String(rule_obj.unit).toLowerCase();

      var expire_time = null;

      var is_in = {
        day: function () {
          expire_time = new Date(last_time);
          expire_time.setHours(23);
          expire_time.setMinutes(59);
          expire_time.setSeconds(59);
          expire_time.setMilliseconds(999);
          expire_time = expire_time.getTime() + 24 * 60 * 60 * 1000 * (count - 1);

          return expire_time;
        },
        week: function () {
          expire_time = new Date(last_time);
          var current_week_day = expire_time.getDay();
          if (current_week_day === 0) {
            current_week_day = 7;
          }
          var current_week_remain = 7 - current_week_day;
          expire_time.setHours(23);
          expire_time.setMinutes(59);
          expire_time.setSeconds(59);
          expire_time.setMilliseconds(999);

          expire_time = expire_time.getTime() + current_week_remain * 24 * 60 * 60 * 1000 + (count - 1) * 7 * 24 * 60 * 60 * 1000;

          return expire_time;
        },
        month: function () {
          expire_time = new Date(last_time);
          var current_month = expire_time.getMonth();
          var expire_month = current_month + count;
          if (expire_month >= 11) {
            expire_time.setFullYear(expire_time.getFullYear() + parseInt(expire_month / 12));
            expire_time.setMonth(expire_month % 12);
          } else {
            expire_time.setMonth(expire_month);
          }
          expire_time.setDate(1);
          expire_time.setHours(0);
          expire_time.setMinutes(0);
          expire_time.setSeconds(0);
          expire_time.setMilliseconds(0);

          return expire_time.getTime();
        },
        second: function (unit) {
          var interval = {
            month: 30 * 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            minute: 60 * 1000,
            second: 1000
          };
          var interval_time = null;
          expire_time = new Date(last_time);
          if (unit in interval) {
            interval_time = interval[unit] * countInterval;
          }
          return expire_time.getTime() + interval_time;
        }
      };

      if (rule_obj.natural === true) {
        if (unit in is_in) {
          return is_in[unit]();
        }
      } else {
        return is_in.second(unit);
      }
    },
    getLast: function (rule_obj, current_time) {
      var countInterval = Number(rule_obj.value) || 0;
      var count = Number(rule_obj.value) - 1 || 0;
      var unit = String(rule_obj.unit).toLowerCase();

      var expire_time = null;

      var is_in = {
        day: function () {
          expire_time = new Date(current_time);
          expire_time.setHours(0);
          expire_time.setMinutes(0);
          expire_time.setSeconds(0);
          expire_time.setMilliseconds(0);
          expire_time = expire_time.getTime() - 24 * 60 * 60 * 1000 * count;

          return expire_time;
        },
        week: function () {
          expire_time = new Date(current_time);
          var current_week_day = expire_time.getDay();
          if (current_week_day === 0) {
            current_week_day = 7;
          }
          --current_week_day;

          expire_time.setHours(0);
          expire_time.setMinutes(0);
          expire_time.setSeconds(0);
          expire_time.setMilliseconds(0);

          expire_time = expire_time.getTime() - (current_week_day * 24 * 60 * 60 * 1000 + count * 7 * 24 * 60 * 60 * 1000);

          return expire_time;
        },
        month: function () {
          expire_time = new Date(current_time);

          var current_month = expire_time.getMonth() + 1;

          var expire_month = current_month - count;

          if (expire_month <= 0) {
            expire_time.setFullYear(expire_time.getFullYear() + (parseInt(expire_month / 12) - 1));
            expire_time.setMonth(12 + (expire_month % 12) - 1);
          } else {
            expire_time.setMonth(expire_month - 1);
          }
          expire_time.setDate(1);
          expire_time.setHours(0);
          expire_time.setMinutes(0);
          expire_time.setSeconds(0);
          expire_time.setMilliseconds(0);

          return expire_time.getTime();
        },
        second: function (unit) {
          var interval = {
            month: 30 * 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            minute: 60 * 1000,
            second: 1000
          };
          var interval_time = null;
          expire_time = new Date(current_time);
          if (unit in interval) {
            interval_time = interval[unit] * countInterval;
          }
          return expire_time.getTime() - interval_time;
        }
      };

      if (rule_obj.natural === true) {
        if (unit in is_in) {
          return is_in[unit]();
        }
      } else {
        return is_in.second(unit);
      }
    },
    getArrMatchCount: function (arr, last_time) {
      var i = 0;
      for (i = 0; i < arr.length; i++) {
        if (last_time >= arr[i]) {
          return i;
        }
      }
      return arr.length;
    }
  };


  popup.eventTriggerProcess = function () {
    if (!popup.updateDataAndSetListen.active_state) {
      return false;
    }
    if (!_.isArray(popup.localData.eventQueue)) {
      return false;
    }
    if (popup.localData.eventQueue.length === 0) {
      return false;
    }
    if (popup.isRun) {
      return false;
    }
    salog('事件队列---eventQueue', popup.localData.eventQueue);

    var already_displayed = false;
    var eventDate = popup.localData.eventQueue[0];
    var plan_list = popup.eventRule[eventDate.event];

    popup.isRun = true;
    popup.localData.eventQueue.shift();
    popup.updateDataAndSetListen.updateLocalData();
    if (_.isArray(plan_list) && _.isObject(plan_list[0]) && plan_list.length > 0) {
      salog('--------------------触发事件开始--------------------');
      _.each(plan_list, function (plan) {
        if (_.isObject(plan) && typeof plan.match_state !== 'undefined') {
          delete plan.match_state;
        }

        new popup.RuleCheck(plan, eventDate);
      });
      _.each(plan_list, function (plan) {
        if (plan.match_state === true) {
          if (already_displayed === false) {
            already_displayed = true;
            salog('检查完毕-优先弹窗-开始', plan.plan.cname);
            new popup.PopupCheck(plan, true);
          } else if (already_displayed === true) {
            salog('检查完毕-非优先弹窗-不渲染', plan.plan.cname);
            new popup.PopupCheck(plan, false);
          }
        } else {
          salog('检查完毕-计划-不满足', plan.plan.cname);
        }
      });
      if (!already_displayed) {
        popup.completeWindowLifecycle();
      }
      salog('--------------------触发事件结束--------------------');
    }
  };

  popup.completeWindowLifecycle = function () {
    popup.isRun = false;
    popup.eventTriggerProcess();
  };

  popup.PopupCheck = function (plan, isShow) {
    this.plan = plan.plan;
    this.current_time = new Date().getTime();
    if (isShow) {
      this.renderPopup();
    } else {
      this.hidePopup();
    }
    popup.updateDataAndSetListen.updateLocalData();
  };

  popup.PopupCheck.prototype.createPopupWindow = function (uuid, isEnd) {
    this.startConvertWindow(uuid);
    this.startPopupIntervalWindow(this.current_time);
    this.startPopupLimitWindow();
    this.setGlobalLimit();
    this.deletePlanAllWindow();
    if (isEnd) {
      popup.completeWindowLifecycle();
    }
  };

  popup.PopupCheck.prototype.hidePopup = function () {
    this.deletePlanAllWindow();
  };

  popup.PopupCheck.prototype.renderPopup = function () {
    popup.handlerCampaign(this);
  };
  popup.PopupCheck.prototype.popupFailed = function (code, isCustom, info) {
    var ERROR_CODE = {
      1001: '预览信息解析失败，请检查计划配置',
      1003: '对照组',
      1004: 'campaignShouldStart 接口返回 false',
      1005: '计划下发 is_trigger 为 false',
      1006: '自定义触达计划未实现弹窗生命周期回调'
    };
    var fail_reason = ERROR_CODE[code];
    var popup_info = popup.getPopupInfo(info.content);
    popup_info.$sf_msg_id = info.uuid;
    popup_info.plan = info.plan;
    popup_info.$sf_succeed = false;
    popup_info.$sf_fail_reason = fail_reason;
    popup.track.popupDisplay(popup_info);

    if (!isCustom && popup.info.popup_listener && _.isFunction(popup.info.popup_listener.onLoadFailed)) {
      popup.info.popup_listener.onLoadFailed(info.plan.plan_id, code, fail_reason);
    }
    popup.info.popup_campaign_listener.onFailed(popup.getSFCampaign(info.plan), code, fail_reason);

    this.createPopupWindow(info.uuid, true);
  };
  popup.PopupCheck.prototype.customCampaign = function (info) {
    var sfCampaign = popup.getSFCampaign(info.plan);

    var popup_info = popup.getPopupInfo(info.content);
    popup_info.$sf_msg_id = info.uuid;
    popup_info.plan = info.plan;
    popup_info.$sf_succeed = true;
    popup.track.popupDisplay(popup_info);

    popup.info.popup_campaign_listener.onStart(sfCampaign);

    this.createPopupWindow(info.uuid, true);
  };
  popup.PopupCheck.prototype.showPopup = function (info) {
    if (!popup.ElementRender) {
      popup.log('暂不支持预置弹窗UI');
      return false;
    }
    var ele = new popup.ElementRender(info.content);
    var popup_info = popup.getPopupInfo(info.content);
    popup_info.$sf_msg_id = info.uuid;
    popup_info.plan = info.plan;
    popup_info.$sf_succeed = true;
    _.extend(ele.msg, popup_info);
    ele.popupCheckInstance = this;
    popup.track.popupDisplay(popup_info);

    var render = ele.render();
    if (!render) {
      salog('当前页面已有一个弹框正在渲染，本次弹框不渲染！');
      return false;
    }
    popup.info.popup_campaign_listener.onStart(popup.getSFCampaign(info.plan));
    this.createPopupWindow(info.uuid);

    popup.info.popup_listener.onLoadSuccess(info.plan.plan_id);
  };

  popup.PopupCheck.prototype.startConvertWindow = function (uuid) {
    salog('--弹窗展示-转化窗口设置', this.plan.cname);
    if (_.isObject(this.plan.convert_window) && this.plan.convert_window.value) {
      this.plan.is_in_convert_window = {
        expire_time: popup.ruleTime.getExpire(this.plan.convert_window, this.current_time),
        start_time: this.current_time,
        uuid: uuid
      };
      popup.asyncConvert(this.plan);
    }
  };
  popup.PopupCheck.prototype.startPopupIntervalWindow = function (time) {
    if (_.isObject(this.plan.popup_interval) && this.plan.popup_interval.value) {
      this.plan.is_in_popup_interval_window = popup.ruleTime.getExpire(this.plan.popup_interval, time);
    }
  };

  popup.PopupCheck.prototype.resetPopupIntervalWindow = function () {
    var time = new Date().getTime();
    this.startPopupIntervalWindow(time);
    this.resetGlobalLimit(time);
    popup.completeWindowLifecycle();
  };

  popup.PopupCheck.prototype.startPopupLimitWindow = function () {
    salog('--弹窗展示-参与限制窗口设置重置');
    if (_.isObject(this.plan.re_enter) && this.plan.re_enter.value) {
      if (!_.isObject(this.plan.is_in_popup_limit_window)) {
        this.plan.is_in_popup_limit_window = {
          expire_time: popup.ruleTime.getExpire(this.plan.re_enter, this.current_time),
          count: 1
        };
      } else {
        this.plan.is_in_popup_limit_window.count++;
      }
    }
  };
  popup.PopupCheck.prototype.setGlobalLimit = function () {
    salog('--弹窗展示-全局弹窗次数设置');
    if (!_.isArray(popup.localData.global_popup_count)) {
      popup.localData.global_popup_count = [];
    }
    popup.localData.global_popup_count.unshift(this.current_time);
    var count = popup.localData.global_popup_count;
    var last_data = count[count.length - 1];
    while (last_data + 90 * 24 * 60 * 60 * 1000 < this.current_time || count.length > 3000) {
      count.pop();
      last_data = count[count.length - 1];
    }
  };

  popup.PopupCheck.prototype.resetGlobalLimit = function (time) {
    if (_.isArray(popup.localData.global_popup_count) && popup.localData.global_popup_count.length > 0) {
      popup.localData.global_popup_count.shift();
      popup.localData.global_popup_count.unshift(time);
    }
  };
  popup.PopupCheck.prototype.deletePlanAllWindow = function () {
    var matchlist = this.plan.pattern_popup.matcher_list;
    if (_.isArray(matchlist)) {
      _.each(matchlist, function (match) {
        if (match.is_in_window) {
          salog('--弹窗展示-重置各个规则的窗口计算-成功');
          delete match.is_in_window;
        }
      });
    }
  };

  popup.RuleCheck = function (plan_match, event_properties) {
    this.plan_match = plan_match;

    this.plan = plan_match.plan;
    this.rule_arr = plan_match.rule;

    this.event_data = event_properties;

    this.current_time = new Date().getTime();

    var str = '-------------检查-计划-(' + this.plan.cname + ')';
    _.each(this.rule_arr, function (rule) {
      str += '--包含规则-(' + rule.event_name + '）-触发' + rule.params[0] + '次';
    });
    salog(str);
    salog(this.plan);

    this.checkPlanIsExpire();
    popup.updateDataAndSetListen.updateLocalData();
  };

  popup.RuleCheck.prototype.checkPlanIsExpire = function () {
    if (!this.plan.expire_at || (_.isNumber(this.plan.expire_at) && this.current_time < this.plan.expire_at)) {
      salog('--过期-满足', this.plan.cname);
      this.checkPlanIsAudience();
    } else {
      salog('--过期-不满足', this.plan.cname);
    }
  };

  popup.RuleCheck.prototype.checkPlanIsAudience = function () {
    if (this.plan.is_audience === true) {
      salog('--是否受众-满足', this.plan.cname);
      this.checkPlanSuspend();
    } else {
      salog('--是否受众-不满足', this.plan.cname);
    }
  };

  popup.RuleCheck.prototype.checkPlanSuspend = function () {
    if (!this.plan.status || this.plan.status !== 'SUSPEND') {
      salog('--暂停-满足', this.plan.cname);
      this.checkConvert();
    } else {
      salog('--暂停-不满足', this.plan.cname);
    }
  };

  popup.RuleCheck.prototype.checkConvert = function () {
    if (_.isObject(this.plan.is_in_convert_window) && this.plan.is_in_convert_window.expire_time > this.current_time) {
      salog('--存在转化窗口 - 不满足', this.plan.is_in_convert_window);
    } else if (_.isObject(this.plan.is_in_convert_window) && this.current_time > this.plan.is_in_convert_window.expire_time) {
      salog('--转化窗口超时已经过期 - 满足', this.plan.plan_id);
      delete this.plan.is_in_convert_window;
      for (var i = 0; i < popup.convertPlans.length; i++) {
        if (this.plan.plan_id === popup.convertPlans[i].plan_id) {
          popup.convertPlans.splice(i, 1);
          i--;
        }
      }
      this.checkGlobalPopupInterval();
    } else {
      salog('--不存在转化窗口 - 满足', this.plan.is_in_convert_window);
      this.checkGlobalPopupInterval();
    }
  };

  popup.RuleCheck.prototype.checkGlobalPopupInterval = function () {
    var count = popup.localData.global_popup_count;
    if (_.isArray(count) && count.length >= 1) {
      var last_rule_time = popup.ruleTime.getLast(popup.localData.popup_interval_global, this.current_time);
      if (last_rule_time > count[0]) {
        salog('--全局弹窗间隔-满足-' + last_rule_time + '>上次弹窗时间' + count[0]);
        this.checkPopupInterval();
      } else {
        salog('检查-全局弹窗间隔-不满足-' + last_rule_time + '<上次弹窗时间' + count[0]);
      }
    } else {
      salog('--全局弹窗间隔-没有弹过窗-满足');
      this.checkPopupInterval();
    }
  };

  popup.RuleCheck.prototype.checkPopupInterval = function () {
    var isCheck = true;
    if (_.isNumber(this.plan.is_in_popup_interval_window)) {
      if (this.current_time > this.plan.is_in_popup_interval_window) {
        salog('--弹窗间隔-当前时间大于固定弹窗间隔-满足');
        this.plan.is_in_popup_interval_window = null;
      } else {
        salog('--弹窗间隔-当前时间小于固定弹窗间隔-不满足');
        isCheck = false;
      }
    } else {
      salog('--弹窗间隔-窗口不存在-新开');
      this.plan.is_in_popup_interval_window = null;
    }
    if (isCheck) {
      this.checkPermission() && this.checkProperties();
    }
  };

  popup.RuleCheck.prototype.isMatched = function (matcher) {
    var filter_map = {
      equal: function (property, params) {
        if (!_.isNumber(property) && !_.isString(property)) {
          return false;
        }
        for (var i = 0, len = params.length; i < len; i++) {
          if (!_.isNumber(params[i]) && !_.isString(params[i])) {
            return false;
          }

          if (_.isString(property)) {
            var param_item = _.isString(params[i]) ? params[i] : String(params[i]);
            if (property === param_item) {
              return true;
            }
          } else {
            if (_.getConvertNumberValue(property) === _.getConvertNumberValue(params[i])) {
              return true;
            }
          }
        }
        return false;
      },
      notEqual: function (property, params) {
        if (!_.isNumber(property) && !_.isString(property)) {
          return false;
        }
        for (var i = 0, len = params.length; i < len; i++) {
          if (!_.isNumber(params[i]) && !_.isString(params[i])) {
            return false;
          }

          if (_.isString(property)) {
            var param_item = _.isString(params[i]) ? params[i] : String(params[i]);
            if (property === param_item) {
              return false;
            }
          } else {
            if (_.getConvertNumberValue(property) === _.getConvertNumberValue(params[i])) {
              return false;
            }
          }
        }
        return true;
      },
      contain: function (property, params) {
        if (!_.isString(property)) {
          return false;
        }
        return property.indexOf(params[0]) >= 0;
      },
      notContain: function (property, params) {
        if (!_.isString(property)) {
          return false;
        }

        return property.indexOf(params[0]) === -1;
      },
      isTrue: function (property) {
        return property === true;
      },
      isFalse: function (property) {
        return property === false;
      },
      isSet: function (property) {
        return typeof property !== 'undefined';
      },
      notSet: function (property) {
        return typeof property === 'undefined';
      },
      isEmpty: function (property) {
        if (!_.isString(property) && !_.isArray(property)) {
          return false;
        }

        if (_.isString(property)) {
          return property === '';
        } else {
          for (var i = 0; i < property.length; i++) {
            var $item = property[i].replace(/^\s+|\s+$/g, '');
            if ($item !== '') {
              return false;
            }
          }
          return true;
        }
      },
      isNotEmpty: function (property) {
        if (!_.isString(property) && !_.isArray(property)) {
          return false;
        }

        if (_.isString(property)) {
          return property !== '';
        } else {
          for (var i = 0; i < property.length; i++) {
            var $item = property[i].replace(/^\s+|\s+$/g, '');
            if ($item === '') {
              return false;
            }
          }
          return true;
        }
      },

      less: function (property, params) {
        if (!_.isNumber(property)) {
          return false;
        }
        if (typeof params[0] === 'undefined') {
          return false;
        }
        return _.getConvertNumberValue(property) < _.getConvertNumberValue(params[0]);
      },
      greater: function (property, params) {
        if (!_.isNumber(property)) {
          return false;
        }
        if (typeof params[0] === 'undefined') {
          return false;
        }
        return _.getConvertNumberValue(property) > _.getConvertNumberValue(params[0]);
      },
      between: function (property, params) {
        if (!_.isNumber(property)) {
          return false;
        }
        if (typeof params[0] === 'undefined' && typeof params[1] === 'undefined') {
          return false;
        }
        var property_value = _.getConvertNumberValue(property);
        var prev_value = _.getConvertNumberValue(params[0]);
        var next_value = _.getConvertNumberValue(params[1]);
        return property_value >= prev_value && property_value <= next_value;
      },
      isIn: function (property, params) {
        if (!_.isArray(property)) {
          return false;
        }
        for (var i = 0; i < property.length; i++) {
          if (_.indexOf(params, property[i]) >= 0) {
            return true;
          }
        }
        return false;
      },
      notInclude: function (property, params) {
        if (!_.isArray(property)) {
          return false;
        }
        for (var i = 0; i < property.length; i++) {
          if (_.indexOf(params, property[i]) === -1) {
            return true;
          }
        }
        return false;
      },
      absolute_between: function (property, params) {
        try {
          var startTime = new Date(params[0]);
          var endTime = new Date(params[1]);
          var data = new Date(property);
          return data >= startTime && data <= endTime;
        } catch (e) {
          salog('absolute_between Error', e);
        }
      },
      absoluteBetween: function (property, params) {
        try {
          var startTime = new Date(params[0]);
          var endTime = new Date(params[1]);
          var data = new Date(property);
          return data >= startTime && data <= endTime;
        } catch (e) {
          salog('absolute_between Error', e);
        }
      }
    };

    var that = this;
    var relation = matcher.relation;
    var isOr = String(relation).toLowerCase() === 'or';
    var isAnd = String(relation).toLowerCase() === 'and';
    var flag = isAnd ? true : false;
    var isNext = true;

    _.each(matcher.conditions, function (item) {
      if (!isNext) {
        return false;
      }

      if (!item.field) {
        return false;
      }

      var fields_index = item.field.lastIndexOf('.');
      var params = item.params;
      var function_name = item['function'] === 'in' ? 'isIn' : item['function'];

      if (!filter_map[function_name]) {
        flag = false;
        isNext = false;
        return false;
      }

      if (fields_index < 0) {
        return false;
      }

      var fields_name = item.field.slice(fields_index + 1);
      var data = that.event_data.properties;
      var property = data[fields_name];
      if (fields_name === '$event_duration' && property === void 0) {
        property = data['event_duration'];
      }
      var result = filter_map[function_name](property, params);

      if (isOr && result) {
        flag = true;
        isNext = false;
      }

      if (isAnd && !result) {
        flag = false;
        isNext = false;
      }
    });

    return flag;
  };
  popup.RuleCheck.prototype.checkProperties = function () {
    var that = this;
    var matched_rule = _.filter(this.rule_arr, function (matcher) {
      var filter = matcher.multi_filter ? matcher.multi_filter : matcher.filter;
      if (!filter || (filter.conditions && filter.conditions.length === 0)) {
        return true;
      }
      return that.isMatched(filter);
    });

    if (_.isArray(matched_rule) && matched_rule.length > 0) {
      this.checkWindowAndMatch(matched_rule);
      salog('--属性匹配-满足', matched_rule);
    } else {
      salog('--属性匹配-不满足');
    }
  };

  popup.RuleCheck.prototype.checkPermission = function () {
    var event_permission = this.plan.event_permission;
    if (!_.isObject(event_permission) || _.isEmptyObject(event_permission)) {
      return true;
    }

    var filters = [event_permission];
    var that = this;
    var matched_arr = [];
    var isMatchedConditions = function (permission_data) {
      var matched_rule = _.filter(permission_data, function (matcher) {
        if (!matcher || !matcher.conditions || (matcher.conditions && matcher.conditions.length === 0)) {
          return true;
        }
        return that.isMatched(matcher); 
      });

      return matched_rule;
    };

    function matchPermission(list) {
      _.each(list, function (v) {
        matched_arr = isMatchedConditions([v]);
        if (_.isArray(matched_arr) && matched_arr.length > 0) {
          var item = v.filters || [];
          if (item && item.length > 0) {
            matchPermission(item);
          }
        }
      });
    }

    matchPermission(filters);

    if (_.isArray(matched_arr) && matched_arr.length > 0) {
      popup.log('--角色属性匹配-满足', matched_arr);
      return true;
    } else {
      popup.log('--角色属性匹配-不满足');
      return false;
    }
  };

  popup.RuleCheck.prototype.checkWindowAndMatch = function (matched_rule) {
    var that = this;

    var temp_matched_rule = [];

    _.each(matched_rule, function (rule) {
      if (!rule.params || !rule.params[0]) {
        salog('--窗口期和次数-规则数据异常');

        return false;
      }
      var rule_count = Number(rule.params[0]);

      if (rule_count === 1) {
        temp_matched_rule.push(rule);
      } else if (rule_count > 1 && _.isObject(rule.window) && rule.window.value > 0) {
        if (!_.isObject(rule.is_in_window) || !_.isNumber(rule.is_in_window.expire_time) || rule.is_in_window.expire_time < that.current_time) {
          rule.is_in_window = {
            expire_time: popup.ruleTime.getExpire(rule.window, that.current_time),
            count: 1
          };
        } else {
          rule.is_in_window.count = rule.is_in_window.count + 1;
        }

        if (rule.is_in_window.count >= rule_count) {
          temp_matched_rule.push(rule);
        } else {
          salog('--窗口期和次数-规则数', rule.is_in_window.count, '不匹配当前次数', rule_count);
        }
      }
    });
    if (temp_matched_rule.length > 0) {
      salog('--窗口期和次数-有匹配成功的规则', temp_matched_rule);
      this.checkGlobalPopupLimit();
    } else {
      salog('--窗口期和次数-没有匹配成功的规则', temp_matched_rule);
    }
  };
  popup.RuleCheck.prototype.checkGlobalPopupLimit = function () {
    var global_limit = popup.localData.msg_limit_global;
    var isTrue = true;
    var that = this;

    if (_.isObject(global_limit) && global_limit.is_in_use === true && _.isArray(global_limit.limits) && _.isArray(popup.localData.global_popup_count) && this.plan.global_msg_limit_enabled === true) {
      _.each(global_limit.limits, function (limit) {
        if (_.isObject(limit) && _.isNumber(limit.limit)) {
          var begin_time = popup.ruleTime.getLast(limit, that.current_time);

          var current_count = popup.ruleTime.getArrMatchCount(popup.localData.global_popup_count, begin_time);

          salog('--全局弹窗限制-已经弹窗次数-' + current_count + '-限制的次数' + limit.limit + '-限制时间-' + begin_time);
          if (current_count < limit.limit) {
            isTrue = isTrue && true;
          } else {
            isTrue = isTrue && false;
          }
        }
      });
      if (isTrue) {
        salog('--全局弹窗限制- 满足');
        this.checkPopupLimit();
      } else {
        salog('--全局弹窗限制-不满足');
      }
    } else {
      salog('--全局弹窗限制- 满足');
      this.checkPopupLimit();
    }
  };

  popup.RuleCheck.prototype.checkPopupLimit = function () {
    if (!_.isObject(this.plan.re_enter) || !_.isNumber(this.plan.re_enter.value) || !_.isNumber(this.plan.re_enter.limit)) {
      this.plan_match.match_state = true;
      return false;
    }
    if (_.isObject(this.plan.is_in_popup_limit_window) && _.isNumber(this.plan.is_in_popup_limit_window.expire_time) && _.isNumber(this.plan.is_in_popup_limit_window.count)) {
      if (this.plan.is_in_popup_limit_window.expire_time < this.current_time) {
        salog('--参与限制-超过了参与限制窗口-开启新窗口-满足', this.plan.is_in_popup_limit_window);
        delete this.plan.is_in_popup_limit_window;
        this.plan_match.match_state = true;
      } else {
        if (this.plan.is_in_popup_limit_window.count < this.plan.re_enter.limit) {
          salog('--参与限制-在窗口内且在参与限制次数内-满足', this.plan.is_in_popup_limit_window);
          this.plan_match.match_state = true;
        } else {
          salog('--参与限制-在窗口内但是超过了参与限制-不满足', this.plan.is_in_popup_limit_window);
        }
      }
    } else {
      if (this.plan.is_in_popup_limit_window) {
        salog('--参与限制-有窗口但是窗口数据异常-开新窗口-满足', this.plan.is_in_popup_limit_window);
        delete this.plan.is_in_popup_limit_window;
      } else {
        salog('--参与限制-不存在窗口-开新窗口-满足', this.plan.is_in_popup_limit_window);
      }

      this.plan_match.match_state = true;
    }
  };

  var flag_dfm = 'dfm-enc-';
  function dfmapping(option) {
    var str = 't6KJCZa5pDdQ9khoEM3Tj70fbP2eLSyc4BrsYugARqFIw1mzlGNVXOHiWvxUn8';
    var len = str.length - 1;
    var relation = {};
    var i = 0;
    for (i = 0; i < str.length; i++) {
      relation[str.charAt(i)] = str.charAt(len - i);
    }
    var newStr = '';
    for (i = 0; i < option.length; i++) {
      if (option.charAt(i) in relation) {
        newStr += relation[option.charAt(i)];
      } else {
        newStr += option.charAt(i);
      }
    }
    return newStr;
  }

  function decrypt(v) {
    if (v.indexOf(flag_dfm) === 0) {
      v = v.substring(flag_dfm.length);
      v = dfmapping(v);
    }
    return v;
  }

  function encrypt(v) {
    return flag_dfm + dfmapping(v);
  }

  popup.store = {
    delete_time: 30 * 24 * 60 * 60 * 1000,
    init: function () {
      this.migrateLocalData();

      popup.localData = this.getLocalData();
      if (_.isNumber(popup.localData.config_pull_interval_ms) && popup.localData.config_pull_interval_ms > 0) {
        popup.updateDataAndSetListen.interval_time = popup.localData.config_pull_interval_ms;
      }

      this.removeLocalData();
      popup.log('初始化-获取-内存-localData');
    },
    getJSONData: function () {
      var data = _.localStorage.get(popup.config.storageName);
      if (_.isString(data)) {
        data = decrypt(data);
      }
      try {
        data = JSON.parse(data);
      } catch (e) {
        _.log(e);
      }
      return data;
    },
    saveJSONData: function (data) {
      data = JSON.stringify(data);
      if (popup.info.encrypt_cookie) {
        data = encrypt(data);
      }
      _.localStorage.set(popup.config.storageName, data);
    },
    migrateLocalData: function () {
      var data = this.getJSONData() || {};
      var distinct_id = popup.sa.store.getDistinctId();

      if (data.popup_sdk_users && data.popup_sdk_plans) {
        return false;
      }

      var popup_data = {
        popup_sdk_plans: {},
        popup_sdk_users: {}
      };
      popup_data.popup_sdk_plans[distinct_id] = data;
      popup_data.popup_sdk_users[distinct_id] = {
        user_id: distinct_id
      };
      this.saveJSONData(popup_data);
    },
    getLocalData: function () {
      var data = this.getJSONData();
      var distinct_id = popup.sa.store.getDistinctId();
      var user_id = null;

      if (!data) {
        return {};
      }

      if (_.isObject(data.popup_sdk_users[distinct_id]) && data.popup_sdk_users[distinct_id].user_id) {
        user_id = data.popup_sdk_users[distinct_id].user_id;
      }

      if (user_id && _.isObject(data.popup_sdk_plans[user_id])) {
        data.popup_sdk_plans[user_id].update_time = new Date().getTime();
        this.saveJSONData(data);
        return data.popup_sdk_plans[user_id];
      } else {
        return {};
      }
    },
    saveLocalData: function () {
      var data = this.getJSONData();
      var distinct_id = popup.sa.store.getDistinctId();
      var user_id = null;

      if (!data) {
        return false;
      }

      if (data.popup_sdk_users && _.isObject(data.popup_sdk_users[distinct_id]) && data.popup_sdk_users[distinct_id].user_id) {
        user_id = data.popup_sdk_users[distinct_id].user_id;
        data.popup_sdk_plans[user_id] = popup.localData;
        this.saveJSONData(data);
      }
    },
    removeLocalData: function () {
      var data = this.getJSONData();
      var delete_time = this.delete_time;
      if (!data || !data.popup_sdk_plans || !data.popup_sdk_users) {
        return false;
      }
      var popups = JSON.parse(JSON.stringify(data.popup_sdk_plans));
      var users = JSON.parse(JSON.stringify(data.popup_sdk_users));
      var current_time = new Date().getTime();
      var delete_id_list = [];
      _.each(popups, function (popup, key) {
        if (current_time - popup.update_time > delete_time) {
          delete data.popup_sdk_plans[key];
          delete_id_list.push(key);
        }
      });

      _.each(users, function (info, distinct_id) {
        if (delete_id_list.length > 0) {
          _.each(delete_id_list, function (id) {
            if (info.user_id && id === info.user_id) {
              delete data.popup_sdk_users[distinct_id];
            }
          });
        }
      });

      this.saveJSONData(data);
    }
  };

  popup.updateDataAndSetListen = {
    active_state: true,
    interval_time: 10 * 60 * 1000,
    save_interval: null,
    data_interval: null,
    image_list: null,
    local_data: null,
    filterConvertPlans: function () {
      var plans = popup.localData.popup_plans;

      if (!plans || !_.isArray(plans)) {
        return false;
      }

      var data = _.filter(plans, function (value) {
        return !!value.convert_window && !!value.is_in_convert_window;
      });

      popup.convertPlans = data;
      popup.log('初始化-异步的convertWindow', popup.convertPlans);
      popup.asyncConvert();
    },
    diffData: function () {
      var localData = popup.localData;
      var serverData = JSON.parse(JSON.stringify(popup.serverData));
      var timer = new Date().getTime();

      if (!serverData || _.isEmptyObject(serverData)) {
        return false;
      }


      if (!localData || _.isEmptyObject(localData) || !localData.popup_plans || localData.popup_plans.length === 0) {
        _.extend(popup.localData, serverData);
        return false;
      }

      var plans = serverData.popup_plans;

      _.each(plans, function (item, index) {
        var localItem = null;

        _.each(localData.popup_plans, function (local_item) {
          if (local_item.plan_id === item.plan_id) {
            localItem = local_item;

            if (!item.audience_id) {
              delete localItem.audience_id;
            }

            if (_.isObject(item.window_update)) {
              _.each(item.window_update, function (value, key) {
                if (!localItem.window_update || localItem.window_update[key] !== value) {
                  if (key === 'trigger_window') {
                    localItem.pattern_popup.matcher_list = item.pattern_popup.matcher_list;
                  } else if (key === 'convert_window') {
                    if (localItem.is_in_convert_window && item.convert_window && localItem.is_in_convert_window.start_time) {
                      localItem.is_in_convert_window.expire_time = popup.ruleTime.getExpire(item.convert_window, localItem.is_in_convert_window.start_time);
                    }
                  }
                }
              });
            }
          }
        });

        if (!localItem) {
          return false;
        }

        if (!item.window_update && localItem.last_update_config_time !== item.last_update_config_time) {
          return false;
        }

        var matcher_list = localItem.pattern_popup.matcher_list;
        _.extend2Lev(localItem, item);
        localItem.pattern_popup.matcher_list = matcher_list;

        plans[index] = localItem;
      });

      _.extend(popup.localData, serverData);
    },
    getEventRule: function () {
      var popup_plans = popup.localData.popup_plans;
      var eventRule = {};
      if (!popup_plans || !_.isArray(popup_plans)) {
        return false;
      }
      _.each(popup_plans, function (plan) {
        var matcher_list = plan.pattern_popup.matcher_list;

        _.each(matcher_list, function (matcher) {
          var event_item = {
            plan: plan,
            rule: [matcher]
          };
          var eventName = matcher.event_name;
          var flag = false;

          if (eventRule[eventName]) {
            _.each(eventRule[eventName], function (item) {
              if (item.plan.plan_id === plan.plan_id) {
                item.rule.push(matcher);
                flag = true;
              }
            });
            if (flag) {
              return false;
            }
            eventRule[eventName].push(event_item);
          } else {
            eventRule[eventName] = [event_item];
          }
        });
      });
      _.each(eventRule, function (value) {
        value.sort(function (first, second) {
          var result = second.plan.absolute_priority - first.plan.absolute_priority;
          if (result === 0) {
            return second.plan.plan_id - first.plan.plan_id;
          }
          return result;
        });
      });
      popup.eventRule = eventRule;
      popup.log('初始化-得到事件和计划的关系');
      popup.log('--------------------初始化完成--------------------等待事件触发计划--------------------');
    },

    registerListen: function () {
      var that = this;
      popup.sa.events.on('send', function (data) {
        if (data.event && popup.eventRule[data.event]) {
          if (!_.isArray(popup.localData.eventQueue)) {
            popup.localData.eventQueue = [];
          }
          popup.localData.eventQueue.push(data);
          that.updateLocalData();
          popup.eventTriggerProcess();
        }
      });

      popup.sa.events.on('changeDistinctId', function (id) {
        that.changeId();
      });

      popup.sa.events.isReady();
    },

    setListenEvent: function () {
      this.diffData();
      this.filterConvertPlans();
      this.getEventRule();
      this.updateLocalData();
    },
    loadImage: function (arr) {
      if (arr.length < 1) {
        return false;
      }
      if (JSON.stringify(arr) === JSON.stringify(this.image_list)) {
        return false;
      }

      this.image_list = arr;

      for (var i = 0; i < arr.length; i++) {
        load(arr[i]);
      }

      function load(src) {
        var image = new Image();
        image.src = src;
      }
    },
    getDataFromServer: function (suc, err) {
      var that = this;
      var distinct_id = encodeURIComponent(popup.sa.store.getDistinctId());
      var platform = encodeURIComponent(popup.info.platform);
      var project = encodeURIComponent(popup.info.project);
      suc = _.isFunction(suc) ? suc : function () {};
      err = _.isFunction(err) ? err : function () {};
      _.ajax({
        url: popup.info.api_base_url + '/sfo/user_popup_configs?distinct_id=' + distinct_id + '&platform=' + platform + '&project=' + project + '&time=' + new Date().getTime() + '&sdk_version=' + popup.lib_version,
        type: 'GET',
        cors: true,
        credentials: false,
        contentType: 'application/json',
        success: function (data) {
          if (!that.active_state) {
            err();
            return false;
          }
          popup.log('初始化-修改-serverData-ajax获取');
          if (_.isObject(data) && data.server_current_time && data.popup_plans && /\d+\.\d+/.test(data.min_sdk_version_required) && parseFloat(data.min_sdk_version_required) <= parseFloat(popup.lib_version)) {
            popup.serverData = data;

            if (_.isNumber(data.config_pull_interval_ms) && data.config_pull_interval_ms > 0) {
              that.interval_time = data.config_pull_interval_ms;
            }
            popup.serverData.local_update_time = new Date().getTime();
            if (popup.info.preload_image) {
              that.loadImage(popup.getImageList(data.popup_plans));
            }
            that.updateUserPlans();
            that.setListenEvent();
          } else {
            popup.log('初始化-数据异常-请求返回的数据错误-中止');
            popup.serverData = {};
            popup.localData = {};
            that.updateLocalData();
          }
          suc();
          that.setIntervalTime(that.interval_time);
        },
        error: function () {
          if (!that.active_state) {
            err();
            return false;
          }
          popup.log('初始化-数据异常-请求错误-中止');
          popup.serverData = {};
          suc();
          that.setIntervalTime(that.interval_time);
        }
      });
    },
    updateUserPlans: function () {
      var data = popup.store.getJSONData();
      var distinct_id = popup.sa.store.getDistinctId();
      var user_id = popup.serverData.user_id;

      data.popup_sdk_users[distinct_id] = {
        user_id: user_id || distinct_id
      };

      if (user_id) {
        if (data.popup_sdk_plans[user_id]) {
          popup.localData = data.popup_sdk_plans[user_id];
        } else if (data.popup_sdk_plans[distinct_id]) {
          popup.localData = data.popup_sdk_plans[distinct_id];
          delete data.popup_sdk_plans[distinct_id];
        }
      } else {
        if (data.popup_sdk_plans[distinct_id]) {
          popup.localData = data.popup_sdk_plans[distinct_id];
        }
      }

      popup.localData.update_time = new Date().getTime();

      popup.store.saveJSONData(data);
    },
    setIntervalTime: function (time) {
      var that = this;
      this.data_interval = setTimeout(function () {
        popup.log('10分钟定时更新数据开始-------');
        that.getDataFromServer();
      }, time);
    },
    setFirstListen: function () {
      var that = this;
      this.getDataFromServer(function () {
        that.registerListen();
      });
    },
    updateLocalData: function () {
      var local_data = JSON.stringify(popup.localData);
      if (this.local_data !== local_data) {
        this.local_data = local_data;
        popup.store.saveLocalData();
      }
    },
    initial: function () {
      popup.store.init();
      var last_time = popup.localData.local_update_time;
      var current_time = new Date().getTime();
      if (!_.isNumber(last_time)) {
        this.setFirstListen();
      } else {
        var remain_time = current_time - last_time;
        if (remain_time <= 0 || remain_time >= this.interval_time) {
          this.setFirstListen();
        } else {
          this.setIntervalTime(this.interval_time - remain_time);
          this.setListenEvent();
          this.registerListen();
          if (popup.info.preload_image) {
            this.loadImage(popup.getImageList(popup.localData.popup_plans));
          }
        }
      }
    },
    changeId: function () {
      this.stopAllState();
      this.startState({ getLocalData: false });
    },
    stopAllState: function () {
      this.active_state = false;
      popup.eventRule = {};
      this.data_interval && window.clearTimeout(this.data_interval);
      this.save_interval && window.clearInterval(this.save_interval);
      popup.asyncConvert.timer && window.clearTimeout(popup.asyncConvert.timer);
      popup.convertPlans = [];
      popup.localData = {};
      this.resetState();
    },
    resetState: function () {
      if (popup.info.platform === 'WEB') {
        return false;
      }
      if (!document.querySelector('div[data-sf-mask]') && popup.isRun) {
        popup.isRun = false;
      }
    },
    startState: function (obj) {
      this.active_state = true;
      obj = obj || { getLocalData: true };
      if (obj.getLocalData) {
        this.resetState();
        popup.localData = popup.store.getLocalData();
      }
      this.getDataFromServer();
    }
  };

  popup.testSend = {
    hasParam: function () {
      var params = _.URL(window.location.href).searchParams;
      var sf_popup_test = params.get('sf_popup_test') || '';
      var popup_window_id = params.get('popup_window_id') || '';
      var platform = params.get('platform');

      if (!sf_popup_test || !popup_window_id) {
        return false;
      } else {
        return {
          sf_popup_test: sf_popup_test,
          popup_window_id: popup_window_id,
          platform: platform
        };
      }
    },
    start: function () {
      var _platform = this.hasParam().platform;
      if (_platform === 'WEB') {
        this.webCampaign();
      } else {
        popup.log('H5测试弹窗请在移动端查看！');
        return false;
      }
    },
    webCampaign: function () {
      var project = popup.info.project;
      var platform = popup.info.platform;
      var popup_window_id = this.hasParam().popup_window_id;
      var distinct_id = encodeURIComponent(popup.sa.store.getDistinctId());

      _.ajax({
        url: popup.info.api_base_url + '/sfo/popup_windows/' + popup_window_id + '?project=' + encodeURIComponent(project) + '&time=' + new Date().getTime() + '&sdk_version=' + popup.lib_version + '&platform=' + encodeURIComponent(platform) + '&distinct_id=' + distinct_id,
        type: 'GET',
        credentials: false,
        cors: true,
        contentType: 'application/json',
        success: function (data) {
          var uuid = _.getUuid();
          var content;
          if (!_.isObject(data)) {
            popup.sa.log('测试弹窗-服务端数据格式不合法', data);
            data = {};
          }
          try {
            content = JSON.parse(data.content);
          } catch (error) {
            popup.sa.log('测试弹窗-content解析失败,content:', data, error);
          }

          var popup_info = popup.getPopupInfo(content);
          popup_info.$sf_msg_id = uuid;

          var param = {
            content: data.content,
            type: data.popup_type || 'CUSTOMIZED'
          };
          if (Object.hasOwnProperty.call(data, 'name')) {
            param.name = data.name;
          }
          if (!_.isString(data.content)) {
            popup_info.$sf_succeed = false;
            popup_info.$sf_fail_reason = '预览信息解析失败，请检查计划配置';
            popup.track.popupDisplay(popup_info);
            popup.info.popup_campaign_listener.onFailed(param, 1001, '预览信息解析失败，请检查计划配置');
          } else if (popup.info.supportCustom === 'withoutCampaignListener' || popup.info.supportCustom === 'withoutStart') {
            popup_info.$sf_succeed = false;
            popup_info.$sf_fail_reason = '自定义触达计划未实现弹窗生命周期回调';
            popup.track.popupDisplay(popup_info);
            popup.info.popup_campaign_listener.onFailed(param, 1006, '自定义触达计划未实现弹窗生命周期回调');
          } else {
            popup_info.$sf_succeed = true;
            popup.track.popupDisplay(popup_info);
            popup.info.popup_campaign_listener.onStart(param);
          }
        },
        error: function (err) {
          popup.log('测试弹窗获取数据错误', err);
        }
      });
    }
  };

  popup.setPara = function (para) {
    if (!_.isObject(para)) {
      para = {};
    }
    popup.info = _.extend({}, popup.defaultPara, para);

    var sa = popup.sa;
    if (!sa) {
      popup.log('web js sdk 还没有初始化完成');
      return false;
    }
    if (sa.para.encrypt_cookie === true) {
      popup.info.encrypt_cookie = true;
    }
    if (!_.isString(popup.info.api_base_url) || popup.info.api_base_url.slice(0, 4) !== 'http') {
      popup.log('popup 必须填写有效 api_base_url');
      return false;
    } else {
      if (popup.info.api_base_url.slice(0, 5) === 'http:' && location.protocol === 'https:') {
        popup.log('您的当前页面是https的地址，api_base_url 也必须是https！');
        return false;
      } else {
        popup.info.api_base_url = popup.info.api_base_url.slice(-1) === '/' ? popup.info.api_base_url.slice(0, -1) : popup.info.api_base_url;
      }
    }

    if (!_.isString(sa.para.server_url) || sa.para.server_url.slice(0, 4) !== 'http') {
      popup.log('server_url 必须填写有效数据接收地址');
      return false;
    }

    if (!popup.info.project) {
      popup.info.project = _.URL(sa.para.server_url).searchParams.get('project') || 'default';
    }

    popup.info.supportCustom = true;
    if (!_.isObject(popup.info.popup_campaign_listener)) {
      popup.info.supportCustom = 'withoutCampaignListener';
      popup.info.popup_campaign_listener = {
        shouldStart: function () {
          return true;
        },
        onClick: function () { },
        onStart: function () { },
        onEnd: function () { },
        onFailed: function () { }
      };
    } else {
      if (!_.isFunction(popup.info.popup_campaign_listener.shouldStart)) {
        popup.info.popup_campaign_listener.shouldStart = function () {
          return true;
        };
      }
      if (!_.isFunction(popup.info.popup_campaign_listener.onStart)) {
        popup.info.supportCustom = 'withoutStart';
        popup.info.popup_campaign_listener.onStart = function () { };
      }
      if (!_.isFunction(popup.info.popup_campaign_listener.onEnd)) {
        popup.info.popup_campaign_listener.onEnd = function () { };
      }
      if (!_.isFunction(popup.info.popup_campaign_listener.onFailed)) {
        popup.info.popup_campaign_listener.onFailed = function () { };
      }
      if (!_.isFunction(popup.info.popup_campaign_listener.onClick)) {
        popup.info.popup_campaign_listener.onClick = function () { };
      }
    }

    return true;
  };

  popup.init = function () {
    var sd = window.UniversalStatistics201505;
    popup.sa = sd;

    if ((sd && sd.readyState && sd.readyState.state >= 3) || !sd.on) {
      initPopup.apply(this, arguments);
    } else {
      var _this = this;
      var _args = arguments;
      sd &&
        sd.on('sdkReady', function () {
          initPopup.apply(_this, _args);
        });
    }
  };

  function initPopup() {
    if (!popup.isSupportPopup()) {
      return false;
    }
    if (window.screen.width && Number(window.screen.width) <= 1024) {
      if (typeof console === 'object' && console.log) {
        console.log('Web 弹窗仅支持 PC端，且屏幕宽度大于 1024');
      }
      return false;
    }

    var para = {};
    if (arguments.length > 0) {
      if (arguments.length === 1 && _.isObject(arguments[0])) {
        para = arguments[0];
      } else if (arguments.length >= 2 && _.isObject(arguments[1])) {
        para = arguments[1];
      }
    }

    if (!this.setPara(para)) {
      return false;
    }
    popup.info.platform = 'WEB';
    if (!popup.setIsLoad()) {
      return false;
    }

    if (popup.testSend.hasParam()) {
      popup.testSend.start();
    } else {
      popup.listenPageStateChange();
      popup.updateDataAndSetListen.initial();
    }
  }

  if (window.UniversalStatistics201505 && window.UniversalStatistics201505.modules["WebPopup"]) {
    window.UniversalStatistics201505.modules.WebPopup = window.UniversalStatistics201505.modules.WebPopup || popup;
  } else {
    window.UniversalStatistics201505.modules.WebPopup = popup;
  }

  return popup;

})));
