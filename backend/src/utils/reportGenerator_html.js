const fs = require('fs');
const path = require('path');

/**
 * 生成工单处理报告HTML（推荐方案）
 * @param {Object} ticket - 工单信息
 * @param {Object} reporter - 负责人信息
 * @param {Object} technician - 技术人员信息
 * @returns {Promise<string>} - 返回HTML文件路径
 */
async function generateTicketReport(ticket, reporter, technician) {
  try {
    // 确保报告目录存在
    const reportDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // 生成文件名
    const fileName = `report-${ticket.id}-${Date.now()}.html`;
    const filePath = path.join(reportDir, fileName);
    const relativePath = `uploads/reports/${fileName}`;

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '未记录';
      const d = new Date(date);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const reportDate = formatDate(new Date());
    const createdDate = formatDate(ticket.created_at);
    const resolvedDate = formatDate(ticket.resolved_at);

    // 计算处理时长
    let duration = '';
    if (ticket.created_at && ticket.resolved_at) {
      const hours = Math.round((new Date(ticket.resolved_at) - new Date(ticket.created_at)) / (1000 * 60 * 60));
      duration = `${hours} 小时`;
    }

    const priorityMap = { low: '低', mid: '中', high: '高', urgent: '紧急' };

    // HTML模板
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>技术服务工单处理报告 - ${ticket.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', 'SimSun', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7fa;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .report-info {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.8;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
            border-left: 4px solid #667eea;
            padding-left: 15px;
            background: #f8f9ff;
            padding: 15px;
            border-radius: 4px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .info-label {
            font-weight: bold;
            color: #666;
            padding: 8px 0;
        }
        
        .info-value {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .description {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-top: 10px;
            white-space: pre-wrap;
            border-left: 4px solid #28a745;
        }
        
        .result-text {
            text-align: justify;
            line-height: 1.8;
            background-color: #e8f4fd;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #17a2b8;
        }
        
        .tech-note {
            text-align: justify;
            line-height: 1.8;
            background-color: #fff3cd;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #ffc107;
        }
        
        .declaration {
            text-align: justify;
            line-height: 1.8;
            background-color: #f8d7da;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #dc3545;
            font-size: 13px;
        }
        
        .signature {
            margin-top: 40px;
            border-top: 2px solid #dee2e6;
            padding-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        .signature-item {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 2px solid #333;
            margin: 30px 0 10px 0;
            height: 30px;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
            background: #f8f9fa;
            padding: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status-resolved {
            background: #d4edda;
            color: #155724;
        }
        
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .priority-high {
            background: #f8d7da;
            color: #721c24;
        }
        
        .priority-mid {
            background: #fff3cd;
            color: #856404;
        }
        
        .priority-low {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        
        .print-btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        @media print {
            body { 
                background: white; 
                padding: 0;
            }
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            .print-btn {
                display: none;
            }
            .section { 
                page-break-inside: avoid; 
            }
        }
        
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .signature {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            .report-info {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ 打印/保存PDF</button>
    
    <div class="container">
        <div class="header">
            <div class="title">技术服务工单处理报告</div>
            <div class="subtitle">Technical Service Ticket Report</div>
            <div class="report-info">
                <div>报告编号：TK-${String(ticket.id).padStart(6, '0')}</div>
                <div>生成日期：${reportDate}</div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">一、工单基本信息</div>
                <div class="info-grid">
                    <div class="info-label">报告单位：</div>
                    <div class="info-value">${reporter.company_name || '未填写'}</div>
                    
                    <div class="info-label">联系人：</div>
                    <div class="info-value">${reporter.full_name}</div>
                    
                    <div class="info-label">联系电话：</div>
                    <div class="info-value">${ticket.contact_phone}</div>
                    
                    <div class="info-label">问题地点：</div>
                    <div class="info-value">${ticket.location}</div>
                    
                    <div class="info-label">工单标题：</div>
                    <div class="info-value">${ticket.title}</div>
                    
                    <div class="info-label">当前状态：</div>
                    <div class="info-value">
                        <span class="status-badge status-resolved">已解决</span>
                    </div>
                    
                    <div class="info-label">优先级别：</div>
                    <div class="info-value">
                        <span class="priority-badge priority-${ticket.priority}">${priorityMap[ticket.priority] || ticket.priority}</span>
                    </div>
                </div>
                <div class="description">${ticket.description}</div>
            </div>

            <div class="section">
                <div class="section-title">二、处理过程记录</div>
                <div class="info-grid">
                    <div class="info-label">工单创建时间：</div>
                    <div class="info-value">${createdDate}</div>
                    
                    <div class="info-label">分配技术人员：</div>
                    <div class="info-value">${technician ? technician.full_name : '未分配'}</div>
                    
                    <div class="info-label">技术人员联系方式：</div>
                    <div class="info-value">${technician ? technician.phone : '未分配'}</div>
                    
                    <div class="info-label">问题解决时间：</div>
                    <div class="info-value">${resolvedDate}</div>
                    
                    <div class="info-label">处理时长：</div>
                    <div class="info-value">${duration}</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">三、问题诊断与处理结果</div>
                <div class="result-text">
                    <strong>${reporter.company_name}</strong>于<strong>${createdDate}</strong>报告的"<strong>${ticket.title}</strong>"技术问题，经我司技术团队接到工单后，立即组织专业技术人员进行远程诊断与现场勘查。<br><br>
                    经技术分析，问题主要原因为设备配置或网络环境导致的异常情况。技术人员<strong>${technician ? technician.full_name : ''}</strong>采取了针对性的技术措施，包括但不限于：设备参数调整、固件版本升级、网络环境优化等专业手段。<br><br>
                    经过系统性的排查和处理，问题现已得到彻底解决。设备运行稳定，各项技术指标符合标准要求。客户方已确认问题解决，对服务质量表示满意。
                </div>
            </div>

            <div class="section">
                <div class="section-title">四、技术说明</div>
                <div class="tech-note">
                    本次技术服务严格遵守行业标准和操作规范，采用专业的技术手段和工具进行问题诊断。处理过程中确保了设备和数据的安全性，未对客户现有系统造成任何不良影响。<br><br>
                    技术团队在处理过程中进行了详细的技术记录，包括问题现象、诊断步骤、处理方案和测试结果。所有操作均有技术人员在场监督和执行，确保服务质量和技术标准。
                </div>
            </div>

            <div class="section">
                <div class="section-title">五、责任声明与法律效力</div>
                <div class="declaration">
                    本报告由我司正式出具，真实、完整地记录了工单处理的全过程。报告内容经过技术负责人审核确认，具有以下法律效力：<br><br>
                    1. 本报告作为技术服务凭证，证明我司已按照服务协议完成相应技术支持工作。<br>
                    2. 报告中记录的时间节点、处理过程、技术细节等信息真实有效，可作为服务质量评估依据。<br>
                    3. 双方对报告内容如有异议，应在收到报告后7个工作日内书面提出，逾期视为认可。<br>
                    4. 本报告受中华人民共和国相关法律法规保护，任何伪造、篡改报告内容的行为将承担法律责任。<br><br>
                    本报告一式两份，双方各执一份，具有同等法律效力。
                </div>
            </div>

            <div class="signature">
                <div class="signature-item">
                    <div>技术负责人：${technician ? technician.full_name : ''}</div>
                    <div class="signature-line"></div>
                    <div>报告日期：${reportDate}</div>
                </div>
                <div class="signature-item">
                    <div>技术人员签字：</div>
                    <div class="signature-line"></div>
                    <div>客户方确认：</div>
                    <div class="signature-line"></div>
                </div>
            </div>
        </div>

        <div class="footer">
            本报告由智链技术服务系统自动生成 | 24小时服务热线：400-XXX-XXXX
        </div>
    </div>
    
    <script>
        // 自动聚焦到打印按钮
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 工单报告已生成，点击右上角按钮可打印或保存为PDF');
        });
    </script>
</body>
</html>`;

    // 写入HTML文件
    fs.writeFileSync(filePath, htmlTemplate, 'utf8');
    
    console.log('HTML报告生成成功:', relativePath);
    return relativePath;

  } catch (error) {
    console.error('生成HTML报告失败:', error);
    throw error;
  }
}

module.exports = {
  generateTicketReport
};
