const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

/**
 * 验证密码 
 * @param {string} password 用户输入的密码
 * @param {string} salt 数据库中存储的盐
 * @param {string} storedHash 数据库中存储的哈希值
 * @returns {boolean} 是否匹配
 */
function verifyPassword(password, salt, storedHash) {
  // 如果 salt 或 storedHash 不存在，直接返回 false，防止程序崩溃
  if (!salt || !storedHash) {
    return false;
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

exports.main = async (event, context) => {
  const { email, password } = event;

  // 1. 基本验证
  if (!email || !password) {
    return { success: false, message: '邮箱或密码不能为空' };
  }

  try {
    // 2. 根据邮箱查询用户，这是关键的第一步
    const userRes = await db.collection('users').where({
      email: email
    }).get();

    // 关键检查：如果查询结果数组的长度为 0，说明用户不存在。
    // 必须在这里立刻返回，并告知前端用户未找到。
    if (userRes.data.length === 0) {
      return {
        success: false,
        code: 'USER_NOT_FOUND', // 这个 code 会被前端用来判断是否跳转注册页
        message: '该邮箱未注册'
      };
    }

    // 只有在找到用户后，才继续执行下面的代码
    const user = userRes.data[0];

    // 3. 验证密码
    const isPasswordValid = verifyPassword(password, user.salt, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: '邮箱或密码错误'
      };
    }

    // 4. 登录成功
    // 注意：不要将 salt 和 passwordHash 返回给前端
    return {
      success: true,
      message: '登录成功',
      data: {
        userId: user._id,
        email: user.email,
        openid: user._openid,
        username: user.username || '对对队' // 返回用户名，如果老用户没有，则给一个默认值
      }
    };

  
    
  } catch (e) {
    console.error("登录函数异常:", e); // 在日志中打印详细错误
    return {
      success: false,
      message: '服务器内部错误',
      error: e
    };
  }
};