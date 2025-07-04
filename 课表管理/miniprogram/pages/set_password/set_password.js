// pages/change-password/change-password.js (最终版)
Page({
  data: {
    email: '加载中...',
    securityQuestion: '加载中...',
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadInitialData();
  },

  /**
   * 封装一个加载初始数据的方法
   */
  loadInitialData: function() {
    // 1. 获取当前用户的登录信息
    const userInfo = getApp().globalData.userInfo || wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.email) {
      wx.showModal({
        title: '错误',
        content: '无法获取登录状态，请重新登录。',
        showCancel: false,
        success: () => wx.reLaunch({ url: '/pages/login/login' })
      });
      return;
    }
    
    // 先把 email 显示出来
    this.setData({ email: userInfo.email });
    
    wx.showLoading({ title: '获取密保...' });

    // 2. 调用云函数，获取该 email 对应的密保问题
    wx.cloud.callFunction({
      name: 'checkSecurityStatus',
      data: { email: userInfo.email }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success && res.result.hasSecurity) {
        // 获取成功，更新页面显示
        this.setData({
          securityQuestion: res.result.question
        });
      } else {
        // 如果没有设置密保，或者获取失败，则提示并返回
        wx.showModal({
          title: '操作无法继续',
          content: res.result.message || '您尚未设置密保，无法修改密码。',
          showCancel: false,
          success: () => wx.navigateBack()
        });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      this.setData({ securityQuestion: '获取失败，请返回重试' });
    });
  },

  /**
   * 表单提交事件处理函数
   */
  onSubmit: function(e) {
    if (this.data.isLoading) return;

    const formData = e.detail.value;
    const { securityAnswer, newPassword, confirmPassword } = formData;

    // 前端校验
    if (!securityAnswer || !newPassword || !confirmPassword) {
      wx.showToast({ title: '所有输入框均不能为空', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });
    wx.showLoading({ title: '正在提交...' });
    
    // 调用云函数 'changePassword'
    wx.cloud.callFunction({
      name: 'changePassword',
      data: {
        email: this.data.email, // 使用从 data 中获取的 email
        securityAnswer: securityAnswer,
        newPassword: newPassword
      }
    }).then(res => {
      this.setData({ isLoading: false });
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showModal({
          title: '成功',
          content: '密码修改成功，请使用新密码重新登录。',
          showCancel: false,
          success: () => {
            wx.removeStorageSync('userInfo');
            getApp().globalData.userInfo = null;
            wx.reLaunch({ url: '/pages/login/login' });
          }
        });
      } else {
        wx.showToast({ title: res.result.message || '修改失败', icon: 'none' });
      }
    }).catch(err => {
      this.setData({ isLoading: false });
      wx.hideLoading();
      wx.showToast({ title: '网络请求失败', icon: 'none' });
    });
  }
});