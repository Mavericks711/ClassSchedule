const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { newUsername } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 校验用户名
  if (!newUsername || newUsername.trim().length === 0) {
    return { success: false, message: '用户名不能为空' };
  }
  if (newUsername.length > 10) {
    return { success: false, message: '用户名不能超过10个字符' };
  }

  try {
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        username: newUsername
      }
    });
    return { success: true, message: '用户名更新成功' };
  } catch (e) {
    console.error("更新用户名失败:", e);
    return { success: false, message: '更新失败，请稍后再试' };
  }
};