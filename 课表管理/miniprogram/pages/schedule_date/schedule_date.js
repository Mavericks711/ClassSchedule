Page({
  data: {
    showSelect: false,
    menuTop: 0,
    menuRight: 0,
    displayDate: '',
    schoolWeekText: '',
    currentWeek: 0,
    currentDay: 0,
    selectedDate: '',
    dailyCourses: Array(11).fill(null),
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
    isPageReady: false
  },

  onLoad: function () {
    const app = getApp();
    // 确保全局数据已设置
    if (!app.globalData.currentDate) {
      app.globalData.currentDate = '2025/04/11';
      app.globalData.currentWeekText = '第8周 周五';
    }

    this.initDateAndWeek(() => {
      this.loadDailySchedule();
    });
  },

  onShow: function () {
    const app = getApp();

    // 确保全局数据已设置
    if (!app.globalData.currentDate) {
      app.globalData.currentDate = '2025/04/11';
      app.globalData.currentWeekText = '第8周 周五';
    }

    
    this.setData({
      displayDate: app.globalData.currentDate || '2025/04/11',
      schoolWeekText: app.globalData.currentWeekText || '第8周 周五'
    });
  
    this.initDateAndWeek(() => {
      this.loadDailySchedule();
    });
  },

  initDateAndWeek: function(callback) {
    const app = getApp();
    const dateStr = app.globalData.currentDate || '2025/02/17';
    const weekText = app.globalData.currentWeekText || '第1周 周一';
    
    const [year, month, day] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    const startDate = new Date('2025-02-17');
    const diffDays = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
    const week = Math.min(Math.floor(diffDays / 7) + 1, 16);
    const dayOfWeek = date.getDay();
  
    this.setData({
      displayDate: dateStr,
      schoolWeekText: weekText,
      selectedDate: dateStr,
      currentWeek: week,
      currentDay: dayOfWeek === 0 ? 7 : dayOfWeek,
      isPageReady: false
    }, () => {
      // 等数据设置完成后执行回调
      if (typeof callback === 'function') {
        callback();
      }
    });
  },

  loadDailySchedule: function() {
    const userEmail = wx.getStorageSync('userInfo')?.email;
    if (!userEmail) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getWeeklySchedule',
      data: {
        userEmail: userEmail,
        weekNumber: this.data.currentWeek
      }
    }).then(res => {
      const allCourses = res.result || [];
      const dayCourses = allCourses
        .filter(course => course.day === this.data.currentDay)
        .sort((a, b) => a.startSection - b.startSection);
      
      const dailyCourses = Array(11).fill(null);
      
      dayCourses.forEach(course => {
        const span = course.endSection - course.startSection + 1;
        
        // 只在开始节设置完整的课程信息
        dailyCourses[course.startSection - 1] = {
          ...course,
          span: span,
          isStart: true,
          backgroundColor: course.backgroundColor || '#D0021B', // 默认红色
          textColor: course.textColor || '#FFFFFF' // 默认白色文字
        };
        
        // 标记被占用的节数
        for (let i = 1; i < span; i++) {
          if (course.startSection - 1 + i < 11) {
            dailyCourses[course.startSection - 1 + i] = 'occupied';
          }
        }
      });
      
      this.setData({ 
        dailyCourses,
        isPageReady: true 
      }, () => {
        wx.hideLoading();
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('加载课程表失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onCourseClick: function(e) {
    const course = e.currentTarget.dataset.course;
    if (course && course !== 'occupied') {
      // 将课程对象转换为JSON字符串传递
      const courseStr = JSON.stringify(course);
      wx.navigateTo({
        url: `/pages/courseDetail/courseDetail?course=${encodeURIComponent(courseStr)}`
      });
    }
},


  // 显示选择框
  showSelectMenu: function(e) {
    const query = wx.createSelectorQuery();
    query.select('.image').boundingClientRect(rect => {
      if (rect) {
        this.setData({
          showSelect: true,
          menuTop: rect.top + rect.height - 10,
          menuRight: wx.getSystemInfoSync().windowWidth - rect.right - 110
        });
      }
    }).exec();
  },

  // 从excel导入
 
  handleExcelImport: function() {
    // 使用箭头函数作为回调，就不需要 `that = this` 了
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
      success: (res) => {
        console.log('上传成功, FileID:', res.fileID);
        this.callImportFunction(res.fileID); // 直接用 this
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
              // 可以在这里触发页面刷新，重新拉取课程数据
              // this.getCourseList(); 
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
  onShow() {
    const app = getApp();
    this.setData({
      displayDate: app.globalData.currentDate || '2025/04/11',
      schoolWeekText: app.globalData.currentWeekText || '第8周 周五'
    });
  }
  
  
});