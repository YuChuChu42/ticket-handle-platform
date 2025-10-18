const { query } = require('../config/database');

class Ticket {
  // 创建工单
  static async create({ title, description, priority, creatorId }) {
    const result = await query(
      `INSERT INTO tickets (title, description, priority, creator_id, status)
       VALUES ($1, $2, $3, $4, 'open')
       RETURNING *`,
      [title, description, priority, creatorId]
    );
    
    // 记录创建事件
    await query(
      `INSERT INTO events (ticket_id, type, actor_id)
       VALUES ($1, 'created', $2)`,
      [result.rows[0].id, creatorId]
    );
    
    return result.rows[0];
  }

  // 获取工单列表（分页、搜索、筛选）
  static async findAll({ page = 1, pageSize = 10, q = '', status = 'all', priority = 'all' }) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // 搜索条件
    if (q) {
      params.push(`%${q}%`);
      whereClause += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
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
              creator.username as creator_name,
              assignee.username as assignee_name
       FROM tickets t
       LEFT JOIN users creator ON t.creator_id = creator.id
       LEFT JOIN users assignee ON t.assignee_id = assignee.id
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

  // 通过ID获取工单详情（含评论）
  static async findById(id) {
    const ticketResult = await query(
      `SELECT t.*,
              creator.username as creator_name,
              creator.email as creator_email,
              assignee.username as assignee_name,
              assignee.email as assignee_email
       FROM tickets t
       LEFT JOIN users creator ON t.creator_id = creator.id
       LEFT JOIN users assignee ON t.assignee_id = assignee.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return null;
    }

    // 获取评论
    const commentsResult = await query(
      `SELECT c.*, u.username as author_name
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    return {
      ...ticketResult.rows[0],
      comments: commentsResult.rows,
    };
  }

  // 更新工单
  static async update(id, updates, actorId) {
    const allowedFields = ['title', 'description', 'status', 'priority', 'assignee_id'];
    const setClause = [];
    const params = [];
    let paramIndex = 1;

    // 记录变更前的值（用于事件记录）
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
        const eventType = key === 'assignee_id' ? 'assigned' :
                         key === 'status' ? 'status_changed' :
                         key === 'priority' ? 'priority_changed' : null;
        
        if (eventType) {
          await query(
            `INSERT INTO events (ticket_id, type, actor_id, old_value, new_value)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, eventType, actorId, String(oldData[key] || ''), String(value || '')]
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

  // 删除工单
  static async delete(id) {
    const result = await query(
      'DELETE FROM tickets WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // 添加评论
  static async addComment(ticketId, authorId, content) {
    const result = await query(
      `INSERT INTO comments (ticket_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ticketId, authorId, content]
    );

    // 记录评论事件
    await query(
      `INSERT INTO events (ticket_id, type, actor_id)
       VALUES ($1, 'commented', $2)`,
      [ticketId, authorId]
    );

    return result.rows[0];
  }

  // 获取统计摘要
  static async getSummary() {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_count,
        COUNT(*) FILTER (WHERE status = 'open') as open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_count
      FROM tickets
    `);

    return result.rows[0];
  }

  // 获取趋势数据
  static async getTrend(days = 7) {
    const result = await query(
      `SELECT
        DATE(e.created_at) as date,
        COUNT(*) FILTER (WHERE e.type = 'created') as created_count,
        COUNT(*) FILTER (WHERE e.type = 'status_changed' AND e.new_value = 'resolved') as resolved_count
      FROM events e
      WHERE e.created_at >= CURRENT_DATE - $1
      GROUP BY DATE(e.created_at)
      ORDER BY date ASC`,
      [days]
    );

    return result.rows;
  }
}

module.exports = Ticket;

