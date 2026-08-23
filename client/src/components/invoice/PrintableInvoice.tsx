import React from 'react';
import type { InvoiceDto } from '../../types/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface PrintableInvoiceProps {
  invoice: InvoiceDto;
  language: 'ar' | 'en';
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, language }) => {
  const isArabic = language === 'ar';

  return (
    <div
      id="printable-receipt-area"
      dir={isArabic ? 'rtl' : 'ltr'}
      className="bg-white text-black p-4 max-w-[320px] mx-auto text-xs font-mono select-none leading-tight border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none print:w-[80mm]"
    >
      {/* Restaurant Header */}
      <div className="text-center space-y-1 pb-2 border-b border-dashed border-gray-400">
        <h1 className="text-base font-black uppercase tracking-tight">
          {isArabic ? invoice.restaurantNameArabic || 'مطعم ألاريس فلو إكس' : invoice.restaurantName || 'Alaris FlowX Restaurant'}
        </h1>
        <p className="text-[10px] font-bold text-gray-700">
          {isArabic ? 'فاتورة ضريبية مبسطة' : 'SIMPLIFIED TAX INVOICE'}
        </p>
        <p className="text-[10px] text-gray-600">
          {isArabic ? invoice.restaurantAddressArabic || 'القاهرة، مصر' : invoice.restaurantAddress || 'Cairo, Egypt'}
        </p>
        <p className="text-[10px] text-gray-600">
          {isArabic ? 'تليفون:' : 'Tel:'} {invoice.restaurantPhone || '+20 100 123 4567'}
        </p>
        <div className="text-[9px] text-gray-500 pt-0.5 space-y-0.5">
          <p>
            {isArabic ? 'الرقم الضريبي:' : 'Tax Reg No:'} {invoice.taxRegistrationNumber || '723-458-912'}
          </p>
          <p>
            {isArabic ? 'السجل التجاري:' : 'CR No:'} {invoice.commercialRegistrationNumber || '142859'}
          </p>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
        <div className="flex justify-between font-bold">
          <span>{isArabic ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
          <span>{invoice.receiptNumber || `INV-${invoice.orderId}`}</span>
        </div>
        <div className="flex justify-between">
          <span>{isArabic ? 'التاريخ والوقت:' : 'Date & Time:'}</span>
          <span>{formatDateTime(invoice.paidAt, language)}</span>
        </div>
        <div className="flex justify-between">
          <span>{isArabic ? 'الترابيزة:' : 'Table:'}</span>
          <span>{isArabic ? `طاولة #${invoice.tableNumber}` : `Table #${invoice.tableNumber}`}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-700">
          <span>{isArabic ? `الويتر: ${invoice.waiterName || 'عام'}` : `Waiter: ${invoice.waiterName || 'Staff'}`}</span>
          <span>{isArabic ? `الكاشير: ${invoice.cashierName || 'كاشير'}` : `Cashier: ${invoice.cashierName || 'Cashier'}`}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-start py-2 border-b border-dashed border-gray-400 text-[11px]">
        <thead>
          <tr className="border-b border-gray-300 text-[10px]">
            <th className="text-start py-1">{isArabic ? 'الصنف' : 'Item'}</th>
            <th className="text-center py-1">{isArabic ? 'العدد' : 'Qty'}</th>
            <th className="text-end py-1">{isArabic ? 'السعر' : 'Price'}</th>
            <th className="text-end py-1">{isArabic ? 'الإجمالي' : 'Total'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td className="py-1 pe-1 font-sans text-[11px] font-medium leading-snug">{item.menuItemName}</td>
              <td className="py-1 text-center font-mono">{item.quantity}</td>
              <td className="py-1 text-end font-mono">{item.unitPrice.toFixed(2)}</td>
              <td className="py-1 text-end font-mono font-bold">{(item.unitPrice * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Breakdown */}
      <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
        <div className="flex justify-between">
          <span>{isArabic ? 'الإجمالي الفرعي:' : 'Subtotal:'}</span>
          <span className="font-mono">{formatCurrency(invoice.subTotal, language)}</span>
        </div>

        {invoice.discountAmount > 0 && (
          <div className="flex justify-between text-gray-800">
            <span>{isArabic ? 'الخصم:' : 'Discount:'}</span>
            <span className="font-mono">-{formatCurrency(invoice.discountAmount, language)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-300">
          <span>{isArabic ? 'صافي الفاتورة:' : 'Net Total:'}</span>
          <span className="font-mono">{formatCurrency(invoice.finalAmount, language)}</span>
        </div>

        <div className="flex justify-between text-[10px] text-gray-700 pt-1">
          <span>{isArabic ? 'طريقة الدفع:' : 'Payment Method:'}</span>
          <span>
            {isArabic
              ? invoice.paymentMethod === 'Cash'
                ? 'كاش (نقدي)'
                : invoice.paymentMethod === 'Card'
                ? 'كارت (فيزا)'
                : 'محفظة إلكترونية'
              : invoice.paymentMethod}
          </span>
        </div>

        {invoice.paymentMethod === 'Cash' && (
          <>
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>{isArabic ? 'المدفوع:' : 'Paid:'}</span>
              <span className="font-mono">{formatCurrency(invoice.amountPaid || invoice.finalAmount, language)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>{isArabic ? 'الباقي:' : 'Change:'}</span>
              <span className="font-mono">{formatCurrency(invoice.changeAmount || 0, language)}</span>
            </div>
          </>
        )}
      </div>

      {/* Egyptian Receipt Footer */}
      <div className="text-center pt-3 space-y-1 text-[10px] text-gray-600">
        <p className="font-bold text-black">
          {isArabic ? 'شكراً لزيارتكم • يسعدنا خدمتكم دائماً' : 'Thank you for visiting us!'}
        </p>
        <p className="text-[9px] text-gray-400">Alaris FlowX POS System • Powered by Alaris Space</p>
      </div>
    </div>
  );
};
