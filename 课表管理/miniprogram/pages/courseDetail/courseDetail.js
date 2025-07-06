// /pages/course_detail/course_detail.js

const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    scheduleId: null,      // 从上个页面传来的课程安排 ID
    courseDetail: null,    // 存储从数据库获取的完整课程信息
    isLoading: true,       // 控制加载状态
    error: null,           // 存储错误信息
  },

  /**
   * 页面加载时触发，是获取数据的入口
   */
  onLoad: function (options) {
    // 1. 获取从课程表页传来的 schedule_id
    const scheduleId = options.id;
    console.log('接收到的 Schedule ID:', scheduleId);

    if (!scheduleId) {
      console.error('未接收到课程 ID');
      this.setData({
        isLoading: false,
        error: '无法加载课程信息，ID缺失。'
      });
      return;
    }

    this.setData({
      scheduleId: scheduleId
    });

    // 2. 根据 ID 从数据库加载课程详情
    this.loadCourseDetail(scheduleId);
  },

  /**
   * 根据 ID 从数据库加载课程详情
   */
  loadCourseDetail: async function(scheduleId) {
    this.setData({ isLoading: true, error: null });
    try {
      // 使用聚合操作 (aggregate) 一次性查询两个集合并合并数据
      const res = await db.collection('courses_schedule').aggregate()
        .match({
          _id: scheduleId // 匹配课程安排表中的指定 ID
        })
        .lookup({
          from: 'courses',           // 要关联的集合
          localField: 'course_id',   // 本集合的关联字段
          foreignField: '_id',       // 目标集合的关联字段
          as: 'courseInfo'         // 关联查询出的课程主信息，结果是一个数组
        })
        .end();

      if (res.list && res.list.length > 0) {
        let detail = res.list[0];
        // lookup 返回的是数组，即使只有一个匹配项。我们需要把它提取出来。
        detail.courseInfo = detail.courseInfo[0] || {};
        
        console.log('获取到的完整课程详情:', detail);

        this.setData({
          courseDetail: detail,
          isLoading: false
        });
      } else {
        throw new Error('在数据库中未找到该课程。');
      }

    } catch (err) {
      console.error('加载课程详情失败', err);
      this.setData({
        isLoading: false,
        error: '加载失败，请稍后重试。'
      });
    }
  },

  /**
   * 点击编辑按钮
   */
  onEdit: function() {
    // 跳转到编辑页面，并传递 schedule_id
    wx.navigateTo({
      url: `/pages/edit/edit?id=${this.data.scheduleId}`
    });
  },

  /**
   * 点击删除按钮
   */
  onDelete: function() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个课程安排吗？此操作不可恢复。',
      confirmColor: '#e64340', // 红色，表示危险操作
      success: (res) => {
        if (res.confirm) {
          this.deleteSchedule();
        }
      }
    });
  },

  /**
   * 执行删除操作
   */
  deleteSchedule: async function() {
    wx.showLoading({ title: '正在删除...' });
    try {
      // 从 courses_schedule 集合中删除记录
      await db.collection('courses_schedule').doc(this.data.scheduleId).remove();
      
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

      // 关键：通知上一个页面（课程表页）刷新数据
      const pages = getCurrentPages();
      if (pages.length > 1) {
        const prevPage = pages[pages.length - 2];
        // 调用上一个页面的刷新方法（假设课程表页有 loadScheduleData 方法）
        if (typeof prevPage.loadScheduleData === 'function') {
          prevPage.loadScheduleData(prevPage.data.currentWeek);
        }
      }

      // 延时1.5秒后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
      console.error('删除课程安排失败', err);
    }
  }
});