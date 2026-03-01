import React from 'react';

export const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', { timeZone: 'UTC' });
};

export const formatToCurrencyString = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const isNegative = num < 0;
  let v = Math.abs(num).toFixed(2).replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return isNegative ? '-' + v : v;
};

export const parseCurrency = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const isNegative = String(val).includes('-');
  const cleanVal = String(val).replace(/\./g, '').replace(',', '.').replace('-', '');
  const parsed = parseFloat(cleanVal);
  return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
};

export function CurrencyInput({ value, onChange, placeholder, className, required, disabled }) {
  const handleChange = (e) => {
    let val = e.target.value;
    const isNegative = val.startsWith('-');
    let v = val.replace(/\D/g, ''); 
    if (v === '') { onChange(''); return; }
    v = (parseInt(v, 10) / 100).toFixed(2).replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    if (isNegative) v = '-' + v;
    onChange(v);
  };
  return (
    <input type="text" value={value || ''} onChange={handleChange} placeholder={placeholder || "0,00"} className={className} required={required} disabled={disabled} />
  );
}

export const getBaseCode = (code) => {
  if (!code) return '';
  const match = code.match(/^(.*)\.\d+$/);
  return match ? match[1] : code;
};

export const getAllBaseCodes = (contratos) => contratos.map(c => c.codigo_contrato).sort((a,b) => b.length - a.length);

export const findBaseCode = (code, allCodes) => {
  if (!code) return '';
  const parent = allCodes.find(base => code !== base && code !== code && code.startsWith(base) && /^[\.\-A-Za-z_]/.test(code.substring(base.length)));
  return parent || code;
};
