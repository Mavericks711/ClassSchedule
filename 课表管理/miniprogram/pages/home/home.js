// pages/home/home.js
Page({
  data: {
    // --- 用户信息 ---
    username: '游客',
    email: '未登录',
    // --- 提醒设置 ---
    emailReminder: true,
    popUpReminder: true, // 修正为与数据库一致的字段名（首字母大写P和U）
  },

  /**
   * 页面每次显示时都会执行的生命周期函数
   * 非常适合用于刷新页面数据
   */
  onShow: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.email) {
      this.setData({
        username: userInfo.username || '对对队',
        email: userInfo.email
      });
      
      // 关键修改：合并获取用户设置和检查弹窗提醒的逻辑
      this.getUserSettingsAndCheckPopup(userInfo.email);
    } else {
      this.setData({
        username: '游客',
        email: '请先登录'
      });
    }
  },

  /**
   * 修改用户名的函数，由 wxml 中的 bindtap="editUsername" 触发
   */
  editUsername: function() {
    // 检查是否已登录
    if (!wx.getStorageSync('userInfo')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '修改用户名',
      editable: true,
      placeholderText: '请输入新的用户名',
      content: this.data.username, // 将当前用户名作为默认值填入
      success: (res) => {
        if (res.confirm && res.content) {
          const newUsername = res.content.trim();
          if (newUsername.length === 0) {
            wx.showToast({ title: '用户名不能为空', icon: 'none' });
            return;
          }
          if (newUsername === this.data.username) return; // 用户名没有变化，不执行操作  
          this.updateUsernameInCloud(newUsername);
        }
      }
    });
  },
  
  /**
   * 调用云函数更新用户名的辅助函数
   */
  updateUsernameInCloud: function(newUsername) {
    wx.showLoading({ title: '更新中...' });
    wx.cloud.callFunction({
      name: 'updateUserName', // 确保你已创建并部署了这个云函数
      data: { newUsername: newUsername }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({ title: '更新成功', icon: 'success' });
        // 同步更新界面和本地缓存
        this.setData({ username: newUsername });
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
          userInfo.username = newUsername;
          wx.setStorageSync('userInfo', userInfo);
        }
      } else {
        wx.showToast({ title: res.result.message || '更新失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '请求失败', icon: 'none' });
    });
  },

  // 切换邮件提醒状态
  toggleEmailReminder(e) {
    const newStatus = e.detail.value;
    this.setData({ emailReminder: newStatus });
    
    // 获取用户邮箱
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.email) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      // 恢复开关状态
      this.setData({ emailReminder: !newStatus });
      return;
    }
    
    wx.showLoading({ title: '保存设置...' });
    
    // 调用云函数更新设置
    wx.cloud.callFunction({
      name: 'updateEmailReminder',
      data: {
        email: userInfo.email,
        emailReminder: newStatus
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({ title: '设置已保存', icon: 'success' });
      } else {
        wx.showToast({ title: res.result.message || '保存失败', icon: 'none' });
        // 保存失败时恢复开关状态
        this.setData({ emailReminder: !newStatus });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      // 发生错误时恢复开关状态
      this.setData({ emailReminder: !newStatus });
    });
  },

  // 切换弹窗提醒状态（保存到users表的popUpReminder字段）
  togglePopupReminder(e) {
    const newStatus = e.detail.value;
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.email) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ popUpReminder: !newStatus }); // 恢复状态
      return;
    }

    wx.showLoading({ title: '保存设置...' });
    wx.cloud.callFunction({
      name: 'updatePopupReminder', // 需创建此云函数
      data: {
        email: userInfo.email,
        popUpReminder: newStatus // 真实字段名
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        this.setData({ popUpReminder: newStatus });
        wx.showToast({ title: '设置已保存', icon: 'success' });
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
        this.setData({ popUpReminder: !newStatus });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
      this.setData({ popUpReminder: !newStatus });
    });
  },

  // 合并获取用户设置和检查弹窗提醒的逻辑
 // 在 home.js 的 getUserSettingsAndCheckPopup 方法中
 getUserSettingsAndCheckPopup: function(email) {
  wx.cloud.callFunction({
    name: 'getUserPopupStatus',
    data: { email: email }
  }).then(res => {
    if (res.result && res.result.success && res.result.data) {
      const { popUpReminder, emailReminder, hasUnreadPopup, pendingPopupCourse } = res.result.data;
      
      // 更新本地开关状态
      this.setData({
        popUpReminder: popUpReminder,
        emailReminder: emailReminder
      });

      // 关键：添加空值检查
      if (hasUnreadPopup && popUpReminder && pendingPopupCourse && pendingPopupCourse.courseName) {
        wx.showModal({
          title: '课程即将开始',
          content: `《${pendingPopupCourse.courseName}》将在30分钟内开始\n地点：${pendingPopupCourse.location || '未设置'}`,
          confirmText: '知道了',
          showCancel: false,
          success: () => {
            // 清除未读标记
            wx.cloud.callFunction({
              name: 'clearPopupUnread',
              data: { email: email }
            });
          }
        });
      }
    } else {
      console.error('获取用户状态失败:', res.result);
    }
  }).catch(err => {
    console.error('获取用户设置失败:', err);
  });
},

  // 退出登录
  logout: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
  
          // 1. 清除本地缓存
          wx.removeStorageSync('userInfo');
  
          // 2. 清空 globalData（确保不会保留之前设置的日期）
          app.globalData.currentDate = null;
          app.globalData.currentWeekText = null;
          app.globalData.openid = null;
  
          // 3. 强制跳转回登录前首页或启动页
          wx.reLaunch({ url: '/pages/home_pre/home_pre' });
        }
      }
    });
  }
});