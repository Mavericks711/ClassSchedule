/**
 * @file changePassword/index.js
 * @description 修改用户密码。需要先验证用户的密保答案。
 * 
 * @param {string} email - 要修改密码的用户的邮箱。
 * @param {string} securityAnswer - 用户输入的密保答案。
 * @param {string} newPassword - 用户输入的新密码。
 * 
 * @returns {{success: boolean, message: string}} - 返回操作结果。
 */

const cloud = require('wx-server-sdk');
const crypto = require('crypto');

// 初始化云环境
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 获取数据库引用
const db = cloud.database();
const _ = db.command; // 获取数据库查询指令

/**
 * 对新密码进行加盐哈希，用于存储。
 * @param {string} password - 明文密码.
 * @param {string} salt - 从数据库中查询到的该用户的盐.
 * @returns {string} - 哈希后的密码.
 */
function hashPassword(password, salt) {
  // 这里的参数（迭代次数、密钥长度、算法）必须与你注册时使用的 hashPassword 函数完全一致！
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// 云函数主入口
exports.main = async (event, context) => {
  // 1. 从前端获取并解构参数
  const { email, securityAnswer, newPassword } = event;

  // 2. [后端安全校验] 对传入的参数进行严格校验
  if (!email || !securityAnswer || !newPassword) {
    return { success: false, message: '所有字段均为必填项' };
  }

  // 校验新密码的复杂度，例如长度
  if (newPassword.length < 6) {
    return { success: false, message: '新密码长度至少为6位' };
  }

  try {
    // 3. 根据 email 查询用户，这次需要获取到密保答案和盐
    const userRes = await db.collection('users').where({
      email: email
    }).field({ // 只查询必要的字段，提高效率和安全性
      securityAnswer: true,
      salt: true
    }).get();

    // 4. 检查用户是否存在
    if (userRes.data.length === 0) {
      // 理论上前端已保证用户存在，但后端必须再次校验
      return { success: false, message: '用户不存在' };
    }
    const user = userRes.data[0];

    // 5. 检查用户数据完整性（非常重要，防止因脏数据导致崩溃）
    if (!user.securityAnswer || !user.salt) {
      console.error(`[数据不完整] 用户 ${email} 缺少 securityAnswer 或 salt 字段。`);
      // 不向前端暴露具体原因，统一返回验证失败
      return { success: false, message: '验证失败，请联系客服' };
    }

    // 6. 【核心】验证密保答案是否正确
    // 假设你的 securityAnswer 是明文存储的，直接进行字符串比较。
    // 如果你的答案也是哈希存储的，这里就需要调用一个 verifySecurityAnswer 的函数。
    if (user.securityAnswer !== securityAnswer) {
      return { success: false, message: '密保答案不正确，请重试' };
    }

    // 7. 密保答案验证通过，对新密码进行哈希处理
    const newPasswordHash = hashPassword(newPassword, user.salt);

    // 8. 将新的哈希密码更新到数据库中
    const updateResult = await db.collection('users').where({
      email: email
    }).update({
      data: {
        passwordHash: newPasswordHash
      }
    });
    
    // 9. 检查更新结果并返回成功信息
    if (updateResult.stats.updated === 1) {
      return { success: true, message: '密码修改成功！' };
    } else {
      // 如果更新了0条，可能是并发操作等极端情况，也视为失败
      return { success: false, message: '密码更新失败，请重试' };
    }

  } catch (e) {
    // 10. 捕获所有未知异常
    console.error(`[严重错误] changePassword 云函数执行异常 for email: ${email}`, e);
    return { success: false, message: '服务器内部错误，请稍后重试' };
  }
};