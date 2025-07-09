const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { email } = event;
    await db.collection('users')
      .where({ email: email })
      .update({
        data: {
          hasUnreadPopup: false,
          pendingPopupCourse: null
        }
      });
    return { success: true };
  } catch (err) {
    return { success: false, message: '更新失败' };
  }
};