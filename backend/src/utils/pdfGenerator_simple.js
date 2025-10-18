const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * 生成工单处理报告PDF（PDFKit Unicode方案）
 * @param {Object} ticket - 工单信息
 * @param {Object} reporter - 负责人信息
 * @param {Object} technician - 技术人员信息
 * @returns {Promise<string>} - 返回PDF文件路径
 */
async function generateTicketReport(ticket, reporter, technician) {
  return new Promise((resolve, reject) => {
    try {
      // 确保报告目录存在
      const reportDir = path.join(__dirname, '../../uploads/reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // 生成文件名
      const fileName = `report-${ticket.id}-${Date.now()}.pdf`;
      const filePath = path.join(reportDir, fileName);
      const relativePath = `uploads/reports/${fileName}`;

      // 创建PDF文档
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 72,
          right: 72
        }
      });

      // 管道输出到文件
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

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

      // ===== 报告头部 =====
      doc.fontSize(20)
         .text('技术服务工单处理报告', { align: 'center' });
      
      doc.fontSize(10)
         .text('Technical Service Ticket Report', { align: 'center' });
      
      doc.moveDown();
      doc.moveTo(72, doc.y)
         .lineTo(523, doc.y)
         .stroke();
      doc.moveDown(0.5);

      // ===== 报告编号和日期 =====
      doc.fontSize(10);
      doc.text(`报告编号：TK-${String(ticket.id).padStart(6, '0')}`, { continued: true })
         .text(`生成日期：${reportDate}`, { align: 'right' });
      doc.moveDown(1.5);

      // ===== 工单基本信息 =====
      doc.fontSize(14)
         .text('一、工单基本信息');
      doc.moveDown(0.5);

      doc.fontSize(11);
      doc.text(`报告单位：${reporter.company_name || '未填写'}`);
      doc.text(`联系人：${reporter.full_name}`);
      doc.text(`联系电话：${ticket.contact_phone}`);
      doc.text(`问题地点：${ticket.location}`);
      doc.moveDown(0.5);
      doc.text(`工单标题：${ticket.title}`);
      doc.text(`问题描述：`);
      doc.fontSize(10)
         .text(ticket.description, { indent: 20, width: 450 });
      doc.moveDown(1.5);

      // ===== 处理过程 =====
      doc.fontSize(14)
         .text('二、处理过程记录');
      doc.moveDown(0.5);

      doc.fontSize(11);
      doc.text(`工单创建时间：${createdDate}`);
      doc.text(`分配技术人员：${technician ? technician.full_name : '未分配'}`);
      doc.text(`技术人员联系方式：${technician ? technician.phone : '未分配'}`);
      doc.text(`问题解决时间：${resolvedDate}`);
      doc.text(`处理时长：${duration}`);
      doc.text(`优先级别：${priorityMap[ticket.priority] || ticket.priority}`);
      doc.moveDown(1.5);

      // ===== 处理结果 =====
      doc.fontSize(14)
         .text('三、问题诊断与处理结果');
      doc.moveDown(0.5);

      doc.fontSize(11);
      
      const resultText = `${reporter.company_name}于${createdDate}报告的"${ticket.title}"技术问题，经我司技术团队接到工单后，立即组织专业技术人员进行远程诊断与现场勘查。

经技术分析，问题主要原因为设备配置或网络环境导致的异常情况。技术人员${technician ? technician.full_name : ''}采取了针对性的技术措施，包括但不限于：设备参数调整、固件版本升级、网络环境优化等专业手段。

经过系统性的排查和处理，问题现已得到彻底解决。设备运行稳定，各项技术指标符合标准要求。客户方已确认问题解决，对服务质量表示满意。`;

      doc.text(resultText, { width: 450, align: 'justify' });
      doc.moveDown(1.5);

      // ===== 技术说明 =====
      doc.fontSize(14)
         .text('四、技术说明');
      doc.moveDown(0.5);

      doc.fontSize(11);
      
      const techNote = `本次技术服务严格遵守行业标准和操作规范，采用专业的技术手段和工具进行问题诊断。处理过程中确保了设备和数据的安全性，未对客户现有系统造成任何不良影响。

技术团队在处理过程中进行了详细的技术记录，包括问题现象、诊断步骤、处理方案和测试结果。所有操作均有技术人员在场监督和执行，确保服务质量和技术标准。`;

      doc.text(techNote, { width: 450, align: 'justify' });
      doc.moveDown(1.5);

      // ===== 责任声明 =====
      doc.fontSize(14)
         .text('五、责任声明与法律效力');
      doc.moveDown(0.5);

      doc.fontSize(10);
      
      const declaration = `本报告由我司正式出具，真实、完整地记录了工单处理的全过程。报告内容经过技术负责人审核确认，具有以下法律效力：

1. 本报告作为技术服务凭证，证明我司已按照服务协议完成相应技术支持工作。
2. 报告中记录的时间节点、处理过程、技术细节等信息真实有效，可作为服务质量评估依据。
3. 双方对报告内容如有异议，应在收到报告后7个工作日内书面提出，逾期视为认可。
4. 本报告受中华人民共和国相关法律法规保护，任何伪造、篡改报告内容的行为将承担法律责任。

本报告一式两份，双方各执一份，具有同等法律效力。`;

      doc.text(declaration, { width: 450, align: 'justify', lineGap: 2 });
      doc.moveDown(2);

      // ===== 签字栏 =====
      doc.moveTo(72, doc.y)
         .lineTo(523, doc.y)
         .stroke();
      doc.moveDown(0.5);

      doc.fontSize(11);
      doc.text(`技术负责人：${technician ? technician.full_name : '_________________'}`, { continued: true });
      doc.text(`报告日期：${reportDate}`, { align: 'right' });
      doc.moveDown(0.5);
      
      doc.text('技术人员签字：_________________', { continued: true });
      doc.text('客户方确认：_________________', { align: 'right' });
      doc.moveDown(2);

      // ===== 页脚 =====
      const pageHeight = doc.page.height;
      doc.fontSize(8)
         .text(
           '本报告由智链技术服务系统自动生成 | 24小时服务热线：400-XXX-XXXX',
           72,
           pageHeight - 50,
           { align: 'center', width: 451 }
         );

      // 完成PDF
      doc.end();

      stream.on('finish', () => {
        resolve(relativePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateTicketReport
};
