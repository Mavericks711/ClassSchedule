Page({
  data: {
    courseInfo: {
      courseName: "离散数学",
      textColor: "#FFFFFF",
      backgroundColor: "#D0021B",
      isElective: false,
      weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
      day: 1,
      startSection: 1,
      endSection: 2,
      teacher: "XXX",
      location: "学武楼C306"
    }
  },

  onLoad: function(options) {
    if (options.course) {
        // 解析传递过来的课程数据
        const course = JSON.parse(decodeURIComponent(options.course));
        this.setData({
            courseInfo: {
                courseName: course.courseName || course.name || '未知课程',
                textColor: course.textColor || '#FFFFFF',
                backgroundColor: course.backgroundColor || '#D0021B',
                isElective: course.isElective || false,
                weeks: course.weeks || [],
                day: course.day || 0,
                startSection: course.startSection || 1,
                endSection: course.endSection || 2,
                teacher: course.teacher || '未知教师',
                location: course.location || '未知地点'
            }
        });
    }
    // 如果需要从数据库加载，可以保留以下代码
    if (options.id) {
    this.loadCourseDetail(options.id);
     }
},
loadCourseDetail: function(courseId) {
  wx.cloud.callFunction({
      name: 'getCourseDetail',
      data: {
          courseId: courseId
      }
  }).then(res => {
      this.setData({
          courseInfo: res.result
      });
  }).catch(err => {
      console.error('加载课程详情失败', err);
      wx.showToast({
          title: '加载失败',
          icon: 'none'
      });
  });
},
  // 格式化周数显示
  formatWeeks: function(weeks) {
    if (!weeks || weeks.length === 0) return '无';
    
    // 简单实现：显示为"第1,2,3...15周"
    return '第' + weeks.join(',') + '周';
    
    // 更复杂的实现可以合并连续周数，如"第1-15周"
  },

  // 将数字星期转换为中文
  formatDay: function(day) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[day] || '未知';
  }
});