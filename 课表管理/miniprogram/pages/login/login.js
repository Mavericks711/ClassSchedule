// pages/login/login.js

// 使用 Page() 来注册一个页面
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    // 只有控制按钮加载状态的 isLoading 是我们需要的数据
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 可以在这里做一些页面加载时的初始化工作
  },

  /**
   * onLoginSubmit 函数：处理表单提交事件。
   * 这个函数必须是 Page({}) 对象的第一层属性，和 data, onLoad 平级。
   * @param {object} e - 事件对象，包含了所有表单数据。
   */
  onLoginSubmit: function(e) {
    // 1. 防止重复提交
    if (this.data.isLoading) {
      return;
    }

    // 2. 从事件对象 e.detail.value 中直接获取所有表单数据
    const formData = e.detail.value;
    const email = formData.email ? formData.email.trim() : '';
    const password = formData.password ? formData.password.trim() : '';

    console.log("【Form Submit】获取到的表单数据:", { email, password });

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
      // 无论成功失败，都结束加载状态
      this.setData({ isLoading: false });
      wx.hideLoading();

      console.log("【云函数返回】:", res.result);

      if (res.result && res.result.success) {
        // --- 登录成功 ---
      
        // 1. 将用户信息存入全局和本地缓存 (这些操作很快，先做完)
        getApp().globalData.userInfo = res.result.data;
        wx.setStorageSync('userInfo', res.result.data);
      
        // 2. 显示一个持续时间稍长（比如1.5秒）的成功提示
        // wx.showToast 默认的 duration 是 1500ms
        wx.showToast({ 
          title: '登录成功', 
          icon: 'success',
          duration: 1500 
        });
      
        // 3. 【核心修改】使用 setTimeout 设置一个定时器
        // 在 1500 毫秒（也就是提示框自动消失的时候）后，再执行页面跳转
        setTimeout(function () {
          wx.switchTab({
            url: '/pages/schedule_week/schedule_week'
          });
        }, 1500); // 这里的延迟时间最好和 toast 的 duration 保持一致
      } else {
        // --- 登录失败 ---
        wx.showToast({
          title: res.result.message || '登录失败，请检查账号密码',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      // --- 网络或调用异常 ---
      this.setData({ isLoading: false });
      wx.hideLoading();
      console.error("调用 login 云函数失败:", err);
      wx.showToast({ title: '网络请求失败，请稍后重试', icon: 'none' });
    });
  },

  /**
   * 其他的生命周期函数或自定义函数可以写在下面
   */
  // onShow: function() { ... },
  // onReady: function() { ... },

}) // Page({...}) 的括号在这里结束