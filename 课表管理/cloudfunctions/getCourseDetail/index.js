// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { courseId } = event;
  
  try {
    const db = cloud.database();
    // 直接查询课程详情
    const res = await db.collection('courses')
      .doc(courseId)
      .get();
    
    return res.data;
    
  } catch (err) {
    console.error('查询失败', err);
    throw err;
  }
};