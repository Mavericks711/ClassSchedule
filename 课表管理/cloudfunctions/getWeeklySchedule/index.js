// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数主入口函数
exports.main = async (event, context) => {
  const { weekNumber,userEmail } = event;

  if (!userEmail) {
    console.error('[getSchedule] 调用失败：前端未提供 userEmail。');
    // 如果没有用户信息，直接返回空数组，防止泄露任何数据
    return []; 
  }

  if (typeof weekNumber !== 'number' || weekNumber <= 0) {
    throw new Error('无效的周数参数');
  }

  console.log(`--- [调试 MATCH] --- 正在为用户 [${userEmail}] 查询第 [${weekNumber}] 周的数据`);
  
  try {
    const res = await db.collection('courses_schedule').aggregate()
      .match({
        user_email: userEmail,
        weeks: weekNumber
      })
      .lookup({
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'courseInfoArray'
      })
      .unwind('$courseInfoArray')
      // ===== 根据日志证据修正的最终版本 =====
      .addFields({
        // 1. 从 courseInfoArray 中获取 courseName
        courseName: '$courseInfoArray.courseName',
        
        // 2. 直接从顶层获取 teacher 和 location (注意：不再需要 '$courseInfoArray.')
        teacher: '$teacher',
        location: '$location',
        
        // 3. 从 courseInfoArray 中获取颜色，并修正字段名 + 使用 $ifNull 增加健壮性
        backgroundColor: { $ifNull: ['$courseInfoArray.backgroundColor', '#EFEFEF'] }, // 注意是 backgroundColor！
        textColor: { $ifNull: ['$courseInfoArray.textColor', '#333333'] },
        isElective: '$courseInfo.isElective' 
      })

      // ===== 清理掉不再需要的临时字段 =====
      .project({
        courseInfoArray: 0,
        _id: 0,
        // 如果你的 courses 表的主信息字段是 'name', 'backgroundColor' 等，
        // 而不是 'courseName', 那么就不需要 project 它们了。
        // 如果字段名不一致，需要在这里重命名。
        // 假设 `courses` 表里是 `name`, `backgroundColor`
        // 而 `courses_schedule` 里是 `courseId`, `teacher`, `location`
        // 合并后，所有字段都在顶层了，无需重命名。
        // 我们只需要移除不需要的即可。
        user_email: 0,
        createdAt: 0
      })
      .end();

    return res.list;

  } catch (err) {
    console.error('[聚合查询失败] 原始错误对象:', JSON.stringify(err, null, 2));
    throw new Error(`聚合查询失败: ${err.errMsg || err.message}`);
  }
};