/**
 * @file setSecurityQuestion/index.js
 * @description 根据前端传递的 email，设置或更新用户的密保问题和答案。
 * 
 * @param {string} email - 用户的唯一业务标识（邮箱），由前端在用户登录后获取并传递。
 * @param {string} question - 用户设置的密保问题。
 * @param {string} answer - 用户设置的密保答案。
 * 
 * @returns {{success: boolean, message: string}} - 返回操作结果。
 */

const cloud = require('wx-server-sdk');

// 初始化云环境
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 获取数据库引用
const db = cloud.database();

// 云函数主入口
exports.main = async (event, context) => {
  // 1. 从前端获取并解构参数
  const { email, question, answer } = event;

  // 2. [后端安全校验] 对传入的参数进行严格校验
  if (!email) {
    return { success: false, message: '用户身份凭证(email)缺失，请重新登录' };
  }
  
  // 简单的邮箱格式校验
  const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailReg.test(email)) {
    return { success: false, message: '用户身份凭证(email)格式不正确' };
  }

  // 校验问题和答案
  const chineseRegex = /^[\u4e00-\u9fa5\uFF1F\uFF0C\u3002？，。]+$/;
  if (!question || !chineseRegex.test(question)) {
    return { success: false, message: '密保问题必须为中文及标点' };
  }
  const numberRegex = /^\d+$/;
  if (!answer || !numberRegex.test(answer)) {
    return { success: false, message: '密保答案必须为纯数字' };
  }
  
  try {
    // 3. 【核心】使用 email 作为查询条件来更新用户的密保信息
    // 注意: where().update() 会更新所有匹配到的记录。
    const updateResult = await db.collection('users').where({
      email: email
    }).update({
      data: {
        securityQuestion: question.trim(),
        securityAnswer: answer.trim() // 建议答案也用一个新字段，并去除空格
      }
    });

    // 4. 检查更新操作的结果
    // updateResult.stats.updated 表示实际被更新的文档数量
    if (updateResult.stats.updated === 1) {
      // 成功更新了 1 条记录，符合预期
      return { success: true, message: '密保设置成功！' };
    } else {
      // 如果 updated 为 0，说明数据库中没有找到这个 email 的用户
      return { success: false, message: '该邮箱账号不存在，请确认登录状态' };
    }

  } catch (e) {
    // 5. 捕获并处理异常
    console.error(`[Error] setSecurityQuestion failed for email: ${email}`, e);
    // 返回一个通用的服务器错误信息
    return { success: false, message: '服务器开小差了，请稍后再试' };
  }
};