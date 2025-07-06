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
  }
});