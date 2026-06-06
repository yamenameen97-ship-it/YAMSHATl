import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Table, Tag, Space, Typography, Statistic, Row, Col } from 'antd';
import { WalletOutlined, ArrowUpOutlined, ArrowDownOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const WalletSettings = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch wallet balance and transactions from billing service
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      // API call to /api/billing/balance
      const response = await fetch('/api/billing/balance');
      const data = await response.json();
      setBalance(data.balance || 0);
    } catch (error) {
      console.error('Failed to fetch balance', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // API call to /api/billing/transactions
      const response = await fetch('/api/billing/transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'النوع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'deposit' ? 'green' : 'red'}>
          {type === 'deposit' ? 'إيداع' : 'سحب'}
        </Tag>
      ),
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text type={amount > 0 ? 'success' : 'danger'}>
          {amount > 0 ? `+${amount}` : amount} $
        </Text>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'blue' : 'orange'}>
          {status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="wallet-settings">
      <Title level={3}><WalletOutlined /> المحفظة الإلكترونية</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="الرصيد الحالي"
              value={balance}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<WalletOutlined />}
              suffix="$"
            />
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<ArrowUpOutlined />}>شحن الرصيد</Button>
              <Button icon={<ArrowDownOutlined />}>سحب الأرباح</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={<span><HistoryOutlined /> سجل العمليات</span>} style={{ marginTop: 24 }}>
        <Table
          dataSource={transactions}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

export default WalletSettings;
