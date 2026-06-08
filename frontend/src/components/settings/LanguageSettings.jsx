import React, { useState } from 'react';
import { Card, Select, Typography, Divider, message } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const LanguageSettings = () => {
  const [currentLang, setCurrentLang] = useState('ar');

  const handleLanguageChange = (value) => {
    setCurrentLang(value);
    // In a real app, this would trigger a re-render with new translations
    // and potentially call the i18n-service to fetch phrases
    message.loading({ content: 'جاري تغيير اللغة...', key: 'langChange' });
    setTimeout(() => {
      message.success({ content: 'تم تغيير اللغة بنجاح', key: 'langChange' });
      // window.location.reload(); // Reload to apply language changes
    }, 1000);
  };

  return (
    <Card title={<span><GlobalOutlined /> إعدادات اللغة والتوسع العالمي</span>}>
      <div style={{ marginBottom: 24 }}>
        <Text strong>لغة العرض المفضلة</Text>
        <div style={{ marginTop: 8 }}>
          <Select 
            defaultValue={currentLang} 
            style={{ width: 200 }} 
            onChange={handleLanguageChange}
          >
            <Option value="ar">العربية (Arabic)</Option>
            <Option value="en">English</Option>
            <Option value="fr">Français (French)</Option>
            <Option value="tr">Türkçe (Turkish)</Option>
          </Select>
        </div>
      </div>
      
      <Divider />
      
      <div>
        <Text type="secondary">
          يتم توفير الترجمات عبر خدمة Yamshat i18n الذكية لضمان أفضل تجربة مستخدم عالمية.
        </Text>
      </div>
    </Card>
  );
};

export default LanguageSettings;
