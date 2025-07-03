Page({
  data: {
    email: '',
    password: '',
    loading: false // 新增一个 loading 状态，防止重复点击
  },

  onShareAppMessage() {
    return {};
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
  
  //跳转到注册页面的函数
  goToRegister() {
    wx.navigateTo({
      // 将用户已经输入的邮箱传递到注册页面，提升用户体验
      url: `/pages/register/register?email=${this.data.email}`
    });
  },

  // 登录按钮点击事件
  login() {
    // 如果正在登录，则不执行任何操作
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
      title: '登录中...',
    });

    wx.cloud.callFunction({
      name: 'login', // 调用的云函数名
      data: {
        email: email,
        password: password
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ loading: false });

      console.log('登录云函数返回结果:', res.result);

      // 3. 根据云函数返回结果处理
      if (res.result.success) {
        // 登录成功
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 登录成功后跳转 (可以将用户信息存储到全局或缓存)
        // getApp().globalData.userInfo = res.result.data;
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/schedule_week/schedule_week'
          });
        }, 1500);

      } else {
        // 登录失败，根据错误码进行提示
        if (res.result.code === 'USER_NOT_FOUND') {
          // 用户不存在，提示并引导注册
          wx.showModal({
            title: '登录失败',
            content: '该邮箱尚未注册，是否立即注册？',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 用户点击确定，跳转到注册页
                this.goToRegister();
              }
            }
          });
        } else {
          // 其他错误，如密码错误、格式错误等
          wx.showToast({
            title: res.result.message, // 显示后端返回的错误信息
            icon: 'none'
          });
        }
      }
    }).catch(err => {
      // 异常处理
      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({
        title: '登录失败，请检查网络',
        icon: 'none'
      });
      console.error('调用登录云函数失败:', err);
    });
  }
});