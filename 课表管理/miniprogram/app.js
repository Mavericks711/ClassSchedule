// app.js
App({
  globalData: {
    currentDate: '2025/04/11',
    currentWeekText: '第8周 周五'
  },
  onLaunch: function () {
    wx.cloud.init({
      env: 'cloud1-9g6zgl8h39903d5d', // 在云开发控制台设置里查看
      traceUser: true,
    });

    this.login();
  },

  //登录方法
  login: function() {
    wx.cloud.callFunction({
      name: 'login',
    }).then(res => {
      console.log('登录成功', res.result);
      if (res.result.success) {
        // 将 openid 存入全局变量，方便其他页面使用
        this.globalData.openid = res.result.data.openid;
      }
    }).catch(err => {
      console.error('登录失败', err);
    });
  },

  globalData: {
    openid: null
  }

});
