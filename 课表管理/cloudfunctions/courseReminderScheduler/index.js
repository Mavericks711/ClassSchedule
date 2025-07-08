// cloudfunctions/courseReminderScheduler/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {

  
  try {
    // 1. 获取即将开始的课程
    const { success, data } = await cloud.callFunction({
      name: 'getUpcomingCourses',
      data: {}
    });
    
    if (!success || !data || data.length === 0) {
      return { success: true, message: '没有即将开始的课程' };
    }
    
    // 2. 批量发送提醒邮件
    const tasks = data.map(course => {
      return cloud.callFunction({
        name: 'sendCourseReminder',
        data: course
      });
    });
    
    const results = await Promise.allSettled(tasks);
    
    // 3. 统计发送结果
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.length - successCount;
    
    return {
      success: true,
      message: `提醒任务执行完成，成功: ${successCount}，失败: ${failedCount}`,
      details: results
    };
  } catch (err) {
    console.error('执行课程提醒调度失败:', err);
    return { success: false, message: '服务器内部错误' };
  }
};