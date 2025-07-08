// cloudfunctions/getUpcomingCourses/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 节次与开始时间映射（小时）
const SECTION_START_TIME = [
  0, 8.00, 8.55, 10.10, 11.05, 14.30, 15.25, 16.40, 17.35, 19.10, 20.05, 21.00
];

// 获取当前周（需要根据学期开始日期计算，这里简化处理）
function getCurrentWeek() {
  // 实际应用中应根据学期开始日期计算当前周
  // 假设当前是第8周
  return 8;
}

// 获取当前时间（小时）
function getCurrentTime() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

// 获取当前星期几（1-7）
function getCurrentDay() {
  const now = new Date();
  return now.getDay() === 0 ? 7 : now.getDay(); // 转换为1-7
}

exports.main = async (event, context) => {
  try {
    const currentWeek = getCurrentWeek();
    const currentDay = getCurrentDay();
    const currentTime = getCurrentTime();

    console.log('当前周:', currentWeek);
    console.log('当前星期:', currentDay);
    console.log('当前时间(小时):', currentTime);
    
    // 计算半小时内的节次
    const validSections = SECTION_START_TIME
      .map((time, idx) => (idx > 0 && time >= currentTime && time <= currentTime + 0.5 ? idx : null))
      .filter(section => section !== null);
    
    console.log('符合条件的节次:', validSections);
    
    // 查询半小时内开始的课程
    const upcomingCourses = await db.collection('courses_schedule')
      .where({
        weeks: currentWeek,
        day: currentDay,
        startSection: _.in(validSections)
      })
      .get();
    
    console.log('查询到的课程数量:', upcomingCourses.data.length);
    
    // 打印符合条件的课程
    console.log('符合时间范围的课程:');
    upcomingCourses.data.forEach(course => {
      console.log(`- 课程ID: ${course.course_id}, 节次: ${course.startSection}, 地点: ${course.location}`);
    });
    
    if (!upcomingCourses.data || upcomingCourses.data.length === 0) {
      return { success: true, data: [] };
    }
    
    // 获取课程详情和用户邮箱
    const courseIds = upcomingCourses.data.map(c => c.course_id);
    const courseDetails = await db.collection('courses')
      .where({
        _id: _.in(courseIds)
      })
      .get();
    
    console.log('获取到的课程详情数量:', courseDetails.data.length);
    
    // 打印课程详情及关联用户
    console.log('课程详情及关联用户:');
    courseDetails.data.forEach(detail => {
      console.log(`- 课程名称: ${detail.courseName}, 用户邮箱: ${detail.user_email}`);
    });
    
    // 合并课程信息
    const courseMap = {};
    courseDetails.data.forEach(c => {
      courseMap[c._id] = c;
    });
    
    const result = upcomingCourses.data.map(schedule => {
      const course = courseMap[schedule.course_id] || {};
      return {
        course_id: schedule.course_id,
        courseName: course.courseName || '未知课程',
        user_email: course.user_email || '',
        startSection: schedule.startSection,
        location: schedule.location || '未知地点',
        startTime: SECTION_START_TIME[schedule.startSection]
      };
    });
    
    // 打印最终结果（课程与用户的映射）
    console.log('最终符合条件的课程与用户映射:');
    result.forEach(item => {
      console.log(`- 课程: ${item.courseName}, 用户: ${item.user_email}, 节次: ${item.startSection}, 时间: ${item.startTime}h`);
    });
    
    // 统计并打印涉及的用户
    const uniqueUsers = [...new Set(result.map(item => item.user_email))];
    console.log(`涉及的用户数量: ${uniqueUsers.length}`);
    console.log('涉及的用户邮箱:');
    uniqueUsers.forEach(email => {
      console.log(`- ${email}`);
    });
    
    return { success: true, data: result };
  } catch (err) {
    console.error('获取即将开始的课程失败:', err);
    return { success: false, message: '服务器内部错误' };
  }
};