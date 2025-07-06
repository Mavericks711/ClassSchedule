// 云函数入口文件: getDailySchedule/index.js

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 云函数主入口函数
exports.main = async (event, context) => {
  // 从前端接收 weekNumber 和 day 两个参数
  const { weekNumber, day } = event;

  // 参数校验
  if (typeof weekNumber !== 'number' || weekNumber <= 0) {
    throw new Error('无效的周数参数');
  }
  if (typeof day !== 'number' || day < 1 || day > 7) {
    throw new Error('无效的星期参数 (应为 1-7)');
  }

  try {
    const res = await db.collection('courses_schedule').aggregate()
      // ✅ 核心区别：同时匹配周数和星期几
      .match({
        weeks: weekNumber,
        day: day
      })
      .lookup({
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'courseInfoArray'
      })
      .unwind('$courseInfoArray')
      .addFields({
        // 以下字段名请确保与你最终版本一致
        courseName: '$courseInfoArray.courseName',
        teacher: '$teacher',
        location: '$location',
        backgroundColor: { $ifNull: ['$courseInfoArray.backgroundColor', '#EFEFEF'] },
        textColor: { $ifNull: ['$courseInfoArray.textColor', '#333333'] }
      })
      .project({
        courseInfoArray: 0,
        courseId: 0
      })
      // ✅ 新增：按开始节数排序，确保课程从早到晚显示
      .sort({
        startSection: 1 
      })
      .end();

    return res.list;

  } catch (err) {
    console.error('[日课程查询失败]', err);
    throw new Error(`聚合查询失败: ${err.errMsg || err.message}`);
  }
};