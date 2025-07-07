// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  // 1. 从 event 对象中获取前端传递的所有数据
  // ===== 修改区域 开始 =====
  const { userEmail, courseName, textColor, backgroundColor, isElective, schedules } = event;
  // ===== 修改区域 结束 =====


  // 2. 数据校验（核心是检查邮箱是否存在）
  if (!userEmail) {
    return {
      success: false,
      message: '用户信息错误，请重新登录'
    };
  }
  if (!courseName || !schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return {
      success: false,
      message: '课程名称和时间安排不能为空'
    };
  }

  // 3. 使用数据库事务创建课程
  try {
    const result = await db.runTransaction(async transaction => {

      // ===== 修改区域 开始 =====
      // 4. 在 `courses` 集合中插入主课程信息
      const courseRes = await transaction.collection('courses').add({
        data: {
          // 变动点：字段名从 userEmail 改为 user_email 以保持风格统一
          user_email: userEmail,
          courseName: courseName,
          textColor: textColor || '#FFFFFF',
          // 变动点：字段名从 backgroundColor 改为 boxColor
          backgroundColor: backgroundColor || '#3498DB', 
          isElective: isElective,
          createdAt: db.serverDate()
        }
      });
      // ===== 修改区域 结束 =====

      if (!courseRes._id) {
        await transaction.rollback('创建课程主信息失败');
        return;
      }
      
      const newCourseId = courseRes._id;

      // 5. 准备要插入的课程安排数据
      const scheduleTasks = schedules.map(schedule => {

        // ===== 修改区域 开始 =====
        // 变动点：集合名从 'courses1_schedule' 改为 'courses_schedule'
        return transaction.collection('courses_schedule').add({
          data: {
            // 变动点：字段名从 courseId 改为 course_id
            courseId: newCourseId,
            // 变动点：字段名从 userEmail 改为 user_email
            user_email: userEmail,
            // 变动点：确保 weeks 是数字数组，以防万一
            weeks: Array.isArray(schedule.weeks) ? schedule.weeks.map(Number) : [],
            // 变动点：确保 day, startSection, endSection 是数字
            day: Number(schedule.day),
            startSection: Number(schedule.startSection),
            endSection: Number(schedule.endSection),
            teacher: schedule.teacher || '',
            location: schedule.location || ''
          }
        });
        // ===== 修改区域 结束 =====
      });

      // 6. 并发插入所有课程安排
      await Promise.all(scheduleTasks);

      // 事务成功
      return {
        courseId: newCourseId
      };
    });

    if (result && result.courseId) {
       return {
         success: true,
         message: '课程创建成功',
         data: {
           courseId: result.courseId
         }
       };
    } else {
        throw new Error('事务执行失败');
    }

  } catch (e) {
    console.error('addCourse 云函数执行失败', e);
    return {
      success: false,
      message: e.message || '服务器内部错误，创建失败'
    };
  }
};