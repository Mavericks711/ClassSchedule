App({
  globalData: {
    currentDate: null,  // 初始为null，通过login()重置
    currentWeekText: null,
    openid: null
  },

  onLaunch: function () {
    wx.cloud.init({ env: 'cloud1-9g6zgl8h39903d5d', traceUser: true });
  
    // 默认值写入（确保即使 login 没回来，也有值）
    this.globalData.currentDate = '2025/04/11';
    this.globalData.currentWeekText = '第8周 周五';
  
    this.login(); // 只设置 openid
  },
  

  login: function () {
    wx.cloud.callFunction({
      name: 'login',
    }).then(res => {
      this.globalData.openid = res.result.data?.openid || null;
    }).catch(err => {
      this.globalData.openid = null;
      console.error('登录失败', err);
    });
  }
  
  
})