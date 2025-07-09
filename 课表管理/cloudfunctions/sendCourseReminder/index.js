// cloudfunctions/sendCourseReminder/index.js
const cloud = require('wx-server-sdk');
const nodemailer = require('nodemailer');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com', // 手动指定服务器
  port: 465,
  auth: {
    user: '1650387158@qq.com', // 从环境变量获取邮箱
    pass: 'etmwwcksbfmjcaei'  // 从环境变量获取授权码
  }
});

// 节次与开始时间映射（小时）
const SECTION_START_TIME = [
  0, 8.00, 8.55, 10.10, 11.05, 14.30, 15.25, 16.40, 17.35, 19.10, 20.05, 21.00
];

// 格式化时间（将8.55转换为8:55）
function formatTime(time) {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

exports.main = async (event, context) => {

  console.log("进入发送邮件函数");
      //测试函数
  if (event.testMode) {
    console.log("进入测试");
    try {
      const testMailOptions = {
        from: '1650387158@qq.com',
        to: event.testEmail ,
        subject: '[测试] 邮件发送功能验证',
        html: `
          <div>
            <p>这是一封测试邮件，用于验证邮件发送配置是否正常。</p>
            <p>当前时间：${new Date().toLocaleString()}</p>
          </div>
        `
      };
      
    // 添加详细日志
    console.log('测试邮件配置:', {
      from: testMailOptions.from,
      to: testMailOptions.to,
      service: 'QQ',
      authUser: '1650387158@qq.com' // 隐藏密码，只输出用户名
    });
    
    // 发送邮件并捕获详细响应
    const sendResult = await transporter.sendMail(testMailOptions);
    console.log('邮件发送成功响应:', sendResult); // 记录发送结果
    
    return { success: true, message: '测试邮件发送成功', result: sendResult.messageId };
  } catch (err) {
    console.error('测试邮件发送失败详情:', {
      error: err.message,
      code: err.code, // 错误代码（如 EENVELOPE、EAUTH 等）
      response: err.response // 邮箱服务器返回的原始响应
    });
    return { 
      success: false, 
      message: '测试邮件发送失败', 
      error: err.message,
      code: err.code
    };
  }
  }
   //以上为测试函数
  else{
  try {
    const { course_id, courseName, user_email, startSection, location } = event;
    
    // 验证参数
    if (!course_id || !courseName || !user_email || !startSection || !location) {
      return { success: false, message: '缺少必要参数' };
    }
    
    // 检查用户是否开启邮件提醒
    const user = await db.collection('users')
      .where({ email: user_email })
      .field({ emailReminder: true })
      .get();
    
    if (!user.data || !user.data[0] || !user.data[0].emailReminder) {
      return { success: true, message: '用户已关闭邮件提醒' };
    }
    
    // 计算课程开始时间
    const startTime = formatTime(SECTION_START_TIME[startSection]);
    
    // 构建邮件内容
    const mailOptions = {
      from: '课程提醒',
      to: user_email,
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
    
    return { success: true, message: '邮件发送成功' };
  } catch (err) {
    console.error('发送课程提醒失败:', err);
    return { success: false, message: '邮件发送失败' };
  }

 }
};