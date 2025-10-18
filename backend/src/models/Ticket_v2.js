const { query } = require('../config/database');

class Ticket {
  // 创建工单（带图片）
  static async create({ title, description, location, contactPhone, priority, reporterId, images = [] }) {
    const client = await require('../config/database').pool.connect();
    
    try {
      await client.query('BEGIN');

      // 插入工单
      const ticketResult = await client.query(
        `INSERT INTO tickets (title, description, location, contact_phone, priority, reporter_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [title, description, location, contactPhone, priority, reporterId]
      );

      const ticket = ticketResult.rows[0];

      // 插入图片
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await client.query(
            `INSERT INTO ticket_images (ticket_id, image_path, image_order, file_size)
             VALUES ($1, $2, $3, $4)`,
            [ticket.id, images[i].path, i + 1, images[i].size]
          );
        }
      }

      // 记录创建事件
      await client.query(
        `INSERT INTO events (ticket_id, event_type, actor_id, description)
         VALUES ($1, 'created', $2, '创建工单')`,
        [ticket.id, reporterId]
      );

      await client.query('COMMIT');
      return ticket;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 获取工单列表（分页、搜索、筛选）
  static async findAll({ page = 1, pageSize = 10, q = '', status = 'all', priority = 'all', userId, userRole }) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // 角色过滤
    if (userRole === 'reporter') {
      // 负责人只能看自己的工单
      params.push(userId);
      whereClause += ` AND t.reporter_id = $${paramIndex}`;
      paramIndex++;
    } else if (userRole === 'technician') {
      // 技术人员看分配给自己的工单
      params.push(userId);
      whereClause += ` AND t.technician_id = $${paramIndex}`;
      paramIndex++;
    }
    // admin 可以看所有工单

    // 搜索条件
    if (q) {
      params.push(`%${q}%`);
      whereClause += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex} OR t.location ILIKE $${paramIndex})`;
      paramIndex++;
    }

    // 状态筛选
    if (status !== 'all') {
      params.push(status);
      whereClause += ` AND t.status = $${paramIndex}`;
      paramIndex++;
    }

    // 优先级筛选
    if (priority !== 'all') {
      params.push(priority);
      whereClause += ` AND t.priority = $${paramIndex}`;
      paramIndex++;
    }

    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) FROM tickets t ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // 查询数据
    params.push(pageSize, offset);
    const result = await query(
      `SELECT t.*,
              reporter.full_name as reporter_name,
              reporter.company_name as reporter_company,
              technician.full_name as technician_name,
              admin_user.full_name as assigned_by_name
       FROM tickets t
       LEFT JOIN users reporter ON t.reporter_id = reporter.id
       LEFT JOIN users technician ON t.technician_id = technician.id
       LEFT JOIN users admin_user ON t.assigned_by = admin_user.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取工单详情（含图片和评论）
  static async findById(id) {
    const ticketResult = await query(
      `SELECT t.*,
              reporter.full_name as reporter_name,
              reporter.company_name as reporter_company,
              reporter.email as reporter_email,
              reporter.phone as reporter_phone,
              reporter.full_name as reporter_full_name,
              technician.full_name as technician_name,
              technician.email as technician_email,
              technician.phone as technician_phone,
              technician.full_name as technician_full_name
       FROM tickets t
       LEFT JOIN users reporter ON t.reporter_id = reporter.id
       LEFT JOIN users technician ON t.technician_id = technician.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return null;
    }

    const ticket = ticketResult.rows[0];

    // 获取图片
    const imagesResult = await query(
      `SELECT * FROM ticket_images WHERE ticket_id = $1 ORDER BY image_order ASC`,
      [id]
    );
    ticket.images = imagesResult.rows;

    // 获取评论
    const commentsResult = await query(
      `SELECT c.*, u.username as author_name, u.full_name as author_full_name
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    ticket.comments = commentsResult.rows;

    return ticket;
  }

  // 更新工单
  static async update(id, updates, actorId) {
    const allowedFields = ['title', 'description', 'location', 'contact_phone', 'status', 'priority', 'technician_id'];
    const setClause = [];
    const params = [];
    let paramIndex = 1;

    // 获取旧数据
    const oldTicket = await query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (oldTicket.rows.length === 0) {
      throw new Error('工单不存在');
    }
    const oldData = oldTicket.rows[0];

    // 构建更新语句
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;

        // 记录变更事件
        let eventType = null;
        let description = '';
        
        if (key === 'technician_id' && oldData[key] !== value) {
          eventType = 'assigned';
          description = '工单已分配';
        } else if (key === 'status' && oldData[key] !== value) {
          eventType = 'status_changed';
          description = `状态从 ${oldData[key]} 变更为 ${value}`;
        } else if (key === 'priority' && oldData[key] !== value) {
          eventType = 'priority_changed';
          description = `优先级从 ${oldData[key]} 变更为 ${value}`;
        }
        
        if (eventType) {
          await query(
            `INSERT INTO events (ticket_id, event_type, actor_id, old_value, new_value, description)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, eventType, actorId, String(oldData[key] || ''), String(value || ''), description]
          );
        }
      }
    }

    if (setClause.length === 0) {
      throw new Error('没有可更新的字段');
    }

    params.push(id);
    const result = await query(
      `UPDATE tickets
       SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  // 分配工单（管理员功能）
  static async assign(ticketId, technicianId, adminId) {
    const result = await query(
      `UPDATE tickets
       SET technician_id = $1, assigned_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [technicianId, adminId, ticketId]
    );

    if (result.rows.length === 0) {
      throw new Error('工单不存在');
    }

    // 记录分配事件
    await query(
      `INSERT INTO events (ticket_id, event_type, actor_id, new_value, description)
       VALUES ($1, 'assigned', $2, $3, '工单已分配给技术人员')`,
      [ticketId, adminId, String(technicianId)]
    );

    // 添加评论
    const techResult = await query('SELECT full_name FROM users WHERE id = $1', [technicianId]);
    const techName = techResult.rows[0]?.full_name || '技术人员';
    
    await query(
      `INSERT INTO comments (ticket_id, author_id, content, comment_type)
       VALUES ($1, $2, $3, 'assignment')`,
      [ticketId, adminId, `已将此工单分配给${techName}处理`]
    );

    return result.rows[0];
  }

  // 删除工单（仅待处理状态下，且是创建者）
  static async delete(id, userId, userRole) {
    const ticket = await query('SELECT * FROM tickets WHERE id = $1', [id]);
    
    if (ticket.rows.length === 0) {
      throw new Error('工单不存在');
    }

    const ticketData = ticket.rows[0];

    // 只有待处理状态可以删除
    if (ticketData.status !== 'pending') {
      throw new Error('只能删除待处理状态的工单');
    }

    // 只有创建者可以删除自己的工单
    if (userRole !== 'admin' && ticketData.reporter_id !== userId) {
      throw new Error('只能删除自己创建的工单');
    }

    // 记录删除事件
    await query(
      `INSERT INTO events (ticket_id, event_type, actor_id, description)
       VALUES ($1, 'deleted', $2, '工单已删除')`,
      [id, userId]
    );

    const result = await query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // 添加评论
  static async addComment(ticketId, authorId, content, commentType = 'comment') {
    const result = await query(
      `INSERT INTO comments (ticket_id, author_id, content, comment_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ticketId, authorId, content, commentType]
    );

    if (commentType === 'comment') {
      await query(
        `INSERT INTO events (ticket_id, event_type, actor_id, description)
         VALUES ($1, 'created', $2, '添加评论')`,
        [ticketId, authorId]
      );
    }

    return result.rows[0];
  }

  // 更新报告文件路径
  static async updateReport(ticketId, reportPath) {
    const result = await query(
      `UPDATE tickets
       SET report_file = $1, report_generated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reportPath, ticketId]
    );

    return result.rows[0];
  }

  // 获取统计摘要
  static async getSummary(userId, userRole) {
    let whereClause = '';
    const params = [];

    if (userRole === 'reporter') {
      whereClause = 'WHERE reporter_id = $1';
      params.push(userId);
    } else if (userRole === 'technician') {
      whereClause = 'WHERE technician_id = $1';
      params.push(userId);
    }

    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count
      FROM tickets
      ${whereClause}
    `, params);

    return result.rows[0];
  }

  // 获取趋势数据
  static async getTrend(days = 7, userId, userRole) {
    let whereClause = '';
    const params = [days];

    if (userRole === 'reporter') {
      whereClause = 'AND t.reporter_id = $2';
      params.push(userId);
    } else if (userRole === 'technician') {
      whereClause = 'AND t.technician_id = $2';
      params.push(userId);
    }

    const result = await query(
      `SELECT
        DATE(e.created_at) as date,
        COUNT(*) FILTER (WHERE e.event_type = 'created') as created_count,
        COUNT(*) FILTER (WHERE e.event_type = 'status_changed' AND e.new_value = 'resolved') as resolved_count
      FROM events e
      JOIN tickets t ON e.ticket_id = t.id
      WHERE e.created_at >= CURRENT_DATE - ($1 || ' days')::interval
      ${whereClause}
      GROUP BY DATE(e.created_at)
      ORDER BY date ASC`,
      params
    );

    return result.rows;
  }

  // 获取技术人员列表
  static async getTechnicians() {
    const result = await query(
      `SELECT id, username, full_name, email, phone
       FROM users
       WHERE role = 'technician'
       ORDER BY full_name ASC`
    );
    return result.rows;
  }
}

module.exports = Ticket;

