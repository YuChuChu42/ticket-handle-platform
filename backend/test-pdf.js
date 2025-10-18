const { generateTicketReport } = require('./src/utils/pdfGenerator_html');

// 测试数据
const testTicket = {
  id: 999,
  title: '测试工单标题',
  description: '这是一个测试工单的描述，用于验证中文显示是否正常。',
  location: '北京市朝阳区测试地址',
  contact_phone: '13800138000',
  priority: 'high',
  status: 'resolved',
  created_at: new Date('2023-10-18T10:00:00Z'),
  resolved_at: new Date('2023-10-18T18:00:00Z')
};

const testReporter = {
  company_name: '测试公司',
  full_name: '测试负责人',
  phone: '13800138001'
};

const testTechnician = {
  full_name: '测试技术员',
  phone: '13800138002'
};

async function testPDF() {
  try {
    console.log('🚀 开始测试PDF生成...');
    const result = await generateTicketReport(testTicket, testReporter, testTechnician);
    console.log('✅ PDF生成成功:', result);
  } catch (error) {
    console.error('❌ PDF生成失败:', error);
  }
}

testPDF();
