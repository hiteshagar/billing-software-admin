import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { SafetyCertificateOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useAuth } from '../store/auth';
import api from '../api/axios';

const { Title, Text } = Typography;

export default function VerifyOTP() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { tempToken, setToken, setTempToken } = useAuth();

  const handleSubmit = async (values) => {
    if (!tempToken) {
      message.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/admin/auth/verify-otp', {
        tempToken,
        otp: values.otp,
      });
      flushSync(() => {
        setToken(data.token);
        setTempToken(null);
      });
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Card className="login-card" bordered={false}>
        <div className="login-logo">
          <SafetyCertificateOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          <Title level={3} style={{ margin: '8px 0 4px', color: '#1677ff' }}>
            Verify OTP
          </Title>
          <Text type="secondary">Enter the 6-digit OTP sent to your email</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="otp"
            label="One-Time Password"
            rules={[
              { required: true, message: 'Please enter the OTP' },
              { len: 6, message: 'OTP must be exactly 6 digits' },
              { pattern: /^\d{6}$/, message: 'OTP must contain only digits' },
            ]}
          >
            <Input
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Verify OTP
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Button
              type="link"
              onClick={() => navigate('/login')}
              style={{ padding: 0 }}
            >
              Back to Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
