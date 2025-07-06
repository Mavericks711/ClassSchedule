Page({
  data: {
    showSelect: false,    // 控制选择框显示状态
    menuTop: 0,           // 选择框顶部位置
    menuRight: 0,          // 选择框右侧位置

    showSelect: false,
    menuTop: 0,
    menuRight: 0,

    showDatePicker: false,
    selectedYear: 2025,  // 默认2025年
    selectedMonth: 4,    // 默认4月
    selectedDay: 11,     // 默认11日
    displayDate: '2025/04/11',
    schoolWeekText: '第8周 周五',
    daysInMonth: [],

    showWeekPicker: false,
    weekIndex: 7, // 默认第8周
    dayIndex: 4,  // 默认周五

    currentWeekDates: ['04/7', '04/8', '04/9', '04/10', '04/11', '04/12', '04/13'] // 初始值
  },

  // 显示选择框
  showSelectMenu(e) {
    // 获取图标的位置
    const query = wx.createSelectorQuery();
    query.select('.image').boundingClientRect(rect => {
      if (rect) {
        this.setData({
          showSelect: true,
          // 选择框显示在图标右上角附近
          menuTop: rect.top + rect.height -10,
          menuRight: wx.getSystemInfoSync().windowWidth - rect.right-110
        });
      }
    }).exec();
  },

  // 从excel导入
  handleExcelImport() {
    this.setData({ showSelect: false });
    console.log('触发从excel导入');
  },

  // 手动添加
  handleManualAdd() {
    this.setData({ showSelect: false });
    console.log('触发手动添加');
    wx.navigateTo({
      url: '/pages/edit/edit'
    });
  },

  // 点击选择框外部关闭选择框
  handleOutsideTap() {
    this.setData({ showSelect: false });
  },

   // 显示弹窗
   showDatePicker() {
    // 从当前displayDate解析出年月日
    const [year, month, day] = this.data.displayDate.split('/').map(Number);
    
    this.setData({
      showDatePicker: true,
      selectedYear: year,
      selectedMonth: month,
      selectedDay: day,
      daysInMonth: this.getDaysInMonth(year, month)
    });
  },

  closeDatePicker() {
    this.setData({ showDatePicker: false });
  },

  // 防止点击透传
  noop() {},

  toggleYear() {
    this.setData({
      selectedYear: this.data.selectedYear === 2025 ? null : 2025
    });
  },

  toggleMonth(e) {
    const month = e.currentTarget.dataset.month;
    const isSame = this.data.selectedMonth === month;
    const newMonth = isSame ? null : month;

    this.setData({
      selectedMonth: newMonth,
      selectedDay: null,
      daysInMonth: this.getDaysInMonth(this.data.selectedYear, newMonth)
    });
  },

  toggleDay(e) {
    const day = e.currentTarget.dataset.day;
    this.setData({
      selectedDay: this.data.selectedDay === day ? null : day
    });
  },

  confirmDate() {
    const { selectedYear, selectedMonth, selectedDay } = this.data;
    if (!selectedYear || !selectedMonth || !selectedDay) {
      wx.showToast({
        title: '请选择有效日期',
        icon: 'none'
      });
      return;
    }
  
    // 日期格式化
    const dateStr = `${selectedYear}/${String(selectedMonth).padStart(2, '0')}/${String(selectedDay).padStart(2, '0')}`;
  
    // 计算上学周和星期
    const startDate = new Date('2025-02-16'); // 第1周周一前一天(2月16日)
    const endDate = new Date('2025-06-08');   // 第16周周日
    const chosenDate = new Date(`${selectedYear}-${selectedMonth}-${selectedDay}`);
    
    // 检查日期是否在有效范围内
    if (chosenDate < startDate || chosenDate > endDate) {
      wx.showToast({
        title: '日期不在学期范围内(2月17日-6月8日)',
        icon: 'none'
      });
      return;
    }
  
    // 修复周数计算逻辑
    const diffDays = Math.floor((chosenDate - startDate) / (1000 * 60 * 60 * 24));
    const week = Math.min(Math.floor(diffDays / 7) + 1, 16); // 使用Math.floor而不是Math.ceil
    
    // 计算星期几
    const dayOfWeek = ['日','一','二','三','四','五','六'][chosenDate.getDay()];
  
    // 计算当前周的日期范围（周一到周日）
    const currentWeekDates = this.calculateWeekDates(chosenDate);
  
     // 更新全局数据
    const app = getApp()
    app.globalData.currentDate = dateStr
    app.globalData.currentWeekText = `第${week}周 周${dayOfWeek}`

    this.setData({
      displayDate: dateStr,
      showDatePicker: false,
      schoolWeekText: `第${week}周 周${dayOfWeek}`,
      currentWeekDates,
      // 保留选择的年月日，下次打开选择器时会显示
      selectedYear: selectedYear,
      selectedMonth: selectedMonth,
      selectedDay: selectedDay
    });
  },
  
  // 计算当前周的日期范围（周一到周日）
  calculateWeekDates(date) {
    const currentDay = date.getDay(); // 0是周日，1是周一...
    const monday = new Date(date);
    monday.setDate(date.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      dates.push(`${String(day.getMonth() + 1).padStart(2, '0')}/${day.getDate()}`);
    }
    
    return dates;
  },
  getDaysInMonth(year, month) {
    if (!year || !month) return [];
    const thirtyOne = [1, 3, 5, 7, 8, 10, 12];
    const thirty = [4, 6, 9, 11];
  
    if (thirtyOne.includes(month)) return Array.from({ length: 31 }, (_, i) => i + 1);
    if (thirty.includes(month)) return Array.from({ length: 30 }, (_, i) => i + 1);
    if (month === 2) return Array.from({ length: 28 }, (_, i) => i + 1); // 2025 is not leap year
  
    return [];
  },

  // 点击周文本显示选择器
  showWeekPicker() {
    // 从当前文本解析出周和星期
    const weekMatch = this.data.schoolWeekText.match(/第(\d+)周/);
    const dayMatch = this.data.schoolWeekText.match(/周(.)$/);
    const weekDays = ['一','二','三','四','五','六','日'];
    
    this.setData({
      showWeekPicker: true,
      weekIndex: weekMatch ? parseInt(weekMatch[1]) - 1 : 7,
      dayIndex: dayMatch ? weekDays.indexOf(dayMatch[1]) : 4 // 默认周五
    });
  },

  // 关闭周选择器
  closeWeekPicker() {
    this.setData({ showWeekPicker: false });
  },

  
  // 周选择变化
  bindWeekChange: function(e) {
    this.setData({
      weekIndex: e.detail.value[0]
    });
  },

  // 星期选择变化
  bindDayChange: function(e) {
    this.setData({
      dayIndex: e.detail.value[0]
    });
  },

  // 确认周选择
  confirmWeek() {
    const week = this.data.weekIndex + 1; // 转为1-based
    const day = this.data.dayIndex;
    const weekDays = ['一','二','三','四','五','六','日'];
    const dayText = weekDays[day];
    
    // 计算对应的日期 (2月17日是第1周周一)
    const startDate = new Date('2025-02-17');
    const targetDate = new Date(startDate);
    
    // 计算目标日期
    targetDate.setDate(startDate.getDate() + (week - 1) * 7 + day);
    
    // 检查日期是否超出学期范围
    const endDate = new Date('2025-06-08');
    if (targetDate > endDate) {
      wx.showToast({
        title: '超出学期范围(2月17日-6月8日)',
        icon: 'none'
      });
      return;
    }
    
    // 计算当前周的日期范围
    const currentWeekDates = this.calculateWeekDates(targetDate);
    
    // 更新全局数据
    const app = getApp()
    app.globalData.currentDate = `${targetDate.getFullYear()}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${String(targetDate.getDate()).padStart(2, '0')}`
    app.globalData.currentWeekText = `第${week}周 周${dayText}`

    // 更新数据
    this.setData({
      schoolWeekText: `第${week}周 周${dayText}`,
      displayDate: `${targetDate.getFullYear()}/${String(targetDate.getMonth() + 1).padStart(2, '0')}/${String(targetDate.getDate()).padStart(2, '0')}`,
      selectedMonth: targetDate.getMonth() + 1,
      currentWeekDates,
      showWeekPicker: false
    });
  },

  // 在calculateWeekDates方法中修改日期格式
calculateWeekDates(date) {
  const currentDay = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    // 使用短格式显示（单数字不加0）
    const month = day.getMonth() + 1;
    const dayNum = day.getDate();
    dates.push(`${month}/${dayNum}`);
  }
  
  return dates;
}
});