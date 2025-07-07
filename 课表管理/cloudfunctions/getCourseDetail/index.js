// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { courseId } = event;
  
  try {
    // 查询课程详情
    const db = cloud.database();
    const res = await db.collection('courses_schedule')
      .doc(courseId)
      .get();
    
    // 查询关联的课程信息
    const courseRes = await db.collection('courses')
      .doc(res.data.courseId)
      .get();
    
    // 合并数据
    return {
      ...res.data,
      ...courseRes.data,
      _id: res.data._id
    };
    
  } catch (err) {
    console.error('查询失败', err);
    throw err;
  }
};