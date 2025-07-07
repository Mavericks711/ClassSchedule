const app = getApp();

Page({
  data: {
    courseInfo: null
  },

  onLoad: function(options) {
    // 从跳转参数获取课程ID
    const courseId = options.id;
    this.loadCourseDetail(courseId);
  },

  loadCourseDetail: function(courseId) {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getCourseDetail',
      data: {
        courseId: courseId
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({
        courseInfo: res.result
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('加载课程详情失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  navigateToEdit: function() {
    const courseId = this.data.courseInfo._id;
    wx.navigateTo({
      url: `/pages/edit/edit?id=${courseId}`
    });
  },

  // 格式化周数显示
  formatWeeks: function(weeks) {
    if (!weeks || weeks.length === 0) return '无';
    // 这里可以添加更复杂的格式化逻辑
    return '第' + weeks.join(',') + '周';
  }
});