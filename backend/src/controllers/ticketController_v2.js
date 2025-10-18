const Ticket = require('../models/Ticket_v2');
const { generateTicketReport } = require('../utils/reportGenerator_html');
const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

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
      userId: req.user.id,
      userRole: req.user.role,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 创建工单（带图片上传）
exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, location, contactPhone, priority = 'mid' } = req.body;

    // 验证输入
    if (!title || !description || !location || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: '标题、描述、地点和联系电话不能为空',
      });
    }

    // 处理上传的图片
    const images = req.files ? req.files.map((file, index) => ({
      path: file.path.replace(/\\/g, '/').replace(/.*uploads/, 'uploads'),
      size: file.size,
      order: index + 1
    })) : [];

    // 图片数量验证
    if (images.length > 4) {
      return res.status(400).json({
        success: false,
        message: '最多只能上传4张图片',
      });
    }

    const ticket = await Ticket.create({
      title,
      description,
      location,
      contactPhone,
      priority,
      reporterId: req.user.id,
      images,
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

    // 权限检查
    const { role, id: userId } = req.user;
    if (role === 'reporter' && ticket.reporter_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能查看自己的工单',
      });
    }
    if (role === 'technician' && ticket.technician_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能查看分配给自己的工单',
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
    const { role, id: userId } = req.user;

    // 权限检查：负责人只能更新优先级
    if (role === 'reporter') {
      const allowedFields = ['priority'];
      const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
      if (invalidFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: '负责人只能修改优先级',
        });
      }
    }

    // 技术人员只能更新状态
    if (role === 'technician') {
      const allowedFields = ['status'];
      const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));
      if (invalidFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: '技术人员只能修改状态',
        });
      }
    }

    const ticket = await Ticket.update(id, updates, userId);

    res.json({
      success: true,
      data: ticket,
      message: '工单更新成功',
    });
  } catch (error) {
    next(error);
  }
};

// 分配工单（管理员功能）
exports.assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: '请选择技术人员',
      });
    }

    const ticket = await Ticket.assign(id, technicianId, req.user.id);

    res.json({
      success: true,
      data: ticket,
      message: '工单分配成功',
    });
  } catch (error) {
    next(error);
  }
};

// 删除工单
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.delete(id, req.user.id, req.user.role);

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
    if (error.message === '只能删除待处理状态的工单' || 
        error.message === '只能删除自己创建的工单') {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// 添加评论
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空',
      });
    }

    const comment = await Ticket.addComment(id, req.user.id, content.trim());

    res.status(201).json({
      success: true,
      data: comment,
      message: '评论添加成功',
    });
  } catch (error) {
    next(error);
  }
};

// 生成报告（技术人员功能）
exports.generateReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 获取工单详情
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '工单不存在',
      });
    }

    // 只有已解决的工单才能生成报告
    if (ticket.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: '只有已解决的工单才能生成报告',
      });
    }

    // 获取负责人和技术人员信息
    const reporterResult = await query('SELECT * FROM users WHERE id = $1', [ticket.reporter_id]);
    const technicianResult = await query('SELECT * FROM users WHERE id = $1', [ticket.technician_id]);

    const reporter = reporterResult.rows[0];
    const technician = technicianResult.rows[0];

    // 生成HTML报告
    const reportPath = await generateTicketReport(ticket, reporter, technician);

    // 更新工单的报告路径
    await Ticket.updateReport(id, reportPath);

    // 记录事件
    await query(
      `INSERT INTO events (ticket_id, event_type, actor_id, description)
       VALUES ($1, 'report_generated', $2, 'HTML报告已生成')`,
      [id, req.user.id]
    );

    res.json({
      success: true,
      data: {
        reportPath,
        downloadUrl: `/api/tickets/${id}/download-report`,
      },
      message: 'HTML报告生成成功',
    });
  } catch (error) {
    next(error);
  }
};

// 下载报告文件（支持HTML和PDF）
exports.downloadReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '工单不存在',
      });
    }

    if (!ticket.report_file) {
      return res.status(404).json({
        success: false,
        message: '报告文件不存在',
      });
    }

    const filePath = path.join(__dirname, '../../', ticket.report_file);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '报告文件未找到',
      });
    }

    // 根据文件扩展名设置Content-Type
    const ext = path.extname(ticket.report_file).toLowerCase();
    let contentType, fileName;
    
    if (ext === '.html') {
      contentType = 'text/html; charset=utf-8';
      fileName = `工单报告-${id}.html`;
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Type', contentType);
      res.sendFile(path.resolve(filePath));
    } else if (ext === '.pdf') {
      fileName = `工单报告-${id}.pdf`;
      res.download(filePath, fileName);
    } else {
      fileName = `工单报告-${id}${ext}`;
      res.download(filePath, fileName);
    }
  } catch (error) {
    next(error);
  }
};

// 获取统计摘要
exports.getSummary = async (req, res, next) => {
  try {
    const summary = await Ticket.getSummary(req.user.id, req.user.role);

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
    
    const trend = await Ticket.getTrend(parseInt(days), req.user.id, req.user.role);

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    next(error);
  }
};

// 获取技术人员列表（管理员功能）
exports.getTechnicians = async (req, res, next) => {
  try {
    const technicians = await Ticket.getTechnicians();

    res.json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    next(error);
  }
};

