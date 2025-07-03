// pages/register/register.js

Page({
  data: {
    email: '',
    password: '',
    loading: false // 用于控制按钮的加载状态和防止重复点击
  },

  onShareAppMessage() {
    return {};
  },

  /**
   * 页面加载时的生命周期函数
   * @param {object} options 页面启动参数，从登录页跳转时会携带 email
   */
  onLoad(options) {
    // 检查 options 对象和 options.email 是否存在
    if (options && options.email) {
      // 如果登录页传递了邮箱，自动填充到输入框
      this.setData({
        email: options.email
      });
    }
  },

  // 邮箱输入事件
  handleEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },

  // 密码输入事件
  handlePasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 注册按钮点击事件
  register() {
    // 如果正在注册，则不执行任何操作
    if (this.data.loading) {
      return;
    }

    const { email, password } = this.data;

    // 1. 前端基本验证
    if (!email || !password) {
      wx.showToast({
        title: '请填写邮箱和密码',
        icon: 'none'
      });
      return;
    }

    const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailReg.test(email)) {
      wx.showToast({
        title: '请输入正确的邮箱格式',
        icon: 'none'
      });
      return;
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      });
      return;
    }

    // 2. 显示 loading 状态，并调用云函数
    this.setData({ loading: true });
    wx.showLoading({
      title: '注册中...',
    });

    wx.cloud.callFunction({
      name: 'register', // 调用的云函数名
      data: {
        email: email,
        password: password
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ loading: false });
      
      console.log('注册云函数返回结果:', res.result);

      // 3. 根据云函数返回结果处理
      if (res.result.success) {
        // 注册成功
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 注册成功后，直接跳转到目标页面
        // 使用 wx.redirectTo 可以关闭当前注册页，用户无法返回
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/schedule_date/schedule_date'
          });
        }, 1500); // 延迟 1.5 秒，让用户能看到成功提示

      } else {
        // 注册失败，显示后端返回的错误信息（如：邮箱已被注册）
        wx.showToast({
          title: res.result.message,
          icon: 'none',
          duration: 2000 // 显示时间长一点
        });
      }
    }).catch(err => {
      // 异常处理
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: '注册失败，请检查网络',
        icon: 'none'
      });
      console.error('调用注册云函数失败:', err);
    });
  }
});