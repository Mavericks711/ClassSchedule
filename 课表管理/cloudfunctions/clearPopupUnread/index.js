const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { email } = event;
    
    // 安全更新 - 不清空课程信息，只清除未读标记
    await db.collection('users')
      .where({ email })
      .update({
        data: {
          hasUnreadPopup: false
        }
      });
      
    return { success: true };
  } catch (err) {
    console.error('clearPopupUnread 失败:', err);
    return { 
      success: false, 
      message: '更新失败',
      error: err.message 
    };
  }
};