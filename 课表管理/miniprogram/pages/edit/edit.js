Page({
 
  // 输入框输入事件处理函数
  ClassInput(e) {
    const inputValue = e.detail.value;
    // 正则表达式，匹配仅包含中文、英文的内容
    const reg = /^[a-zA-Z\u4e00-\u9fa5]+$/; 
    if (!reg.test(inputValue)) {
      wx.showToast({
        title: '请输入有效的课程名称（中文或英文）',
        icon: 'none',
        duration: 2000
      });
      return;
    }
     // 输入内容符合要求，更新data中的值
     this.setData({
      class: inputValue
    });
  },

  data: {
    showColorPicker: false,
    textColor: '#a6a6a6', // 默认灰色
    currentColor: '#a6a6a6',
    currentHexColor: 'a6a6a6',
    cursorX: 100,
    cursorY: 100,
    hueValue: 0,
    brightnessValue: 65,
  },
  // 显示颜色选择器
  showColorPicker: function() {
    this.setData({
      showColorPicker: true,
      currentColor: this.data.textColor,
      currentHexColor: this.data.textColor.substring(1)
    });
  },

  // 隐藏颜色选择器
  hideColorPicker: function() {
    this.setData({
      showColorPicker: false
    });
  },

  // 确认颜色选择
  confirmColor: function() {
    this.setData({
      textColor: this.data.currentColor,
      showColorPicker: false
    });
  },

  // 处理颜色选择
  handleColorSelect: function(e) {
    const { pageX, pageY } = e.touches[0];
    const query = wx.createSelectorQuery();
    query.select('.color-palette').boundingClientRect();
    query.exec((res) => {
      const palette = res[0];
      if (palette) {
        let x = pageX - palette.left;
        let y = pageY - palette.top;
        
        // 限制在调色板范围内
        x = Math.max(0, Math.min(x, palette.width));
        y = Math.max(0, Math.min(y, palette.height));
        
        // 计算颜色
        const hue = (x / palette.width) * 360;
        const brightness = 100 - (y / palette.height) * 100;
        
        this.setData({
          cursorX: x,
          cursorY: y,
          hueValue: hue,
          brightnessValue: brightness,
          currentColor: this.hslToHex(hue, 100, brightness),
          currentHexColor: this.hslToHex(hue, 100, brightness).substring(1)
        });
      }
    });
  },

  // 处理色度变化
  handleHueChange: function(e) {
    const hue = e.detail.value;
    this.setData({
      hueValue: hue,
      currentColor: this.hslToHex(hue, 100, this.data.brightnessValue),
      currentHexColor: this.hslToHex(hue, 100, this.data.brightnessValue).substring(1)
    });
  },

  // 处理明度变化
  handleBrightnessChange: function(e) {
    const brightness = e.detail.value;
    this.setData({
      brightnessValue: brightness,
      currentColor: this.hslToHex(this.data.hueValue, 100, brightness),
      currentHexColor: this.hslToHex(this.data.hueValue, 100, brightness).substring(1)
    });
  },

  // 处理十六进制颜色输入
  handleHexInput: function(e) {
    const hex = e.detail.value;
    if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
      this.setData({
        currentHexColor: hex,
        currentColor: '#' + hex
      });
      
      // 这里可以添加代码更新光标位置
      // 需要将十六进制颜色转换为HSL然后计算x,y位置
    }
  },

  // HSL转十六进制颜色
  hslToHex: function(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
});