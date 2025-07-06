// cloudfunctions/importExcel/index.js
const cloud = require('wx-server-sdk');
const xlsx = require('node-xlsx');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// --- 辅助函数 ---

// 解析 "1-5,7,9-10" 这样的周数字符串为数组 [1,2,3,4,5,7,9,10]
function parseWeeks(weeksStr) {
  if (!weeksStr) return [];
  const weeks = new Set();
  const parts = String(weeksStr).split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        weeks.add(i);
      }
    } else {
      weeks.add(Number(part));
    }
  }
  return Array.from(weeks).sort((a, b) => a - b);
}

// 解析 "周一3-4" 为 { day: 1, startSection: 3, endSection: 4 }
function parseTime(timeStr) {
  if (!timeStr) return null;
  const dayMap = { '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7 };
  const match = timeStr.match(/(周[一二三四五六日])(\d+)-(\d+)/);
  if (match) {
    return {
      day: dayMap[match[1]],
      startSection: Number(match[2]),
      endSection: Number(match[3])
    };
  }
  return null;
}

// --- 主函数 ---
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { fileID } = event;

  try {
    // 1. 从云存储下载文件
    const res = await cloud.downloadFile({ fileID });
    const buffer = res.fileContent;

    // 2. 解析 Excel 文件
    const sheets = xlsx.parse(buffer);
    if (!sheets || sheets.length === 0) {
      return { success: false, message: 'Excel文件为空或格式错误' };
    }
    const dataRows = sheets[0].data;
    if (dataRows.length <= 1) {
      return { success: false, message: 'Excel中没有数据' };
    }

    // 提取数据（跳过表头）
    const rows = dataRows.slice(1);
    
    // 用于存储课程主信息的Map，key为课程名称，用于去重
    const coursesMap = new Map();

    // 第一次遍历，整理出所有独立的课程主信息
    rows.forEach(row => {
      // 根据你的Excel列顺序获取数据
      const [courseName, teacher, location, weeksStr, timeStr, isElectiveStr, textColor, bgColor] = row;
      
      if (courseName && !coursesMap.has(courseName)) {
        coursesMap.set(courseName, {
          courseName: String(courseName),
          isElective: String(isElectiveStr).trim() === '是',
          textColor: String(textColor || '#FFFFFF'),
          backgroundColor: String(bgColor || '#4A90E2'),
          _openid: OPENID
        });
      }
    });

    // 3. 将去重后的课程主信息写入 `courses` 数据库
    const coursePromises = [];
    const courseNameIdMap = new Map(); // 用于存储 courseName -> new _id 的映射

    for (const [name, courseData] of coursesMap.entries()) {
      // 检查该用户的课程是否已存在
      
      const existingCourse = await db.collection('courses').where({
        courseName: name,
        _openid: OPENID
      }).get();

      if (existingCourse.data.length > 0) {
        // 课程已存在，直接使用其 ID
        courseNameIdMap.set(name, existingCourse.data[0]._id);
      } else {
        // 课程不存在，添加新课程
        const promise = db.collection('courses').add({ data: courseData })
          .then(addRes => {
            courseNameIdMap.set(name, addRes._id);
          });
        coursePromises.push(promise);
      }
    }
    await Promise.all(coursePromises);

    // 4. 第二次遍历，根据 courseId 写入 `courses_schedule` 数据库
    const schedulePromises = [];
    let scheduleCount = 0;
    rows.forEach(row => {
      const [courseName, teacher, location, weeksStr, timeStr, ...rest] = row;
      const courseId = courseNameIdMap.get(String(courseName));
      const timeInfo = parseTime(String(timeStr));
      
      if (courseId && timeInfo) {
        const scheduleData = {
          courseId,
          teacher: String(teacher || ''),
          location: String(location || ''),
          weeks: parseWeeks(weeksStr),
          day: timeInfo.day,
          startSection: timeInfo.startSection,
          endSection: timeInfo.endSection,
          _openid: OPENID
        };
        console.log('即将存入数据库的数据:', JSON.stringify(courseData, null, 2));
        schedulePromises.push(db.collection('courses_schedule').add({ data: scheduleData }));
        scheduleCount++;
      }
    });

    await Promise.all(schedulePromises);

    return {
      success: true,
      courseCount: coursesMap.size,
      scheduleCount: scheduleCount
    };

  } catch (e) {
    console.error('导入失败', e);
    return {
      success: false,
      message: e.message || '服务器内部错误'
    };
  }
};