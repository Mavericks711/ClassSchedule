Page({
  data: {
    showColorPicker: false,
    textColor: '#a6a6a6',
    blockTextColor: '#a6a6a6',
    isEditingTextColor: true,
    currentColor: '#a6a6a6',
    currentHexColor: 'a6a6a6',
    cursorX: 100,
    cursorY: 100,
    hueValue: 0,
    brightnessValue: 65,
    courseType: 'required', 

    // 周数选择器相关数据
    showWeekPicker: false,
    weeks: Array.from({length: 16}, (_, i) => i + 1),
    selectedWeeks: Array(16).fill(false),
    
    // 时间选择器相关数据
    showTimePicker: false,
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    classNumbers: Array.from({length: 11}, (_, i) => i + 1),
    
    // 当前操作的时间段索引
    currentSlotIndex: 0,
    
    // 课程基本信息
    class: '',
    teacher: '',
    location: '',
    
    // 多时间段数据
    timeSlots: [{
      weekDisplayText: '',
      timeDisplayText: '',
      teacher: '',
      location: '',
      selectedWeeks: Array(16).fill(false),
      weekIndex: 0,
      startClassIndex: 0,
      endClassIndex: 0
    }]
  },

  // 输入框输入事件处理函数
  ClassInput(e) {
    const inputValue = e.detail.value;
    const reg = /^[a-zA-Z0-9\u4e00-\u9fa5\+\#\-\_\*\(\)\（\）\，\。\、\；\：\“\”\《\》\？\！\￥\……\·]+$/; 
    if (!reg.test(inputValue)) {
      wx.showToast({
        title: '请输入有效的课程名称（中文或英文）',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    this.setData({ class: inputValue });
  },

  // 老师输入 - 修改为多时间段版本
  bindTeacherInput(e) {
    const index = e.currentTarget.dataset.index;
    const inputValue = e.detail.value.trim();
    const reg = /^[a-zA-Z\u4e00-\u9fa5]+$/;
  
    if (!reg.test(inputValue)) {
      wx.showToast({
        title: '请输入有效的授课老师（中文或英文）',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    const timeSlots = [...this.data.timeSlots];
    timeSlots[index].teacher = inputValue;
    this.setData({ timeSlots });
  },

  // 地点输入 - 修改为多时间段版本
  bindLocationInput(e) {
    const index = e.currentTarget.dataset.index;
    const inputValue = e.detail.value.trim();
    const reg = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
  
    if (!reg.test(inputValue)) {
      wx.showToast({
        title: '请输入有效的上课地点',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    const timeSlots = [...this.data.timeSlots];
    timeSlots[index].location = inputValue;
    this.setData({ timeSlots });
  },

  // 添加时间段
  addTimeSlot() {
    const newSlot = {
      weekDisplayText: '',
      timeDisplayText: '',
      teacher: '',
      location: '',
      selectedWeeks: Array(16).fill(false),
      weekIndex: 0,
      startClassIndex: 0,
      endClassIndex: 0
    };
    this.setData({
      timeSlots: [...this.data.timeSlots, newSlot]
    });
  },

  // 删除时间段
  removeTimeSlot(e) {
    const index = e.currentTarget.dataset.index;
    const timeSlots = [...this.data.timeSlots];
    
    if (timeSlots.length <= 1) {
      wx.showToast({
        title: '至少保留一个时间段',
        icon: 'none'
      });
      return;
    }
    
    timeSlots.splice(index, 1);
    this.setData({ timeSlots });
  },

  // 显示颜色选择器
  showTextColorPicker() {
    this.setData({
      showColorPicker: true,
      isEditingTextColor: true,
      currentColor: this.data.textColor,
      currentHexColor: this.data.textColor.substring(1)
    });
  },
  
  showBlockColorPicker() {
    this.setData({
      showColorPicker: true,
      isEditingTextColor: false,
      currentColor: this.data.blockTextColor,
      currentHexColor: this.data.blockTextColor.substring(1)
    });
  },

  // 隐藏颜色选择器
  hideColorPicker() {
    this.setData({ showColorPicker: false });
  },

  // 确认颜色选择
  confirmColor() {
    if (this.data.isEditingTextColor) {
      this.setData({
        textColor: this.data.currentColor,
        showColorPicker: false
      });
    } else {
      this.setData({
        blockTextColor: this.data.currentColor,
        showColorPicker: false
      });
    }
  },

  // 颜色选择相关方法保持不变...
  handleColorSelect(e) {
    const { pageX, pageY } = e.touches[0];
    const query = wx.createSelectorQuery();
    query.select('.color-palette').boundingClientRect();
    query.exec((res) => {
      const palette = res[0];
      if (palette) {
        let x = pageX - palette.left;
        let y = pageY - palette.top;
        
        x = Math.max(0, Math.min(x, palette.width));
        y = Math.max(0, Math.min(y, palette.height));
        
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

  handleHueChange(e) {
    const hue = e.detail.value;
    const brightness = this.data.brightnessValue;
    const hex = this.hslToHex(hue, 100, brightness);
  
    this.setData({
      hueValue: hue,
      currentColor: hex,
      currentHexColor: hex.substring(1)
    });
  
    this.updateCursorByHSL(hue, brightness);
  },

  handleBrightnessChange(e) {
    const brightness = e.detail.value;
    const hue = this.data.hueValue;
    const hex = this.hslToHex(hue, 100, brightness);

    this.setData({
      brightnessValue: brightness,
      currentColor: hex,
      currentHexColor: hex.substring(1)
    });

    this.updateCursorByHSL(hue, brightness);
  },

  handleHexInput(e) {
    const hex = e.detail.value;
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      const fullHex = '#' + hex;
      const hsl = this.hexToHSL(fullHex);
  
      this.setData({
        currentHexColor: hex,
        currentColor: fullHex,
        hueValue: hsl.h,
        brightnessValue: hsl.l
      });
  
      this.updateCursorByHSL(hsl.h, hsl.l);
    } else {
      this.setData({ currentHexColor: hex });
    }
  },

  // 显示周数选择器 - 修改为多时间段版本
  showWeekPicker(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentSlotIndex: index,
      showWeekPicker: true,
      selectedWeeks: [...this.data.timeSlots[index].selectedWeeks]
    });
  },

  hideWeekPicker() {
    this.setData({ showWeekPicker: false });
  },

  // 切换周数选择状态
  toggleWeek(e) {
    const index = e.currentTarget.dataset.index;
    const selectedWeeks = [...this.data.selectedWeeks];
    selectedWeeks[index] = !selectedWeeks[index];
    this.setData({ selectedWeeks });
  },

  // 确认选择的周数 - 修改为多时间段版本
  confirmWeeks() {
    const slotIndex = this.data.currentSlotIndex;
    const timeSlots = [...this.data.timeSlots];
    
    timeSlots[slotIndex].selectedWeeks = [...this.data.selectedWeeks];
    timeSlots[slotIndex].weekDisplayText = this.formatWeekDisplay(
      this.data.weeks.filter((_, i) => this.data.selectedWeeks[i])
    );
    
    this.setData({
      timeSlots,
      showWeekPicker: false
    });
  },

  // 格式化周数显示文本
  formatWeekDisplay(weeks) {
    if (weeks.length === 0) return '';
    weeks = Array.from(new Set(weeks)).sort((a, b) => a - b);

    let result = '第';
    let ranges = [];
    let start = weeks[0];
    let prev = weeks[0];

    for (let i = 1; i < weeks.length; i++) {
      const curr = weeks[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = prev = curr;
      }
    }

    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    result += ranges.join('、') + '周';
    return result;
  },

  // 显示时间选择器 - 修改为多时间段版本
  showTimePicker(e) {
    const index = e.currentTarget.dataset.index;
    const slot = this.data.timeSlots[index];
    
    this.setData({
      currentSlotIndex: index,
      showTimePicker: true,
      currentWeekIndex: slot.weekIndex,
      currentStartClassIndex: slot.startClassIndex,
      currentEndClassIndex: slot.endClassIndex
    });
  },

  hideTimePicker() {
    this.setData({ showTimePicker: false });
  },

  // 星期选择变化
  bindWeekChange(e) {
    this.setData({ currentWeekIndex: e.detail.value[0] });
  },

  // 开始节数选择变化
  bindStartClassChange(e) {
    const selectedIndex = e.detail.value[0];
    this.setData({
      currentStartClassIndex: selectedIndex,
      currentEndClassIndex: Math.max(selectedIndex, this.data.currentEndClassIndex)
    });
  },

  // 结束节数选择变化
  bindEndClassChange(e) {
    this.setData({ currentEndClassIndex: e.detail.value[0] });
  },

  // 确认时间选择 - 修改为多时间段版本
  confirmTime() {
    const slotIndex = this.data.currentSlotIndex;
    const timeSlots = [...this.data.timeSlots];
    const startClass = this.data.currentStartClassIndex + 1;
    const endClass = this.data.currentEndClassIndex + 1;
    
    if (endClass < startClass) {
      wx.showToast({
        title: '请选择有效的上课时间',
        icon: 'none'
      });
      return;
    }
    
    const weekName = this.data.weekDays[this.data.currentWeekIndex];
    let displayText = startClass === endClass 
      ? `周${weekName} 第${startClass}节` 
      : `周${weekName} 第${startClass}-${endClass}节`;
    
    timeSlots[slotIndex].weekIndex = this.data.currentWeekIndex;
    timeSlots[slotIndex].startClassIndex = this.data.currentStartClassIndex;
    timeSlots[slotIndex].endClassIndex = this.data.currentEndClassIndex;
    timeSlots[slotIndex].timeDisplayText = displayText;
    
    this.setData({
      timeSlots,
      showTimePicker: false
    });
  },

  // 颜色转换工具方法保持不变...
  hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
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
  },

  hexToHSL(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(hex, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  updateCursorByHSL(hue, brightness) {
    const query = wx.createSelectorQuery();
    query.select('.color-palette').boundingClientRect();
    query.exec((res) => {
      const palette = res[0];
      if (palette) {
        const x = (hue / 360) * palette.width;
        const y = (1 - brightness / 100) * palette.height;
        this.setData({ cursorX: x, cursorY: y });
      }
    });
  },

  radioChange: function(e) {
    this.setData({
      courseType: e.detail.value
    });
  },

  /**
 * 核心：保存课程按钮的处理函数
 * （已优化 Loading 的处理逻辑）
 */
handleSave: function() {
  // 1. 从全局缓存中获取用户邮箱
  const userEmail = wx.getStorageSync('userInfo')?.email;
  if (!userEmail) {
    wx.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  // 2. 前端数据校验
  if (!this.data.class.trim()) {
    wx.showToast({ title: '请输入课程名称', icon: 'none' });
    return;
  }
  for (let i = 0; i < this.data.timeSlots.length; i++) {
    const slot = this.data.timeSlots[i];
    if (!slot.weekDisplayText) {
      wx.showToast({ title: `请为第${i + 1}个时间段选择周数`, icon: 'none' });
      return;
    }
    if (!slot.timeDisplayText) {
      wx.showToast({ title: `请为第${i + 1}个时间段选择上课时间`, icon: 'none' });
      return;
    }
  }

  // --- 在所有校验通过后，显示 Loading ---
  wx.showLoading({ 
    title: '正在保存...',
    mask: true // 建议加上 mask，防止用户在保存期间重复点击
  });

  // 3. 数据转换
  const postData = {
    userEmail: userEmail,
    courseName: this.data.class.trim(),
    textColor: this.data.textColor,
    backgroundColor: this.data.blockTextColor,
    isElective: this.data.courseType === 'elective',
    schedules: this.data.timeSlots.map(slot => {
      const selectedWeekNumbers = this.data.weeks
        .filter((weekNum, index) => slot.selectedWeeks[index]);
      return {
        weeks: selectedWeekNumbers,
        day: slot.weekIndex + 1,//星期几
        startSection: slot.startClassIndex + 1,
        endSection: slot.endClassIndex + 1,
        teacher: slot.teacher.trim(),
        location: slot.location.trim()
      };
    })
  };

  // 4. 调用云函数
  wx.cloud.callFunction({
    name: 'addCourse',
    data: postData,
    success: res => {
      wx.hideLoading();
      // 在 success 回调中，只处理成功的业务逻辑
      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        
        // 云函数返回了业务错误，也在这里处理
        wx.showToast({
          title: res.result.message || '保存失败，请重试',
          icon: 'none'
        });
      }
    },
    fail: err => {
      wx.hideLoading();
      // 在 fail 回调中，只处理网络层面的失败
      wx.showToast({
        title: '请求失败，请检查网络',
        icon: 'none'
      });
      console.error('云函数[addCourse]调用失败', err);
    },
 
  });
}
});