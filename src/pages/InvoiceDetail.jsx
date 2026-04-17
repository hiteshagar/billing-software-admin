import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Descriptions,
  Spin,
  Modal,
  Image,
  Tag,
  Space,
  Empty,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import api, { UPLOADS_BASE_URL } from '../api/axios';

const { Title, Text } = Typography;

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function QuantityDetails({ item }) {
  const unit = (item.unit || '').toLowerCase();
  if (unit === 'meters' || unit === 'metre' || unit === 'mtrs' || unit === 'mtr') {
    const length = item.length_value ?? item.quantity_length ?? '';
    const pieces = item.pieces_value ?? item.quantity_pieces ?? '';
    const total = item.total_quantity ?? item.quantity ?? '';
    if (length !== '' && pieces !== '') {
      return <span>L: {length} × P: {pieces} = {total} mtrs</span>;
    }
    return <span>{total} mtrs</span>;
  }
  return <span>{item.total_quantity ?? item.quantity ?? '-'} pcs</span>;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoModal, setPhotoModal] = useState({ open: false, url: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/invoices/${id}`);
        setInvoice(data.invoice || data);
      } catch (err) {
        console.error('Failed to load invoice', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'SKU Code',
      dataIndex: 'sku_code',
      key: 'sku_code',
    },
    {
      title: 'Item Name',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: 'Quantity Details',
      key: 'quantity_details',
      render: (_, item) => <QuantityDetails item={item} />,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (v) => <Tag>{v || '-'}</Tag>,
    },
    {
      title: 'Rate (₹)',
      dataIndex: 'rate',
      key: 'rate',
      align: 'right',
      render: (v) => formatCurrency(v),
    },
    {
      title: 'Total (₹)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (v) => <strong>{formatCurrency(v)}</strong>,
    },
    {
      title: 'Photo',
      key: 'photo',
      width: 90,
      render: (_, item) => {
        const photoPath = item.photo_path || item.photo;
        if (!photoPath) return <Text type="secondary" style={{ fontSize: 12 }}>No photo</Text>;
        const url = `${UPLOADS_BASE_URL}/${photoPath}`;
        return (
          <img
            src={url}
            alt="item"
            className="photo-thumb"
            onClick={() => setPhotoModal({ open: true, url })}
          />
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')} style={{ marginBottom: 16 }}>
          Back
        </Button>
        <Empty description="Invoice not found" />
      </div>
    );
  }

  const items = invoice.items || [];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </Space>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Invoice {invoice.invoice_number}</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        extra={
          <Tag color="green" style={{ fontSize: 14 }}>
            {formatCurrency(invoice.total_amount)}
          </Tag>
        }
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }} size="small">
          <Descriptions.Item label="Invoice Number">
            <strong>{invoice.invoice_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {invoice.invoice_date ? dayjs(invoice.invoice_date).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {invoice.customer_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Transport Provider">
            {invoice.transport_provider_name || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {invoice.created_by?.name
              ? `${invoice.created_by.name}${invoice.created_by.employee_id ? ` (${invoice.created_by.employee_id})` : ''}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Supported By">
            {invoice.supported_by?.name
              ? `${invoice.supported_by.name}${invoice.supported_by.employee_id ? ` (${invoice.supported_by.employee_id})` : ''}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount" span={2}>
            <strong style={{ fontSize: 16, color: '#1677ff' }}>
              {formatCurrency(invoice.total_amount)}
            </strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Items (${items.length})`}>
        <Table
          dataSource={items}
          columns={columns}
          rowKey={(r, i) => r.id || i}
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
          locale={{ emptyText: <Empty description="No items found" /> }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6} align="right">
                <strong>Grand Total</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <strong style={{ color: '#1677ff' }}>
                  {formatCurrency(
                    items.reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
                  )}
                </strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Modal
        open={photoModal.open}
        onCancel={() => setPhotoModal({ open: false, url: '' })}
        footer={null}
        centered
        width="auto"
        styles={{ body: { padding: 0 } }}
      >
        <img
          src={photoModal.url}
          alt="Item photo"
          style={{ maxWidth: '80vw', maxHeight: '80vh', display: 'block', margin: 'auto' }}
        />
      </Modal>
    </div>
  );
}
