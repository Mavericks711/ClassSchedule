const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 对密码进行加盐哈希
 * @param {string} password 
 * @returns {{salt: string, hash: string}}
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

exports.main = async (event, context) => {
  const { email, password } = event;
  const wxContext = cloud.getWXContext();

  // 1. 格式验证
  const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailReg.test(email)) {
    return { success: false, message: '邮箱格式不正确' };
  }
  if (!password || password.length < 6) {
    return { success: false, message: '密码长度至少为6位' };
  }

  try {
    // 2. 检查邮箱是否已存在
    const countResult = await db.collection('users').where({
      email: email
    }).count();

    if (countResult.total > 0) {
      return {
        success: false,
        code: 'EMAIL_EXISTS',
        message: '该邮箱已被注册'
      };
    }

    // 3. 对密码进行哈希处理
    const { salt, hash } = hashPassword(password);

    // 4. 创建新用户
    await db.collection('users').add({
      data: {
        _openid: wxContext.OPENID,
        email: email,
        passwordHash: hash, // 存储哈希值
        salt: salt,         // 存储盐
       

        createTime: new Date()
      }
    });

    return {
      success: true,
      message: '注册成功'
    };

  } catch (e) {
    return {
      success: false,
      message: '服务器内部错误',
      error: e
    };
  }
};