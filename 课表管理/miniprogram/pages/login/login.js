// pages/login/login.js

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 可以在这里做一些页面加载时的初始化工作
  },

  /**
   * onLoginSubmit 函数：处理表单提交事件
   */
  onLoginSubmit: function(e) {
    // 1. 防止重复提交
    if (this.data.isLoading) {
      return;
    }

    // 2. 从事件对象中获取表单数据
    const formData = e.detail.value;
    const email = formData.email ? formData.email.trim() : '';
    const password = formData.password ? formData.password.trim() : '';

    // 3. 前端数据校验
    if (!email || !password) {
      wx.showToast({ title: '邮箱和密码不能为空', icon: 'none' });
      return;
    }

    // 4. 进入加载状态，调用云函数
    this.setData({ isLoading: true });
    wx.showLoading({ title: '登录中...' });

    wx.cloud.callFunction({
      name: 'login', // 你的登录云函数名
      data: {
        email: email,
        password: password
      }
    }).then(res => {
      // 无论成功失败，都先结束加载状态
      this.setData({ isLoading: false });
      wx.hideLoading();

      console.log("【云函数返回】:", res.result);

      // --- 开始处理云函数返回结果 ---

      if (res.result && res.result.success) {
        
        // 分支一：登录成功
        
        // 1. 存储用户信息
        getApp().globalData.userInfo = res.result.data;
        wx.setStorageSync('userInfo', res.result.data);
      
        // 2. 显示成功提示
        wx.showToast({ 
          title: '登录成功', 
          icon: 'success',
          duration: 1500 
        });
      
        // 3. 延迟后跳转
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/schedule_week/schedule_week'
          });
        }, 1500);

      } else {
        
        // 分支二：登录失败 (res.result.success 为 false)

        // 进一步判断失败的原因
        if (res.result && res.result.code === 'USER_NOT_FOUND') {
          
          // 子分支 2.1：用户不存在
          wx.showModal({
            title: '提示',
            content: '该邮箱尚未注册，是否立即注册？',
            confirmText: '去注册',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 用户点击“去注册”，带上 email 跳转到注册页
                wx.navigateTo({
                  url: `/pages/register/register?email=${email}`
                });
              }
              // 如果用户点击取消，则什么都不做，停留在登录页
            }
          });

        } else {
          
          // 子分支 2.2：其他失败原因（如密码错误、服务器错误等）
          // 直接显示后端返回的 message
          wx.showToast({
            title: res.result.message || '登录失败，请检查账号密码',
            icon: 'none',
            duration: 2000
          });
        }
      }

    }).catch(err => {
      // 分支三：网络或调用异常
      this.setData({ isLoading: false });
      wx.hideLoading();
      console.error("调用 login 云函数失败:", err);
      wx.showToast({ title: '网络请求失败，请稍后重试', icon: 'none' });
    });
  }

}); // Page({...}) 在这里结束