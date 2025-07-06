Page({
  data: {
    showSelect: false,    // 控制选择框显示状态
    menuTop: 0,           // 选择框顶部位置
    menuRight: 0          // 选择框右侧位置
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
  onShow() {
    const app = getApp()
    this.setData({
      displayDate: app.globalData.currentDate,
      schoolWeekText: app.globalData.currentWeekText
    })
  }
});