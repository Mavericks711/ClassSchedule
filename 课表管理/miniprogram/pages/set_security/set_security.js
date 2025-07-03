Page({
  data: {
    securityQuestion: '',
    securityAnswer: '',
    showPassword: false
  },

  // 监听密保问题输入
  onQuestionInput(e) {
    this.setData({
      securityQuestion: e.detail.value
    });
  },

  // 监听密保答案输入
  onAnswerInput(e) {
    this.setData({
      securityAnswer: e.detail.value
    });
  },

  // 确认按钮点击事件
  confirm() {
    const { securityQuestion, securityAnswer } = this.data;

    // 验证是否为空
    if (!securityQuestion && !securityAnswer) {
      wx.showToast({
        title: '未设置密保',
        icon: 'none'
      });
      return;
    }

    // 验证密保问题是否为中文
    if (!/^[\u4e00-\u9fa5]+$/.test(securityQuestion)) {
      wx.showToast({
        title: '密保问题须是中文',
        icon: 'none'
      });
      return;
    }

    // 验证密保答案是否为数字
    if (!/^\d+$/.test(securityAnswer)) {
      wx.showToast({
        title: '密保答案须是数字',
        icon: 'none'
      });
      return;
    }

    // 验证通过，跳转到home页面（tabbar页面）
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  // 切换密码可见性（根据需要添加）
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  }
});