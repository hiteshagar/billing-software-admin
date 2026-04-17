import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Popconfirm,
  Typography,
  message,
  Row,
  Col,
  Empty,
  Upload,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
  DownloadOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/axios';

const { Title } = Typography;
const { Dragger } = Upload;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Excel upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const fetchCustomers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const params = q ? { search: q } : {};
      const { data } = await api.get('/admin/customers', { params });
      setCustomers(data.customers || data || []);
    } catch (err) {
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchCustomers]);

  const openAdd = () => {
    setEditRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditRecord(record);
    form.setFieldsValue({ name: record.name });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editRecord) {
        await api.put(`/admin/customers/${editRecord.id}`, values);
        message.success('Customer updated successfully');
      } else {
        await api.post('/admin/customers', values);
        message.success('Customer added successfully');
      }
      setModalOpen(false);
      fetchCustomers(search);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save customer';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      message.warning('Please select an Excel file first');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const { data } = await api.post('/admin/customers/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(data);
      setUploadFile(null);
      fetchCustomers(search);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload Excel file';
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadResult(null);
    setUploadModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/customers/${id}`);
      message.success('Customer deleted successfully');
      fetchCustomers(search);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete customer';
      message.error(msg);
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Created Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            title="Edit"
          />
          <Popconfirm
            title="Delete Customer"
            description="Are you sure you want to delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button type="text" icon={<DeleteOutlined />} danger title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Customers</Title>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 320 }}
          />
        </Col>
        <Col xs={24} sm={12} style={{ textAlign: 'right', marginTop: 8 }}>
          <Space>
            <Button icon={<UploadOutlined />} onClick={openUploadModal}>
              Upload Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add Customer
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: <Empty description="No customers found" /> }}
      />

      <Modal
        title={editRecord ? 'Edit Customer' : 'Add Customer'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editRecord ? 'Update' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Excel Modal */}
      <Modal
        title="Upload Customers Excel"
        open={uploadModalOpen}
        onCancel={() => { setUploadModalOpen(false); setUploadFile(null); setUploadResult(null); }}
        footer={
          uploadResult ? [
            <Button
              key="close"
              type="primary"
              onClick={() => { setUploadModalOpen(false); setUploadFile(null); setUploadResult(null); }}
            >
              Close
            </Button>,
          ] : [
            <Button key="cancel" onClick={() => { setUploadModalOpen(false); setUploadFile(null); setUploadResult(null); }}>
              Cancel
            </Button>,
            <Button
              key="upload"
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
              onClick={handleUploadExcel}
              disabled={!uploadFile}
            >
              Upload
            </Button>,
          ]
        }
        destroyOnClose
      >
        {!uploadResult ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <a href="/api/admin/customers/template" download>
                <Button icon={<DownloadOutlined />} size="small">
                  Download Template
                </Button>
              </a>
            </div>
            <Dragger
              accept=".xlsx,.xls"
              beforeUpload={(file) => {
                setUploadFile(file);
                return false;
              }}
              onRemove={() => setUploadFile(null)}
              fileList={uploadFile ? [uploadFile] : []}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag an Excel file here to upload</p>
              <p className="ant-upload-hint">Accepted formats: .xlsx, .xls</p>
            </Dragger>
          </>
        ) : (
          <Alert
            type="success"
            showIcon
            message="Upload Complete"
            description={`${uploadResult.created ?? 0} customers created, ${uploadResult.skipped ?? 0} skipped (duplicates).`}
          />
        )}
      </Modal>
    </div>
  );
}
