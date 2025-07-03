Page({
  data: {
    emailReminder: true,  // 邮件提醒默认开启
    popupReminder: true,  // 弹窗提醒默认开启
    // 其他数据...
  },

  // 切换邮件提醒状态
  toggleEmailReminder(e) {
    this.setData({
      emailReminder: e.detail.value
    });
    this.saveReminderSettings('email', e.detail.value);
  },

  // 切换弹窗提醒状态
  togglePopupReminder(e) {
    this.setData({
      popupReminder: e.detail.value
    });
    this.saveReminderSettings('popup', e.detail.value);
  },

  // 保存提醒设置（示例，实际项目中调用后端API）
  saveReminderSettings(type, status) {
    console.log(`保存${type}提醒状态:`, status);
    // 实际项目中调用API保存设置
    // wx.request({
    //   url: '/api/settings/reminder/',
    //   method: 'POST',
    //   data: {
    //     type: type,
    //     status: status
    //   },
    //   success: (res) => {
    //     if (!res.data.success) {
    //       wx.showToast({
    //         title: '保存失败',
    //         icon: 'none'
    //       });
    //       // 恢复原状态
    //       this.setData({
    //         [type + 'Reminder']: !status
    //       });
    //     }
    //   }
    // });
  }
});