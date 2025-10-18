const Ticket = require('../models/Ticket');

// 获取工单列表
exports.getTickets = async (req, res, next) => {
  try {
    const { page, pageSize, q, status, priority } = req.query;
    
    const result = await Ticket.findAll({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      q,
      status,
      priority,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 创建工单
exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, priority = 'mid' } = req.body;

    // 验证输入
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '工单标题不能为空',
      });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      creatorId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: ticket,
      message: '工单创建成功',
    });
  } catch (error) {
    next(error);
  }
};

// 获取工单详情
exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '工单不存在',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// 更新工单
exports.updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.update(id, updates, req.user.id);

    res.json({
      success: true,
      data: ticket,
      message: '工单更新成功',
    });
  } catch (error) {
    next(error);
  }
};

// 删除工单
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 只有管理员可以删除工单
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以删除工单',
      });
    }

    const ticket = await Ticket.delete(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '工单不存在',
      });
    }

    res.json({
      success: true,
      message: '工单删除成功',
    });
  } catch (error) {
    next(error);
  }
};

// 添加评论
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空',
      });
    }

    const comment = await Ticket.addComment(id, req.user.id, content);

    res.status(201).json({
      success: true,
      data: comment,
      message: '评论添加成功',
    });
  } catch (error) {
    next(error);
  }
};

// 获取统计摘要
exports.getSummary = async (req, res, next) => {
  try {
    const summary = await Ticket.getSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// 获取趋势数据
exports.getTrend = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    
    const trend = await Ticket.getTrend(parseInt(days));

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

