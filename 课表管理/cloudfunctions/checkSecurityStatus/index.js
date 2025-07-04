const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  // 我们依然使用 email 作为用户标识
  const { email } = event;

  if (!email) {
    return { success: false, message: '用户凭证缺失' };
  }

  try {
    const userRes = await db.collection('users').where({
      email: email
    }).field({ // 只查询需要的字段，提高效率
      securityQuestion: true
    }).get();

    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const user = userRes.data[0];

    // 检查 securityQuestion 字段是否存在且不为空
    if (user.securityQuestion) {
      // 已设置密保
      return {
        success: true,
        hasSecurity: true,
        question: user.securityQuestion // 将问题返回给前端
      };
    } else {
      // 未设置密保
      return {
        success: true,
        hasSecurity: false
      };
    }

  } catch (e) {
    console.error("检查密保状态失败 for email:", email, e);
    return { success: false, message: '服务器错误' };
  }
};