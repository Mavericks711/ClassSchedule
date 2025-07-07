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
    displayDate: '请选择日期',
    schoolWeekText: '请选择周数',
    daysInMonth: [],

    showWeekPicker: false,
    weekIndex: 7, // 默认第8周
    dayIndex: 4,  // 默认周五

    currentWeekDates: ['04/7', '04/8', '04/9', '04/10', '04/11', '04/12', '04/13'], // 初始值

    // --- 新增的数据渲染和状态控制字段 ---
    gridData: [],       // 核心：用于渲染课程表的二维数组
    isLoading: true,    // 控制加载动画的显示
    currentWeek: 8 ,     // 核心：当前周数，用于向云函数请求数据

    sectionTimes: [
      { start: '08:00', end: '08:45' },
      { start: '08:55', end: '09:40' },
      { start: '10:10', end: '10:55' },
      { start: '11:05', end: '11:50' },
      { start: '14:30', end: '15:15' },
      { start: '15:25', end: '16:10' },
      { start: '16:40', end: '17:25' },
      { start: '17:35', end: '18:20' },
      { start: '19:10', end: '19:55' },
      { start: '20:05', end: '20:50' },
      { start: '21:00', end: '21:45' },
    ],
  },
    // 在周课表页面的js文件中添加onLoad方法
  onLoad: function(options) {
    // 从全局数据获取默认值
    const app = getApp();
    
    // 设置默认值
    this.setData({
      displayDate: app.globalData.currentDate || '2025/04/11',
      schoolWeekText: app.globalData.currentWeekText || '第8周 周五',
      currentWeek: 8, // 默认第8周
      currentWeekDates: this.calculateWeekDates(new Date('2025-04-11')) // 计算第8周的日期范围
    });

    // 加载第8周的课程数据
    this.loadScheduleData(8);
  },
// =================================================================
// ======================  1. 新增的核心功能  =======================
// =================================================================
/**
 * 核心函数：从云端加载指定周的课程数据
 * @param {number} week - 要加载的周数
 */
loadScheduleData: function (week) {
  this.setData({ isLoading: true });
  wx.showLoading({ title: '加载课程中...' });

  wx.cloud.callFunction({
    name: 'getSchedule', // 确保你已创建并部署了这个云函数
    data: {
      weekNumber: Number(week)
    }
  }).then(res => {
    wx.hideLoading();
     // ***** 关键调试点 1 *****
      // 在这里打印一下云函数返回的完整结果
      console.log('云函数返回结果:', res); 
      console.log('实际课程数据:', res.result); 

      // 检查 res.result 是否是你期望的数组
       // ***** 关键调试点 2 *****
        // 确认这里执行了 setData
    console.log('准备 setData，数据长度:', res.result.length); 
    const scheduleList = res.result;
    const gridData = this.processDataForGrid(scheduleList);
    this.setData({
      gridData: gridData,
      isLoading: false
    });
  }).catch(err => {
    wx.hideLoading();
    console.error('加载课程表失败', err);
    wx.showToast({ title: '加载失败', icon: 'none' });
    this.setData({ isLoading: false });
  });
},

/**
 * 核心函数：将课程列表处理成适合WXML渲染的二维网格
 * @param {Array} list - 从云函数返回的课程对象数组
 */
processDataForGrid: function (list) {
  // 初始化一个 11节课 x 7天 的空二维数组
  
  const grid = Array.from({ length: 11 }, () => Array(7).fill(null));

  // 健壮性检查，防止list为null或undefined时报错
  if (list && list.length > 0) {
  
      list.forEach(course => {
          const dayIndex = course.day - 1;
          const startIndex = course.startSection - 1;
          const span = course.endSection - course.startSection + 1;

          if (dayIndex >= 0 && dayIndex < 7 && startIndex >= 0 && startIndex < 11) {
              // 将课程对象和计算出的span放入网格
              grid[startIndex][dayIndex] = { ...course, span: span };
              // 标记被占用的格子
              for (let i = 1; i < span; i++) {
                  if (startIndex + i < 11) {
                      grid[startIndex + i][dayIndex] = 'occupied';
                  }
              }
          }
      });
  }
  console.log('处理后的网格数据 (gridData):', grid);
  return grid;
},

/**
 * 点击课程卡片跳转到详情页
 */
onCourseClick: function (e) {
  const course = e.currentTarget.dataset.course;
  // 使用 schedule_id 跳转，这是最稳妥的方式
  wx.navigateTo({
    url: `/pages/courseDetail/courseDetail?id=${course.schedule_id}`
  });
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
  handleExcelImport: function() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xls', 'xlsx'],
    // ⭐ 关键点：将 `success: function(res) {}` 改为 `success: (res) => {}`
      success: (res) => { 
        const tempFilePath = res.tempFiles[0].path;
        console.log('选择成功, 文件临时路径:', tempFilePath);
        
        wx.showLoading({
          title: '正在导入...',
        });
        this.uploadExcelToCloud(tempFilePath); // ✅ `this` 此时正确指向 Page 实例
      },
      fail: (err) => { // fail 也建议使用箭头函数
        console.error('选择文件失败', err);
        wx.showToast({
          title: '取消选择',
          icon: 'none'
        });
      }
    });
  },

  uploadExcelToCloud: function(filePath) {
    const cloudPath = `excel-imports/${Date.now()}-${Math.floor(Math.random() * 1000)}.xlsx`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      // ⭐ 这里也可以使用箭头函数
      success: (res) => {
        console.log('上传成功, FileID:', res.fileID);
        this.callImportFunction(res.fileID); // ✅ 直接用 this
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '上传失败', icon: 'error' });
        console.error('上传失败', err);
      }
    });
  },

  callImportFunction: function(fileID) {
    wx.cloud.callFunction({
      name: 'importFromExcel', // 你将要创建的云函数名称
      data: {
        fileID: fileID
      },
      success: res => {
        wx.hideLoading();
        console.log('云函数调用成功', res);
        if (res.result && res.result.success) {
          wx.showModal({
            title: '导入成功',
            content: `成功导入 ${res.result.courseCount} 门课程, 共 ${res.result.scheduleCount} 个安排。`,
            showCancel: false,
            success() {
              this.loadScheduleData(this.data.currentWeek);
            }
          });
        } else {
          // 处理云函数返回的错误
          wx.showToast({
            title: res.result.message || '导入失败',
            icon: 'none',
            duration: 3000
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '服务调用失败',
          icon: 'error',
        });
        console.error('云函数调用失败', err);
      }
    });
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
      selectedDay: selectedDay,
     // ⭐ 衔接点：更新 data 中的 currentWeek
      currentWeek: week 
    });

    this.loadScheduleData(week);
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
      showWeekPicker: false,
      currentWeek: week 
    });
    this.loadScheduleData(week);
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