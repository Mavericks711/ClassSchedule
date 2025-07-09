// cloudfunctions/sendCourseReminder/index.js
const cloud = require('wx-server-sdk');
const nodemailer = require('nodemailer');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  auth: {
    user: '1650387158@qq.com', // 发件人邮箱
    pass: 'etmwwcksbfmjcaei'  // 授权码（建议后续迁移到环境变量）
  }
});

// 节次与开始时间映射（使用正确的「小时+分钟/60」小数表示）
const SECTION_START_TIME = [
  0, 
  8.00,          // 节次1: 8:00
  8 + 55/60,     // 节次2: 8:55
  10 + 10/60,    // 节次3: 10:10
  11 + 5/60,     // 节次4: 11:05
  14 + 30/60,    // 节次5: 14:30
  15 + 25/60,    // 节次6: 15:25
  16 + 40/60,    // 节次7: 16:40
  17 + 35/60,    // 节次8: 17:35
  19 + 10/60,    // 节次9: 19:10
  20 + 5/60,     // 节次10: 20:05
  21.00          // 节次11: 21:00
];

// 格式化时间（将小数转换为 HH:MM 格式）
function formatTime(time) {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

exports.main = async (event, context) => {
  console.log("进入发送邮件函数，接收参数:", event);

  // 测试函数逻辑（保持不变）
  if (event.testMode) {
    console.log("进入测试模式");
    try {
      const testMailOptions = {
        from: '1650387158@qq.com',
        to: event.testEmail,
        subject: '[测试] 邮件发送功能验证',
        html: `
          <div>
            <p>这是一封测试邮件，用于验证邮件发送配置是否正常。</p>
            <p>当前时间：${new Date().toLocaleString()}</p>
          </div>
        `
      };
      
      console.log('测试邮件配置:', {
        from: testMailOptions.from,
        to: testMailOptions.to,
        service: 'QQ'
      });
      
      const sendResult = await transporter.sendMail(testMailOptions);
      console.log('测试邮件发送成功响应:', sendResult);
      return { success: true, message: '测试邮件发送成功', result: sendResult.messageId };
    } catch (err) {
      console.error('测试邮件发送失败详情:', {
        error: err.message,
        code: err.code,
        response: err.response
      });
      return { 
        success: false, 
        message: '测试邮件发送失败', 
        error: err.message,
        code: err.code
      };
    }
  }

  // 正式邮件发送逻辑
  try {
    // 关键修正：使用 email 字段（与函数A/B保持一致），而非 user_email
    const { courseId, courseName, email, startSection, location } = event;
    
    // 验证参数（确保必要字段存在）
    if (!courseId || !courseName || !email || !startSection || !location) {
      console.error('缺少必要参数:', { courseId, courseName, email, startSection, location });
      return { success: false, message: '缺少必要参数' };
    }
    
    // 检查用户是否开启邮件提醒（使用 email 字段查询）
    const user = await db.collection('users')
      .where({ email: email }) // 关键修正：用 email 匹配用户
      .field({ emailReminder: true })
      .get();
    
    if (!user.data || !user.data[0] || !user.data[0].emailReminder) {
      return { success: true, message: '用户已关闭邮件提醒' };
    }
    
    // 计算课程开始时间（使用修正后的 SECTION_START_TIME）
    const startTime = formatTime(SECTION_START_TIME[startSection]);
    console.log(`课程 ${courseName} 开始时间: ${startTime}`);
    
    // 构建邮件内容（使用正确的参数）
    const mailOptions = {
      from: '"课程提醒" <1650387158@qq.com>', // 发件人信息
      to: email, // 关键修正：收件人使用 email 字段
      subject: `[课程提醒] ${courseName} 即将开始`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h3 style="color: #333;">${courseName} 课程提醒</h3>
          <p>您的课程 <strong>${courseName}</strong> 将在半小时后开始。</p>
          <p><strong>时间：</strong>${startTime}</p>
          <p><strong>地点：</strong>${location}</p>
          <p style="color: #666; font-size: 14px;">如果您不需要此提醒，请在APP中关闭邮件提醒功能。</p>
        </div>
      `
    };
    
    // 发送邮件
    await transporter.sendMail(mailOptions);
    console.log(`邮件已发送至 ${email}，课程：${courseName}`);
    return { success: true, message: '邮件发送成功' };
  } catch (err) {
    console.error('发送课程提醒失败:', err);
    return { success: false, message: '邮件发送失败', error: err.message };
  }
};