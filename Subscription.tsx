import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SubscriptionPage = () => {
  const [status, setStatus] = useState<any>(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, paymentsRes] = await Promise.all([
          axios.get('/api/subscriptions/status'),
          axios.get('/api/subscriptions/payments')
        ]);
        setStatus(statusRes.data);
        setPayments(paymentsRes.data);
      } catch (error) {
        console.error("Failed to fetch subscription data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">กำลังโหลดข้อมูล...</div>;

  // คำนวณเปอร์เซ็นต์อย่างปลอดภัย
  const used = status?.aiScanUsed || 0;
  const limit = status?.aiScanLimit || 1; // กันหารด้วย 0
  const percentage = Math.min(Math.round((used / limit) * 100), 100);
  const barColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-600';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">จัดการแพ็กเกจสมาชิก</h1>
      
      {/* Quota Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">โควตาการใช้งานปัจจุบัน</h2>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span>AI Scan ประจำเดือนนี้</span>
            <span className="font-bold">{used} / {limit} ครั้ง</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`${barColor} h-2.5 rounded-full transition-all duration-500`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <p className="text-sm text-gray-500">แพ็กเกจปัจจุบัน: <span className="font-medium text-green-700">{status?.planName}</span></p>
      </div>

      {/* Payment History Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">ประวัติการชำระเงิน</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-bottom border-gray-200">
              <th className="py-2">วันที่</th>
              <th className="py-2">รายการ</th>
              <th className="py-2">ยอดเงิน</th>
              <th className="py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? payments.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="py-3">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
                <td className="py-3">{p.description || 'ต่ออายุแพ็กเกจ'}</td>
                <td className="py-3">{p.amount.toLocaleString()} บาท</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${p.payment_status === 'PAID' || p.payment_status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {p.payment_status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">ไม่พบประวัติการชำระเงิน</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionPage;