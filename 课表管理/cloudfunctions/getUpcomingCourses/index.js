const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 修正：用「小时 + 分钟/60」的正确小数表示时间
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

function getCurrentWeek() {
  return 8; // 固定第8周（实际应根据学期计算）
}

function getCurrentTime() {
  console.warn("测试时间");
  // const options = { 
  //   timeZone: 'Asia/Shanghai',
  //   hour: '2-digit', 
  //   minute: '2-digit', 
  //   hour12: false 
  // };
  // const timeStr = new Date().toLocaleString('en-US', options);
  // const [hours, minutes] = timeStr.split(':').map(Number);
  // return hours + minutes / 60;

  return 20.36;
}

function getCurrentDay() {
  console.warn("测试day");
  // const options = { timeZone: 'Asia/Shanghai', weekday: 'long' };
  // const weekdayMap = {
  //   'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
  //   'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
  // };
  // return weekdayMap[new Date().toLocaleString('en-US', options)];

  return 3;
}

exports.main = async (event, context) => {
  try {
    console.log('函数触发时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
    
    const currentWeek = getCurrentWeek();
    const currentDay = getCurrentDay();
    const currentTime = getCurrentTime();

    console.log('当前周:', currentWeek);
    console.log('当前星期:', currentDay);
    console.log('当前时间(小时):', currentTime);
    
    const validSections = SECTION_START_TIME
      .map((time, idx) => idx > 0 && time >= currentTime && time <= currentTime + 0.5 ? idx : null)
      .filter(section => section !== null);
    
    console.log('符合条件的节次:', validSections);
    
    // 查询课程安排
    const upcomingCourses = await db.collection('courses_schedule')
      .where({ 
        weeks: currentWeek, 
        day: currentDay, 
        startSection: _.in(validSections) 
      })
      .get();
    
    console.log('查询到的课程数量:', upcomingCourses.data.length);
    
    if (!upcomingCourses.data || !Array.isArray(upcomingCourses.data)) {
      console.error('课程数据格式错误:', upcomingCourses);
      return { success: false, message: '数据格式异常' };
    }
    
    if (upcomingCourses.data.length === 0) {
      console.log('没有即将开始的课程');
      return { success: true, data: [] };
    }
    
    // 提取课程ID
    const courseIds = upcomingCourses.data
      .map(course => {
        if (!course.courseId) {
          console.warn(`无效课程记录: ${JSON.stringify(course)}`);
          return null;
        }
        return course.courseId;
      })
      .filter(id => id !== null);
    
    console.log('有效课程ID列表:', courseIds);
    
    if (courseIds.length === 0) {
      console.error('没有有效的课程ID');
      return { success: true, data: [] };
    }
    
    // 查询课程详情
    const courseDetails = await db.collection('courses')
      .where({ _id: _.in(courseIds) })
      .get();
    
    console.log('获取到的课程详情数量:', courseDetails.data.length);
    
    // 构建ID到课程详情的映射
    const courseMap = {};
    courseDetails.data.forEach(course => {
      courseMap[course._id] = course;
    });
    
    // 批量查询用户的提醒设置
    const userEmails = [...new Set(
      upcomingCourses.data.map(s => courseMap[s.courseId]?.email).filter(Boolean)
    )];
    
    const userSettings = {};
    if (userEmails.length > 0) {
      const userRes = await db.collection('users')
        .where({ email: _.in(userEmails) })
        .field({ 
          email: true, 
          popUpReminder: true,
          emailReminder: true
        })
        .get();
      
      userRes.data.forEach(user => {
        userSettings[user.email] = {
          popUpReminder: user.popUpReminder ?? true,
          emailReminder: user.emailReminder ?? true
        };
      });
    }
    
    // 合并结果
    const result = upcomingCourses.data.map(schedule => {
      const courseId = schedule.courseId;
      const course = courseMap[courseId] || {};
      const email = course.email || ''; 
      
      return {
        courseId,
        courseName: course.courseName || '未知课程',
        email,
        startSection: schedule.startSection,
        location: schedule.location || '未知地点',
        startTime: SECTION_START_TIME[schedule.startSection],
        popUpReminder: userSettings[email]?.popUpReminder ?? true,
        emailReminder: userSettings[email]?.emailReminder ?? true
      };
    });
    
    console.log('最终结果:', result);
    
    return { success: true, data: result };
  } catch (err) {
    console.error('获取课程失败:', err);
    return { success: false, message: '服务器内部错误' };
  }
};