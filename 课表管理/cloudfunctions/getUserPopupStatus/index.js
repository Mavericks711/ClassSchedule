const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { email } = event;
    const user = await db.collection('users')
      .where({ email: email })
      .field({
        popUpReminder: true,
        hasUnreadPopup: true,
        pendingPopupCourse: true
      })
      .get();
    return {
      success: true,
      data: user.data[0] || { popUpReminder: true, hasUnreadPopup: false }
    };
  } catch (err) {
    return { success: false, message: '查询失败' };
  }
};