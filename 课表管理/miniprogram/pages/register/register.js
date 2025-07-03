Page({
  data: {},
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
 // 注册按钮点击事件
 register() {
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
  
  // 密码长度验证（示例：至少6位）
  if (password.length < 6) {
    wx.showToast({
      title: '密码长度至少6位',
      icon: 'none'
    });
    return;
  }
  
  // 调用后端注册API（实际项目中替换为真实接口）
  wx.showToast({
    title: '注册成功',
    icon: 'success'
  });
  
  // 注册成功后跳转
  setTimeout(() => {
    wx.navigateBack({
      url: '/pages/login/login'
    });
  }, 1500);
}
});