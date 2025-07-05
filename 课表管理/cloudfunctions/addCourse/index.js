// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  // 1. 从 event 对象中获取前端传递的所有数据，包括 userEmail
  const { userEmail, courseName, textColor, boxColor, isRequired, schedules } = event;

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
      // 4. 在 `courses` 集合中插入主课程信息，并明确存入 user_email
      const courseRes = await transaction.collection('courses').add({
        data: {
          user_email: userEmail, // <--- 使用前端传来的 email
          name: courseName,
          textColor: textColor || '#FFFFFF',
          boxColor: boxColor || '#3498DB',
          isRequired: isRequired,
          createdAt: db.serverDate()
        }
      });

      if (!courseRes._id) {
        await transaction.rollback('创建课程主信息失败');
        return;
      }
      
      const newCourseId = courseRes._id;

      // 5. 准备要插入的课程安排数据
      const scheduleTasks = schedules.map(schedule => {
        return transaction.collection('courses_schedule').add({
          data: {
            course_id: newCourseId,
            user_email: userEmail, // <--- 同样存入 email
            weeks: schedule.weeks,
            day_of_week: schedule.dayOfWeek,
            start_session: schedule.startSession,
            end_session: schedule.endSession,
            teacher: schedule.teacher || '',
            location: schedule.location || ''
          }
        });
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