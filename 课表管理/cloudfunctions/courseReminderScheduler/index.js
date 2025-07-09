const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 1. 获取即将开始的课程（含用户提醒设置）
    const callResult = await cloud.callFunction({ name: 'getUpcomingCourses', data: {} });
    
    // 打印完整的调用结果，便于调试
    console.log('getUpcomingCourses调用结果:', callResult);
    
    // 正确解析云函数返回结果
    const { result } = callResult;
    
    if (!result || !result.success) {
      console.error('获取课程失败:', result);
      return { success: false, message: '获取课程信息失败' };
    }
    
    const upcomingCourses = result.data || [];
    
    if (!Array.isArray(upcomingCourses) || upcomingCourses.length === 0) {
      return { success: true, message: '没有即将开始的课程' };
    }
    
    // 2. 分离邮件提醒和弹窗提醒任务
    const emailTasks = [];
    const popupUserMap = new Map(); // 存储用户对应的课程（去重）
    
    upcomingCourses.forEach(course => {
      const { email, popUpReminder, emailReminder } = course;
      
      // 2.1 处理邮件提醒（使用真实字段 emailReminder）
      if (email && emailReminder) {
        emailTasks.push(cloud.callFunction({
          name: 'sendCourseReminder',
          data: course
        }));
      }
      
      // 2.2 处理弹窗提醒（使用真实字段 popUpReminder）
      if (email && popUpReminder) {
        // 每个用户只保留一个待弹窗课程（避免重复）
        if (!popupUserMap.has(email)) {
          popupUserMap.set(email, course);
        }
      }
    });
    
    // 3. 执行邮件提醒
    const emailResults = await Promise.allSettled(emailTasks);
    const emailSuccessCount = emailResults.filter(r => r.status === 'fulfilled').length;
    
    // 4. 标记需要弹窗提醒的用户（在users表中添加临时字段）
    const popupUsers = Array.from(popupUserMap.entries());
    if (popupUsers.length > 0) {
      // 批量更新用户表：标记未读弹窗+存储课程信息
      for (const [email, course] of popupUsers) {
        await db.collection('users')
          .where({ email: email })
          .update({
            data: {
              hasUnreadPopup: true, // 新增临时字段：是否有未读弹窗
              pendingPopupCourse: { // 新增临时字段：待弹窗课程信息
                courseId: course.courseId,
                courseName: course.courseName,
                location: course.location,
                startTime: course.startTime
              }
            }
          });
      }
    }
    
    return {
      success: true,
      message: `邮件提醒成功: ${emailSuccessCount}/${emailTasks.length}, 弹窗提醒待处理: ${popupUsers.length}`
    };
  } catch (err) {
    console.error('调度失败:', err);
    return { success: false, message: '服务器内部错误' };
  }
};