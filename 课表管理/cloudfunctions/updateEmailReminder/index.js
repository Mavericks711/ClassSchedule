//updateEmailReminder

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { email, emailReminder } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 验证参数
    if (!email || emailReminder === undefined) {
      return { success: false, message: '缺少邮箱或状态参数' };
    }

    // 更新用户的邮件提醒状态
    await db.collection('users')
      .where({ 
        email: email,
        _openid: wxContext.OPENID // 确保只能修改自己的设置
      })
      .update({
        data: { emailReminder: emailReminder }
      });

    return { success: true, message: '提醒状态更新成功' };
  } catch (err) {
    console.error('更新提醒状态失败:', err);
    return { success: false, message: '服务器内部错误' };
  }
};