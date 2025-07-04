Page({
  data: {
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  },

  // 监听密保答案输入
  onAnswerInput(e) {
    this.setData({
      securityAnswer: e.detail.value
    });
  },

  // 监听新密码输入
  NewPasswordInput(e) {
    this.setData({
      newPassword: e.detail.value
    });
  },

  // 监听确认密码输入
  ConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 确认按钮点击事件
  confirm() {
    const { securityAnswer, newPassword, confirmPassword } = this.data;

    // 验证密保答案
    if (!securityAnswer) {
      wx.showToast({
        title: '密保答案不能为空',
        icon: 'none'
      });
      return;
    }

    // 验证新密码是否输入
    if (!newPassword) {
      wx.showToast({
        title: '未输入新密码',
        icon: 'none'
      });
      return;
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      });
      return;
    }

    // 验证确认密码是否输入
    if (!confirmPassword) {
      wx.showToast({
        title: '请再输入一次新密码',
        icon: 'none'
      });
      return;
    }

    // 验证两次密码是否一致
    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

     // 所有验证通过，显示成功提示
     wx.showToast({
      title: '修改密码成功',
      icon: 'success',
      duration: 2000
    });

    // 延迟跳转，确保用户能看到提示
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/home/home'
      });
    }, 2000);
  }
});