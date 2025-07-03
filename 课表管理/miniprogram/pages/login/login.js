Page({
  data: {
    email: '',
    password: ''
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
  
  // 登录按钮点击事件
  login() {
    const { email, password } = this.data;
    
    // 简单验证
    if (!email || !password) {
      wx.showToast({
        title: '请填写邮箱和密码',
        icon: 'none'
      });
      return;
    }
    
    // 邮箱格式验证
    const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailReg.test(email)) {
      wx.showToast({
        title: '请输入正确的邮箱格式',
        icon: 'none'
      });
      return;
    }
    
    // 密码长度验证
    if (password.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      });
      return;
    }
    
    // 模拟登录成功
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
    
    // 登录成功后跳转
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/schedule_week/schedule_week'
      });
    }, 1500);
  }
});