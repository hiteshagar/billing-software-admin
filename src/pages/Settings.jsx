import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Divider,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;

export default function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/settings');
        const settings = data.settings || data;
        form.setFieldsValue({
          accountant_email: settings.accountant_email || '',
          accountant_whatsapp: settings.accountant_whatsapp || '',
        });
      } catch (err) {
        message.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await api.put('/admin/settings', values);
      message.success('Settings saved successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save settings';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Settings</Title>

      <Card
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            Application Settings
          </span>
        }
        style={{ maxWidth: 600 }}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            size="large"
          >
            <Divider orientation="left" plain>
              <Text type="secondary" style={{ fontSize: 13 }}>Contact Information</Text>
            </Divider>

            <Form.Item
              name="accountant_email"
              label="Accountant Email"
              rules={[
                { required: true, message: 'Please enter accountant email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input type="email" placeholder="accountant@example.com" />
            </Form.Item>

            <Form.Item
              name="accountant_whatsapp"
              label="Accountant WhatsApp Number"
              rules={[
                { required: true, message: 'Please enter WhatsApp number' },
                {
                  pattern: /^\+?[0-9]{10,15}$/,
                  message: 'Please enter a valid phone number (e.g. +91XXXXXXXXXX)',
                },
              ]}
              extra='Include country code, e.g. "+91XXXXXXXXXX"'
            >
              <Input placeholder="+91XXXXXXXXXX" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
                size="large"
              >
                Save Settings
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
