import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Popconfirm,
  Typography,
  message,
  Upload,
  Checkbox,
  Alert,
  Empty,
  Row,
  Col,
  Form,
  Input,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  KeyOutlined,
  InboxOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import api from '../api/axios';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add employee form modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [adding, setAdding] = useState(false);
  // Shown after single employee creation
  const [singleCredential, setSingleCredential] = useState(null);

  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Credentials modal (shown after successful CSV upload)
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [passwordsSaved, setPasswordsSaved] = useState(false);

  // Reset password modal
  const [resetPasswordModal, setResetPasswordModal] = useState({ open: false, password: '', employeeName: '' });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/employees');
      setEmployees(data.employees || data || []);
    } catch (err) {
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = async (values) => {
    setAdding(true);
    try {
      const { data } = await api.post('/admin/employees', { name: values.name.trim() });
      addForm.resetFields();
      setAddModalOpen(false);
      setSingleCredential({
        employee_id: data.employee.employee_id,
        name: data.employee.name,
        password: data.password,
      });
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add employee';
      message.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/employees/${id}`);
      message.success('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete employee';
      message.error(msg);
    }
  };

  const handleResetPassword = async (record) => {
    try {
      const { data } = await api.put(`/admin/employees/${record.id}/reset-password`);
      setResetPasswordModal({
        open: true,
        password: data.new_password || data.password || '',
        employeeName: record.name,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password';
      message.error(msg);
    }
  };

  const handleUploadCSV = async () => {
    if (!uploadFile) {
      message.warning('Please select a CSV file first');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const { data } = await api.post('/admin/employees/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created = data.employees || data.created || [];
      setCredentials(created);
      setPasswordsSaved(false);
      setUploadModalOpen(false);
      setUploadFile(null);
      setCredentialsModalOpen(true);
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload CSV';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Employee ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Reset Password"
            description={`Reset password for ${record.name}?`}
            onConfirm={() => handleResetPassword(record)}
            okText="Yes, Reset"
            cancelText="Cancel"
          >
            <Button type="default" icon={<KeyOutlined />} size="small">
              Reset Password
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete Employee"
            description={`Are you sure you want to delete ${record.name}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button type="text" icon={<DeleteOutlined />} danger size="small" title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const credentialsColumns = [
    { title: 'Employee ID', dataIndex: 'employee_id', key: 'employee_id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
      render: (v) => (
        <Text code style={{ color: '#cf1322' }}>{v}</Text>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Employees</Title>

      <Row justify="end" gutter={8} style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
            Add Employee
          </Button>
        </Col>
        <Col>
          <Button icon={<UploadOutlined />} onClick={() => { setUploadFile(null); setUploadModalOpen(true); }}>
            Upload CSV
          </Button>
        </Col>
      </Row>

      <Table
        dataSource={employees}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: <Empty description="No employees found" /> }}
      />

      {/* Add Employee Modal */}
      <Modal
        title="Add Employee"
        open={addModalOpen}
        onCancel={() => { setAddModalOpen(false); addForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddEmployee} style={{ marginTop: 8 }}>
          <Form.Item
            name="name"
            label="Employee Name"
            rules={[{ required: true, message: 'Please enter employee name' }]}
          >
            <Input placeholder="Enter full name" autoFocus />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setAddModalOpen(false); addForm.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={adding}>
                Add Employee
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Single employee credential modal */}
      <Modal
        title="Employee Created"
        open={!!singleCredential}
        closable={false}
        maskClosable={false}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setSingleCredential(null)}
          >
            I have saved the password — Close
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          showIcon
          message="This password is only shown once. Save it before closing."
          style={{ marginBottom: 16 }}
        />
        {singleCredential && (
          <div style={{ lineHeight: 2 }}>
            <div><Text type="secondary">Employee ID:</Text> <Text strong>{singleCredential.employee_id}</Text></div>
            <div><Text type="secondary">Name:</Text> <Text strong>{singleCredential.name}</Text></div>
            <div>
              <Text type="secondary">Password:</Text>{' '}
              <Text code style={{ fontSize: 16, color: '#cf1322' }}>{singleCredential.password}</Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload CSV Modal */}
      <Modal
        title="Upload Employees CSV"
        open={uploadModalOpen}
        onCancel={() => { setUploadModalOpen(false); setUploadFile(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setUploadModalOpen(false); setUploadFile(null); }}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={handleUploadCSV}
            disabled={!uploadFile}
          >
            Upload
          </Button>,
        ]}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <a href="/api/admin/employees/template" download>
            <Button icon={<DownloadOutlined />} size="small">Download Template</Button>
          </a>
        </div>
        <Dragger
          accept=".csv"
          beforeUpload={(file) => { setUploadFile(file); return false; }}
          onRemove={() => setUploadFile(null)}
          fileList={uploadFile ? [uploadFile] : []}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Click or drag a CSV file here to upload</p>
          <p className="ant-upload-hint">Only .csv files are accepted</p>
        </Dragger>
      </Modal>

      {/* Credentials Modal — shown after successful CSV upload */}
      <Modal
        title="Employee Credentials"
        open={credentialsModalOpen}
        closable={false}
        maskClosable={false}
        footer={[
          <Button
            key="ok"
            type="primary"
            disabled={!passwordsSaved}
            onClick={() => { setCredentialsModalOpen(false); setCredentials([]); setPasswordsSaved(false); }}
          >
            I have saved the passwords — Close
          </Button>,
        ]}
        width={700}
      >
        <Alert
          type="warning"
          showIcon
          message="These passwords are only shown once. Please record them before closing."
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={credentials}
          columns={credentialsColumns}
          rowKey={(r, i) => r.employee_id || i}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
        />
        <Checkbox checked={passwordsSaved} onChange={(e) => setPasswordsSaved(e.target.checked)}>
          I have saved the passwords
        </Checkbox>
      </Modal>

      {/* Reset Password Result Modal */}
      <Modal
        title="Password Reset Successful"
        open={resetPasswordModal.open}
        onCancel={() => setResetPasswordModal({ open: false, password: '', employeeName: '' })}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setResetPasswordModal({ open: false, password: '', employeeName: '' })}
          >
            Close
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          showIcon
          message="Save this password now — it will not be shown again."
          style={{ marginBottom: 16 }}
        />
        <p><Text>New password for <strong>{resetPasswordModal.employeeName}</strong>:</Text></p>
        <Text code style={{ fontSize: 18, color: '#cf1322' }}>{resetPasswordModal.password}</Text>
      </Modal>
    </div>
  );
}
