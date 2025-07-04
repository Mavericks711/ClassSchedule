// pages/set-security-question/set-security-question.js
Page({
  data: {
    // 【修改】不再需要userId，改为存储email
    email: null,        
    question: '',
    answer: '',
    isLoading: false,
  },

  /**
   * 页面加载时，获取并检查用户登录状态
   */
  onLoad: function (options) {
    // 尝试从全局数据或本地缓存中获取用户信息
    // 【重要】确保你的登录逻辑成功后，会把 { userId: '...', email: '...' } 存起来
    const userInfo = getApp().globalData.userInfo || wx.getStorageSync('userInfo');
    
    // 检查是否存在用户的 email
    if (userInfo && userInfo.email) {
      this.setData({
        email: userInfo.email
      });
    } else {
      // 如果没有email，说明用户未登录
      wx.showModal({
        title: '提示',
        content: '您尚未登录，请先登录后再设置密保。',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    }
  },

  onQuestionInput: function (e) {
    this.setData({ question: e.detail.value });
  },

  onAnswerInput: function (e) {
    this.setData({ answer: e.detail.value });
  },

  /**
   * 点击提交按钮的处理函数
   */
  onSubmit: function () {
    if (this.data.isLoading) return;

 // --- 开始诊断 ---
 console.log("--- 进入【设置密保页】onLoad ---");

 const globalUserInfo = getApp().globalData.userInfo;
 const storageUserInfo = wx.getStorageSync('userInfo');

 console.log("【诊断日志1】: getApp().globalData.userInfo 的值是:", globalUserInfo);
 console.log("【诊断日志2】: wx.getStorageSync('userInfo') 的值是:", storageUserInfo);
 // --- 诊断结束 ---

    // 前端数据校验（保持不变，但可以加上你自己的正则）
    const question = this.data.question.trim();
    const answer = this.data.answer.trim();
    const chineseRegex = /^[\u4e00-\u9fa5\uFF1F\uFF0C\u3002？，。]+$/;
    if (!question || !chineseRegex.test(question)) {
      wx.showToast({ title: '密保问题必须为中文及标点', icon: 'none' });
      return;
    }
    const numberRegex = /^\d+$/;
    if (!answer || !numberRegex.test(answer)) {
      wx.showToast({ title: '密保答案必须为纯数字', icon: 'none' });
      return;
    }
    
    this.setData({ isLoading: true });
    wx.showLoading({ title: '正在提交...' });

    // --- 调用云函数 ---
    wx.cloud.callFunction({
      name: 'setSecurityQuestion',
      data: {
        // 【核心修改】将 email 作为参数传递
        email: this.data.email, 
        question: question,
        answer: answer,
      }
    }).then(res => {
      wx.hideLoading();
      this.setData({ isLoading: false });

      if (res.result && res.result.success) {
        wx.showToast({ title: '设置成功！', icon: 'success', duration: 1500 });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      } else {
        wx.showToast({ title: res.result.message || '设置失败', icon: 'none', duration: 2000 });
      }
    }).catch(err => {
      wx.hideLoading();
      this.setData({ isLoading: false });
      wx.showToast({ title: '网络请求失败，请检查网络', icon: 'none', duration: 2000 });
    });
  }
});