const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { email, popUpReminder } = event; // 真实字段名
    await db.collection('users')
      .where({ email: email })
      .update({
        data: { popUpReminder: popUpReminder }
      });
    return { success: true };
  } catch (err) {
    console.error('更新弹窗设置失败:', err);
    return { success: false };
  }
};