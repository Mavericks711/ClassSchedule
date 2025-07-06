// 云函数 getScheduleForWeek/index.js

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

/**
 * 解析周数范围字符串，例如 '1-3,5,7-9' 会被解析成 [1, 2, 3, 5, 7, 8, 9]
 * @param {string} weekStr - 数据库中存储的周数范围字符串
 * @returns {number[]} - 包含所有有效周数的数组
 */
// function parseWeeks(weekStr) {
//     if (!weekStr) return [];
//     const weeks = new Set();
//     const parts = weekStr.split(',');
//     for (const part of parts) {
//         if (part.includes('-')) {
//             const [start, end] = part.split('-').map(Number);
//             if (!isNaN(start) && !isNaN(end)) {
//                 for (let i = start; i <= end; i++) {
//                     weeks.add(i);
//                 }
//             }
//         } else {
//             const weekNum = Number(part);
//             if (!isNaN(weekNum)) {
//                 weeks.add(weekNum);
//             }
//         }
//     }
//     return Array.from(weeks);
// }

// 云函数主入口
exports.main = async (event, context) => {
    // 1. 从前端接收要查询的周数
    const { weekNumber } = event;

    if (typeof weekNumber !== 'number' || weekNumber <= 0) {
        throw new Error('无效的周数参数');
    }

    // 2. 从 courses_schedule 库中筛选出本周有课的安排
    // 由于周数是字符串，我们先获取所有安排，然后在内存中过滤。
    const scheduleQueryResult = await db.collection('courses_schedule').limit(1000).get();
    const allSchedules = scheduleQueryResult.data;

    const currentWeekSchedules = allSchedules.filter(schedule => {
        const activeWeeks = parseWeeks(schedule.weeks); 
        return activeWeeks.includes(weekNumber);
    });

    // 如果本周没课，直接返回空数组，提高效率
    if (currentWeekSchedules.length === 0) {
        return [];
    }

    // 3. 提取所有相关的 course_id，并去重
    const courseIds = [...new Set(currentWeekSchedules.map(s => s.course_id))];

    // 4. 使用 db.command.in 一次性查询所有相关的课程主信息
    const coursesQueryResult = await db.collection('courses').where({
        _id: _.in(courseIds)
    }).get();
    const coursesMap = new Map(coursesQueryResult.data.map(c => [c._id, c]));

    // 5. 合并课程主信息和课程安排信息
    const finalSchedule = currentWeekSchedules.map(schedule => {
        const courseInfo = coursesMap.get(schedule.course_id);
        // 返回一个包含所有信息的完整对象
        return {
            ...schedule,     // 包含：_id, weeks, dayOfWeek, startTime, endTime, teacher, location, course_id
            ...courseInfo,   // 包含：courseName, textColor, boxColor, isOptional 等
            schedule_id: schedule._id // 保留 schedule 的 _id，用于详情页查询
        };
    });

    return finalSchedule;
}