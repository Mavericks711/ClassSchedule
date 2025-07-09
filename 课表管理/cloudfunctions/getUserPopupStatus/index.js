const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { email } = event;
    
    // 安全查询用户设置
    const userRes = await db.collection('users')
      .where({ email })
      .field({
        popUpReminder: true,
        emailReminder: true, // 添加邮件提醒字段
        hasUnreadPopup: true,
        pendingPopupCourse: true
      })
      .get();
    
    // 处理用户不存在的情况
    if (!userRes.data || userRes.data.length === 0) {
      return { 
        success: true,
        data: {
          popUpReminder: true,
          emailReminder: true,
          hasUnreadPopup: false,
          pendingPopupCourse: null
        }
      };
    }
    
    const user = userRes.data[0];
    
    // 返回标准化数据
    return {
      success: true,
      data: {
        popUpReminder: user.popUpReminder !== undefined ? user.popUpReminder : true,
        emailReminder: user.emailReminder !== undefined ? user.emailReminder : true,
        hasUnreadPopup: user.hasUnreadPopup || false,
        pendingPopupCourse: user.pendingPopupCourse || null
      }
    };
  } catch (err) {
    console.error('getUserPopupStatus 失败:', err);
    return { 
      success: false, 
      message: '查询失败',
      error: err.message 
    };
  }
};