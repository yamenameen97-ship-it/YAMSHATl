import React, { useState } from 'react';
import { Card, Switch, Button, Typography, Divider, List, Modal, Input, message } from 'antd';
import { SafetyCertificateOutlined, LockOutlined, KeyOutlined, MobileOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const SecuritySettingsPage = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handle2FAToggle = (checked) => {
    if (checked) {
      setIsModalVisible(true);
    } else {
      setIs2FAEnabled(false);
      message.success('تم تعطيل المصادقة الثنائية بنجاح');
    }
  };

  const handleVerify = () => {
    if (verificationCode === '123456') { // Mock verification
      setIs2FAEnabled(true);
      setIsModalVisible(false);
      message.success('تم تفعيل المصادقة الثنائية بنجاح');
    } else {
      message.error('رمز التحقق غير صحيح');
    }
  };

  const securityLogs = [
    { title: 'تسجيل دخول جديد', description: 'من متصفح Chrome على Windows', date: '2023-10-27 10:30' },
    { title: 'تغيير كلمة المرور', description: 'تم تحديث كلمة المرور بنجاح', date: '2023-10-25 14:20' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}><SafetyCertificateOutlined /> إعدادات الأمان</Title>
      <Paragraph>إدارة أمان حسابك وحمايته من الوصول غير المصرح به.</Paragraph>

      <Card title={<span><LockOutlined /> المصادقة الثنائية (2FA)</span>}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>تفعيل المصادقة الثنائية</Text>
            <br />
            <Text type="secondary">إضافة طبقة حماية إضافية لحسابك عند تسجيل الدخول.</Text>
          </div>
          <Switch checked={is2FAEnabled} onChange={handle2FAToggle} />
        </div>
        {is2FAEnabled && (
          <div style={{ marginTop: 16 }}>
            <Button icon={<KeyOutlined />}>عرض رموز الاسترداد</Button>
          </div>
        )}
      </Card>

      <Divider />

      <Card title={<span><MobileOutlined /> الأجهزة المرتبطة</span>}>
        <List
          itemLayout="horizontal"
          dataSource={securityLogs}
          renderItem={item => (
            <List.Item actions={[<Button type="link" danger>تسجيل الخروج</Button>]}>
              <List.Item.Meta
                title={item.title}
                description={`${item.description} - ${item.date}`}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="تفعيل المصادقة الثنائية"
        visible={isModalVisible}
        onOk={handleVerify}
        onCancel={() => setIsModalVisible(false)}
        okText="تحقق"
        cancelText="إلغاء"
      >
        <Paragraph>يرجى إدخال الرمز المرسل إلى هاتفك أو تطبيق المصادقة:</Paragraph>
        <Input 
          placeholder="000000" 
          value={verificationCode} 
          onChange={(e) => setVerificationCode(e.target.value)} 
          maxLength={6}
        />
      </Modal>
    </div>
  );
};

export default SecuritySettingsPage;
