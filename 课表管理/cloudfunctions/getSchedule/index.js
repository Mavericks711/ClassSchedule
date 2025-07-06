// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数主入口函数
exports.main = async (event, context) => {
  const { weekNumber } = event;

  if (typeof weekNumber !== 'number' || weekNumber <= 0) {
    throw new Error('无效的周数参数');
  }

  try {
    const res = await db.collection('courses_schedule').aggregate()
      .match({
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
        textColor: { $ifNull: ['$courseInfoArray.textColor', '#333333'] }
      })

      // ===== 清理掉不再需要的临时字段 =====
      .project({
        courseInfoArray: 0, // 移除临时的 courseInfoArray 对象
        // courseId, _openid 等字段如果前端不需要，也可以在这里设为 0 来移除
      })
      .end();

    // 注意：这里不再需要 console.log 调试了，可以删掉
    return res.list;

  } catch (err) {
    console.error('[聚合查询失败] 原始错误对象:', JSON.stringify(err, null, 2));
    throw new Error(`聚合查询失败: ${err.errMsg || err.message}`);
  }
};